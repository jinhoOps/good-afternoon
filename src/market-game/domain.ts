import { DAYS, INITIAL_CASH, MAX_STOCK, PRICES, COOLER_CAPACITY, COOLER_FEE, canRentCooler } from './content';

export type Phase = 'planning' | 'result' | 'complete';
export type Stock = { quantity: number; unitCost: number };
export type Order = { quantity: number; price: number; cooler: boolean };
type OrderInput = Pick<Order, 'quantity' | 'price'> & Partial<Pick<Order, 'cooler'>>;
export type Outcome = { visitor: number; kind: 'bought' | 'expensive' | 'sold-out' };
export type Receipt = Order & {
  day: number;
  openingCash: number;
  cost: number;
  coolerCost: number;
  revenue: number;
  cashChange: number;
  profit: number;
  closingCash: number;
  openingStock: Stock;
  savedStock: Stock;
  discarded: number;
  totalStock: number;
  sold: number;
  leftover: number;
  expensive: number;
  missed: number;
  outcomes: Outcome[];
};
export type GameState = { day: number; phase: Phase; cash: number; stock: Stock; order: Order; receipts: Receipt[] };
const emptyStock = (): Stock => ({ quantity: 0, unitCost: 0 });

export function capacity(cash: number, day: number): number {
  return Math.max(0, Math.min(MAX_STOCK, Math.floor(cash / DAYS[day].cost)));
}

export function preparationCapacity(state: GameState, cooler = state.order.cooler): number {
  return Math.min(MAX_STOCK - state.stock.quantity, capacity(state.cash - (cooler ? COOLER_FEE : 0), state.day));
}

export function newGame(): GameState {
  return { day: 0, phase: 'planning', cash: INITIAL_CASH, stock: emptyStock(), order: { quantity: 6, price: 1000, cooler: false }, receipts: [] };
}

function validOrder(state: GameState, order: Order): boolean {
  return typeof order.cooler === 'boolean' && (!order.cooler || canRentCooler(state.day))
    && Number.isInteger(order.quantity) && order.quantity >= 0 && order.quantity <= preparationCapacity(state, order.cooler)
    && order.quantity * DAYS[state.day].cost + (order.cooler ? COOLER_FEE : 0) <= state.cash
    && PRICES.includes(order.price as typeof PRICES[number]) && (state.day !== 0 || order.price === 1000);
}

export function changeOrder(state: GameState, input: OrderInput): GameState {
  const order = { ...state.order, ...input };
  if (state.phase !== 'planning' || !validOrder(state, order)) return state;
  return { ...state, order };
}

export function openMarket(state: GameState): GameState {
  if (state.phase !== 'planning' || !validOrder(state, state.order)) return state;
  const spec = DAYS[state.day];
  const { quantity, price, cooler } = state.order;
  const totalStock = quantity + state.stock.quantity;
  let sold = 0;
  const outcomes: Outcome[] = spec.visitors.map((visitor, index) => {
    if (visitor.budget < price) return { visitor: index, kind: 'expensive' };
    if (sold >= totalStock) return { visitor: index, kind: 'sold-out' };
    sold += 1;
    return { visitor: index, kind: 'bought' };
  });
  // 어제 보관한 음료부터 팔며, 하루 지난 음료는 다시 보관하지 않습니다.
  const freshLeft = quantity - Math.max(0, sold - state.stock.quantity);
  const savedQuantity = cooler ? Math.min(COOLER_CAPACITY, freshLeft) : 0;
  const savedStock = savedQuantity ? { quantity: savedQuantity, unitCost: spec.cost } : emptyStock();
  const cost = quantity * spec.cost;
  const coolerCost = cooler ? COOLER_FEE : 0;
  const revenue = sold * price;
  const cashChange = revenue - cost - coolerCost;
  // 보관 재료는 아직 소진된 비용이 아닙니다. 현금 변화와 이익을 구분합니다.
  const usedMaterialCost = state.stock.quantity * state.stock.unitCost + cost - savedQuantity * spec.cost;
  const profit = revenue - usedMaterialCost - coolerCost;
  const receipt: Receipt = {
    ...state.order, day: state.day, openingCash: state.cash, cost, coolerCost, revenue, cashChange, profit,
    closingCash: state.cash + cashChange, openingStock: { ...state.stock }, savedStock,
    totalStock, sold, leftover: totalStock - sold, discarded: totalStock - sold - savedQuantity,
    expensive: outcomes.filter((outcome) => outcome.kind === 'expensive').length,
    missed: outcomes.filter((outcome) => outcome.kind === 'sold-out').length, outcomes
  };
  return { ...state, phase: 'result', cash: receipt.closingCash, receipts: [...state.receipts, receipt] };
}

export function nextDay(state: GameState): GameState {
  if (state.phase !== 'result') return state;
  if (state.day === DAYS.length - 1) return { ...state, phase: 'complete' };
  const day = state.day + 1;
  const stock = { ...state.receipts.at(-1)!.savedStock };
  const next = { ...state, day, phase: 'planning' as const, stock, order: { quantity: 0, price: state.order.price, cooler: false } };
  return { ...next, order: { ...next.order, quantity: Math.min(Math.max(0, 6 - stock.quantity), preparationCapacity(next)) } };
}

export function retryDay(state: GameState): GameState {
  if (state.phase !== 'result') return state;
  const last = state.receipts.at(-1);
  if (!last) return state;
  return { ...state, phase: 'planning', cash: last.openingCash, stock: { ...last.openingStock }, receipts: state.receipts.slice(0, -1) };
}

export function resultNote(receipt: Receipt): string {
  if (receipt.totalStock === 0 && receipt.cooler) return '음료가 없어 보관함도 비었어요. 대여료는 지출했으니 다음에는 필요한지 먼저 살펴봐요.';
  if (receipt.totalStock === 0) return '오늘은 장터를 둘러봤어요. 준비 수량을 바꿔 같은 날을 다시 해볼 수도 있어요.';
  if (receipt.savedStock.quantity > 0) return `${receipt.savedStock.quantity}잔을 내일로 가져가요. 오늘은 현금을 썼지만, 내일은 이 음료의 재료비를 다시 내지 않아요.`;
  if (receipt.cooler && receipt.leftover === 0) return '다 팔려서 보관함을 쓰지 않았어요. 대여료도 나간 돈이니, 꼭 빌려야 할 날인지 함께 생각해봐요.';
  if (receipt.leftover > 0 && receipt.expensive > 0) return `가격 때문에 ${receipt.expensive}명이 발길을 돌렸어요. 다음에는 가격이나 물량을 조금 바꿔볼까요?`;
  if (receipt.leftover > 0) return `${receipt.discarded}잔은 판매 기한이 지나 정리했어요. 팔지 못한 음료에도 재료비가 들었네요.`;
  if (receipt.missed > 0) return `준비한 음료가 다 팔린 뒤에도 ${receipt.missed}명이 더 찾았어요. 다음에는 조금 더 준비할 여지가 있겠네요.`;
  return '준비한 음료가 모두 제 주인을 만났어요. 다음 영업의 손님 소식도 읽어보세요.';
}
