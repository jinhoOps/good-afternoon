import { COOLER_CAPACITY, COOLER_FEE, DAYS, canRentCooler, money } from './content';
import type { GameState, Receipt } from './domain';

export function coolerChoice(state: GameState): string {
  if (!canRentCooler(state.day)) return '';
  const affordable = state.cash - state.order.quantity * DAYS[state.day].cost >= COOLER_FEE;
  const next = DAYS[state.day + 1];
  const tomorrow = next.cost !== DAYS[state.day].cost
    ? `내일은 재료비가 한 잔 ${money(next.cost)}으로 올라요. 손님은 ${next.forecast.replace('손님 ', '')} 예상해요.`
    : `내일은 ${next.weatherLabel}. ${next.forecast} 예상해요. 재료비는 한 잔 ${money(next.cost)}이에요.`;
  return `<section class="cooler-choice" aria-labelledby="cooler-title">
    <div class="cooler-choice-heading"><div><span class="small-eyebrow">${state.day === 2 ? '새로운 선택 · 내일을 준비하기' : '다음 영업까지 생각하기'}</span><h3 id="cooler-title">남을 음료, 보관할까요?</h3></div><span class="cooler-price">하루 <b>${money(COOLER_FEE)}</b></span></div>
    <p>오늘 만든 음료 중 최대 ${COOLER_CAPACITY}잔을 내일까지만 보관해요. 빈 보관함도 대여료는 같아요.</p>
    <div class="tomorrow-news"><strong>내일 소식</strong><span>${tomorrow}</span></div>
    <button type="button" id="rent-cooler" class="cooler-toggle" data-action="cooler" aria-pressed="${state.order.cooler}" ${!affordable && !state.order.cooler ? 'disabled' : ''}><span class="toggle-mark" aria-hidden="true">${state.order.cooler ? '✓' : '+'}</span>${state.order.cooler ? '보관함 빌리기 선택됨' : '보관함 하루 빌리기'}<span>${state.order.cooler ? '취소' : money(COOLER_FEE)}</span></button>
    ${!affordable && !state.order.cooler ? '<small>빌리려면 음료 준비량을 조금 줄여야 해요.</small>' : ''}
  </section>`;
}

export function stockNotice(state: GameState): string {
  if (!state.stock.quantity) return '';
  return `<div class="carried-stock" role="note"><strong>어제 보관한 ${state.stock.quantity}잔이 있어요.</strong><p>이 음료부터 팔아요. 재료비는 이미 냈고, 오늘 남으면 다시 보관할 수 없어요.</p></div>`;
}

export function storageResult(receipt: Receipt): string {
  if (!receipt.cooler && !receipt.openingStock.quantity) return '';
  return `<div class="storage-result"><div><span>내일 가져갈 음료</span><strong>${receipt.savedStock.quantity}잔</strong></div><div><span>기한이 지나 정리한 음료</span><strong>${receipt.discarded}잔</strong></div>${receipt.savedStock.quantity ? '<p>보관한 음료의 재료비는 내일 다시 내지 않아요.</p>' : ''}</div>`;
}

export function inventoryAccounting(receipt: Receipt): string {
  if (!receipt.cooler && !receipt.openingStock.quantity) return '';
  const before = receipt.openingStock.quantity * receipt.openingStock.unitCost;
  const after = receipt.savedStock.quantity * receipt.savedStock.unitCost;
  const material = before + receipt.cost - after;
  const signed = `${receipt.profit < 0 ? '−' : '+'}${money(Math.abs(receipt.profit))}`;
  return `<details class="inventory-accounting"><summary>현금과 이익이 다른 이유 <span>+</span></summary><p>재료를 산 날과 그 음료를 판 날이 다를 수 있어요. 보관한 음료의 재료값은 사용하거나 버린 날의 비용으로 계산해요.</p><dl><div><dt>어제 가져온 재료값</dt><dd>${money(before)}</dd></div><div><dt>오늘 준비한 재료값</dt><dd>+${money(receipt.cost)}</dd></div><div><dt>내일로 남긴 재료값</dt><dd>−${money(after)}</dd></div><div><dt>오늘 소진한 재료비</dt><dd>${money(material)}</dd></div><div><dt>보관함 대여료</dt><dd>${money(receipt.coolerCost)}</dd></div><div class="accounting-profit"><dt>오늘 영업 이익</dt><dd>${signed}</dd></div></dl><small>영업 이익 = 매출 − 소진한 재료비 − 대여료. 이 가게는 임대료·세금 등 다른 비용을 생략해요.</small></details>`;
}

export function coolerScene(state: GameState, selling: boolean, sold: number): string {
  const result = state.phase !== 'planning' && !selling;
  const receipt = state.receipts.at(-1);
  if (!state.order.cooler && !state.stock.quantity) return '';
  const remaining = Math.max(0, state.stock.quantity - (selling ? sold : 0));
  const label = result ? (receipt?.savedStock.quantity ? `내일 가져갈 ${receipt.savedStock.quantity}잔` : '보관함이 비었어요')
    : remaining ? `어제 보관한 ${remaining}잔` : '보관 준비';
  return `<div class="cooler-prop ${result && receipt?.savedStock.quantity ? 'has-stock' : ''}" role="img" aria-label="${label}"><svg aria-hidden="true" viewBox="0 0 120 86"><ellipse cx="60" cy="78" rx="53" ry="7" fill="#36483c26"/><path d="M13 25h94l-7 49H20Z" fill="#809f98" stroke="#425c56" stroke-width="2"/><path d="M14 27h92v12H14Z" fill="#62847c"/><rect x="8" y="17" width="104" height="15" rx="5" fill="#e9e7d1" stroke="#425c56" stroke-width="2"/><path d="M41 17v-6h38v6M17 40H9v16h9m85-16h8v16h-8" fill="none" stroke="#425c56" stroke-width="4" stroke-linejoin="round"/><path d="M60 44v20m-9-15 18 10m-18 0 18-10" stroke="#fff9e4" stroke-width="3" stroke-linecap="round"/><path d="M27 43v22" stroke="#b6ccc3" stroke-width="3"/></svg><span>${label}</span></div>`;
}
