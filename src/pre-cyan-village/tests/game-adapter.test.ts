import assert from 'node:assert/strict';
import test from 'node:test';
import { createInitialState } from '../domain/state';
import { createOutingSession } from '../game/adapters/outing-session';
import { createMemoryStorage, loadGameState, saveGameState } from '../game/adapters/storage-adapter';
import { STORAGE_KEY } from '../domain/state';
import type { HotspotId } from '../../shared/types/village';

test('outing session starts from the room and enters the village board state', () => {
  const session = createOutingSession(createInitialState(), null);
  const started = session.start();

  assert.equal(started.screen, 'villageBoard');
  assert.equal(started.currentOutingId, 'settling');
  assert.deepEqual(started.currentOutingSelections, []);
});

test('outing session records three core interactions and returns to the room', () => {
  const session = createOutingSession(createInitialState(), null);
  session.start();

  for (const hotspotId of ['bankCounter', 'storeFront', 'busStop'] as HotspotId[]) {
    session.interact(hotspotId, 1000);
  }

  const state = session.getState();
  assert.equal(state.screen, 'room');
  assert.equal(state.outingHistory.length, 1);
  assert.deepEqual(state.outingHistory[0].selections, ['bankCounter', 'storeFront', 'busStop']);
  assert.equal(state.roomFeatures.firstRecord, true);
});

test('outing session ignores duplicate hotspot interactions', () => {
  const session = createOutingSession(createInitialState(), null);
  session.start();
  session.interact('bankCounter', 1000);
  const unchanged = session.interact('bankCounter', 1001);

  assert.equal(unchanged.currentOutingSelections.length, 1);
  assert.deepEqual(unchanged.currentOutingSelections, ['bankCounter']);
});

test('outing session ignores finance interactions before an outing starts', () => {
  const session = createOutingSession(createInitialState(), null);
  const unchanged = session.interact('bankCounter', 1000);

  assert.equal(unchanged.screen, 'room');
  assert.equal(unchanged.moneyFever.triggerCount, 0);
});

test('outing session ignores inactive finance hotspots during an outing', () => {
  const session = createOutingSession(createInitialState(), null);
  session.start();
  const unchanged = session.interact('bankAtm', 1000);

  assert.equal(unchanged.moneyFever.triggerCount, 0);
  assert.deepEqual(unchanged.currentOutingSelections, []);
});

test('storage-backed outing session persists state for reload recovery', () => {
  const storage = createMemoryStorage();
  const session = createOutingSession(createInitialState(), storage);

  session.start();
  session.interact('bankCounter', 1000);

  const recovered = loadGameState(storage);
  assert.equal(recovered.screen, 'villageBoard');
  assert.deepEqual(recovered.currentOutingSelections, ['bankCounter']);
  assert.equal(recovered.moneyFever.triggerCount, 1);
});

test('game storage adapter saves, loads, and recovers corrupt data', () => {
  const storage = createMemoryStorage();
  const initial = createInitialState();
  const saved = saveGameState(storage, initial);

  assert.equal(saved.screen, 'room');
  assert.ok(storage.getItem(STORAGE_KEY));

  storage.setItem(STORAGE_KEY, '{"screen":"villageBoard","currentOutingId":"missing"}');
  const recovered = loadGameState(storage);
  assert.equal(recovered.screen, 'room');
  assert.equal(recovered.currentOutingId, null);
});
