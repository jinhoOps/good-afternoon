export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function readStorage(storage: StorageLike, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(storage: StorageLike, key: string, value: string): void {
  try {
    storage.setItem(key, value);
  } catch {}
}

export function removeStorage(storage: StorageLike, key: string): void {
  try {
    storage.removeItem(key);
  } catch {}
}
