import { PRICES } from '../content';
import { EQUIPMENT_IDS, rentalFee, type Equipment } from '../equipment';
import { bookingOffer } from '../contracts';
import { MARKET_IDS, fixedPrice, type MarketId } from '../markets';
import { changeOrder, minimumPreparation, newGame, nextDay, openMarket, preparationCapacity, type GameState } from '../domain';

/** 재고와 예약이 같으면 현금이 많은 경로가 이후의 모든 선택을 할 수 있습니다. */
export function bestRun(market: MarketId, equipment: Equipment, bookings = true): GameState {
  let frontier = [newGame(market, [], equipment)];
  for (let day = 0; day < 5; day++) {
    const next = new Map<string, GameState>();
    for (const state of frontier) for (const price of PRICES) {
      if (fixedPrice(state) && price !== 3000) continue;
      for (const cooler of [false, true]) {
        if (cooler && (day < 2 || day === 4 || state.cash < rentalFee(state))) continue;
        for (const booking of [false, true]) {
          if (booking && (!bookings || !bookingOffer(state))) continue;
          for (let quantity = minimumPreparation(state); quantity <= preparationCapacity(state, cooler, booking); quantity++) {
            const ordered = changeOrder(state, { quantity, price, cooler, booking });
            if (ordered === state) continue;
            const result = nextDay(openMarket(ordered));
            const key = `${result.stock.quantity}:${result.stock.unitCost}:${result.booking?.quantity ?? 0}`;
            if (!next.has(key) || next.get(key)!.cash < result.cash) next.set(key, result);
          }
        }
      }
    }
    frontier = [...next.values()];
  }
  return frontier.reduce((best, state) => state.cash > best.cash ? state : best);
}

export function balanceReport(): unknown[] {
  return MARKET_IDS.flatMap(market => EQUIPMENT_IDS.map(equipment => {
    const best = bestRun(market, equipment);
    return { market, equipment, cash: best.cash, withoutBookings: bestRun(market, equipment, false).cash, orders: best.receipts.map(r => ({ quantity: r.quantity, price: r.price, cooler: r.cooler, booking: r.booking })) };
  }));
}
