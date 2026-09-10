import { money, MAX_STOCK } from './content';
import { bookingOffer } from './contracts';
import { dayFor } from './markets';
import { drinkName } from './equipment';
import { changeOrder, minimumPreparation, type GameState, type Receipt } from './domain';

export function bookingChoice(state: GameState): string {
  const offer = bookingOffer(state);
  if (!offer) return '';
  const tomorrow = dayFor({ ...state, day: state.day + 1 });
  const affordable = changeOrder(state, { ...state.order, booking: true }) !== state;
  return `<section class="booking-choice"><span class="small-eyebrow">내일의 단체 주문 · ${offer.customer}</span><h3>미리 받은 돈, 내일의 약속</h3><p>“내일 ${drinkName(state)} ${offer.quantity}잔 부탁해요. 한 잔 ${money(offer.price)}, 총 ${money(offer.prepaid)}은 오늘 마감 때 드릴게요.”</p><div class="tomorrow-news"><strong>내일 소식</strong><span>${tomorrow.forecast} · ${tomorrow.forecastDetail}<br>${tomorrow.news}</span></div><p>받으면 내일 최대 ${MAX_STOCK}잔 중 ${offer.quantity}잔을 먼저 전달해요. 일반 손님에게는 최대 ${MAX_STOCK - offer.quantity}잔을 팔 수 있어요.</p><small>선불금 중 내일 재료비 최대 ${money(offer.reserved)}을 확보해요. 보관분을 쓰면 새로 만들 양은 줄어요. 내일 추가로 받는 돈은 없어요.</small><button id="accept-booking" class="cooler-toggle" data-action="booking" aria-pressed="${state.order.booking}" ${!affordable && !state.order.booking ? 'disabled' : ''}>${state.order.booking ? '단체 주문 받기 선택됨 · 취소' : '내일의 단체 주문 받기'}</button>${!affordable && !state.order.booking ? '<small>내일 재료비를 확보하려면 오늘 준비량을 줄여야 해요.</small>' : ''}</section>`;
}

export function bookingDue(state: GameState): string {
  if (!state.booking) return '';
  return `<div class="booking-due"><strong>오늘 먼저 전달할 단체 주문 ${state.booking.quantity}잔</strong><p>어제 ${money(state.booking.prepaid)}을 받았어요. 보관분을 포함해 ${state.booking.quantity}잔을 먼저 챙기고 나머지를 일반 손님에게 팔아요.</p><small>새 음료는 최소 ${minimumPreparation(state)}잔 준비해요. 선불금은 오늘 다시 들어오지 않아요.</small></div>`;
}

export function bookingResult(receipt: Receipt): string {
  if (!receipt.accepted && !receipt.delivered) return '';
  return `<div class="booking-result">${receipt.delivered ? `<p><strong>약속한 ${receipt.delivered.quantity}잔을 먼저 전달했어요.</strong> 어제 받은 ${money(receipt.delivered.prepaid)}이 오늘 판매한 음료의 매출이 됐어요.</p>` : ''}${receipt.accepted ? `<p><strong>내일 전달할 ${receipt.accepted.quantity}잔의 선불금을 받았어요.</strong> 주머니의 ${money(receipt.accepted.prepaid)}은 아직 내일 음료를 드려야 하는 돈이에요. 내일 재료비 최대 ${money(receipt.accepted.reserved)}을 남겨뒀어요.</p>` : ''}<details><summary>선불금과 오늘의 이익</summary><p>현금은 돈이 들어온 날, 매출은 음료를 전달한 날에 기록해요. 내일의 선불금은 오늘의 영업 이익에 넣지 않아요.</p><p>오늘 매출 ${money(receipt.revenue)}<br>재료비와 대여료를 뺀 영업 이익 <strong>${money(receipt.profit)}</strong></p></details></div>`;
}

export function bookingCashRows(receipt: Receipt): string {
  return `${receipt.accepted ? `<div><span>내일 주문의 선불금 <small>아직 전달하지 않은 ${receipt.accepted.quantity}잔</small></span><strong>+${money(receipt.accepted.prepaid)}</strong></div>` : ''}${receipt.delivered ? `<div><span>오늘 단체 주문 ${receipt.delivered.quantity}잔 <small>대금 ${money(receipt.delivered.prepaid)}은 어제 받았어요</small></span><strong>추가 입금 없음</strong></div>` : ''}`;
}
