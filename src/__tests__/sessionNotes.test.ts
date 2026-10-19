import { afterEach, describe, expect, test } from '@jest/globals';
import {
  formatSessionNotesForPrompt,
  rememberSessionNote,
  resetSessionNotes,
} from '../core/sessionNotes.js';

describe('Session notes', () => {
  afterEach(() => {
    resetSessionNotes();
  });

  test('keeps saved notes available for the next prompt', () => {
    rememberSessionNote('https://example.com/a', 'Price is $19');
    rememberSessionNote('https://example.com/b', '  Shipping is free  ');

    const prompt = formatSessionNotesForPrompt();

    expect(prompt).toContain('https://example.com/a');
    expect(prompt).toContain('Price is $19');
    expect(prompt).toContain('Shipping is free');
    expect(prompt.startsWith('https://example.com/a')).toBe(true);
  });

  test('drops blank notes and truncates from the beginning', () => {
    rememberSessionNote('https://example.com', '   ');
    rememberSessionNote('https://example.com/old', 'OLD');
    rememberSessionNote('https://example.com/new', 'NEW-NOTE-CONTENT');

    const prompt = formatSessionNotesForPrompt(12);
    expect(prompt.startsWith('...(earlier notes truncated)...\n')).toBe(true);
    expect(prompt.endsWith('NOTE-CONTENT')).toBe(true);
    expect(prompt).not.toContain('OLD');
  });

  test('returns nothing before any note is saved', () => {
    expect(formatSessionNotesForPrompt()).toBe('');
  });
});
