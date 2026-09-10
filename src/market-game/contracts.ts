import { unitCost, type Equipment } from './equipment';
import { type MarketId } from './markets';

export type Booking = { quantity: number; price: number; prepaid: number; reserved: number; customer: string };
export function bookingOffer(state: { market: MarketId; day: number; equipment: Equipment }): Booking | null {
  if (state.market === 'neighborhood' || (state.day !== 1 && state.day !== 3)) return null;
  const quantity = state.day === 1 ? 8 : 12;
  const price = state.day === 1 ? (state.market === 'park-walk' ? 1000 : 900) : (state.market === 'park-walk' ? 650 : 800);
  return { quantity, price, prepaid: quantity * price, reserved: quantity * unitCost({ ...state, day: state.day + 1 }), customer: state.day === 1 ? '공원 관리팀' : '행사 정리팀' };
}
