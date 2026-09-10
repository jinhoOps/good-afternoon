import { test } from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_CASH, PRICES } from '../content';
import { EQUIPMENT_IDS, hasShop, rentalFee, storageLimit, unitCost, willingness } from '../equipment';
import { MARKET_IDS, fixedPrice } from '../markets';
import { nextPark } from '../markets';
import { bookingOffer } from '../contracts';
import { changeOrder, minimumPreparation, newGame, nextDay, openMarket, preparationCapacity, retryDay, startMarket } from '../domain';
import { restore, serialize } from '../storage';
import { bestRun } from './balance';

test('간판은 완주 목표 달성으로 생기고, 운영 자금과 분리해 새 장터·중도 재시작에 남습니다', () => {
  const first = newGame();
  assert.equal(hasShop(first), false);
  assert.equal(startMarket(first, first.market, 'tea'), first);
  const completed = bestRun('neighborhood', 'basic');
  assert.equal(hasShop(completed), true);
  const tea = startMarket(completed, 'park-walk', 'tea');
  assert.equal(tea.equipment, 'tea');
  assert.equal(tea.cash, INITIAL_CASH);
  assert.equal(hasShop(tea), true);
  assert.equal(startMarket(tea, tea.market, 'pantry'), tea);
  assert.equal(startMarket(tea, tea.market).equipment, 'tea');
  assert.deepEqual(restore(serialize(tea)), tea);
  let finished = tea;
  for (let day = 0; day < 5; day++) finished = nextDay(openMarket(finished));
  assert.deepEqual(finished.firstShop, completed.firstShop);
  let neighborhood = startMarket(finished, 'neighborhood', 'basic');
  for (let day = 0; day < 5; day++) neighborhood = nextDay(openMarket(neighborhood));
  assert.equal(nextPark(neighborhood.market, neighborhood.records), 'park-concert');
  assert.deepEqual(restore(serialize(neighborhood)), neighborhood);
});

test('v2의 대여와 보관을 모든 단계에서 잃지 않고 이전합니다', () => {
  let state = newGame();
  for (let day = 0; day < 5; day++) {
    const cooler = day === 2;
    state = changeOrder(state, { quantity: Math.min(day === 2 ? 9 : 6, preparationCapacity(state, cooler)), price: day === 2 ? 2400 : 3000, cooler });
    for (const phase of ['planning', 'result'] as const) {
      if (phase === 'result') state = openMarket(state);
      const legacy = { version: 2, phase, order: { quantity: state.order.quantity, price: state.order.price / 3, cooler: state.order.cooler }, receipts: state.receipts.map(({ quantity, price, cooler }) => ({ quantity, price: price / 3, cooler })) };
      assert.deepEqual(restore(JSON.stringify(legacy)), state);
    }
    state = nextDay(state);
  }
  const legacy = { version: 2, phase: 'complete', receipts: state.receipts.map(({ quantity, price, cooler }) => ({ quantity, price: price / 3, cooler })) };
  assert.deepEqual(restore(JSON.stringify(legacy)), state);
});

test('설비는 보관 용량과 비용, 메뉴 원가와 손님 취향을 함께 바꿉니다', () => {
  const basic = newGame('park-walk');
  const pantry = { ...basic, equipment: 'pantry' as const };
  const tea = { ...basic, equipment: 'tea' as const };
  assert.equal(storageLimit(basic), 4);
  assert.equal(storageLimit(pantry), 8);
  assert.equal(rentalFee(pantry) - rentalFee(basic), 1200);
  assert.equal(unitCost(tea) - unitCost(basic), 600);
  assert.equal(willingness({ ...tea, day: 2 }, 0) - willingness({ ...basic, day: 2 }, 0), 1500);
  assert.equal(willingness({ ...tea, day: 1 }, 0) - willingness({ ...basic, day: 1 }, 0), -900);
  assert.equal(willingness(tea, 0) - willingness(basic, 0), 1800);
  assert.equal(willingness({ ...tea, market: 'neighborhood' }, 1) - willingness({ ...basic, market: 'neighborhood' }, 1), -600);
});

test('v3의 모든 장터·설비 기록과 예약·보관은 3,000원 기준으로 한 번만 환산합니다', () => {
  const first = bestRun('neighborhood', 'basic');
  for (const market of MARKET_IDS) for (const equipment of EQUIPMENT_IDS) {
    const completed = bestRun(market, equipment);
    let state = startMarket(first, market, equipment);
    for (const { quantity, price, cooler, booking } of completed.receipts) {
      state = changeOrder(state, { quantity, price, cooler, booking });
      for (const phase of ['planning', 'result'] as const) {
        if (phase === 'result') state = openMarket(state);
        const legacy = JSON.parse(serialize(state), (key, value: unknown) => {
          if (key === 'price' && typeof value === 'number') return value / 3;
          if (key === 'cash') return 99999999;
          return value;
        });
        legacy.version = 3;
        const restored = restore(JSON.stringify(legacy));
        assert.deepEqual(restored, state);
        assert.deepEqual(restore(serialize(restored!)), state);
        legacy.order.price = 3000;
        if (phase === 'planning') assert.equal(restore(JSON.stringify(legacy)), null);
      }
      state = nextDay(state);
    }
    const legacy = JSON.parse(serialize(state), (key, value: unknown) => key === 'price' && typeof value === 'number' ? value / 3 : value);
    legacy.version = 3;
    assert.deepEqual(restore(JSON.stringify(legacy)), state);
    assert.deepEqual(state.firstShop, first.firstShop);
  }
});

test('새 메뉴와 넓은 보관 중 어느 하나가 모든 장터의 최고 결과를 차지하지 않습니다', () => {
  assert.ok(bestRun('park-walk', 'tea').cash > bestRun('park-walk', 'pantry').cash);
  assert.ok(bestRun('park-concert', 'pantry').cash > bestRun('park-concert', 'tea').cash);
});

test('선불금은 받은 날의 이익이 아니며 다음 날 약속 물량과 준비 자금을 확보합니다', () => {
  const dayTwo = nextDay(openMarket(changeOrder(newGame('park-walk'), { quantity: 12, price: 2400 })));
  const accepted = openMarket(changeOrder(dayTwo, { quantity: 6, price: 4500, booking: true }));
  const r = accepted.receipts.at(-1)!;
  assert.equal(accepted.cash, 69000);
  assert.equal(r.profit, 16200);
  assert.equal(r.cashChange - r.profit, 24000);
  assert.equal(openMarket(accepted), accepted);
  const tomorrow = nextDay(accepted);
  assert.equal(minimumPreparation(tomorrow), 8);
  assert.equal(tomorrow.order.quantity, 8);
  assert.equal(changeOrder(tomorrow, { quantity: 7, price: 3600 }), tomorrow);
  assert.deepEqual(restore(serialize(tomorrow)), tomorrow);
  const result = openMarket(changeOrder(tomorrow, { quantity: 11, price: 3600 }));
  assert.equal(result.cash, 53400);
  const delivered = result.receipts.at(-1)!;
  assert.equal(delivered.walkInSold, 3);
  assert.equal(delivered.sold, 11);
  assert.equal(delivered.revenue, 34800);
  assert.equal(delivered.cashChange, -15600);
  assert.equal(delivered.profit, 8400);
  assert.deepEqual(openMarket(retryDay(result)), result);
  assert.deepEqual(restore(serialize(result)), result);
});

test('단체 주문은 한산한 날 도움이 되고, 붐비는 날은 일반 손님의 기회를 줄입니다', () => {
  for (const market of ['park-walk', 'park-concert'] as const) {
    const best = bestRun(market, 'basic');
    assert.equal(best.receipts[1].booking, true);
    assert.equal(best.receipts[3].booking, false);
    assert.ok(best.cash > bestRun(market, 'basic', false).cash);
  }
});

test('장터·설비·가격·물량·보관·예약 조합에서 의무와 돈·재고를 보존합니다', () => {
  for (const market of MARKET_IDS) for (const equipment of EQUIPMENT_IDS) for (const price of PRICES) for (const quantity of [0, 6, 12, 18]) for (const rent of [false, true]) for (const book of [false, true]) {
    let state = newGame(market, [], equipment);
    for (let day = 0; day < 5; day++) {
      let cooler = rent && day >= 2 && day < 4 && state.cash >= rentalFee(state);
      const booking = book && bookingOffer(state) !== null;
      if (preparationCapacity(state, cooler, booking) < minimumPreparation(state)) cooler = false;
      state = changeOrder(state, { quantity: Math.max(minimumPreparation(state), Math.min(quantity, preparationCapacity(state, cooler, booking))), price: fixedPrice(state) ? 3000 : price, cooler, booking });
      const before = state;
      state = openMarket(state);
      const r = state.receipts.at(-1)!;
      assert.ok(state.cash >= 0);
      assert.ok(state.cash >= (r.accepted?.reserved ?? 0));
      assert.equal(r.sold + r.savedStock.quantity + r.discarded, r.totalStock);
      assert.ok(r.savedStock.quantity <= storageLimit(state));
      assert.equal(r.walkInSold + (r.delivered?.quantity ?? 0), r.sold);
      assert.equal(state.cash, INITIAL_CASH + state.receipts.reduce((sum, receipt) => sum + receipt.cashChange, 0));
      assert.equal(state.cash + r.savedStock.quantity * r.savedStock.unitCost - (r.accepted?.prepaid ?? 0), INITIAL_CASH + state.receipts.reduce((sum, receipt) => sum + receipt.profit, 0));
      assert.deepEqual(retryDay(state), before);
      assert.deepEqual(restore(serialize(state)), state);
      state = nextDay(state);
      assert.ok(state.phase !== 'planning' || minimumPreparation(state) <= preparationCapacity(state), JSON.stringify({market, equipment, day, cash: state.cash, booking: state.booking, stock: state.stock}));
      assert.deepEqual(restore(serialize(state)), state);
    }
    assert.equal(state.phase, 'complete');
    assert.equal(state.receipts.at(-1)!.accepted, null);
  }
});
