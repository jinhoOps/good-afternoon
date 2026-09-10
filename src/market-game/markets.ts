import { DAYS, type MarketDay, type Visitor } from './content';

export const MARKET_IDS = ['neighborhood', 'park-walk', 'park-concert'] as const;
export type MarketId = typeof MARKET_IDS[number];
type Market = { name: string; edition: string; description: string; days: MarketDay[] };

function guests(budgets: number[], greeting: string): Visitor[] {
  return budgets.map((budget, index) => ({ ...DAYS[4].visitors[index % 16], budget, greeting }));
}

function parkDay(index: number, values: Omit<MarketDay, 'label' | 'concept'> & { concept?: MarketDay['concept'] }): MarketDay {
  return { label: DAYS[index].label, concept: DAYS[index].concept, ...values };
}

const walk: MarketDay[] = [
  parkDay(0, {
    title: '돗자리를 펴는 오후', weather: 'sun', weatherLabel: '가족 나들이', cost: 1500,
    forecast: '손님 9~12명', forecastDetail: '아이와 산책 나온 가족이 많아요.',
    news: '“여럿이 마시려니 한 잔에 2,400원 정도면 좋겠어요.”',
    hint: '새로운 장터예요. 첫날부터 가격을 고를 수 있어요. 가볍게 사 마실 가족들이 기다려요.',
    visitors: guests([2400, 2700, 2400, 3000, 2700, 2400, 3600, 2400, 2700, 3000, 2400, 2700], '가족과 나들이 왔어요.')
  }),
  parkDay(1, {
    title: '자전거를 세운 사람들', weather: 'heat', weatherLabel: '뜨거운 자전거 길', cost: 1800,
    forecast: '손님 6~8명', forecastDetail: '긴 코스를 마친 자전거 모임이 쉬어가요.',
    news: '“멀리 달렸더니 목말라요. 4,500원까지는 괜찮아요.”',
    hint: '사람은 어제보다 적지만 시원한 음료를 찾고 있어요. 가격과 물량을 함께 바꿔볼까요?',
    visitors: guests([4500, 4800, 4500, 3600, 5100, 4500, 3900, 4500], '긴 코스를 달렸어요.')
  }),
  parkDay(2, {
    title: '비 소식과 남은 레몬', weather: 'rain', weatherLabel: '잠깐의 소나기', cost: 2400,
    forecast: '손님 3~5명', forecastDetail: '정자에서 비를 피하는 산책객이 보여요.',
    news: '재료상 소식 · 오늘은 2,400원, 내일 새 물량이 오면 1,200원이에요.',
    hint: '내일 재료값이 내려가요. 보관료까지 내고 오늘 미리 만들 이유가 있을까요?',
    visitors: guests([3000, 3600, 4500, 3600], '비가 곧 그치겠죠?')
  }),
  parkDay(3, {
    title: '방과 후의 공원', weather: 'supply', weatherLabel: '레몬이 도착했어요', cost: 1200,
    forecast: '손님 11~14명', forecastDetail: '학교가 끝나고 학생들이 모여들어요.',
    news: '“오늘 용돈은 넉넉하지 않아요. 삼천 원이면 한 잔 마실래요.”',
    hint: '재료값은 내려갔고, 주머니가 가벼운 손님은 늘었어요. 내일도 재료비는 같아요.',
    visitors: guests([2400, 2700, 3000, 3000, 3300, 3000, 3600, 3000, 2700, 3000, 3300, 3600, 3000, 3000], '친구들과 잠깐 쉬러 왔어요.')
  }),
  parkDay(4, {
    title: '저녁 산책의 작은 선물', weather: 'festival', weatherLabel: '산책 주간의 마지막 날', cost: 1200,
    forecast: '손님 9~12명', forecastDetail: '퇴근 후 산책 나온 이웃들이 들러요.',
    news: '“한 잔에 3,600원쯤이면 오늘의 작은 선물로 좋겠네요.”',
    hint: '비싼 가격을 택하면 놓치는 손님이 있어요. 마지막 진열대에 얼마나 놓을까요?',
    visitors: guests([3000, 3600, 3600, 3900, 3600, 4500, 3600, 4200, 3600, 3000, 4500, 3600], '하루를 마치고 걷고 있어요.')
  })
];

const concert: MarketDay[] = [
  parkDay(0, {
    title: '공연 준비가 한창이에요', weather: 'sun', weatherLabel: '무대 설치하는 날', cost: 1800,
    forecast: '손님 5~7명', forecastDetail: '일을 마친 무대 스태프가 찾아와요.',
    news: '“쉬는 시간이 짧아요. 시원하면 4,500원도 괜찮아요.”',
    hint: '공연 주간이에요. 오늘은 가족 나들이 대신 스태프들이 잠깐 쉬어가요.',
    visitors: guests([4500, 4800, 3600, 4500, 5100, 4500], '무대를 준비하고 있어요.')
  }),
  parkDay(1, {
    title: '어린이 공연이 열려요', weather: 'festival', weatherLabel: '가족 관객의 날', cost: 1500,
    forecast: '손님 12~15명', forecastDetail: '아이와 공연을 보러 온 가족이 많아요.',
    news: '“아이들과 나눠 마시려고요. 2,400원이면 부담 없겠어요.”',
    hint: '사람이 많아도 비싼 음료를 찾는 건 아니에요. 어제의 가격표를 그대로 둘까요?',
    visitors: guests([2400, 2700, 2400, 3000, 2400, 2700, 2400, 3600, 2400, 2700, 2400, 3000, 2400, 2700, 2400], '어린이 공연을 보러 왔어요.')
  }),
  parkDay(2, {
    title: '내일은 레몬이 귀해져요', weather: 'supply', weatherLabel: '공연 사이 쉬어가는 날', cost: 1200,
    forecast: '손님 4~6명', forecastDetail: '산책 나온 이웃 몇 명이 들러요.',
    news: '재료상 소식 · 내일은 납품이 줄어 재료비가 1,200원 → 2,700원이에요.',
    hint: '오늘은 한산하지만 내일 재료값이 올라요. 다음 영업의 음료를 남겨둘 수도 있어요.',
    visitors: guests([3000, 3600, 3000, 3600, 2700], '다음 공연은 내일이래요.')
  }),
  parkDay(3, {
    title: '재즈가 흐르는 해 질 녘', weather: 'heat', weatherLabel: '재즈 공연 전', cost: 2700,
    forecast: '손님 8~10명', forecastDetail: '공연 전 여유를 즐기는 관객이 찾아와요.',
    news: '“공연 전에 한 잔 마실래요. 4,500원까지 생각하고 왔어요.”',
    hint: '재료가 비싼 날이에요. 내일 재료비는 1,800원으로 내려가요. 오늘 팔 만큼과 내일 물량을 구분해봐요.',
    visitors: guests([4500, 5100, 4500, 3600, 4800, 4500, 5400, 4500, 3900, 4500], '재즈 공연을 기다려요.')
  }),
  parkDay(4, {
    title: '잔디밭의 마지막 앙코르', weather: 'festival', weatherLabel: '모두 함께 앙코르', cost: 1800,
    forecast: '손님 13~16명', forecastDetail: '산책객과 관객이 함께 마지막 공연을 봐요.',
    news: '“삼천 원이면 좋고, 3,600원까지는 한 잔 할래요.”',
    hint: '관객이 바뀌었어요. 어제의 높은 가격과 오늘의 많은 손님 사이를 생각해보세요.',
    visitors: guests([3000, 3600, 3600, 3900, 3000, 3600, 4500, 3600, 3000, 3600, 3900, 4500, 3000, 3600, 3600, 3900], '마지막 공연도 함께해요.')
  })
];

export const MARKETS: Record<MarketId, Market> = {
  neighborhood: { name: '동네 장터', edition: '첫 다섯 오후', description: '익숙한 이웃, 더위와 비, 레몬값과 축제. 같은 조건에서 다른 선택을 시험해요.', days: DAYS },
  'park-walk': { name: '공원 장터', edition: '산책 주간', description: '따뜻한 차를 찾는 산책객이 많아요. 둘째 날은 더위, 셋째 날은 비. 비 온 뒤엔 재료값이 내려가요.', days: walk },
  'park-concert': { name: '공원 장터', edition: '공연 주간', description: '차를 찾는 손님은 절반쯤이고, 넷째 날은 더워요. 레몬값은 셋째 날 1,200원에서 다음 날 2,700원으로 올라요.', days: concert }
};

export const isMarketId = (value: unknown): value is MarketId => MARKET_IDS.some(id => id === value);
export const daysFor = (state: { market: MarketId }): MarketDay[] => MARKETS[state.market].days;
export const dayFor = (state: { market: MarketId; day: number }): MarketDay => daysFor(state)[state.day];
export const fixedPrice = (state: { market: MarketId; day: number }): boolean => state.market === 'neighborhood' && state.day === 0;
export function nextPark(market: MarketId, records: readonly { market: MarketId }[] = []): MarketId {
  const last = market === 'neighborhood' ? [...records].reverse().find(record => record.market !== 'neighborhood')?.market : market;
  return last === 'park-walk' ? 'park-concert' : 'park-walk';
}
