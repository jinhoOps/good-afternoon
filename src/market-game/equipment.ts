import { COOLER_CAPACITY, COOLER_FEE, DREAM_CASH } from './content';
import { dayFor, type MarketId } from './markets';

export const EQUIPMENT_IDS = ['basic', 'pantry', 'tea'] as const;
export type Equipment = typeof EQUIPMENT_IDS[number];
type ShopState = { market: MarketId; day: number; equipment: Equipment };
export const isEquipment = (value: unknown): value is Equipment => EQUIPMENT_IDS.some(id => id === value);
export const hasShop = (state: { records: { cash: number }[] }): boolean => state.records.some(record => record.cash >= DREAM_CASH);
export const drinkName = (state: { equipment: Equipment }): string => state.equipment === 'tea' ? '따뜻한 레몬티' : '레모네이드';
export const unitCost = (state: ShopState): number => dayFor(state).cost + (state.equipment === 'tea' ? 600 : 0);
export const rentalFee = (state: { equipment: Equipment }): number => state.equipment === 'pantry' ? 3000 : COOLER_FEE;
export const storageLimit = (state: { equipment: Equipment }): number => state.equipment === 'pantry' ? 8 : COOLER_CAPACITY;

export function teaInterest(state: Pick<ShopState, 'market' | 'day'>): { change: number; mixed: boolean; hint: string } {
  const weather = dayFor(state).weather;
  if (weather === 'rain') return { change: 1500, mixed: false, hint: '비 오는 날, 따뜻한 차라면 1,500원쯤 더 내겠다는 손님들이에요.' };
  if (weather === 'heat') return { change: -900, mixed: false, hint: '더운 날이라 따뜻한 차에는 시원한 음료보다 900원쯤 덜 쓰고 싶어 해요.' };
  if (state.market === 'park-walk') return { change: 1800, mixed: false, hint: '오늘 산책객들은 따뜻한 차를 찾고 있어요. 레모네이드보다 1,800원 더 쓸 생각이에요.' };
  return { change: 900, mixed: true, hint: '절반쯤은 차를 좋아해 900원 더, 나머지는 시원한 음료를 원해 600원 덜 쓰려고 해요.' };
}

export function willingness(state: ShopState, index: number): number {
  const day = dayFor(state);
  if (state.equipment !== 'tea') return day.visitors[index].budget;
  const interest = teaInterest(state);
  const adjustment = !interest.mixed || index % 2 === 0 ? interest.change : -600;
  return Math.max(0, day.visitors[index].budget + adjustment);
}
