import { activeHotspotIds } from '../domain/outing';
import { hotspots, zones } from '../domain/data';
import type { HotspotId, VillageState, ZoneId } from '../../shared/types/village';

const zoneOrder: ZoneId[] = ['home', 'commercial', 'transit', 'work', 'finance', 'hidden'];

export function renderOutingSlots(host: HTMLElement, state: VillageState): void {
  const selections = state.currentOutingSelections;
  host.innerHTML = [0, 1, 2].map((index) => {
    const hotspotId = selections[index];
    const label = hotspotId ? hotspots[hotspotId]?.shortLabel ?? '?' : String(index + 1);
    return `<span class="outing-slot ${hotspotId ? 'is-filled' : ''}">${label}</span>`;
  }).join('');
}

function renderHotspotButton(hotspotId: HotspotId, state: VillageState): string {
  const hotspot = hotspots[hotspotId];
  const selected = state.currentOutingSelections.includes(hotspotId);
  const financeHotspot = hotspotId === 'bankAtm' || hotspotId === 'bankCounter';
  const disabled = (selected && !financeHotspot) || state.currentOutingSelections.length >= 3 ? 'disabled' : '';
  return `<button type="button" class="hotspot ${selected ? 'is-selected' : ''}" data-hotspot-id="${hotspot.id}" ${disabled}>${hotspot.label}</button>`;
}

export function renderZoneBoard(host: HTMLElement, state: VillageState): void {
  const activeIds = activeHotspotIds(state);
  host.innerHTML = zoneOrder.map((zoneId) => {
    const zone = zones[zoneId];
    const zoneHotspots = activeIds.filter((hotspotId) => hotspots[hotspotId]?.zoneId === zoneId);
    const layer = state.zoneLayers[zoneId] ?? 0;
    const hiddenActive = zoneId === 'hidden' && state.alley.discoveredHint;
    return `
      <section class="zone-card zone-${zoneId} ${zoneHotspots.length || hiddenActive ? 'is-active' : ''}" data-zone-id="${zoneId}">
        <div>
          <h2>${zone.label}</h2>
          <p>${zone.description}</p>
          <span class="zone-layer">layer ${layer}</span>
        </div>
        <div class="hotspots">
          ${zoneHotspots.map((hotspotId) => renderHotspotButton(hotspotId, state)).join('')}
          ${hiddenActive ? '<span class="hidden-hint">신호가 섞였다.</span>' : ''}
        </div>
      </section>
    `;
  }).join('');
}

export function renderStatusStrip(host: HTMLElement, state: VillageState): void {
  const chips = [
    state.moneyFever.triggeredEver ? '<span class="status-chip is-strange">돈독</span>' : '',
    state.cyanGateUnlocked ? '<span class="status-chip is-cyan">길 열림</span>' : '',
    state.roomFeatures.firstRecord ? '<span class="status-chip">기록 있음</span>' : ''
  ].filter(Boolean);
  host.innerHTML = chips.join('');
}
