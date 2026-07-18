import { describe, it, expect } from 'vitest';
import { computeTraderSignals } from './signal-engine.server';

describe('signal-engine', () => {
  it('should be defined', () => {
    expect(computeTraderSignals).toBeDefined();
  });
});
