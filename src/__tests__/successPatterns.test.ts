import { afterEach, describe, expect, test } from '@jest/globals';
import { Action } from '../browserExecutor.js';
import {
  MemoryPatternStore,
  SuccessPatterns,
  getSharedSuccessPatterns,
  resetSharedSuccessPatterns,
} from '../successPatterns.js';

function action(partial: Pick<Action, 'type'> & Partial<Action>): Action {
  return {
    selectorType: 'css',
    maxWait: 1000,
    ...partial,
  };
}

describe('SuccessPatterns', () => {
  afterEach(() => {
    resetSharedSuccessPatterns();
  });

  function createStore(): { patterns: SuccessPatterns; store: MemoryPatternStore } {
    const store = new MemoryPatternStore();
    return { patterns: new SuccessPatterns(store), store };
  }

  test('loads the legacy array file and saves patterns with sequences', () => {
    const store = new MemoryPatternStore(JSON.stringify([
      {
        actionType: 'click',
        element: '#legacy',
        domain: 'example.com',
        successCount: 4,
        lastSuccess: '2020-01-01T00:00:00.000Z',
      },
    ]));
    const patterns = new SuccessPatterns(store);
    patterns.recordSuccess(action({ type: 'input', element: '#q', value: 'agents' }), 'example.com');

    const saved = JSON.parse(store.snapshot() || '{}');
    expect(saved.patterns).toEqual(expect.arrayContaining([
      expect.objectContaining({ element: '#legacy', successCount: 4 }),
      expect.objectContaining({ actionType: 'input', element: '#q', successCount: 1 }),
    ]));
    expect(saved.sequences).toEqual([]);
  });

  test('suggests selectors and replays a successful interaction sequence', () => {
    const { patterns } = createStore();

    patterns.recordSuccess(action({
      type: 'navigate',
      value: 'https://example.com/search',
      previousUrl: 'https://other.test/',
    }), 'example.com');
    patterns.recordSuccess(action({ type: 'click', element: '#search' }), 'example.com');
    patterns.recordSuccess(action({ type: 'input', element: 'input[name="q"]', value: 'agents' }), 'example.com');
    patterns.recordSuccess(action({ type: 'click', element: '#search' }), 'example.com');
    patterns.recordSuccess(action({ type: 'input', element: 'input[name="q"]', value: 'agents' }), 'example.com');

    const suggestions = patterns.getSuggestionsForDomain('www.example.com');
    expect(suggestions.some(line => line.includes('selector "#search"') && line.includes('worked 2 times'))).toBe(true);
    expect(suggestions.some(line =>
      line.startsWith('Replay sequence') &&
      line.includes('click "#search"') &&
      line.includes('input[name="q"]')
    )).toBe(true);
  });

  test('hides navigation tips after repeated failures and keeps the failure mode on one instance', () => {
    const store = new MemoryPatternStore();
    const first = getSharedSuccessPatterns(store);

    first.recordSuccess(action({
      type: 'navigate',
      value: 'https://example.com/docs',
      previousUrl: 'https://example.com/',
    }), 'example.com');
    first.recordSuccess(action({ type: 'click', element: '#docs' }), 'example.com');

    first.recordFailure();
    first.recordFailure();
    first.recordFailure();

    const second = getSharedSuccessPatterns();
    expect(second).toBe(first);
    expect(second.isFrequentFailureMode).toBe(true);

    const suggestions = second.getSuggestionsForDomain('example.com');
    expect(suggestions[0]).toMatch(/Recent attempts on this site are failing/);
    expect(suggestions.some(line => line.includes('"navigate"'))).toBe(false);
    expect(suggestions.some(line => line.includes('#docs'))).toBe(true);
  });

  test('does not remember a homepage refresh as a reusable pattern', () => {
    const { patterns } = createStore();
    patterns.recordSuccess(action({
      type: 'navigate',
      value: 'https://example.com/',
      previousUrl: 'https://example.com/docs',
    }), 'example.com');

    expect(patterns.getSuggestionsForDomain('example.com')).toEqual([]);
  });
});
