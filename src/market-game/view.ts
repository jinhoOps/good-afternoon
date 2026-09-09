import { DAYS, DREAM_CASH, INITIAL_CASH, PRICES, money } from './content';
import { capacity, resultNote, type GameState, type Receipt } from './domain';

export type ViewState = { selling: boolean; seen: number; notice: string; modal: 'help' | 'journal' | 'reset' | null };

const paths: Record<string, string> = {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  cup: '<path d="M5 6h14l-2 15H7L5 6Z"/><path d="m13 11 3-9h5M7 13h10"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  book: '<path d="M4 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-4-2H4V4Zm9 3a3 3 0 0 1 3-3h5v15h-4a4 4 0 0 0-4 2"/>',
  wallet: '<path d="M20 8H5a2 2 0 0 1 0-4h13v4M4 6v13a1 1 0 0 0 1 1h15V8M20 12h-6v4h6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  rain: '<path d="M7 15H6a4 4 0 1 1 1-8 6 6 0 0 1 11-1 4.5 4.5 0 0 1 0 9h-1M9 16l-1 4m5-4-1 4m5-3-1 4"/>',
  people: '<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 4v3"/>',
  leaf: '<path d="M20 3C8 2 2 9 6 16s15 3 14-13ZM4 21 15 9"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  repeat: '<path d="M4 9a8 8 0 1 1 0 6m0-12v6h6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',
  star: '<path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6Z"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="M15 8h-4a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4H9m3-10v12"/>'
};

export function icon(name: string, className = ''): string {
  return `<svg class="icon ${className}" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${paths[name] ?? paths.sun}</svg>`;
}

const difference = (value: number): string => `${value > 0 ? '+' : value < 0 ? '−' : ''}${money(Math.abs(value))}`;

function liveReceipt(state: GameState, ui: ViewState): { sold: number; cash: number; left: number } {
  const last = state.receipts.at(-1);
  if (!ui.selling || !last) return { sold: last?.sold ?? 0, cash: state.cash, left: last?.leftover ?? state.order.quantity };
  const sold = last.outcomes.slice(0, ui.seen).filter((outcome) => outcome.kind === 'bought').length;
  return { sold, cash: last.openingCash - last.cost + sold * last.price, left: last.quantity - sold };
}

function scene(state: GameState, ui: ViewState): string {
  const day = DAYS[state.day];
  const last = state.receipts.at(-1);
  const live = liveReceipt(state, ui);
  const showResult = state.phase !== 'planning' && !ui.selling;
  const cups = state.phase === 'planning' ? state.order.quantity : live.left;
  const outcome = ui.selling && ui.seen > 0 ? last?.outcomes[ui.seen - 1] : null;
  const visitor = outcome ? day.visitors[outcome.visitor] : null;
  const bubble = outcome?.kind === 'bought' ? `이걸로 할게요! · +${money(state.order.price)}`
    : outcome?.kind === 'expensive' ? '오늘은 조금 비싸네요. 다음에 올게요.' : '앗, 다 팔렸네요. 다음에 올게요!';
  return `<section class="world-column" aria-label="오후의 레모네이드 가게">
    <div class="scene weather-${day.weather} ${ui.selling ? 'is-selling' : ''}">
      <img class="scene-art" src="${new URL('./assets/market.png', import.meta.url).href}" alt="노란 차양 아래에서 레모네이드를 파는 작은 초록색 노점과 가게 주인" fetchpriority="high">
      <div class="weather-atmosphere" aria-hidden="true"></div>
      <div class="scene-label"><span class="live-dot ${ui.selling ? 'active' : ''}"></span>${ui.selling ? '장사하는 중' : showResult ? '오늘의 장사 끝' : '곧 문을 열어요'}</div>
      <div class="weather-label">${icon(day.weather === 'rain' ? 'rain' : 'sun')} ${day.weatherLabel}</div>
      ${visitor ? `<div class="customer-bubble" role="status"><span class="avatar" style="--avatar:${visitor.color}">${visitor.name.slice(0, 1)}</span><div><small>${visitor.name}</small><p>${bubble}</p></div></div>` : ''}
      <div class="counter-display"><div class="counter-caption">${icon('cup')} ${showResult ? '남은 음료' : ui.selling ? '지금 진열대' : '준비할 레모네이드'}<strong>${cups}<span>잔</span></strong></div><div class="cup-row" aria-hidden="true">${Array.from({ length: Math.min(12, cups) }, () => icon('cup', 'stock-cup')).join('')}${cups > 12 ? `<span class="more-cups">+${cups - 12}</span>` : ''}${cups === 0 ? '<span class="empty-shelf">비어 있는 진열대</span>' : ''}</div></div>
    </div>
    <div class="market-news"><span class="news-icon">${icon('people')}</span><div><div class="news-topline"><strong>${day.forecast}</strong><span>오늘의 장터 소식</span></div><p>${day.news}</p></div></div>
    <div class="dream"><span class="dream-icon">${icon('leaf')}</span><div class="dream-copy"><strong>언젠가, 내 이름을 건 가게</strong><p>다섯 번의 오후 동안 준비금 ${money(DREAM_CASH)} 모아보기</p></div><div class="dream-progress" role="progressbar" aria-label="가게 준비금" aria-valuemin="0" aria-valuemax="${DREAM_CASH}" aria-valuenow="${Math.min(DREAM_CASH, live.cash)}"><span style="width:${Math.min(100, live.cash / DREAM_CASH * 100)}%"></span></div></div>
  </section>`;
}

function planning(state: GameState): string {
  const day = DAYS[state.day];
  const max = capacity(state.cash, state.day);
  const cost = state.order.quantity * day.cost;
  return `<section class="play-panel" aria-labelledby="panel-title">
    <div class="panel-eyebrow">${icon('cup')} 오늘의 메뉴 · 레모네이드</div>
    <h2 id="panel-title" tabindex="-1">오늘은 몇 잔<br> 준비해볼까요?</h2>
    <p class="panel-intro">${day.hint}</p>
    <div class="order-block"><div class="field-heading"><label for="quantity">준비할 음료</label><span>한 잔 재료비 ${money(day.cost)}</span></div>
      <div class="stepper"><button id="less" data-action="less" aria-label="한 잔 줄이기" ${state.order.quantity === 0 ? 'disabled' : ''}>−</button><div class="quantity-display"><input id="quantity" aria-label="준비할 음료 수량" type="number" inputmode="numeric" min="0" max="${max}" value="${state.order.quantity}"><span>잔</span></div><button id="more" data-action="more" aria-label="한 잔 늘리기" ${state.order.quantity === max ? 'disabled' : ''}>+</button></div>
      <div class="quantity-presets" aria-label="준비 수량 빠르게 선택">${[4, 8, 12].map((qty) => `<button id="preset-${qty}" data-action="quantity" data-value="${qty}" class="${state.order.quantity === qty ? 'selected' : ''}" ${qty > max ? 'disabled' : ''}>${qty}잔</button>`).join('')}</div>
    </div>
    <fieldset class="price-block"><legend>한 잔 판매가 ${state.day === 0 ? '<span>첫날은 1,000원으로 시작해요</span>' : ''}</legend>${state.day === 0 ? `<div class="fixed-price"><strong>1,000<span>원</span></strong><span>가격 정하기는 다음 오후부터</span></div>` : `<div class="price-options">${PRICES.map((price) => `<button type="button" id="price-${price}" data-action="price" data-value="${price}" aria-pressed="${state.order.price === price}">${price.toLocaleString('ko-KR')}<small>원</small></button>`).join('')}</div>`}</fieldset>
    <div class="cost-summary"><div><span>오늘 준비에 쓰는 돈</span><strong>${money(cost)}</strong></div><div><span>준비하고 남는 돈</span><strong>${money(state.cash - cost)}</strong></div></div>
    <p class="perish-note">${icon('info')} 남은 음료는 다음 날 팔 수 없어요.</p>
    ${max === 0 ? '<p class="empty-budget">지금은 재료를 살 돈이 없어요. 이번 영업을 쉬거나 새 장터를 시작할 수 있어요.</p>' : ''}
    <button id="open-market" class="primary-button" data-action="open">${state.order.quantity === 0 ? '이번 영업 쉬기' : '가게 문 열기'} ${icon('arrow')}</button>
    <div class="panel-footnote">급하게 고르지 않아도 괜찮아요.</div>
  </section>`;
}

function selling(state: GameState, ui: ViewState): string {
  const receipt = state.receipts.at(-1)!;
  const live = liveReceipt(state, ui);
  return `<section class="play-panel selling-panel" aria-labelledby="panel-title"><div class="panel-eyebrow"><span class="live-dot active"></span> 오늘의 영업</div><h2 id="panel-title" tabindex="-1">어서 오세요,<br> 시원한 한 잔 어때요?</h2><p class="panel-intro">손님들의 반응을 살펴보세요.<br> 준비한 물량과 가격이 어떻게 돌아올까요?</p><div class="live-sales"><div class="large-cup">${icon('cup')}</div><strong>${live.sold}<span>잔 팔았어요</span></strong><p>지금까지 받은 돈 <b>${money(live.sold * receipt.price)}</b></p></div><div class="visitor-track" aria-label="손님 ${receipt.outcomes.length}명 중 ${ui.seen}명 방문">${receipt.outcomes.map((outcome, index) => `<span class="${index < ui.seen ? outcome.kind : ''}" aria-hidden="true"></span>`).join('')}</div><p class="visitors-progress">${ui.seen} / ${receipt.outcomes.length}명 방문</p><button id="skip-sales" class="secondary-button" data-action="skip">영업 결과 바로 보기 ${icon('arrow')}</button></section>`;
}

function receiptRows(receipt: Receipt): string {
  return `<div class="receipt-rows"><div><span>손님에게 받은 돈 <small>${receipt.sold}잔 × ${money(receipt.price)}</small></span><strong>+${money(receipt.revenue)}</strong></div><div><span>재료에 쓴 돈 <small>준비한 ${receipt.quantity}잔 전체</small></span><strong>−${money(receipt.cost)}</strong></div><div class="profit-row"><span>오늘 남긴 돈</span><strong class="${receipt.profit < 0 ? 'negative' : ''}">${difference(receipt.profit)}</strong></div></div>`;
}

function result(state: GameState): string {
  const day = DAYS[state.day];
  const receipt = state.receipts.at(-1)!;
  return `<section class="play-panel result-panel" aria-labelledby="panel-title"><div class="panel-eyebrow">${icon('check')} ${day.label}의 기록</div><h2 id="panel-title" tabindex="-1">${receipt.leftover > 0 ? '오늘의 경험도<br> 가게에 남았어요.' : receipt.quantity === 0 ? '잠시 쉬어가는<br> 오후도 있어요.' : '한 잔씩, 차곡차곡.<br> 수고했어요!'}</h2><div class="sales-summary"><span><strong>${receipt.sold}</strong>잔 판매</span><span><strong>${receipt.leftover}</strong>잔 남음</span><span><strong>${receipt.expensive + receipt.missed}</strong>명 돌아감</span></div>${receiptRows(receipt)}<p class="result-observation">${resultNote(receipt)}</p><details class="concept-note"><summary>${icon('leaf')} 오늘 만난 경제 · ${day.concept.title}<span>+</span></summary><p>${day.concept.description}</p><small>이 작은 가게에서는 재료비만 계산해요. 실제 장사에는 임대료 등 다른 비용도 있어요.</small></details><button id="next-day" class="primary-button" data-action="next">${state.day === DAYS.length - 1 ? '다섯 번의 오후 돌아보기' : '다음 오후로'} ${icon('arrow')}</button><button id="retry-day" class="text-button retry" data-action="retry">${icon('repeat')} 다른 선택으로 오늘 다시 해보기</button><p class="retry-note">다시 하면 오늘 영업 전의 돈으로 돌아가요.</p></section>`;
}

function finale(state: GameState): string {
  const earned = state.cash - INITIAL_CASH;
  const fulfilled = state.cash >= DREAM_CASH;
  return `<section class="play-panel final-panel" aria-labelledby="panel-title"><div class="panel-eyebrow">${icon('star')} 다섯 번의 오후를 지나</div><h2 id="panel-title" tabindex="-1">${fulfilled ? '내 가게의 시작이<br> 조금 가까워졌어요.' : '내일은 조금 다르게<br> 해볼 수 있겠죠.'}</h2><p class="panel-intro">${fulfilled ? '손님을 읽고, 가격을 고르고, 다음을 준비했어요. 내 이름을 건 가게를 위한 준비금이 모였네요.' : '어떤 날엔 모자라고, 어떤 날엔 남았죠. 그 차이를 알아차린 경험도 다음 장터에 가져가요.'}</p><div class="final-cash"><span>장터를 마친 내 주머니</span><strong>${money(state.cash)}</strong><small>시작 ${money(INITIAL_CASH)}에서 ${difference(earned)}</small></div><ol class="day-history">${state.receipts.map((receipt) => `<li><span>${receipt.day + 1}일차</span><span>${receipt.sold} / ${receipt.quantity}잔 판매</span><strong class="${receipt.profit < 0 ? 'negative' : ''}">${difference(receipt.profit)}</strong></li>`).join('')}</ol><p class="final-question">같은 손님을 다시 만난다면,<br> 어느 날의 선택을 바꿔보고 싶나요?</p><button id="new-market" class="primary-button" data-action="reset">새 장터 열기 ${icon('arrow')}</button><button id="final-journal" class="text-button retry" data-action="journal">${icon('book')} 내 영업 기록 자세히 보기</button></section>`;
}

function modal(state: GameState, kind: ViewState['modal']): string {
  if (!kind) return '';
  let title = '작은 가게를 여는 방법';
  let content = `<ol class="help-steps"><li><strong>장터 소식 읽기</strong><p>오늘 찾아올 손님과 재료값을 살펴보세요.</p></li><li><strong>물량과 가격 정하기</strong><p>가진 돈 안에서 준비해요. 처음에는 물량만 고르면 돼요.</p></li><li><strong>손님의 반응 보기</strong><p>팔린 음료와 남은 음료, 실제로 번 돈을 연결해보세요.</p></li></ol><p class="modal-note">다섯 번의 영업으로 끝나는 작은 게임이에요. 같은 날 다시 해보기로 결과를 비교할 수 있어요. 기록은 이 브라우저에 자동으로 남아요.</p>`;
  if (kind === 'journal') {
    title = '내 장터 일지';
    content = state.receipts.length ? state.receipts.map((receipt) => `<article class="journal-entry"><h3>${receipt.day + 1}일차 · ${DAYS[receipt.day].title}</h3><p>${receipt.quantity}잔 준비 · 판매가 ${money(receipt.price)} · ${receipt.sold}잔 판매</p>${receiptRows(receipt)}<p>${resultNote(receipt)}</p></article>`).join('') : '<div class="empty-journal">첫 영업이 끝나면<br> 이곳에 오늘의 기록이 남아요.</div>';
  }
  if (kind === 'reset') {
    title = '새 장터를 열까요?';
    content = '<p class="reset-copy">지금의 영업 기록을 지우고, 6,000원으로 첫 오후부터 다시 시작해요.</p><button id="confirm-reset" class="primary-button" data-action="confirm-reset">새 장터 시작하기</button><button class="secondary-button" data-action="close-modal">현재 장터 계속하기</button>';
  }
  return `<dialog class="modal" aria-labelledby="modal-title"><div class="modal-heading"><h2 id="modal-title">${title}</h2><button id="close-modal" class="icon-button" data-action="close-modal" aria-label="닫기">${icon('close')}</button></div>${content}</dialog>`;
}

export function view(state: GameState, ui: ViewState): string {
  const day = DAYS[state.day];
  const live = liveReceipt(state, ui);
  return `<div class="app-wrap"><header class="site-header"><div class="brand">${icon('sun')}<span>Good Afternoon<span class="brand-dot">.</span></span></div><nav aria-label="게임 메뉴"><button id="help" class="header-button" data-action="help" aria-label="놀이 방법">${icon('info')}<span>놀이 방법</span></button><button id="journal" class="header-button" data-action="journal">${icon('book')}<span>장터 일지</span></button><button id="restart" class="icon-button" data-action="reset" aria-label="새 장터 시작">${icon('repeat')}</button></nav></header>
    ${ui.notice ? `<div class="notice" role="status">${ui.notice}</div>` : ''}
    <main><div class="game-heading"><div><div class="eyebrow">오후의 작은 가게 <span>/</span> 주말 장터</div><h1 id="day-title" tabindex="-1">${state.phase === 'complete' ? '우리 가게의 다섯 번의 오후' : day.title}</h1></div><div class="wallet"><span class="wallet-icon">${icon('wallet')}</span><div><span>내 주머니</span><strong id="wallet-value">${money(live.cash)}</strong></div></div></div>
    <div class="day-rail" aria-label="${state.day + 1}일차, 전체 ${DAYS.length}일"><div class="day-markers">${DAYS.map((_, index) => `<span class="day-marker ${index === state.day ? 'current' : index < state.day ? 'past' : ''}" ${index === state.day ? 'aria-current="step"' : ''}>${index < state.day || state.phase === 'complete' ? icon('check') : `<b>${index + 1}</b>`}<span>${index + 1}일차</span></span>`).join('')}</div><span class="day-status">${ui.selling ? '영업 중' : state.phase === 'planning' ? '영업 준비' : state.phase === 'complete' ? '장터를 마치며' : '영업 기록'}</span></div>
    <div class="game-grid">${scene(state, ui)}${ui.selling ? selling(state, ui) : state.phase === 'planning' ? planning(state) : state.phase === 'complete' ? finale(state) : result(state)}</div></main>
    <footer><span>${icon('leaf')} 작게 시작하고, 조금씩 알아가요.</span><span>Good Afternoon. <span class="footer-separator">·</span> 주말 장터</span></footer>${modal(state, ui.modal)}</div>`;
}
