import { hasShop, isEquipment } from './equipment';
import { dayFor, isMarketId } from './markets';
import './styles.css';
import './cooler.css';
import './credits.css';
import './journey.css';
import './contracts.css';
import './atmosphere.css';
import { startAtmosphere, TIME_CONSENT_KEY } from './atmosphere';
import { startCredits } from './credits';
import { PRICES } from './content';
import { preparationCapacity, minimumPreparation, changeOrder, startMarket, nextDay, openMarket, retryDay, type GameState } from './domain';
import { load, save } from './storage';
import { view, type ViewState } from './view';

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('게임을 표시할 영역을 찾지 못했습니다.');
const app = root;
let storage: Storage | null = null;
try { storage = window.localStorage; } catch { /* 저장할 수 없어도 플레이는 이어집니다. */ }
const loaded = load(storage);
let state = loaded.state;
const ui: ViewState = { selling: false, seen: 0, notice: loaded.notice, modal: null };
let timer: ReturnType<typeof setTimeout> | null = null;
let modalTrigger = '';
let stopCredits: (() => void) | null = null;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const atmosphere = startAtmosphere(storage);
window.addEventListener('pagehide', (event) => { if (!event.persisted) atmosphere.stop(); });
window.addEventListener('storage', (event) => {
  if (ui.modal === 'atmosphere' && (event.key === TIME_CONSENT_KEY || event.key === null)) render();
});

function render(focusId?: string): void {
  const focus = focusId ?? (document.activeElement instanceof HTMLElement ? document.activeElement.id : '');
  stopCredits?.();
  stopCredits = null;
  app.innerHTML = view(state, { ...ui, timeLinked: atmosphere.isTimeEnabled() });
  if (ui.modal) {
    const dialog = app.querySelector<HTMLDialogElement>('dialog');
    dialog?.showModal();
    if (dialog && ui.modal === 'credits') stopCredits = startCredits(dialog, reducedMotion);
    dialog?.addEventListener('cancel', (event) => { event.preventDefault(); closeModal(); });
    dialog?.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeModal();
    });
  }
  if (focus) document.getElementById(focus)?.focus({ preventScroll: true });
}

function persist(next: GameState): void {
  state = next;
  if (!save(storage, state)) ui.notice = '이번 기록은 이 기기에 남기지 못했어요. 현재 플레이는 계속할 수 있어요.';
}

function showModal(modal: NonNullable<ViewState['modal']>): void {
  modalTrigger = document.activeElement instanceof HTMLElement ? document.activeElement.id : '';
  ui.modal = modal;
  render(modal === 'credits' ? 'credits-title' : 'close-modal');
}

function closeModal(): void {
  ui.modal = null;
  render(modalTrigger);
}

function finishAnimation(): void {
  if (timer) clearTimeout(timer);
  timer = null;
  ui.selling = false;
  ui.seen = dayFor(state).visitors.length;
  render('panel-title');
  if (window.innerWidth < 850) document.querySelector('.play-panel')?.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' });
}

function tick(): void {
  if (!ui.selling) return;
  if (ui.modal) { timer = setTimeout(tick, 200); return; }
  const count = dayFor(state).visitors.length;
  if (ui.seen >= count) { finishAnimation(); return; }
  ui.seen += 1;
  render();
  timer = setTimeout(tick, reducedMotion.matches ? 220 : 950);
}

function changeQuantity(quantity: number, repaint = true): void {
  const nextQuantity = Math.min(preparationCapacity(state), Math.max(minimumPreparation(state), Math.trunc(quantity)));
  if (!Number.isFinite(nextQuantity)) { if (repaint) render('quantity'); return; }
  persist(changeOrder(state, { ...state.order, quantity: nextQuantity }));
  if (repaint) render();
}

app.addEventListener('change', (event) => {
  if (event.target instanceof HTMLInputElement && event.target.id === 'time-consent') {
    atmosphere.setTimeConsent(event.target.checked);
    render('time-consent');
    return;
  }
  if (event.target instanceof HTMLInputElement && event.target.id === 'quantity' && event.target.valueAsNumber !== state.order.quantity) changeQuantity(event.target.valueAsNumber);
});

app.addEventListener('keydown', (event) => {
  if (event.key !== 'Tab' || event.ctrlKey || event.altKey || event.metaKey || !(event.target instanceof HTMLInputElement) || event.target.id !== 'quantity') return;
  // 값 확정으로 화면을 갱신한 뒤 새 수량에 맞는 다음 조작으로 이동합니다.
  // 브라우저가 제거된 버튼에 초점을 보내 페이지 맨 위로 돌아가지 않게 합니다.
  event.preventDefault();
  changeQuantity(event.target.valueAsNumber, false);
  event.target.value = String(state.order.quantity);
  render('quantity');
  const controls = Array.from(app.querySelectorAll<HTMLElement>('button, input, summary, a[href], [tabindex]'))
    .filter(element => element.tabIndex >= 0 && !element.matches(':disabled') && element.getClientRects().length > 0);
  const index = controls.findIndex(element => element.id === 'quantity');
  controls[index + (event.shiftKey ? -1 : 1)]?.focus();
});

app.addEventListener('pointerdown', (event) => {
  const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('button[data-action]') : null;
  // 입력 중 버튼을 누르면 blur의 렌더링이 해당 버튼을 지우지 않게 합니다.
  // 값 확정과 버튼 동작은 이어지는 click에서 한 번에 처리합니다.
  if (button && !button.disabled && document.activeElement?.id === 'quantity') event.preventDefault();
});

app.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('button[data-action]') : null;
  if (!target || target.disabled) return;
  if (state.phase === 'planning' && !ui.modal && document.activeElement instanceof HTMLInputElement && document.activeElement.id === 'quantity') {
    const value = document.activeElement.valueAsNumber;
    if (Number.isFinite(value)) changeQuantity(value, false);
    document.activeElement.value = String(state.order.quantity);
    target.focus({ preventScroll: true });
  }
  const action = target.dataset.action;
  if (action === 'help' || action === 'journal' || action === 'reset' || action === 'atmosphere') {
    showModal(action === 'reset' && state.phase === 'complete' ? 'credits' : action);
    return;
  }
  if (action === 'close-modal') { closeModal(); return; }
  if ((action === 'confirm-reset' && ui.modal === 'reset') || (action === 'replay-market' && ui.modal === 'credits' && state.phase === 'complete')) {
    if (timer) clearTimeout(timer);
    timer = null;
    ui.modal = null; ui.selling = false; ui.seen = 0;
    persist(startMarket(state, state.market)); render('day-title');
    window.scrollTo({ top: 0, behavior: 'instant' });
    return;
  }
  if (action === 'choose-market' && ui.modal === 'credits') { ui.modal = 'markets'; ui.equipment = state.equipment; render('modal-title'); return; }
  if (action === 'equipment' && ui.modal === 'markets' && hasShop(state) && isEquipment(target.dataset.equipment)) {
    ui.equipment = target.dataset.equipment; render(); return;
  }
  if (action === 'start-market' && ui.modal === 'markets' && state.phase === 'complete' && isMarketId(target.dataset.market)) {
    persist(startMarket(state, target.dataset.market, ui.equipment));
    ui.modal = null; ui.selling = false; ui.seen = 0;
    render('day-title'); window.scrollTo({ top: 0, behavior: 'instant' }); return;
  }
  if (ui.modal) return;
  if (action === 'skip' && ui.selling) { finishAnimation(); return; }
  if (ui.selling) return;
  if (action === 'less') changeQuantity(state.order.quantity - 1);
  if (action === 'more') changeQuantity(state.order.quantity + 1);
  if (action === 'quantity') changeQuantity(Number(target.dataset.value));
  if (action === 'booking') {
    persist(changeOrder(state, { ...state.order, booking: !state.order.booking })); render('accept-booking');
  }
  if (action === 'cooler') {
    persist(changeOrder(state, { ...state.order, cooler: !state.order.cooler }));
    render('rent-cooler');
  }
  if (action === 'price') {
    const price = Number(target.dataset.value);
    if (PRICES.includes(price as typeof PRICES[number])) { persist(changeOrder(state, { ...state.order, price })); render(); }
  }
  if (action === 'open' && state.phase === 'planning') {
    // 정산을 먼저 저장해 새로고침·연타로 매출이 중복 반영되지 않게 합니다.
    persist(openMarket(state));
    ui.selling = true; ui.seen = 0;
    render('skip-sales');
    if (window.innerWidth < 850) document.querySelector('.scene')?.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' });
    timer = setTimeout(tick, reducedMotion.matches ? 100 : 650);
  }
  if (action === 'next' && state.phase === 'result') {
    persist(nextDay(state)); render('day-title');
    window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  }
  if (action === 'retry' && state.phase === 'result') {
    persist(retryDay(state)); render('panel-title');
  }
});

render();
