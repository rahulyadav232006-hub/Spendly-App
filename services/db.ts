import { RegularExpense, Settings, SpendlyState, Transaction } from "@/types";
import { defaultState } from "@/lib/sampleData";

const DB_NAME = "spendly-db";
const DB_VERSION = 1;
const STORE_TRANSACTIONS = "transactions";
const STORE_REGULAR = "regularExpenses";
const STORE_SETTINGS = "settings";
const SETTINGS_KEY = "settings";

// A single shared connection promise, reused across every call. Opening a
// fresh connection per operation (the previous approach) meant many
// concurrent IDBDatabase handles to the same database, which is wasteful
// and — combined with React 18 Strict Mode's double-invoked effects in
// development — could race with the initial seed write. Caching the
// connection avoids that entirely.
let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available in this environment"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const idb = request.result;
      if (!idb.objectStoreNames.contains(STORE_TRANSACTIONS)) {
        idb.createObjectStore(STORE_TRANSACTIONS, { keyPath: "id" });
      }
      if (!idb.objectStoreNames.contains(STORE_REGULAR)) {
        idb.createObjectStore(STORE_REGULAR, { keyPath: "id" });
      }
      if (!idb.objectStoreNames.contains(STORE_SETTINGS)) {
        idb.createObjectStore(STORE_SETTINGS, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbPromise = null; // allow retry on the next call
      reject(request.error);
    };
  });
  return dbPromise;
}

/**
 * Runs a single read or write op and resolves only once the *transaction*
 * commits (`oncomplete`), not just once the individual request succeeds.
 * This guarantees the data is actually durable before callers act on it —
 * resolving on `request.onsuccess` alone can fire slightly before the
 * transaction is guaranteed to have committed to disk.
 */
function runTx<T>(db: IDBDatabase, storeName: string, mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const request = run(store);
    let result: T;
    request.onsuccess = () => {
      result = request.result;
    };
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => resolve(result);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error || new Error("Transaction aborted"));
  });
}

function getAll<T>(db: IDBDatabase, storeName: string): Promise<T[]> {
  return runTx<T[]>(db, storeName, "readonly", (store) => store.getAll() as unknown as IDBRequest<T[]>);
}

function clearStore(db: IDBDatabase, storeName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).clear();
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error || new Error("Transaction aborted"));
  });
}

function bulkPut<T>(db: IDBDatabase, storeName: string, items: T[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    items.forEach((item) => store.put(item as any));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error || new Error("Transaction aborted"));
  });
}

// Guards against two concurrent loadState() calls (e.g. React Strict
// Mode's mount → cleanup → mount in development) both seeing an empty
// database and racing to seed it independently.
let loadPromise: Promise<SpendlyState> | null = null;

export function loadState(): Promise<SpendlyState> {
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    const db = await openDB();
    const [transactions, regularExpenses, settingsRows] = await Promise.all([
      getAll<Transaction>(db, STORE_TRANSACTIONS),
      getAll<RegularExpense>(db, STORE_REGULAR),
      getAll<{ key: string; value: Settings }>(db, STORE_SETTINGS),
    ]);

    const isFirstRun = transactions.length === 0 && regularExpenses.length === 0 && settingsRows.length === 0;

    if (isFirstRun) {
      // A brand-new user starts completely empty — no demo transactions,
      // no demo regular expenses. Only their own onboarding budget/settings
      // get seeded here; everything else appears only once they add it.
      const seed = defaultState(false);
      await Promise.all([
        bulkPut(db, STORE_SETTINGS, [{ key: SETTINGS_KEY, value: seed.settings }]),
      ]);
      return seed;
    }

    const settings = settingsRows.find((r) => r.key === SETTINGS_KEY)?.value || defaultState(false).settings;
    return { transactions, regularExpenses, settings };
  })();
  return loadPromise;
}

export async function saveTransaction(t: Transaction): Promise<void> {
  const db = await openDB();
  await runTx(db, STORE_TRANSACTIONS, "readwrite", (store) => store.put(t));
}

export async function deleteTransactionById(id: string): Promise<void> {
  const db = await openDB();
  await runTx(db, STORE_TRANSACTIONS, "readwrite", (store) => store.delete(id));
}

export async function saveRegularExpense(r: RegularExpense): Promise<void> {
  const db = await openDB();
  await runTx(db, STORE_REGULAR, "readwrite", (store) => store.put(r));
}

export async function deleteRegularExpenseById(id: string): Promise<void> {
  const db = await openDB();
  await runTx(db, STORE_REGULAR, "readwrite", (store) => store.delete(id));
}

export async function saveSettings(settings: Settings): Promise<void> {
  const db = await openDB();
  await runTx(db, STORE_SETTINGS, "readwrite", (store) => store.put({ key: SETTINGS_KEY, value: settings }));
}

/** Replaces the entire database contents — used for JSON import. */
export async function replaceAll(state: SpendlyState): Promise<void> {
  const db = await openDB();
  await Promise.all([clearStore(db, STORE_TRANSACTIONS), clearStore(db, STORE_REGULAR), clearStore(db, STORE_SETTINGS)]);
  await Promise.all([
    bulkPut(db, STORE_TRANSACTIONS, state.transactions),
    bulkPut(db, STORE_REGULAR, state.regularExpenses),
    bulkPut(db, STORE_SETTINGS, [{ key: SETTINGS_KEY, value: state.settings }]),
  ]);
}

/** Wipes everything and re-seeds fresh (empty, not sample) defaults. */
export async function wipeAll(): Promise<SpendlyState> {
  const db = await openDB();
  await Promise.all([clearStore(db, STORE_TRANSACTIONS), clearStore(db, STORE_REGULAR), clearStore(db, STORE_SETTINGS)]);
  const fresh = defaultState(false);
  fresh.settings.onboarded = true;
  await bulkPut(db, STORE_SETTINGS, [{ key: SETTINGS_KEY, value: fresh.settings }]);
  return fresh;
}
