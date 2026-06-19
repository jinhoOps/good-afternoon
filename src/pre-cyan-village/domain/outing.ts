import { nextPlannedOutingId, outingById, requiredActions } from './data';
import type { HotspotId, ReactionResult, RequiredAction, VillageState } from '../../shared/types/village';

const MAX_SELECTIONS = 3;
const MONEY_FEVER_WINDOW_MS = 2000;
const MONEY_FEVER_DURATION_MS = 60_000;

function uniqueActions(actions: RequiredAction[], gained: RequiredAction[]): RequiredAction[] {
  return [...new Set([...actions, ...gained])];
}

function hasAction(state: VillageState, action: RequiredAction): boolean {
  return state.completedActions.includes(action);
}

function allRequiredActionsComplete(state: VillageState): boolean {
  return requiredActions.every((action) => state.completedActions.includes(action));
}

function missingActions(state: VillageState): RequiredAction[] {
  return requiredActions.filter((action) => !state.completedActions.includes(action));
}

function recoveryOutingId(state: VillageState): string {
  const missing = missingActions(state)[0];
  return missing ? `recovery-${missing}` : 'trace-check';
}

function hotspotIdsForRecovery(state: VillageState): HotspotId[] {
  const missing = missingActions(state);
  const ids: HotspotId[] = [];
  if (missing.includes('receivedSupport')) ids.push('bankCounter');
  if (missing.includes('spent')) ids.push('storeRegister');
  if (missing.includes('moved')) ids.push('busEnd');
  if (missing.includes('earned')) ids.push('workBoard');
  if (missing.includes('kept')) ids.push('bankAtm');
  const fallbackHotspots: HotspotId[] = ['cyanTrace', 'busEnd', 'bankAtm'];
  return [...new Set<HotspotId>([...ids, ...fallbackHotspots])].slice(0, 4);
}

export function activeHotspotIds(state: VillageState): HotspotId[] {
  if (state.currentOutingId?.startsWith('recovery-')) {
    return hotspotIdsForRecovery(state);
  }
  const outing = state.currentOutingId ? outingById(state.currentOutingId) : null;
  return outing?.hotspotIds ?? [];
}

function reactionFor(state: VillageState, hotspotId: HotspotId): ReactionResult {
  const selected = state.currentOutingSelections;
  const hasSupport = hasAction(state, 'receivedSupport') || selected.includes('bankCounter');
  const hasEarned = hasAction(state, 'earned') || selected.includes('workBackDoor') || selected.includes('workBoard');

  if (hotspotId === 'bankCounter') {
    return {
      id: 'bank-counter-support',
      hotspotId,
      kind: 'softSuccess',
      log: '처음 온 사람한텐 이 정도는 괜찮대.',
      actionsGained: ['receivedSupport'],
      flagsGained: ['supportEnvelope']
    };
  }

  if (hotspotId === 'storeFront' || hotspotId === 'storeRegister') {
    return hasSupport || hasEarned
      ? {
        id: `${hotspotId}-spent`,
        hotspotId,
        kind: 'softSuccess',
        log: '봉투가 조금 가벼워졌다.',
        actionsGained: ['spent'],
        flagsGained: ['spentSmall']
      }
      : {
        id: `${hotspotId}-empty`,
        hotspotId,
        kind: 'differentDay',
        log: '빈손으로 가격표만 보고 나왔다.',
        actionsGained: [],
        flagsGained: ['sawPriceWithoutMoney']
      };
  }

  if (hotspotId === 'busStop' || hotspotId === 'busEnd') {
    return {
      id: `${hotspotId}-moved`,
      hotspotId,
      kind: 'softSuccess',
      log: '정류장 끝에서 길이 조금 이어졌다.',
      actionsGained: ['moved'],
      flagsGained: ['foundTransitPath']
    };
  }

  if (hotspotId === 'workBackDoor' || hotspotId === 'workBoard') {
    return selected.includes('busStop') || selected.includes('busEnd')
      ? {
        id: `${hotspotId}-late`,
        hotspotId,
        kind: 'differentDay',
        log: '조금 늦었지만, 게시판 메모는 봤다.',
        actionsGained: ['earned'],
        flagsGained: ['lateWorkNote']
      }
      : {
        id: `${hotspotId}-earned`,
        hotspotId,
        kind: 'softSuccess',
        log: '짧은 일을 돕고 봉투가 조금 묵직해졌다.',
        actionsGained: ['earned'],
        flagsGained: ['earnedSmall']
      };
  }

  if (hotspotId === 'bankAtm') {
    return hasEarned || hasSupport
      ? {
        id: 'bank-atm-kept',
        hotspotId,
        kind: 'softSuccess',
        log: '조금 남겨두는 칸이 생겼다.',
        actionsGained: ['kept'],
        flagsGained: ['keptSmall']
      }
      : {
        id: 'bank-atm-empty',
        hotspotId,
        kind: 'differentDay',
        log: '기계 불빛만 조용히 켜져 있다.',
        actionsGained: [],
        flagsGained: ['sawAtmEmpty']
      };
  }

  if (hotspotId === 'mailbox') {
    return {
      id: 'mailbox-hint',
      hotspotId,
      kind: 'differentDay',
      log: '방으로 돌아오면 적어둘 만한 종이가 있다.',
      actionsGained: [],
      flagsGained: ['mailboxHint']
    };
  }

  const ready = allRequiredActionsComplete(state);
  return ready
    ? {
      id: 'cyan-trace-open',
      hotspotId,
      kind: 'softSuccess',
      log: '길이 하나 더 생겼어.',
      actionsGained: [],
      flagsGained: ['cyanTraceOpen']
    }
    : {
      id: 'cyan-trace-faint',
      hotspotId,
      kind: 'differentDay',
      log: '길이 아직 흐릿하다.',
      actionsGained: [],
      flagsGained: ['cyanTraceFaint']
    };
}

function finishOuting(state: VillageState): VillageState {
  const summary = state.currentOutingSelections.length
    ? `${state.currentOutingSelections.join(' -> ')} 순서로 다녀왔다.`
    : '오늘은 문 앞에서만 맴돌았다.';

  return {
    ...state,
    screen: 'room',
    guideLine: '방금 일은 적어뒀어.',
    log: summary,
    outingHistory: [
      ...state.outingHistory,
      {
        stage: state.stage,
        outingId: state.currentOutingId ?? 'unknown',
        selections: [...state.currentOutingSelections],
        summary,
        flagsGained: [...state.currentOutingFlagsGained],
        reactionsSeen: [...state.currentOutingReactionsSeen]
      }
    ],
    currentOutingId: null,
    currentOutingSelections: [],
    currentOutingFlagsGained: [],
    currentOutingReactionsSeen: [],
    pendingReaction: null,
    roomFeatures: {
      ...state.roomFeatures,
      firstRecord: true
    },
    outingCount: state.outingCount + 1
  };
}

export function startOuting(state: VillageState): VillageState {
  if (state.screen !== 'room') return state;
  const outingId = state.outingCount >= 3 && !allRequiredActionsComplete(state)
    ? recoveryOutingId(state)
    : nextPlannedOutingId(state.outingCount);
  const outing = outingById(outingId);

  return {
    ...state,
    screen: 'villageBoard',
    currentOutingId: outingId,
    currentOutingSelections: [],
    currentOutingFlagsGained: [],
    currentOutingReactionsSeen: [],
    pendingReaction: null,
    guideLine: outing?.guideLine ?? '오늘 못 본 길이 하나 남았네.',
    log: outing?.title ?? '다른 하루'
  };
}

export function selectHotspot(state: VillageState, hotspotId: HotspotId): VillageState {
  if (state.screen !== 'villageBoard') return state;
  if (state.currentOutingSelections.length >= MAX_SELECTIONS) return state;
  if (!activeHotspotIds(state).includes(hotspotId)) return state;
  if (state.currentOutingSelections.includes(hotspotId)) return state;

  const reaction = reactionFor(state, hotspotId);
  const completedActions = uniqueActions(state.completedActions, reaction.actionsGained);
  const sequenceFlags = reaction.flagsGained.reduce<Record<string, boolean>>((flags, flag) => {
    return { ...flags, [flag]: true };
  }, state.sequenceFlags);
  const readyForCyan = hotspotId === 'cyanTrace'
    && requiredActions.every((action) => completedActions.includes(action));
  const nextState: VillageState = {
    ...state,
    log: reaction.log,
    pendingReaction: reaction,
    currentOutingSelections: [...state.currentOutingSelections, hotspotId],
    currentOutingFlagsGained: [...new Set([...state.currentOutingFlagsGained, ...reaction.flagsGained])],
    currentOutingReactionsSeen: [...new Set([...state.currentOutingReactionsSeen, reaction.id])],
    completedActions,
    sequenceFlags,
    reactionsSeen: [...new Set([...state.reactionsSeen, reaction.id])],
    bankSupportReceived: completedActions.includes('receivedSupport'),
    cyanTraceDiscovered: state.cyanTraceDiscovered || hotspotId === 'cyanTrace',
    cyanGateUnlocked: state.cyanGateUnlocked || readyForCyan,
    stage: state.stage === 'preCyan' && readyForCyan ? 'cyanReady' : state.stage,
    roomFeatures: readyForCyan
      ? { ...state.roomFeatures, cyanTraceRecord: true }
      : state.roomFeatures
  };

  return nextState.currentOutingSelections.length >= MAX_SELECTIONS ? finishOuting(nextState) : nextState;
}

export function recordMoneyFeverClick(state: VillageState, nowMs: number): VillageState {
  const windowStartedAt = state.moneyFever.triggerCountWindowStartedAt;
  const insideWindow = windowStartedAt !== null && nowMs - windowStartedAt <= MONEY_FEVER_WINDOW_MS;
  const triggerCount = insideWindow ? state.moneyFever.triggerCount + 1 : 1;
  const triggerCountWindowStartedAt = insideWindow ? windowStartedAt : nowMs;
  const triggered = triggerCount >= 10;

  return {
    ...state,
    log: triggered ? '골목 쪽 신호가 섞였어.' : state.log,
    moneyFever: {
      activeUntil: triggered ? nowMs + MONEY_FEVER_DURATION_MS : state.moneyFever.activeUntil,
      triggeredEver: state.moneyFever.triggeredEver || triggered,
      triggerCountWindowStartedAt,
      triggerCount
    },
    alley: {
      ...state.alley,
      discoveredHint: state.alley.discoveredHint || triggered
    },
    roomFeatures: triggered
      ? { ...state.roomFeatures, strangeDrawer: true }
      : state.roomFeatures
  };
}
