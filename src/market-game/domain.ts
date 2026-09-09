import { DAYS, INITIAL_CASH, MAX_STOCK, PRICES } from './content';

export type Phase = 'planning' | 'result' | 'complete';
export type Order = { quantity: number; price: number };
export type Outcome = { visitor: number; kind: 'bought' | 'expensive' | 'sold-out' };
export type Receipt = Order & {
  day: number;
  openingCash: number;
  cost: number;
  revenue: number;
  profit: number;
  closingCash: number;
  sold: number;
  leftover: number;
  expensive: number;
  missed: number;
  outcomes: Outcome[];
};
export type GameState = { day: number; phase: Phase; cash: number; order: Order; receipts: Receipt[] };

export function capacity(cash: number, day: number): number {
  return Math.min(MAX_STOCK, Math.floor(cash / DAYS[day].cost));
}

function defaultOrder(cash: number, day: number, price = 1000): Order {
  return { quantity: Math.min(6, capacity(cash, day)), price };
}

export function newGame(): GameState {
  return { day: 0, phase: 'planning', cash: INITIAL_CASH, order: defaultOrder(INITIAL_CASH, 0), receipts: [] };
}

function validOrder(state: GameState, order: Order): boolean {
  return Number.isInteger(order.quantity) && order.quantity >= 0 && order.quantity <= capacity(state.cash, state.day)
    && PRICES.includes(order.price as typeof PRICES[number]) && (state.day !== 0 || order.price === 1000);
}

export function changeOrder(state: GameState, order: Order): GameState {
  if (state.phase !== 'planning' || !validOrder(state, order)) return state;
  return { ...state, order: { ...order } };
}

export function openMarket(state: GameState): GameState {
  if (state.phase !== 'planning' || !validOrder(state, state.order)) return state;
  const spec = DAYS[state.day];
  const { quantity, price } = state.order;
  let sold = 0;
  const outcomes: Outcome[] = spec.visitors.map((visitor, index) => {
    if (visitor.budget < price) return { visitor: index, kind: 'expensive' };
    if (sold >= quantity) return { visitor: index, kind: 'sold-out' };
    sold += 1;
    return { visitor: index, kind: 'bought' };
  });
  const cost = quantity * spec.cost;
  const revenue = sold * price;
  const profit = revenue - cost;
  const receipt: Receipt = {
    ...state.order, day: state.day, openingCash: state.cash, cost, revenue, profit,
    closingCash: state.cash + profit, sold, leftover: quantity - sold,
    expensive: outcomes.filter((outcome) => outcome.kind === 'expensive').length,
    missed: outcomes.filter((outcome) => outcome.kind === 'sold-out').length, outcomes
  };
  return { ...state, phase: 'result', cash: receipt.closingCash, receipts: [...state.receipts, receipt] };
}

export function nextDay(state: GameState): GameState {
  if (state.phase !== 'result') return state;
  if (state.day === DAYS.length - 1) return { ...state, phase: 'complete' };
  const day = state.day + 1;
  return { ...state, day, phase: 'planning', order: defaultOrder(state.cash, day, state.order.price) };
}

export function retryDay(state: GameState): GameState {
  if (state.phase !== 'result') return state;
  const last = state.receipts.at(-1);
  if (!last) return state;
  return { ...state, phase: 'planning', cash: last.openingCash, receipts: state.receipts.slice(0, -1) };
}

export function resultNote(receipt: Receipt): string {
  if (receipt.quantity === 0) return '오늘은 장터를 둘러봤어요. 준비 수량을 바꿔 같은 날을 다시 해볼 수도 있어요.';
  if (receipt.leftover > 0 && receipt.expensive > 0) return `가격 때문에 ${receipt.expensive}명이 발길을 돌렸어요. 다음에는 가격이나 물량을 조금 바꿔볼까요?`;
  if (receipt.leftover > 0) return `${receipt.leftover}잔이 남았어요. 손님에게 받은 돈에서 팔지 못한 음료의 재료비도 빼야 해요.`;
  if (receipt.missed > 0) return `준비한 음료가 다 팔린 뒤에도 ${receipt.missed}명이 더 찾았어요. 다음에는 조금 더 준비할 여지가 있겠네요.`;
  return '준비한 음료가 모두 제 주인을 만났어요. 다음 영업의 손님 소식도 읽어보세요.';
}
