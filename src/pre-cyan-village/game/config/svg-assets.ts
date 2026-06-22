import Phaser from 'phaser';

type SvgAssetKey =
  | 'player'
  | 'room'
  | 'bank'
  | 'store'
  | 'bus-stop'
  | 'board'
  | 'lottery'
  | 'dark-alley'
  | 'cyan-trace';

const svgAssetSizes: Record<SvgAssetKey, Phaser.Types.Loader.FileTypes.SVGSizeConfig> = {
  player: { width: 48, height: 64 },
  room: { width: 720, height: 480 },
  bank: { width: 160, height: 120 },
  store: { width: 160, height: 120 },
  'bus-stop': { width: 160, height: 120 },
  board: { width: 140, height: 120 },
  lottery: { width: 160, height: 120 },
  'dark-alley': { width: 140, height: 120 },
  'cyan-trace': { width: 140, height: 120 }
};

function assetUrl(fileName: string): string {
  return new URL(`../../assets/${fileName}?no-inline`, import.meta.url).href;
}

export function loadSvgAsset(scene: Phaser.Scene, key: SvgAssetKey): void {
  scene.load.svg(key, assetUrl(`${key}.svg`), svgAssetSizes[key]);
}
