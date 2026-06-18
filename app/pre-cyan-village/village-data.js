(() => {
  const villageNodes = {
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

  const villageEdges = [
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

const cyanFirstLoop = {
  id: 'fare-exchange',
  situation: '버스정류장에서 잔액이 부족하다.',
  question: '지금 오가야 하는 건 뭐지?',
  correctChoiceId: 'fare-for-time',
  successLog: '맞아. 뭔가를 내고, 길을 얻었다.',
  failureLog: '그건 아직 길이 안 이어진다.',
  choices: [
    { id: 'fare-for-time', label: '교통카드 잔액을 내고 이동 시간을 얻는다.' },
    { id: 'time-for-bag', label: '이동 시간을 내고 봉투값을 얻는다.' },
    { id: 'lottery-for-work', label: '복권 번호를 내고 알바 시간을 얻는다.' }
  ]
};

window.PreCyanVillageData = { villageNodes, villageEdges, cyanFirstLoop };
})();
