/**
 * Vitest setup for the node test environment.
 * The onboarding store and API persist to localStorage, which does not exist
 * in node. Provide a minimal in-memory polyfill and reset it before each test.
 */
import { beforeEach } from "vitest";

class MemoryStorage {
  private store = new Map<string, string>();
  get length(): number {
    return this.store.size;
  }
  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
}

globalThis.localStorage = new MemoryStorage() as unknown as Storage;

beforeEach(() => {
  localStorage.clear();
});
