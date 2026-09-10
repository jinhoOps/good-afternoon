import { money } from './content';
import type { GameState } from './domain';
import { MARKETS, nextPark } from './markets';
import { hasShop, type Equipment } from './equipment';

export function marketChoices(state: GameState, equipment: Equipment): string {
  const park = nextPark(state.market, state.records);
  return `<p class="journey-intro">운영 자금은 각각 6,000원으로 시작해요. 장터별 최고 기록은 이 브라우저에 남아요.</p><p class="journey-preview"><strong>다음 공원 소식 · ${MARKETS[park].edition}</strong>${MARKETS[park].description}</p>${equipmentChoices(state, equipment)}
    <div class="market-destinations">${([park, 'neighborhood'] as const).map(id => {
      const market = MARKETS[id];
      const record = state.records.find(record => record.market === id);
      return `<button id="destination-${id}" class="destination" data-action="start-market" data-market="${id}">
        <span class="destination-art ${id === 'neighborhood' ? 'village' : 'park'}" aria-hidden="true">${id === 'neighborhood' ? '⌂' : '♧'}</span>
        <span><small>${market.edition}</small><strong>${market.name}</strong><span>${market.description}</span><em>${record ? `최고 기록 ${money(record.cash)}` : '아직 열지 않은 장터'} · 출발 →</em></span>
      </button>`;
    }).join('')}</div><p class="journey-note">공원은 산책 주간과 공연 주간을 번갈아 만나요. 한 번 출발하면 다섯 오후의 조건은 그대로 유지돼요.</p>`;
}

function equipmentChoices(state: GameState, equipment: Equipment): string {
  if (!hasShop(state)) return '<p class="journey-note">어느 장터에서든 마지막에 준비금 15,000원이 모이면 우리 가게 간판과 설비 자리 하나가 생겨요.</p>';
  const options = [
    ['basic', '익숙한 진열대', '레모네이드 · 기본 보관 4잔, 대여 하루 600원'],
    ['pantry', '넓은 보관 자리', '레모네이드 · 보관 8잔, 대여 하루 1,000원'],
    ['tea', '새 메뉴 자리', '따뜻한 레몬티 · 재료비 +200원, 손님 취향에 따라 구매 반응 변화']
  ];
  return `<fieldset class="equipment-choice"><legend>우리 가게에 가져갈 설비</legend><p>설비 자리는 하나예요. 이번 다섯 오후 동안 유지하고 다음 장터에서 바꿀 수 있어요.</p><div>${options.map(([id, title, description]) => `<button id="equipment-${id}" data-action="equipment" data-equipment="${id}" aria-pressed="${equipment === id}"><strong>${title}</strong><span>${description}</span></button>`).join('')}</div><small>넓은 보관도 셋째·넷째 날 필요할 때만 빌려요. 새 메뉴 자리의 보관은 기본 4잔이에요.</small></fieldset>`;
}

export function shopScene(state: GameState): string {
  if (!hasShop(state)) return '';
  return `<div class="shop-sign" role="img" aria-label="목표를 달성해 마련한 우리 가게 간판과 진열대"><svg viewBox="0 0 240 125" aria-hidden="true"><path d="M42 0v30m155-30v30" stroke="#5b5641" stroke-width="4"/><rect x="8" y="25" width="224" height="76" rx="11" fill="#385c44" stroke="#eadbb1" stroke-width="4"/><rect x="16" y="33" width="208" height="60" rx="6" fill="none" stroke="#bbac72"/><text x="120" y="57" text-anchor="middle" fill="#e8dcae" font-size="12">오후의 작은 가게</text><text x="120" y="81" text-anchor="middle" fill="#fff6d7" font-size="19" font-weight="600">우리 가게</text><path d="M18 118h204" stroke="#796746" stroke-width="10" stroke-linecap="round"/><path d="M49 113V99h17v14m104 0V99h17v14" fill="#f1d16f" stroke="#837140" stroke-width="2"/></svg></div>${state.equipment !== 'basic' && (state.equipment === 'tea' || (!state.order.cooler && !state.stock.quantity)) ? `<span class="shop-equipment">${state.equipment === 'pantry' ? '넓은 보관 자리 · 최대 8잔' : '새 메뉴 · 따뜻한 레몬티'}</span>` : ''}`;
}

export function journeyRecords(state: GameState): string {
  if (!state.records.length) return '';
  return `<section class="journey-records"><h3>다시 가져갈 장터 기록</h3><p>이 장터를 새로 시작해도 최고 기록은 남아요.</p>${state.firstShop ? `<p>처음 간판을 단 곳 · ${MARKETS[state.firstShop.market].name}<br>그날의 준비금 ${money(state.firstShop.cash)}</p>` : ''}<ul>${state.records.map(record => `<li><span>${MARKETS[record.market].name} · ${MARKETS[record.market].edition}<br>${record.equipment === 'tea' ? '새 메뉴 자리' : record.equipment === 'pantry' ? '넓은 보관 자리' : '익숙한 진열대'}</span><strong>${money(record.cash)}</strong></li>`).join('')}</ul></section>`;
}
