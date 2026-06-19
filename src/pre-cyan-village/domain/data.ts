import type { HotspotDefinition, HotspotId, OutingDefinition, RequiredAction, ZoneId } from '../../shared/types/village';

export const requiredActions: RequiredAction[] = ['receivedSupport', 'spent', 'moved', 'earned', 'kept'];

export const zones: Record<ZoneId, { id: ZoneId; label: string; description: string }> = {
  home: { id: 'home', label: '주거구역', description: '방으로 돌아가는 길이 여기서 시작된다.' },
  commercial: { id: 'commercial', label: '상업구역', description: '불빛과 가격표가 먼저 보인다.' },
  transit: { id: 'transit', label: '이동구역', description: '기다리는 사람과 막차 표시가 있다.' },
  work: { id: 'work', label: '업무구역', description: '닫힌 뒷문 옆에 종이가 붙어 있다.' },
  finance: { id: 'finance', label: '금융구역', description: '은행 창구와 ATM 불빛이 보인다.' },
  hidden: { id: 'hidden', label: '어두운 틈', description: '아직 길이라고 부르기엔 애매하다.' }
};

export const hotspots: Record<HotspotId, HotspotDefinition> = {
  bankCounter: { id: 'bankCounter', zoneId: 'finance', label: '은행 창구', shortLabel: '창구' },
  storeFront: { id: 'storeFront', zoneId: 'commercial', label: '편의점 앞', shortLabel: '편의점' },
  busStop: { id: 'busStop', zoneId: 'transit', label: '버스정류장', shortLabel: '정류장' },
  mailbox: { id: 'mailbox', zoneId: 'home', label: '내 방 우편함', shortLabel: '우편함' },
  workBackDoor: { id: 'workBackDoor', zoneId: 'work', label: '알바처 뒷문', shortLabel: '뒷문' },
  storeRegister: { id: 'storeRegister', zoneId: 'commercial', label: '편의점 계산대', shortLabel: '계산대' },
  bankAtm: { id: 'bankAtm', zoneId: 'finance', label: '은행 ATM', shortLabel: 'ATM' },
  workBoard: { id: 'workBoard', zoneId: 'work', label: '알바처 게시판', shortLabel: '게시판' },
  busEnd: { id: 'busEnd', zoneId: 'transit', label: '버스정류장 끝', shortLabel: '정류장 끝' },
  cyanTrace: { id: 'cyanTrace', zoneId: 'transit', label: 'Cyan 입구 흔적', shortLabel: '입구 흔적' }
};

export const plannedOutings: OutingDefinition[] = [
  {
    id: 'settling',
    title: '첫 외출',
    guideLine: '처음이면 은행 쪽이 덜 헤매.',
    hotspotIds: ['bankCounter', 'storeFront', 'busStop', 'mailbox']
  },
  {
    id: 'daily-loop',
    title: '생활 실험',
    guideLine: '오늘은 돈이 오가고 남는 걸 보면 돼.',
    hotspotIds: ['workBackDoor', 'storeRegister', 'busStop', 'bankAtm']
  },
  {
    id: 'trace-check',
    title: '정리',
    guideLine: '길 끝에 이상한 색이 조금 보여.',
    hotspotIds: ['bankAtm', 'workBoard', 'busEnd', 'cyanTrace']
  }
];

export function outingById(id: string): OutingDefinition | null {
  return plannedOutings.find((outing) => outing.id === id) ?? null;
}

export function nextPlannedOutingId(outingCount: number): string {
  return plannedOutings[Math.min(outingCount, plannedOutings.length - 1)].id;
}
