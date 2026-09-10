/** 위치 정보 없이 기기의 현지 시각으로 웹 바깥의 빛을 정합니다. */
export function lightAt(date: Date): { night: number; x: number; y: number; angle: number } {
  const hour = date.getHours() + date.getMinutes() / 60;
  const smooth = (value: number): number => {
    const t = Math.min(1, Math.max(0, value));
    return t * t * (3 - 2 * t);
  };
  const night = hour < 12 ? 1 - smooth((hour - 5) / 2) : smooth((hour - 18) / 2);
  const afternoon = Math.min(1, Math.max(0, (hour - 7) / 11));
  return { night, x: (afternoon - 0.5) * 28, y: afternoon * 18, angle: (afternoon - 0.5) * 3 };
}

type RGB = readonly [number, number, number];
const mix = (a: RGB, b: RGB, amount: number): RGB => [
  Math.round(a[0] + (b[0] - a[0]) * amount),
  Math.round(a[1] + (b[1] - a[1]) * amount),
  Math.round(a[2] + (b[2] - a[2]) * amount)
];
const rgb = (value: RGB): string => `rgb(${value.join(' ')})`;
const luminance = (value: RGB): number => value.map(v => v / 255).map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);

export function shellPalette(night: number): { background: string; ink: string; muted: string; line: string; surface: string } {
  const background = mix([253, 253, 252], [38, 38, 35], night);
  const light = luminance(background);
  const contrast = (foreground: RGB): number => {
    const f = luminance(foreground);
    return (Math.max(f, light) + 0.05) / (Math.min(f, light) + 0.05);
  };
  const darkInk: RGB = [24, 26, 24];
  const lightInk: RGB = [252, 251, 247];
  const ink = contrast(darkInk) >= contrast(lightInk) ? darkInk : lightInk;
  const muted: RGB = night < 0.5 ? [82, 87, 82] : [191, 194, 185];
  return {
    background: rgb(background), ink: rgb(ink),
    muted: rgb(contrast(muted) >= 4.8 ? muted : ink),
    line: rgb(mix([221, 223, 218], [82, 83, 77], night)),
    surface: rgb(mix([255, 255, 255], [37, 39, 35], night))
  };
}
