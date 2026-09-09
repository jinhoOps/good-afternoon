import './styles.css';
import { DAYS, PRICES } from './content';
import { capacity, changeOrder, newGame, nextDay, openMarket, retryDay, type GameState } from './domain';
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
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function render(focusId?: string): void {
  const focus = focusId ?? (document.activeElement instanceof HTMLElement ? document.activeElement.id : '');
  app.innerHTML = view(state, ui);
  if (ui.modal) {
    const dialog = app.querySelector<HTMLDialogElement>('dialog');
    dialog?.showModal();
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
  render('close-modal');
}

function closeModal(): void {
  ui.modal = null;
  render(modalTrigger);
}

function finishAnimation(): void {
  if (timer) clearTimeout(timer);
  timer = null;
  ui.selling = false;
  ui.seen = DAYS[state.day].visitors.length;
  render('panel-title');
  if (window.innerWidth < 850) document.querySelector('.play-panel')?.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' });
}

function tick(): void {
  if (!ui.selling) return;
  if (ui.modal) { timer = setTimeout(tick, 200); return; }
  const count = DAYS[state.day].visitors.length;
  if (ui.seen >= count) { finishAnimation(); return; }
  ui.seen += 1;
  render();
  timer = setTimeout(tick, reducedMotion.matches ? 220 : 950);
}

function changeQuantity(quantity: number): void {
  const nextQuantity = Math.min(capacity(state.cash, state.day), Math.max(0, Math.trunc(quantity)));
  if (!Number.isFinite(nextQuantity)) { render('quantity'); return; }
  persist(changeOrder(state, { ...state.order, quantity: nextQuantity }));
  render();
}

app.addEventListener('change', (event) => {
  if (event.target instanceof HTMLInputElement && event.target.id === 'quantity') changeQuantity(event.target.valueAsNumber);
});

app.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('button[data-action]') : null;
  if (!target || target.disabled) return;
  const action = target.dataset.action;
  if (action === 'help' || action === 'journal' || action === 'reset') { showModal(action); return; }
  if (action === 'close-modal') { closeModal(); return; }
  if (action === 'confirm-reset') {
    if (timer) clearTimeout(timer);
    timer = null;
    ui.modal = null; ui.selling = false; ui.seen = 0;
    persist(newGame()); render('day-title');
    window.scrollTo({ top: 0, behavior: 'instant' });
    return;
  }
  if (ui.modal) return;
  if (action === 'skip' && ui.selling) { finishAnimation(); return; }
  if (ui.selling) return;
  if (action === 'less') changeQuantity(state.order.quantity - 1);
  if (action === 'more') changeQuantity(state.order.quantity + 1);
  if (action === 'quantity') changeQuantity(Number(target.dataset.value));
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
