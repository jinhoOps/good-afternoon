import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DAYS, INITIAL_CASH, PRICES } from '../content';
import { capacity, changeOrder, newGame, nextDay, openMarket, retryDay } from '../domain';
import { load, restore, save, serialize, STORAGE_KEY } from '../storage';

test('10잔을 준비하고 6잔을 팔면 매출은 6,000원, 이익은 1,000원입니다', () => {
  const state = openMarket(changeOrder(newGame(), { quantity: 10, price: 1000 }));
  const receipt = state.receipts[0];
  assert.equal(receipt.sold, 6);
  assert.equal(receipt.leftover, 4);
  assert.equal(receipt.revenue, 6000);
  assert.equal(receipt.cost, 5000);
  assert.equal(receipt.profit, 1000);
  assert.equal(state.cash, 7000);
});

test('준비한 재고보다 팔지 않고, 재료 예산을 초과하지 않습니다', () => {
  const initial = newGame();
  for (const quantity of [-1, 13, NaN, Infinity, 1.5]) {
    assert.equal(changeOrder(initial, { quantity, price: 1000 }), initial);
  }
  assert.equal(changeOrder(initial, { quantity: 6, price: 1500 }), initial);
  const state = openMarket(changeOrder(initial, { quantity: 4, price: 1000 }));
  assert.equal(state.receipts[0].sold, 4);
  assert.equal(state.receipts[0].missed, 2);
  assert.equal(state.receipts[0].leftover, 0);
});

test('가격과 손님 조건에 따라 판매량이 달라집니다', () => {
  const dayTwo = nextDay(openMarket(newGame()));
  const cheap = openMarket(changeOrder(dayTwo, { quantity: 12, price: 800 }));
  const premium = openMarket(changeOrder(dayTwo, { quantity: 12, price: 1500 }));
  assert.ok(cheap.receipts[1].sold > premium.receipts[1].sold);
  assert.ok(premium.receipts[1].expensive > 0);
});

test('연타와 결과 상태의 조작으로 정산이 중복되지 않습니다', () => {
  const result = openMarket(newGame());
  assert.equal(openMarket(result), result);
  assert.equal(changeOrder(result, { quantity: 10, price: 1000 }), result);
  assert.equal(nextDay(newGame()).day, 0);
  const next = nextDay(result);
  assert.equal(nextDay(next), next);
});

test('다시 해보기는 정확한 영업 전 돈과 이전 기록으로 돌아갑니다', () => {
  const dayOne = openMarket(newGame());
  const dayTwo = nextDay(dayOne);
  const result = openMarket(changeOrder(dayTwo, { quantity: 8, price: 1500 }));
  const retried = retryDay(result);
  assert.equal(retried.cash, dayTwo.cash);
  assert.equal(retried.day, 1);
  assert.equal(retried.phase, 'planning');
  assert.deepEqual(retried.receipts, dayTwo.receipts);
  assert.equal(retried.order.price, 1500);
});

test('여러 물량·가격의 5일 진행에서 현금과 손익이 일치합니다', () => {
  for (const price of PRICES) {
    for (const requested of [0, 2, 6, 12, 18]) {
      let state = newGame();
      for (let day = 0; day < DAYS.length; day++) {
        state = changeOrder(state, { quantity: Math.min(requested, capacity(state.cash, day)), price: day === 0 ? 1000 : price });
        state = openMarket(state);
        const receipt = state.receipts.at(-1)!;
        assert.ok(state.cash >= 0);
        assert.ok(receipt.sold <= receipt.quantity);
        assert.equal(receipt.sold + receipt.leftover, receipt.quantity);
        assert.equal(receipt.sold + receipt.missed + receipt.expensive, DAYS[day].visitors.length);
        assert.equal(state.cash, INITIAL_CASH + state.receipts.reduce((sum, item) => sum + item.profit, 0));
        assert.deepEqual(restore(serialize(state)), state);
        state = nextDay(state);
        assert.deepEqual(restore(serialize(state)), state);
      }
      assert.equal(state.phase, 'complete');
      assert.equal(openMarket(state), state);
      assert.equal(nextDay(state), state);
    }
  }
});

test('저장값의 잔액을 믿지 않고 선택 기록에서 다시 계산합니다', () => {
  const state = openMarket(newGame());
  const payload = JSON.parse(serialize(state));
  payload.cash = 100000000;
  payload.receipts[0].profit = 90000000;
  assert.deepEqual(restore(JSON.stringify(payload)), state);
  payload.receipts[0].quantity = 99;
  assert.equal(restore(JSON.stringify(payload)), null);
});

test('손상·다른 버전·잘못된 단계는 초기 상태로 복구합니다', () => {
  const invalid = ['{', 'null', '[]', '{}', '{"version":2}', '{"version":1,"phase":"complete","receipts":[]}', '{"version":1,"phase":"result","receipts":[]}'];
  for (const raw of invalid) {
    assert.equal(restore(raw), null);
    const result = load({ getItem: () => raw, setItem: () => {} });
    assert.deepEqual(result.state, newGame());
    assert.ok(result.notice);
  }
});

test('저장소 접근·쓰기 실패는 플레이를 막지 않습니다', () => {
  const throwing = { getItem: () => { throw new Error('읽기 실패'); }, setItem: () => { throw new Error('쓰기 실패'); } };
  assert.deepEqual(load(throwing).state, newGame());
  assert.equal(save(throwing, newGame()), false);
  assert.equal(save(null, newGame()), false);
  let key = '';
  assert.equal(save({ getItem: () => null, setItem: (value) => { key = value; } }, newGame()), true);
  assert.equal(key, STORAGE_KEY);
});
