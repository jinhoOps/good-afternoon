import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DAYS, INITIAL_CASH, COOLER_FEE, COOLER_CAPACITY } from '../content';
import { changeOrder, newGame, nextDay, openMarket, preparationCapacity, retryDay, type GameState } from '../domain';
import { restore, serialize } from '../storage';

function thirdDay(): GameState {
  return nextDay(openMarket(changeOrder(nextDay(openMarket(newGame())), { quantity: 8, price: 3600 })));
}

function keepFour(): GameState {
  return openMarket(changeOrder(thirdDay(), { quantity: 9, price: 2400, cooler: true }));
}

test('보관 대여는 셋째·넷째 날에만 가능하며 준비비와 같은 현금에서 나갑니다', () => {
  for (const state of [newGame(), nextDay(openMarket(newGame()))]) {
    assert.equal(changeOrder(state, { ...state.order, cooler: true }), state);
  }
  const state = { ...thirdDay(), cash: 7800 };
  assert.equal(preparationCapacity(state, true), 4);
  assert.equal(changeOrder(state, { quantity: 5, price: 2400, cooler: true }), state);
  const poor = { ...state, cash: COOLER_FEE - 1 };
  assert.equal(changeOrder(poor, { quantity: 0, price: 2400, cooler: true }), poor);
  const result = openMarket(changeOrder(state, { quantity: 4, price: 2400, cooler: true }));
  assert.equal(result.cash, 9600);
  assert.equal(result.receipts.at(-1)!.coolerCost, 1800);
  assert.equal(nextDay(result).order.cooler, false);
});

test('4잔의 재료값을 다음 날로 넘기며 현금과 이익을 구분합니다', () => {
  const result = keepFour();
  const receipt = result.receipts.at(-1)!;
  assert.equal(receipt.sold, 5);
  assert.equal(receipt.savedStock.quantity, 4);
  assert.equal(receipt.discarded, 0);
  assert.equal(receipt.cashChange, -3300);
  assert.equal(receipt.profit, 2700);
  assert.equal(receipt.profit - receipt.cashChange, 6000);
  const next = nextDay(result);
  assert.deepEqual(next.stock, { quantity: 4, unitCost: 1500 });
  assert.equal(next.order.quantity, 2);
  assert.equal(preparationCapacity(next), 14);
});

test('보관분은 재료비를 다시 내지 않으며 먼저 판매하고 재보관하지 않습니다', () => {
  const dayFour = nextDay(keepFour());
  const result = openMarket(changeOrder(dayFour, { quantity: 0, price: 4500, cooler: true }));
  const receipt = result.receipts.at(-1)!;
  assert.equal(receipt.sold, 2);
  assert.equal(receipt.cost, 0);
  assert.equal(receipt.savedStock.quantity, 0);
  assert.equal(receipt.discarded, 2);
  assert.equal(receipt.cashChange, 7200);
  assert.equal(receipt.profit, 1200);
  assert.equal(nextDay(result).stock.quantity, 0);
});

test('묵은 재고부터 팔고 새 음료만 최대 4잔 보관합니다', () => {
  const result = openMarket(changeOrder(nextDay(keepFour()), { quantity: 8, price: 4500, cooler: true }));
  const receipt = result.receipts.at(-1)!;
  assert.equal(receipt.totalStock, 12);
  assert.equal(receipt.sold, 2);
  assert.deepEqual(receipt.savedStock, { quantity: 4, unitCost: 2100 });
  assert.equal(receipt.discarded, 6);
  const last = nextDay(result);
  assert.equal(changeOrder(last, { ...last.order, cooler: true }), last);
  const final = nextDay(openMarket(changeOrder(last, { quantity: 2, price: 4500 })));
  assert.equal(final.phase, 'complete');
  assert.equal(final.receipts.at(-1)!.savedStock.quantity, 0);
});

test('재료비 상승 전 4잔을 보관하면 600원을 아끼고, 빈 보관함은 1,800원을 더 씁니다', () => {
  const baseline = openMarket(changeOrder(nextDay(openMarket(changeOrder(thirdDay(), { quantity: 5, price: 2400 }))), { quantity: 7, price: 3600 }));
  const invested = openMarket(changeOrder(nextDay(keepFour()), { quantity: 3, price: 3600 }));
  assert.equal(invested.cash - baseline.cash, 600);
  assert.equal(invested.receipts.at(-1)!.sold, baseline.receipts.at(-1)!.sold);
  const noLeft = openMarket(changeOrder(thirdDay(), { quantity: 5, price: 2400, cooler: true }));
  const noRental = openMarket(changeOrder(thirdDay(), { quantity: 5, price: 2400 }));
  assert.equal(noRental.cash - noLeft.cash, 1800);
});

test('재시도와 저장 복원에서 보관분·대여료가 복제되거나 사라지지 않습니다', () => {
  const dayFour = changeOrder(nextDay(keepFour()), { quantity: 8, price: 4500, cooler: true });
  assert.deepEqual(restore(serialize(dayFour)), dayFour);
  const result = openMarket(dayFour);
  const restored = restore(serialize(result))!;
  assert.deepEqual(restored, result);
  assert.deepEqual(retryDay(restored), dayFour);
  assert.deepEqual(openMarket(retryDay(restored)), result);
  const forged = JSON.parse(serialize(dayFour));
  forged.stock = { quantity: 99, unitCost: -30000 };
  forged.cash = 2999997;
  assert.deepEqual(restore(JSON.stringify(forged)), dayFour);
  forged.receipts[0].cooler = true;
  assert.equal(restore(JSON.stringify(forged)), null);
});

test('기존 v1의 모든 단계 기록을 손실 없이 이어 읽습니다', () => {
  let state = newGame();
  for (let day = 0; day < DAYS.length; day++) {
    for (const phase of ['planning', 'result'] as const) {
      if (phase === 'result') state = openMarket(state);
      const v1 = { version: 1, phase, order: { quantity: state.order.quantity, price: state.order.price / 3 }, receipts: state.receipts.map(({ quantity, price }) => ({ quantity, price: price / 3 })) };
      assert.deepEqual(restore(JSON.stringify(v1)), state);
    }
    state = nextDay(state);
  }
  const complete = { version: 1, phase: 'complete', receipts: state.receipts.map(({ quantity, price }) => ({ quantity, price: price / 3 })) };
  assert.deepEqual(restore(JSON.stringify(complete)), state);
  const malformed = JSON.parse(serialize(thirdDay()));
  delete malformed.order.cooler;
  assert.equal(restore(JSON.stringify(malformed)), null);
});

test('다양한 5일 경로에서 현금·재고·손익 보존과 음료의 기한을 유지합니다', () => {
  for (const quantity of [0, 3, 8, 12, 18]) {
    for (const price of [2400, 3000, 3600, 4500]) {
      for (const rent of [false, true]) {
        let state = newGame();
        for (let day = 0; day < DAYS.length; day++) {
          const cooler = rent && day >= 2 && day <= 3 && state.cash >= COOLER_FEE;
          state = changeOrder(state, { quantity: Math.min(quantity, preparationCapacity(state, cooler)), price: day === 0 ? 3000 : price, cooler });
          state = openMarket(state);
          const r = state.receipts.at(-1)!;
          assert.ok(state.cash >= 0);
          assert.equal(r.sold + r.savedStock.quantity + r.discarded, r.totalStock);
          assert.ok(r.savedStock.quantity <= COOLER_CAPACITY);
          assert.ok(r.savedStock.quantity <= r.quantity);
          assert.equal(state.cash, INITIAL_CASH + state.receipts.reduce((sum, item) => sum + item.cashChange, 0));
          assert.equal(state.cash + r.savedStock.quantity * r.savedStock.unitCost, INITIAL_CASH + state.receipts.reduce((sum, item) => sum + item.profit, 0));
          assert.deepEqual(restore(serialize(state)), state);
          state = nextDay(state);
          assert.deepEqual(restore(serialize(state)), state);
        }
      }
    }
  }
});
