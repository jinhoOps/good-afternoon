export type Weather = 'sun' | 'heat' | 'rain' | 'supply' | 'festival';

export type Visitor = {
  name: string;
  budget: number;
  color: string;
  greeting: string;
};

export type MarketDay = {
  title: string;
  label: string;
  weather: Weather;
  weatherLabel: string;
  forecast: string;
  forecastDetail: string;
  news: string;
  hint: string;
  cost: number;
  visitors: Visitor[];
  concept: { title: string; description: string };
};

const names = ['하루', '지우', '수영', '민호', '예린', '준', '나래', '도윤', '솔', '해나', '유진', '하람', '다온', '서우', '여름', '시온'];
const colors = ['#b66e52', '#78937b', '#7287a0', '#be9b54', '#a67f98', '#6d9a99'];

function visitors(budgets: number[], greeting: string): Visitor[] {
  return budgets.map((budget, index) => ({ name: names[index], budget, color: colors[index % colors.length], greeting }));
}

export const DAYS: MarketDay[] = [
  {
    title: '처음 여는 작은 가게', label: '첫 번째 오후', weather: 'sun', weatherLabel: '기분 좋은 햇살',
    forecast: '손님 6명 안팎', forecastDetail: '산책 나온 이웃들이 들를 것 같아요.',
    news: '“천 원이면 산책하면서 한 잔 마시기 좋겠네.”',
    hint: '오늘은 한 잔에 1,000원. 먼저 얼마나 준비할지 골라보세요.', cost: 500,
    visitors: visitors([1100, 1200, 1000, 1300, 1000, 1200], '산책하다가 들렀어요.'),
    concept: { title: '매출과 이익', description: '손님에게 받은 돈은 매출, 재료비를 빼고 실제로 남긴 돈은 이익이에요.' }
  },
  {
    title: '더운 날엔 시원한 한 잔', label: '두 번째 오후', weather: 'heat', weatherLabel: '조금 더운 오후',
    forecast: '손님 9~12명', forecastDetail: '공원에서 운동을 마친 사람들이 찾아와요.',
    news: '“좀 덥네. 시원한 음료 어디 없을까?”',
    hint: '오늘부터 가격도 정해요. 비싸게 팔면 한 잔에 더 남지만, 돌아서는 손님도 있어요.', cost: 500,
    visitors: visitors([1500, 1400, 1100, 1000, 1600, 1200, 900, 1500, 1300, 1100, 1400, 1000], '운동하고 나니 목말라요.'),
    concept: { title: '가격과 수요', description: '한 잔에 남는 돈과 사려는 손님 수를 함께 봐야 해요. 손님마다 지불하려는 가격도 달라요.' }
  },
  {
    title: '빗소리가 들리는 장터', label: '세 번째 오후', weather: 'rain', weatherLabel: '오후부터 가랑비',
    forecast: '손님 4~6명', forecastDetail: '학교를 마친 학생 몇 명이 지나갈 거예요.',
    news: '“비도 오는데, 오늘은 가볍게 사 마실래.”',
    hint: '어제 잘 팔렸어도 오늘은 달라요. 오늘 팔 물량과 내일 가져갈 음료를 함께 생각해보세요.', cost: 500,
    visitors: visitors([800, 900, 1200, 1000, 900], '잠깐 비를 피하고 있어요.'),
    concept: { title: '오늘의 돈과 내일의 재고', description: '보관에 쓰는 돈은 지금의 현금을 줄여요. 대신 내일 팔 음료가 남으면 새 재료에 쓸 돈을 아낄 수 있어요. 얼마나 활용하느냐에 따라 선택의 가치가 달라져요.' }
  },
  {
    title: '레몬 상자의 새 가격표', label: '네 번째 오후', weather: 'supply', weatherLabel: '구름 사이 햇살',
    forecast: '손님 7~10명', forecastDetail: '동네 장터에 평소처럼 이웃들이 모여요.',
    news: '재료상 소식 · 오늘부터 한 잔 재료비가 500원 → 700원이에요.',
    hint: '판매가가 같아도 재료비가 오르면 남는 돈이 줄어요. 오늘의 가격표를 다시 봐주세요.', cost: 700,
    visitors: visitors([1000, 1200, 1300, 1400, 1500, 1200, 1600, 1000, 1300], '레몬 향이 좋네요.'),
    concept: { title: '원가와 남는 돈', description: '재료값이 오르면 같은 가격에 팔아도 이익이 줄어요. 이번 변화는 레몬 재료비의 변화이며 모든 물가가 오른다는 뜻은 아니에요.' }
  },
  {
    title: '음악이 흐르는 마지막 장터', label: '다섯 번째 오후', weather: 'festival', weatherLabel: '동네 작은 축제',
    forecast: '손님 12~16명', forecastDetail: '공연을 보러 온 손님들이 장터를 가득 채워요.',
    news: '“공연 시작 전에 음료부터 챙겨야겠다!”',
    hint: '마지막 영업이에요. 손님 수, 한 잔의 이익, 준비할 물량을 함께 골라보세요.', cost: 700,
    visitors: visitors([900, 1000, 1100, 1200, 1300, 1600, 1500, 1800, 1200, 1400, 1500, 1100, 1400, 1000, 1700, 1200], '저기서 곧 공연한대요!'),
    concept: { title: '현금의 흐름', description: '오늘 재료에 쓴 돈, 판매로 들어온 돈, 마지막에 남은 돈을 이어보면 내 장사가 어떻게 달라졌는지 알 수 있어요.' }
  }
];

export const PRICES = [800, 1000, 1200, 1500] as const;
export const INITIAL_CASH = 6000;
export const DREAM_CASH = 15000;
export const MAX_STOCK = 18;
export const COOLER_FEE = 600;
export const COOLER_CAPACITY = 4;
export const canRentCooler = (day: number): boolean => day >= 2 && day < DAYS.length - 1;
export const money = (value: number): string => `${value.toLocaleString('ko-KR')}원`;
