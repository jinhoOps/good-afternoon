import { cyanFirstLoop } from '../domain/data';
import type { VillageState } from '../../shared/types/village';

export type LoopElements = {
  cyanLoop: HTMLElement;
  situation: HTMLElement;
  question: HTMLElement;
  choices: HTMLElement;
};

export function renderCyanLoop(elements: LoopElements, state: VillageState): void {
  const visible = state.currentStage === 'cyanLoop' && state.cyanLoopSeen;
  elements.cyanLoop.hidden = !visible;
  if (!visible) return;

  elements.situation.textContent = cyanFirstLoop.situation;
  elements.question.textContent = cyanFirstLoop.question;
  elements.choices.innerHTML = cyanFirstLoop.choices.map((choice) => {
    const selected = state.cyanLoopResult === 'success' && choice.id === cyanFirstLoop.correctChoiceId;
    const classes = ['cyan-choice', selected ? 'is-selected' : ''].filter(Boolean).join(' ');
    const disabled = state.cyanLoopCompleted ? 'disabled' : '';

    return `<button class="${classes}" type="button" data-cyan-choice="${choice.id}" ${disabled}>${choice.label}</button>`;
  }).join('');
}
