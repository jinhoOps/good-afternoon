import { DAYS, INITIAL_CASH, DREAM_CASH, MAX_STOCK, PRICES, canRentCooler } from './content';
import { dayFor, fixedPrice, type MarketId } from './markets';
import { hasShop, unitCost, rentalFee, storageLimit, willingness, type Equipment } from './equipment';
import { bookingOffer, type Booking } from './contracts';

export type Phase = 'planning' | 'result' | 'complete';
export type Stock = { quantity: number; unitCost: number };
export type Order = { quantity: number; price: number; cooler: boolean; booking: boolean };
type OrderInput = Pick<Order, 'quantity' | 'price'> & Partial<Pick<Order, 'cooler' | 'booking'>>;
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
  delivered: Booking | null;
  accepted: Booking | null;
  walkInSold: number;
};
export type RunRecord = { market: MarketId; equipment: Equipment; orders: Order[]; cash: number };
export type GameState = { market: MarketId; equipment: Equipment; booking: Booking | null; records: RunRecord[]; firstShop: RunRecord | null; day: number; phase: Phase; cash: number; stock: Stock; order: Order; receipts: Receipt[] };
const emptyStock = (): Stock => ({ quantity: 0, unitCost: 0 });

export function capacity(cash: number, day: number, market: MarketId = 'neighborhood', equipment: Equipment = 'basic'): number {
  return Math.max(0, Math.min(MAX_STOCK, Math.floor(cash / unitCost({ day, market, equipment }))));
}

export function preparationCapacity(state: GameState, cooler = state.order.cooler, booking = state.order.booking): number {
  const offer = booking ? bookingOffer(state) : null;
  const reserve = offer ? Math.max(0, offer.reserved - offer.prepaid) : 0;
  return Math.min(MAX_STOCK - state.stock.quantity, capacity(state.cash - reserve - (cooler ? rentalFee(state) : 0), state.day, state.market, state.equipment));
}

export const minimumPreparation = (state: GameState): number => Math.max(0, (state.booking?.quantity ?? 0) - state.stock.quantity);

export function newGame(market: MarketId = 'neighborhood', records: RunRecord[] = [], equipment: Equipment = 'basic', firstShop: RunRecord | null = null): GameState {
  return { market, equipment, booking: null, records, firstShop, day: 0, phase: 'planning', cash: INITIAL_CASH, stock: emptyStock(), order: { quantity: 6, price: 3000, cooler: false, booking: false }, receipts: [] };
}

export function startMarket(state: GameState, market: MarketId, equipment: Equipment = state.equipment): GameState {
  if (market !== state.market && (state.phase !== 'complete' || state.records.length === 0)) return state;
  if (equipment !== 'basic' && !hasShop(state)) return state;
  if (equipment !== state.equipment && state.phase !== 'complete') return state;
  return newGame(market, state.records, equipment, state.firstShop);
}

function rememberRun(state: GameState): RunRecord[] {
  const previous = state.records.find(record => record.market === state.market);
  const record = { market: state.market, equipment: state.equipment, cash: state.cash, orders: state.receipts.map(({ quantity, price, cooler, booking }) => ({ quantity, price, cooler, booking })) };
  // 최고 기록의 내용은 유지하고 최근에 마친 장터를 마지막에 둡니다.
  return [...state.records.filter(item => item !== previous), previous && previous.cash >= state.cash ? previous : record];
}

function validOrder(state: GameState, order: Order): boolean {
  return typeof order.cooler === 'boolean' && (!order.cooler || canRentCooler(state.day))
    && typeof order.booking === 'boolean' && (!order.booking || bookingOffer(state) !== null)
    && Number.isInteger(order.quantity) && order.quantity >= minimumPreparation(state) && order.quantity <= preparationCapacity(state, order.cooler, order.booking)
    && order.quantity * unitCost(state) + (order.cooler ? rentalFee(state) : 0) <= state.cash
    && PRICES.includes(order.price as typeof PRICES[number]) && (!fixedPrice(state) || order.price === 3000);
}

export function changeOrder(state: GameState, input: OrderInput): GameState {
  const order = { ...state.order, ...input };
  if (state.phase !== 'planning' || !validOrder(state, order)) return state;
  return { ...state, order };
}

export function openMarket(state: GameState): GameState {
  if (state.phase !== 'planning' || !validOrder(state, state.order)) return state;
  const spec = dayFor(state);
  const { quantity, price, cooler } = state.order;
  const totalStock = quantity + state.stock.quantity;
  let sold = state.booking?.quantity ?? 0;
  const outcomes: Outcome[] = spec.visitors.map((_, index) => {
    if (willingness(state, index) < price) return { visitor: index, kind: 'expensive' };
    if (sold >= totalStock) return { visitor: index, kind: 'sold-out' };
    sold += 1;
    return { visitor: index, kind: 'bought' };
  });
  // 어제 보관한 음료부터 팔며, 하루 지난 음료는 다시 보관하지 않습니다.
  const freshLeft = quantity - Math.max(0, sold - state.stock.quantity);
  const savedQuantity = cooler ? Math.min(storageLimit(state), freshLeft) : 0;
  const savedStock = savedQuantity ? { quantity: savedQuantity, unitCost: unitCost(state) } : emptyStock();
  const cost = quantity * unitCost(state);
  const coolerCost = cooler ? rentalFee(state) : 0;
  const accepted = state.order.booking ? bookingOffer(state) : null;
  const walkInSold = sold - (state.booking?.quantity ?? 0);
  const revenue = walkInSold * price + (state.booking?.prepaid ?? 0);
  const cashChange = walkInSold * price + (accepted?.prepaid ?? 0) - cost - coolerCost;
  // 보관 재료는 아직 소진된 비용이 아닙니다. 현금 변화와 이익을 구분합니다.
  const usedMaterialCost = state.stock.quantity * state.stock.unitCost + cost - savedQuantity * unitCost(state);
  const profit = revenue - usedMaterialCost - coolerCost;
  const receipt: Receipt = {
    ...state.order, day: state.day, openingCash: state.cash, cost, coolerCost, revenue, cashChange, profit,
    closingCash: state.cash + cashChange, openingStock: { ...state.stock }, savedStock,
    totalStock, sold, leftover: totalStock - sold, discarded: totalStock - sold - savedQuantity,
    expensive: outcomes.filter((outcome) => outcome.kind === 'expensive').length,
    missed: outcomes.filter((outcome) => outcome.kind === 'sold-out').length, outcomes,
    delivered: state.booking, accepted, walkInSold
  };
  return { ...state, phase: 'result', cash: receipt.closingCash, receipts: [...state.receipts, receipt] };
}

export function nextDay(state: GameState): GameState {
  if (state.phase !== 'result') return state;
  if (state.day === DAYS.length - 1) {
    const records = rememberRun(state);
    return { ...state, phase: 'complete', records, firstShop: state.firstShop ?? (hasShop({ records }) ? records.find(record => record.cash >= DREAM_CASH)! : null), stock: emptyStock(), booking: null };
  }
  const day = state.day + 1;
  const stock = { ...state.receipts.at(-1)!.savedStock };
  const booking = state.receipts.at(-1)!.accepted;
  const next = { ...state, day, phase: 'planning' as const, stock, booking, order: { quantity: 0, price: state.order.price, cooler: false, booking: false } };
  return { ...next, order: { ...next.order, quantity: Math.min(Math.max(minimumPreparation(next), 6 - stock.quantity), preparationCapacity(next)) } };
}

export function retryDay(state: GameState): GameState {
  if (state.phase !== 'result') return state;
  const last = state.receipts.at(-1);
  if (!last) return state;
  return { ...state, phase: 'planning', cash: last.openingCash, stock: { ...last.openingStock }, receipts: state.receipts.slice(0, -1) };
}

export function resultNote(receipt: Receipt): string {
  if (receipt.delivered && receipt.missed > 0) return `단체 주문 ${receipt.delivered.quantity}잔을 먼저 드린 뒤, 일반 손님 ${receipt.missed}명은 품절로 돌아갔어요. 예약 대금과 놓친 판매 기회를 함께 봐주세요.`;
  if (receipt.totalStock === 0 && receipt.cooler) return '음료가 없어 보관함도 비었어요. 대여료는 지출했으니 다음에는 필요한지 먼저 살펴봐요.';
  if (receipt.totalStock === 0) return '오늘은 장터를 둘러봤어요. 준비 수량을 바꿔 같은 날을 다시 해볼 수도 있어요.';
  if (receipt.savedStock.quantity > 0) return `${receipt.savedStock.quantity}잔을 내일로 가져가요. 오늘은 현금을 썼지만, 내일은 이 음료의 재료비를 다시 내지 않아요.`;
  if (receipt.cooler && receipt.leftover === 0) return '다 팔려서 보관함을 쓰지 않았어요. 대여료도 나간 돈이니, 꼭 빌려야 할 날인지 함께 생각해봐요.';
  if (receipt.leftover > 0 && receipt.expensive > 0) return `가격 때문에 ${receipt.expensive}명이 발길을 돌렸어요. 다음에는 가격이나 물량을 조금 바꿔볼까요?`;
  if (receipt.leftover > 0) return `${receipt.discarded}잔은 판매 기한이 지나 정리했어요. 팔지 못한 음료에도 재료비가 들었네요.`;
  if (receipt.missed > 0) return `준비한 음료가 다 팔린 뒤에도 ${receipt.missed}명이 더 찾았어요. 다음에는 조금 더 준비할 여지가 있겠네요.`;
  return '준비한 음료가 모두 제 주인을 만났어요. 다음 영업의 손님 소식도 읽어보세요.';
}
