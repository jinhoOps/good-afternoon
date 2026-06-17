export const villageNodes = {
  room: { id: 'room', label: '내 방', log: '카드를 챙겼다.', x: 50, y: 76, unlocks: ['store', 'bus'], startsUnlocked: true },
  store: { id: 'store', label: '편의점', log: '봉투값이 붙었다.', x: 28, y: 55, unlocks: ['work', 'subscriptions', 'lottery'] },
  bus: { id: 'bus', label: '버스정류장', log: '잔액이 부족하다.', x: 70, y: 56, unlocks: ['bank'] },
  work: { id: 'work', label: '알바처', log: '입금액이 예상보다 작다.', x: 24, y: 34, unlocks: ['bank'] },
  subscriptions: { id: 'subscriptions', label: '구독함', log: '이번 달에도 빠졌다.', x: 52, y: 35, unlocks: [] },
  bank: { id: 'bank', label: '은행', log: '숫자가 조금 늘었다.', x: 78, y: 34, unlocks: [] },
  lottery: { id: 'lottery', label: '복권방', log: '같은 번호가 또 걸려 있다.', x: 18, y: 18, unlocks: [] },
  alley: { id: 'alley', label: '어두운 골목', log: '불이 잠깐 켜졌다.', x: 16, y: 12, unlocks: [], hidden: true },
  cyanGate: { id: 'cyanGate', label: 'Cyan 입구', log: '길이 열렸다.', x: 82, y: 14, unlocks: [], gate: true }
};

export const villageEdges = [
  ['room', 'store'],
  ['room', 'bus'],
  ['store', 'work'],
  ['store', 'subscriptions'],
  ['store', 'lottery'],
  ['bus', 'bank'],
  ['work', 'bank'],
  ['bank', 'cyanGate'],
  { from: 'lottery', to: 'alley', hiddenUntil: 'backAlleyDiscovered' }
];
