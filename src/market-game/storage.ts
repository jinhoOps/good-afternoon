import { isEquipment } from './equipment';
import { DAYS, DREAM_CASH } from './content';
import { isMarketId } from './markets';
import { changeOrder, newGame, nextDay, openMarket, type GameState, type RunRecord } from './domain';

export const STORAGE_KEY = 'goodafternoon.weekend-market.v1';
type Store = Pick<Storage, 'getItem' | 'setItem'>;
export type LoadResult = { state: GameState; notice: string };

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function serialize(state: GameState): string {
  return JSON.stringify({ version: 4, market: state.market, equipment: state.equipment, records: state.records, firstShop: state.firstShop, phase: state.phase, order: state.order, receipts: state.receipts.map(({ quantity, price, cooler, booking }) => ({ quantity, price, cooler, booking })) });
}

export function restore(raw: string): GameState | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!record(parsed) || ![1, 2, 3, 4].includes(parsed.version as number) || !Array.isArray(parsed.receipts) || parsed.receipts.length > DAYS.length) return null;
    const hasJourney = parsed.version === 3 || parsed.version === 4;
    // v1~v3의 금액은 현재 단위의 1/3입니다. 선택만 환산해 재연산하므로
    // 현금·보관 원가·예약·간판 기록이 함께 이전되고 금액 위조는 무시됩니다.
    const priceFor = (price: number): number => parsed.version === 4 ? price : [800, 1000, 1200, 1500].includes(price) ? price * 3 : NaN;
    const records: RunRecord[] = [];
    let firstShop: RunRecord | null = null;
    if (hasJourney) {
      if (!isMarketId(parsed.market) || !isEquipment(parsed.equipment) || !Array.isArray(parsed.records) || parsed.records.length > 3) return null;
      for (const item of parsed.records) {
        if (!record(item) || !isMarketId(item.market) || !isEquipment(item.equipment) || records.some(r => r.market === item.market)) return null;
        // 지난 최고 기록도 선택에서 재계산하며 저장된 금액은 쓰지 않습니다.
        const completed = restore(JSON.stringify({ version: parsed.version, market: item.market, equipment: item.equipment, records: [], firstShop: null, phase: 'complete', receipts: item.orders }));
        if (!completed) return null;
        records.push(completed.records[0]);
      }
    }
    if (hasJourney && parsed.firstShop !== null) {
      const item = parsed.firstShop;
      if (!record(item) || !isMarketId(item.market) || !isEquipment(item.equipment)) return null;
      const completed = restore(JSON.stringify({ version: parsed.version, market: item.market, equipment: item.equipment, records: [], firstShop: null, phase: 'complete', receipts: item.orders }));
      if (!completed || completed.cash < DREAM_CASH) return null;
      firstShop = completed.records[0];
    }
    let state = newGame(hasJourney ? parsed.market as GameState['market'] : 'neighborhood', records, hasJourney ? parsed.equipment as GameState['equipment'] : 'basic', firstShop);
    for (const [index, item] of parsed.receipts.entries()) {
      if (!record(item) || typeof item.quantity !== 'number' || typeof item.price !== 'number') return null;
      if (parsed.version !== 1 && typeof item.cooler !== 'boolean') return null;
      if (hasJourney && typeof item.booking !== 'boolean') return null;
      if (index > 0) state = nextDay(state);
      const ordered = changeOrder(state, { quantity: item.quantity, price: priceFor(item.price), cooler: parsed.version !== 1 ? item.cooler as boolean : false, booking: hasJourney ? item.booking as boolean : false });
      if (ordered === state) return null;
      state = openMarket(ordered);
    }
    if (parsed.phase === 'complete' && state.receipts.length === DAYS.length) state = nextDay(state);
    else if (parsed.phase === 'planning') {
      if (state.receipts.length === DAYS.length) return null;
      if (state.receipts.length > 0) state = nextDay(state);
      if (!record(parsed.order) || typeof parsed.order.quantity !== 'number' || typeof parsed.order.price !== 'number') return null;
      if (parsed.version !== 1 && typeof parsed.order.cooler !== 'boolean') return null;
      if (hasJourney && typeof parsed.order.booking !== 'boolean') return null;
      const updated = changeOrder(state, { quantity: parsed.order.quantity, price: priceFor(parsed.order.price), cooler: parsed.version !== 1 ? parsed.order.cooler as boolean : false, booking: hasJourney ? parsed.order.booking as boolean : false });
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
    if (raw.length > 50000) return { state: newGame(), notice: '저장 기록을 읽지 못해 새 장터를 열었어요.' };
    const state = restore(raw);
    const migrated = state && JSON.parse(raw).version !== 4;
    return { state: state ?? newGame(), notice: state ? migrated ? '음료 기본가를 3,000원으로 맞췄어요. 진행은 그대로, 기록의 금액도 같은 비율로 바뀌었어요.' : '' : '저장 기록을 읽지 못해 새 장터를 열었어요.' };
  } catch {
    return { state: newGame(), notice: '이번 기록은 이 기기에 저장되지 않아요.' };
  }
}

export function save(store: Store | null, state: GameState): boolean {
  if (!store) return false;
  try { store.setItem(STORAGE_KEY, serialize(state)); return true; } catch { return false; }
}
