import assert from 'node:assert/strict';
import test from 'node:test';
import { villageHotspots, roomDoor, findNearestHotspot, findNearestDoor, coreHotspotIds } from '../game/config/map-layout';

test('room door uses explicit interaction radius', () => {
  assert.equal(roomDoor.id, 'door');
  assert.equal(findNearestDoor({ x: roomDoor.x, y: roomDoor.y })?.id, 'door');
  assert.equal(findNearestDoor({ x: roomDoor.x + roomDoor.radius + 10, y: roomDoor.y }), null);
});

test('village exposes current core hotspots and background seeds', () => {
  assert.deepEqual(coreHotspotIds, ['bankCounter', 'storeFront', 'busStop', 'mailbox']);
  assert.ok(villageHotspots.some((hotspot) => hotspot.kind === 'background' && hotspot.id === 'lottery' && hotspot.domainId === null));
  assert.ok(villageHotspots.some((hotspot) => hotspot.kind === 'background' && hotspot.id === 'darkAlley' && hotspot.domainId === null));
  assert.ok(villageHotspots.some((hotspot) => hotspot.kind === 'background' && hotspot.id === 'cyanTraceSeed' && hotspot.domainId === null));
});

test('nearest hotspot only returns a target inside its radius', () => {
  const bank = villageHotspots.find((hotspot) => hotspot.id === 'bankCounter');
  assert.ok(bank);
  assert.equal(findNearestHotspot({ x: bank.x, y: bank.y })?.id, 'bankCounter');
  assert.equal(findNearestHotspot({ x: 20, y: 20 }), null);
});
