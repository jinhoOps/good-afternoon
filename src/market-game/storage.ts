import { DAYS, MAX_STOCK } from './content';
import { changeOrder, newGame, nextDay, openMarket, type GameState } from './domain';

export const STORAGE_KEY = 'goodafternoon.weekend-market.v1';
type Store = Pick<Storage, 'getItem' | 'setItem'>;
export type LoadResult = { state: GameState; notice: string };

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function serialize(state: GameState): string {
  return JSON.stringify({ version: 1, phase: state.phase, order: state.order, receipts: state.receipts.map(({ quantity, price }) => ({ quantity, price })) });
}

export function restore(raw: string): GameState | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!record(parsed) || parsed.version !== 1 || !Array.isArray(parsed.receipts) || parsed.receipts.length > DAYS.length) return null;
    let state = newGame();
    for (const [index, item] of parsed.receipts.entries()) {
      if (!record(item) || typeof item.quantity !== 'number' || typeof item.price !== 'number') return null;
      if (index > 0) state = nextDay(state);
      const ordered = changeOrder(state, { quantity: item.quantity, price: item.price });
      if (ordered === state) return null;
      state = openMarket(ordered);
    }
    if (parsed.phase === 'complete' && state.receipts.length === DAYS.length) state = nextDay(state);
    else if (parsed.phase === 'planning') {
      if (state.receipts.length === DAYS.length) return null;
      if (state.receipts.length > 0) state = nextDay(state);
      if (!record(parsed.order) || typeof parsed.order.quantity !== 'number' || typeof parsed.order.price !== 'number') return null;
      const updated = changeOrder(state, { quantity: parsed.order.quantity, price: parsed.order.price });
      if (updated === state) return null;
      state = updated;
    } else if (parsed.phase !== 'result' || state.receipts.length === 0) return null;
    return state;
  } catch {
    return null;
  }
}

export function load(store: Store | null): LoadResult {
  if (!store) return { state: newGame(), notice: '이번 기록은 이 기기에 저장되지 않아요.' };
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return { state: newGame(), notice: '' };
    // 지나치게 큰 저장값은 처리하지 않습니다.
    if (raw.length > MAX_STOCK * 1000) return { state: newGame(), notice: '저장 기록을 읽지 못해 새 장터를 열었어요.' };
    const state = restore(raw);
    return { state: state ?? newGame(), notice: state ? '' : '저장 기록을 읽지 못해 새 장터를 열었어요.' };
  } catch {
    return { state: newGame(), notice: '이번 기록은 이 기기에 저장되지 않아요.' };
  }
}

export function save(store: Store | null, state: GameState): boolean {
  if (!store) return false;
  try { store.setItem(STORAGE_KEY, serialize(state)); return true; } catch { return false; }
}
