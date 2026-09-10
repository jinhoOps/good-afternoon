import { lightAt, shellPalette } from './daylight';

export const TIME_CONSENT_KEY = 'goodafternoon.background-time.v1';

export function startAtmosphere(storage: Storage | null): { stop: () => void; setTimeConsent: (enabled: boolean) => void; isTimeEnabled: () => boolean } {
  const root = document.documentElement;
  const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  let timer: ReturnType<typeof setTimeout> | undefined;
  const readConsent = (): boolean => {
    try { return storage?.getItem(TIME_CONSENT_KEY) === 'enabled'; } catch { return false; }
  };
  let timeEnabled = readConsent();
  const refresh = (): void => {
    if (timer) clearTimeout(timer);
    // 동의 전에는 현지 시각을 읽지 않고 낮 장면을 고정합니다.
    const now = timeEnabled ? new Date() : null;
    const light = now ? lightAt(now) : { night: 0, x: 0, y: 0, angle: 0 };
    const palette = shellPalette(light.night);
    root.style.setProperty('--night', String(light.night));
    root.style.setProperty('--sun-x', `${light.x}px`);
    root.style.setProperty('--sun-y', `${light.y}px`);
    root.style.setProperty('--sun-angle', `${light.angle}deg`);
    for (const [key, value] of Object.entries(palette)) root.style.setProperty(`--shell-${key}`, value);
    root.dataset.light = light.night < 0.01 ? 'day' : light.night > 0.99 ? 'night' : 'twilight';
    themeColor?.setAttribute('content', palette.background);
    if (now && !document.hidden) timer = setTimeout(refresh, 60_000 - (now.getSeconds() * 1000 + now.getMilliseconds()));
  };
  const syncConsent = (event: StorageEvent): void => {
    if (event.key !== TIME_CONSENT_KEY && event.key !== null) return;
    timeEnabled = readConsent();
    refresh();
  };
  document.addEventListener('visibilitychange', refresh);
  window.addEventListener('pageshow', refresh);
  window.addEventListener('storage', syncConsent);
  refresh();
  return {
    isTimeEnabled: () => timeEnabled,
    setTimeConsent: (enabled) => {
      timeEnabled = enabled;
      try { storage?.setItem(TIME_CONSENT_KEY, enabled ? 'enabled' : 'disabled'); } catch { /* 저장 불가 시 이번 접속에서만 적용합니다. */ }
      refresh();
    },
    stop: () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('pageshow', refresh);
      window.removeEventListener('storage', syncConsent);
    }
  };
}
