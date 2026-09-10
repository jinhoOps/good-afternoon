import { drinkName } from './equipment';
import type { GameState } from './domain';

export function creditsView(state: GameState): string {
  const sold = state.receipts.reduce((sum, receipt) => sum + receipt.sold, 0);
  return `<dialog class="credits-dialog" aria-labelledby="credits-title" aria-describedby="credits-summary">
    <header class="credits-header"><span>Good Afternoon<span class="credits-dot">.</span><small class="credits-build">개발 중</small></span><button id="close-modal" class="credits-close" data-action="close-modal" aria-label="감사 화면 닫고 이번 기록으로 돌아가기">×</button></header>
    <div class="credits-scroll" id="credits-scroll" tabindex="0" role="region" aria-label="플레이 감사 인사와 개발 중 안내">
      <div class="credits-roll">
        <section class="credits-opening"><div class="credits-sun" aria-hidden="true">☀</div><p class="credits-eyebrow">작은 가게의 첫 번째 이야기</p><h2 id="credits-title" tabindex="-1">플레이해 주셔서<br> 고맙습니다.</h2><p>당신의 선택으로<br> 작은 가게의 다섯 오후가 채워졌어요.</p><span class="credits-memory">다섯 번의 오후 · ${sold}잔의 ${drinkName(state)}</span></section>
        <section class="credits-chapter"><span class="credits-chapter-mark" aria-hidden="true">✧</span><p class="credits-eyebrow">이번 장터는 여기까지</p><h3>아직 만들어가는<br> 오후입니다.</h3><p>동네와 공원, 서로 다른 다섯 오후를 담은<br> 개발 중인 버전이에요.</p><p>새 장터에서는 손님과 재료값이 달라져요.<br> 익숙해진 선택을 다시 시험해보세요.</p></section>
        <section class="credits-chapter credits-future"><p class="credits-eyebrow">다음 장터로 가져갈 이야기</p><h3>다음 오후에는</h3><div><h4>오늘과 다른 손님</h4><p>장터가 바뀌면<br> 어제의 좋은 선택도 다시 생각하게 돼요.</p></div><div><h4>내 선택이 남는 가게</h4><p>준비금 목표를 이루면 간판이 생겨요.<br> 넓은 보관과 새 메뉴 중 하나를 골라요.</p></div><div><h4>조금 더 멀리 보는 장사</h4><p>선불금을 받고 내일의 음료를 약속할까요?<br> 일반 손님에게 팔 여유도 함께 남겨봐요.</p></div><small>다른 손님을 만나는 공원 장터는 지금 열 수 있어요.<br> 간판을 달고 설비를 고르거나, 내일의 주문을 맡아보세요.</small></section>
        <section class="credits-farewell"><span class="credits-chapter-mark" aria-hidden="true">✧</span><h3>다음 오후에<br> 다시 만나요.</h3><p>조금씩 더 재미있는 가게로 돌아올게요.<br> 여기까지 함께해 주셔서 고맙습니다.</p><span class="credits-signature">Good Afternoon.</span></section>
      </div>
    </div>
    <footer class="credits-actions"><div class="credits-playback"><span id="credits-scroll-state" role="status"></span><button id="credits-motion" type="button" aria-controls="credits-scroll"></button></div><p id="credits-summary">같은 날씨와 손님을 다시 만나거나, 다른 장터로 떠나요.<br> 자세한 영업 일지는 바뀌고 최고 기록은 남아요.</p><button id="choose-market" class="primary-button" data-action="choose-market">다음 장터 고르기 <span aria-hidden="true">→</span></button><button id="replay-market" class="secondary-button" data-action="replay-market">같은 장터 다시 플레이 <span aria-hidden="true">→</span></button><button class="credits-return" data-action="close-modal">이번 기록으로 돌아가기</button></footer>
  </dialog>`;
}

/** DOM 안의 실제 스크롤을 사용해 손으로 읽거나 자동 이동을 멈출 수 있게 합니다. */
export function startCredits(dialog: HTMLDialogElement, reducedMotion: MediaQueryList): () => void {
  const viewport = dialog.querySelector<HTMLElement>('#credits-scroll')!;
  const control = dialog.querySelector<HTMLButtonElement>('#credits-motion')!;
  const status = dialog.querySelector<HTMLElement>('#credits-scroll-state')!;
  const events = new AbortController();
  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  let frame = 0;
  let playing = false;
  let previousTime = 0;
  let startAfter = 0;
  let position = 0;

  function atEnd(): boolean {
    return viewport.scrollTop >= viewport.scrollHeight - viewport.clientHeight - 1;
  }
  function paint(): void {
    control.textContent = playing ? '스크롤 멈추기' : atEnd() ? '처음부터 스크롤' : '자동 스크롤 재생';
    control.setAttribute('aria-pressed', String(playing));
    status.textContent = playing ? '천천히 올라가요' : '직접 스크롤해도 좋아요';
  }
  function pause(): void {
    playing = false;
    cancelAnimationFrame(frame);
    paint();
  }
  function tick(time: number): void {
    if (!playing) return;
    const elapsed = Math.min(80, time - previousTime);
    previousTime = time;
    if (time >= startAfter && !document.hidden) {
      position += elapsed * 0.027;
      viewport.scrollTop = position;
      if (atEnd()) { pause(); return; }
    }
    frame = requestAnimationFrame(tick);
  }
  function play(delay = 0): void {
    if (atEnd()) viewport.scrollTop = 0;
    position = viewport.scrollTop;
    previousTime = performance.now();
    startAfter = previousTime + delay;
    playing = true;
    paint();
    frame = requestAnimationFrame(tick);
  }
  control.addEventListener('click', () => playing ? pause() : play(), { signal: events.signal });
  for (const name of ['wheel', 'touchstart', 'pointerdown'] as const) {
    viewport.addEventListener(name, pause, { passive: true, signal: events.signal });
  }
  viewport.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) pause();
  }, { signal: events.signal });
  reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) pause(); }, { signal: events.signal });
  if (reducedMotion.matches) paint(); else play(1800);

  return () => {
    playing = false;
    cancelAnimationFrame(frame);
    events.abort();
    document.body.style.overflow = previousOverflow;
  };
}
