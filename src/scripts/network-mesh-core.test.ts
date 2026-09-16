import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildCorrelatedSeeds,
  buildIndependentSeeds,
  buildMeshPlan,
  edgePairsFor,
  edgeStatsForSeed,
  filterPairsLocalInAllSeeds,
  linkLimits,
  meshLayoutForPage,
  NODE_COUNT_DESKTOP,
  SEED_COUNT,
} from './network-mesh-core.ts';

const LAYOUT = meshLayoutForPage(1440, 2400, false);
const COUNT = NODE_COUNT_DESKTOP;
const NEIGHBORS = 5;
const ROOT = 42;

describe('network mesh seeds', () => {
  it('layout is taller than wide', () => {
    assert.ok(LAYOUT.halfH > LAYOUT.halfW * 1.2);
  });

  it('seed 0 edges are local (short)', () => {
    const seeds = buildCorrelatedSeeds(LAYOUT, COUNT, ROOT);
    const pairs = edgePairsFor(seeds[0], LAYOUT, NEIGHBORS);
    const stats = edgeStatsForSeed(seeds[0], pairs, LAYOUT);
    const { maxLink, maxDy } = linkLimits(LAYOUT);

    assert.ok(pairs.length > 40, `too few edges: ${pairs.length}`);
    assert.equal(stats.longCount, 0);
    assert.ok(stats.maxLen <= maxLink + 1e-6, `maxLen ${stats.maxLen} > ${maxLink}`);
    assert.ok(stats.maxDy <= maxDy + 1e-6, `maxDy ${stats.maxDy} > ${maxDy}`);
  });

  it('independent seeds break topology: seed0 edges become long on seed1/2', () => {
    const seeds = buildIndependentSeeds(LAYOUT, COUNT, ROOT);
    const pairs = edgePairsFor(seeds[0], LAYOUT, NEIGHBORS);

    const bad = [1, 2].map((s) => edgeStatsForSeed(seeds[s], pairs, LAYOUT));
    const anyLong = bad.some((st) => st.longCount > 0);
    assert.ok(
      anyLong,
      'expected independent seeds to stretch seed0 edges (documents the bug)',
    );

    const worst = bad.reduce((a, b) => (a.maxLen > b.maxLen ? a : b));
    assert.ok(
      worst.maxLen > linkLimits(LAYOUT).maxLink * 1.5,
      `expected stretched maxLen, got ${worst.maxLen}`,
    );
  });

  it('mesh plan keeps edges local on every seed', () => {
    const plan = buildMeshPlan(LAYOUT, COUNT, ROOT, NEIGHBORS);
    assert.equal(plan.seeds.length, SEED_COUNT);
    assert.ok(plan.pairs.length > 30, `filtered too aggressively: ${plan.pairs.length}`);
    assert.ok(plan.pairs.length <= plan.rawPairCount);

    const { maxLink, maxDy } = linkLimits(LAYOUT);
    for (let s = 0; s < SEED_COUNT; s += 1) {
      const stats = edgeStatsForSeed(plan.seeds[s], plan.pairs, LAYOUT);
      assert.equal(
        stats.longCount,
        0,
        `seed ${s}: ${stats.longCount} long edges (maxLen=${stats.maxLen.toFixed(1)}, maxDy=${stats.maxDy.toFixed(1)})`,
      );
      assert.ok(stats.maxLen <= maxLink + 1e-6, `seed ${s} maxLen`);
      assert.ok(stats.maxDy <= maxDy + 1e-6, `seed ${s} maxDy`);
    }
  });

  it('filter drops pairs that only work on seed 0', () => {
    const seeds = buildIndependentSeeds(LAYOUT, COUNT, ROOT);
    const raw = edgePairsFor(seeds[0], LAYOUT, NEIGHBORS);
    const filtered = filterPairsLocalInAllSeeds(raw, seeds, LAYOUT);
    assert.ok(filtered.length < raw.length, 'expected filter to drop stretched pairs');
    for (let s = 0; s < SEED_COUNT; s += 1) {
      assert.equal(edgeStatsForSeed(seeds[s], filtered, LAYOUT).longCount, 0);
    }
  });

  it('correlated seeds actually differ (morph has motion)', () => {
    const seeds = buildCorrelatedSeeds(LAYOUT, COUNT, ROOT);
    let moved = 0;
    for (let i = 0; i < COUNT; i += 1) {
      const d01 = Math.hypot(
        seeds[0][i][0] - seeds[1][i][0],
        seeds[0][i][1] - seeds[1][i][1],
      );
      const d02 = Math.hypot(
        seeds[0][i][0] - seeds[2][i][0],
        seeds[0][i][1] - seeds[2][i][1],
      );
      if (d01 > 2 || d02 > 2) moved += 1;
    }
    assert.ok(moved > COUNT * 0.5, `too static: only ${moved}/${COUNT} nodes moved`);
  });
});
