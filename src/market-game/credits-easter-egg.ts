/** 마지막 인사를 다 읽은 뒤에만 미디어를 불러옵니다. */
export function creditsEasterEgg(viewport: HTMLElement, reducedMotion: MediaQueryList): { reveal: () => void; reset: () => void; stop: () => void } {
  const section = viewport.querySelector<HTMLElement>('#credits-easter-egg')!;
  const video = section.querySelector<HTMLVideoElement>('video')!;
  const control = section.querySelector<HTMLButtonElement>('#credits-easter-motion')!;
  const roll = section.parentElement!;
  const events = new AbortController();
  let revealed = false;

  const pause = (): void => video.pause();
  const paint = (): void => {
    control.textContent = video.paused ? '재생' : '멈추기';
    control.setAttribute('aria-pressed', String(!video.paused));
  };
  const play = (): void => {
    void video.play().catch(paint);
  };
  control.addEventListener('click', () => video.paused ? play() : pause(), { signal: events.signal });
  video.addEventListener('play', paint, { signal: events.signal });
  video.addEventListener('pause', paint, { signal: events.signal });
  const visibility = new IntersectionObserver(entries => {
    if (!entries[0] || entries[0].intersectionRatio < 0.25) pause();
  }, { root: viewport, threshold: 0.25 });
  visibility.observe(video);
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); }, { signal: events.signal });
  reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) pause(); }, { signal: events.signal });

  const reset = (): void => {
    pause();
    video.removeAttribute('src');
    video.load();
    section.hidden = true;
    roll.classList.remove('has-easter-egg');
    revealed = false;
    paint();
  };

  return {
    reveal: () => {
      if (revealed) return;
      revealed = true;
      section.hidden = false;
      roll.classList.add('has-easter-egg');
      video.src = new URL('./assets/good-afternoon.mp4', import.meta.url).href;
      video.muted = true;
      video.preload = 'auto';
      viewport.scrollTop = viewport.scrollHeight;
      if (!reducedMotion.matches) play();
    },
    reset,
    stop: () => { visibility.disconnect(); events.abort(); reset(); }
  };
}
