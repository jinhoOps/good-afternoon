import type { HotspotId } from '../../../shared/types/village';

export type Point = { x: number; y: number };

export type DoorTarget = {
  id: 'door';
  x: number;
  y: number;
  radius: number;
  label: string;
};

type VillageHotspotBase = {
  x: number;
  y: number;
  radius: number;
  label: string;
  assetKey: string;
};

export type CoreVillageHotspot = VillageHotspotBase & {
  kind: 'core';
  id: HotspotId;
  domainId: HotspotId;
};

export type BackgroundVillageHotspot = VillageHotspotBase & {
  kind: 'background';
  id: 'lottery' | 'darkAlley' | 'cyanTraceSeed';
  domainId: null;
};

export type VillageHotspot = CoreVillageHotspot | BackgroundVillageHotspot;

export const roomSize = { width: 720, height: 480 };
export const villageSize = { width: 960, height: 640 };

export const roomDoor: DoorTarget = {
  id: 'door',
  x: 610,
  y: 250,
  radius: 72,
  label: '문'
};

export const coreHotspotIds: HotspotId[] = ['bankCounter', 'storeFront', 'busStop', 'mailbox'];

export const villageHotspots: VillageHotspot[] = [
  { id: 'bankCounter', domainId: 'bankCounter', kind: 'core', x: 720, y: 250, radius: 76, label: '은행', assetKey: 'bank' },
  { id: 'bankAtm', domainId: 'bankAtm', kind: 'core', x: 805, y: 318, radius: 64, label: 'ATM', assetKey: 'bank' },
  { id: 'storeFront', domainId: 'storeFront', kind: 'core', x: 455, y: 340, radius: 76, label: '편의점', assetKey: 'store' },
  { id: 'storeRegister', domainId: 'storeRegister', kind: 'core', x: 535, y: 240, radius: 64, label: '계산대', assetKey: 'store' },
  { id: 'busStop', domainId: 'busStop', kind: 'core', x: 245, y: 420, radius: 76, label: '정류장', assetKey: 'bus-stop' },
  { id: 'busEnd', domainId: 'busEnd', kind: 'core', x: 330, y: 520, radius: 64, label: '정류장 끝', assetKey: 'bus-stop' },
  { id: 'mailbox', domainId: 'mailbox', kind: 'core', x: 180, y: 220, radius: 68, label: '우편함', assetKey: 'board' },
  { id: 'workBackDoor', domainId: 'workBackDoor', kind: 'core', x: 610, y: 470, radius: 66, label: '뒷문', assetKey: 'board' },
  { id: 'workBoard', domainId: 'workBoard', kind: 'core', x: 675, y: 550, radius: 64, label: '게시판', assetKey: 'board' },
  { id: 'cyanTrace', domainId: 'cyanTrace', kind: 'core', x: 875, y: 92, radius: 62, label: '입구 흔적', assetKey: 'cyan-trace' },
  { id: 'lottery', domainId: null, kind: 'background', x: 795, y: 430, radius: 66, label: '반짝이는 간판', assetKey: 'lottery' },
  { id: 'darkAlley', domainId: null, kind: 'background', x: 875, y: 505, radius: 64, label: '어두운 틈', assetKey: 'dark-alley' },
  { id: 'cyanTraceSeed', domainId: null, kind: 'background', x: 845, y: 155, radius: 64, label: '희미한 빛', assetKey: 'cyan-trace' }
];

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function findNearestDoor(point: Point): DoorTarget | null {
  return distance(point, roomDoor) <= roomDoor.radius ? roomDoor : null;
}

export function findNearestHotspot(point: Point): VillageHotspot | null {
  const candidates = villageHotspots
    .filter((hotspot) => distance(point, hotspot) <= hotspot.radius)
    .sort((a, b) => distance(point, a) - distance(point, b));
  return candidates[0] ?? null;
}
