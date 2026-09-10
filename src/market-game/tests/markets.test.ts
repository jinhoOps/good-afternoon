import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRICES, INITIAL_CASH } from '../content';
import { MARKET_IDS, dayFor, fixedPrice, type MarketId } from '../markets';
import { changeOrder, newGame, nextDay, openMarket, preparationCapacity, retryDay, startMarket, type GameState } from '../domain';
import { restore, serialize } from '../storage';

function complete(market: MarketId, quantity = 6): GameState {
  let state = newGame(market);
  for (let day = 0; day < 5; day++) state = nextDay(openMarket(changeOrder(state, { quantity: Math.min(quantity, preparationCapacity(state)), price: 3000 })));
  return state;
}

function bestToday(state: GameState): { price: number; quantity: number; cash: number } {
  let best = { price: 0, quantity: 0, cash: -1 };
  for (const price of PRICES) {
    if (fixedPrice(state) && price !== 3000) continue;
    for (let quantity = 0; quantity <= preparationCapacity(state); quantity++) {
      const result = openMarket(changeOrder(state, { quantity, price }));
      if (result.cash > best.cash) best = { price, quantity, cash: result.cash };
    }
  }
  return best;
}

test('첫 진입은 수량 하나이며 공원은 가족과 공연 손님에 따라 유리한 가격이 바뀝니다', () => {
  assert.equal(fixedPrice(newGame()), true);
  assert.equal(fixedPrice(newGame('park-walk')), false);
  assert.deepEqual(bestToday(newGame('park-walk')), { price: 2400, quantity: 12, cash: 28800 });
  assert.deepEqual(bestToday(newGame('park-concert')), { price: 4500, quantity: 5, cash: 31500 });
  const walk = nextDay(openMarket(changeOrder(newGame('park-walk'), { quantity: 12, price: 2400 })));
  const concert = nextDay(openMarket(changeOrder(newGame('park-concert'), { quantity: 5, price: 4500 })));
  assert.equal(bestToday(walk).price, 4500);
  assert.equal(bestToday(concert).price, 2400);
});

test('목표 미달이어도 공원으로 갈 수 있고 운영 자금과 최고 기록은 분리됩니다', () => {
  const first = newGame();
  assert.equal(startMarket(first, 'park-walk'), first);
  const completed = complete('neighborhood', 0);
  assert.equal(completed.cash, 18000);
  const park = startMarket(completed, 'park-walk');
  assert.equal(park.market, 'park-walk');
  assert.equal(park.cash, INITIAL_CASH);
  assert.deepEqual(park.records, completed.records);
  assert.deepEqual(restore(serialize(park)), park);
  assert.deepEqual(startMarket(park, park.market).records, completed.records);
});

test('장터별 최고 기록은 더 나쁜 재도전에 덮어쓰지 않고 저장 금액도 재계산합니다', () => {
  const first = complete('neighborhood');
  let retry = startMarket(first, first.market);
  for (let day = 0; day < 5; day++) retry = nextDay(openMarket(changeOrder(retry, { quantity: 0, price: 3000 })));
  assert.deepEqual(retry.records, first.records);
  const raw = JSON.parse(serialize(retry));
  raw.records[0].cash = 299999997;
  assert.deepEqual(restore(JSON.stringify(raw)), retry);
  raw.records[0].orders[0].quantity = 99;
  assert.equal(restore(JSON.stringify(raw)), null);
  raw.market = 'unknown';
  assert.equal(restore(JSON.stringify(raw)), null);
});

test('세 장터의 여러 전략에서 조건·재시도·저장·현금과 재고가 보존됩니다', () => {
  for (const market of MARKET_IDS) for (const price of PRICES) for (const amount of [0, 4, 10, 18]) for (const rent of [false, true]) {
    let state = newGame(market);
    for (let day = 0; day < 5; day++) {
      const cooler = rent && day >= 2 && day < 4 && state.cash >= 1800;
      state = changeOrder(state, { quantity: Math.min(amount, preparationCapacity(state, cooler)), price: fixedPrice(state) ? 3000 : price, cooler });
      const before = state;
      state = openMarket(state);
      const receipt = state.receipts.at(-1)!;
      assert.equal(receipt.sold + receipt.expensive + receipt.missed, dayFor(state).visitors.length);
      assert.equal(receipt.sold + receipt.savedStock.quantity + receipt.discarded, receipt.totalStock);
      assert.equal(state.cash + receipt.savedStock.quantity * receipt.savedStock.unitCost, INITIAL_CASH + state.receipts.reduce((sum, item) => sum + item.profit, 0));
      assert.ok(state.cash >= 0);
      assert.deepEqual(retryDay(state), before);
      assert.deepEqual(openMarket(retryDay(state)), state);
      assert.deepEqual(restore(serialize(state)), state);
      state = nextDay(state);
      assert.deepEqual(restore(serialize(state)), state);
    }
  }
});
