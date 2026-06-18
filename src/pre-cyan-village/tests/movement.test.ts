import assert from 'node:assert/strict';
import test from 'node:test';
import { isSamePath, normalizeEdge } from '../../shared/map/paths';
import { projectIso } from '../../shared/map/isometric';
import type { Edge, GridPosition } from '../../shared/types/graph';

test('normalizeEdge converts tuple edges into object edges', () => {
  assert.deepEqual(normalizeEdge(['room', 'store']), { from: 'room', to: 'store' });
});

test('isSamePath supports directed and reverse edge matching', () => {
  const edge: Edge = { from: 'room', to: 'store' };
  assert.equal(isSamePath(edge, { from: 'room', to: 'store' }), true);
  assert.equal(isSamePath(edge, { from: 'store', to: 'room' }), true);
  assert.equal(isSamePath(edge, { from: 'store', to: 'bus' }), false);
});

test('projectIso maps grid coordinates onto a diamond plane', () => {
  const origin: GridPosition = { q: 0, r: 0 };
  const east: GridPosition = { q: 1, r: 0 };
  const south: GridPosition = { q: 0, r: 1 };
  const raised: GridPosition = { q: 1, r: 1, elevation: 8 };

  assert.deepEqual(projectIso(origin), { x: 0, y: 0 });
  assert.deepEqual(projectIso(east), { x: 32, y: 16 });
  assert.deepEqual(projectIso(south), { x: -32, y: 16 });
  assert.deepEqual(projectIso(raised), { x: 0, y: 24 });
});
