import fs from 'fs';
import path from 'path';
import { Action } from './browserExecutor.js';
import logger from './utils/logger.js';

interface SuccessPattern {
  actionType: string;
  element?: string;
  domain: string;
  successCount: number;
  lastSuccess: string;
}

interface SequenceStep {
  actionType: string;
  element?: string;
}

interface ActionSequence {
  domain: string;
  steps: SequenceStep[];
  successCount: number;
  lastSuccess: string;
}

interface StoredKnowledge {
  patterns: SuccessPattern[];
  sequences: ActionSequence[];
}

const MAX_SEQUENCE_LENGTH = 5;
const MAX_SEQUENCES_PER_DOMAIN = 8;

/**
 * Cross-session memory of what worked on a domain: individual selectors and
 * short action sequences. One shared instance keeps failure-mode state alive
 * for the whole automation session.
 */
export class SuccessPatterns {
  private patterns: SuccessPattern[] = [];
  private sequences: ActionSequence[] = [];
  private currentSequence: { domain: string; steps: SequenceStep[] } | null = null;
  private filePath: string;
  private isInFrequentFailureMode: boolean = false;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;

  constructor(filePath?: string) {
    this.filePath = filePath ?? path.join(process.cwd(), 'data', 'success-patterns.json');
    this.loadPatterns();
  }

  public get isFrequentFailureMode(): boolean {
    return this.isInFrequentFailureMode;
  }

  private loadPatterns() {
    try {
      if (!fs.existsSync(this.filePath)) return;

      const raw = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
      if (Array.isArray(raw)) {
        this.patterns = raw;
        this.sequences = [];
        return;
      }

      this.patterns = Array.isArray(raw?.patterns) ? raw.patterns : [];
      this.sequences = Array.isArray(raw?.sequences) ? raw.sequences : [];
    } catch (error) {
      console.error('Error loading success patterns:', error);
      this.patterns = [];
      this.sequences = [];
    }
  }

  public savePatterns() {
    try {
      fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
      const payload: StoredKnowledge = {
        patterns: this.patterns,
        sequences: this.sequences,
      };
      fs.writeFileSync(this.filePath, JSON.stringify(payload, null, 2));
    } catch (error) {
      console.error('Error saving success patterns:', error);
    }
  }

  public recordSuccess(action: Action, domain: string) {
    if (action.type === 'navigate' && !this.isSignificantNavigation(action)) {
      return;
    }

    const target = action.element || action.value;
    const existingPattern = this.patterns.find(p =>
      p.actionType === action.type &&
      p.element === target &&
      p.domain === domain
    );

    if (existingPattern) {
      existingPattern.successCount++;
      existingPattern.lastSuccess = new Date().toISOString();
    } else {
      this.patterns.push({
        actionType: action.type,
        element: target,
        domain,
        successCount: 1,
        lastSuccess: new Date().toISOString(),
      });
    }

    this.noteSequenceStep(action, domain);
    this.savePatterns();
  }

  private noteSequenceStep(action: Action, domain: string) {
    const step: SequenceStep = {
      actionType: action.type,
      element: action.element || action.value,
    };

    if (!this.currentSequence || this.currentSequence.domain !== domain) {
      this.currentSequence = { domain, steps: [] };
    }

    const last = this.currentSequence.steps[this.currentSequence.steps.length - 1];
    if (last && last.actionType === step.actionType && last.element === step.element) {
      return;
    }

    this.currentSequence.steps.push(step);
    if (this.currentSequence.steps.length > MAX_SEQUENCE_LENGTH) {
      this.currentSequence.steps.shift();
    }

    if (this.currentSequence.steps.length >= 2) {
      this.upsertSequence(domain, this.currentSequence.steps.map(s => ({ ...s })));
    }
  }

  private upsertSequence(domain: string, steps: SequenceStep[]) {
    if (!steps.some(step => step.actionType !== 'navigate')) return;

    const existing = this.sequences.find(sequence =>
      sequence.domain === domain && this.sameSteps(sequence.steps, steps)
    );

    if (existing) {
      existing.successCount++;
      existing.lastSuccess = new Date().toISOString();
    } else {
      this.sequences.push({
        domain,
        steps,
        successCount: 1,
        lastSuccess: new Date().toISOString(),
      });
    }

    const forDomain = this.sequences.filter(sequence => sequence.domain === domain);
    if (forDomain.length <= MAX_SEQUENCES_PER_DOMAIN) return;

    forDomain.sort((a, b) => {
      if (b.successCount !== a.successCount) return b.successCount - a.successCount;
      return b.steps.length - a.steps.length;
    });
    const keep = new Set(forDomain.slice(0, MAX_SEQUENCES_PER_DOMAIN));
    this.sequences = this.sequences.filter(sequence =>
      sequence.domain !== domain || keep.has(sequence)
    );
  }

  private sameSteps(left: SequenceStep[], right: SequenceStep[]): boolean {
    if (left.length !== right.length) return false;
    return left.every((step, index) =>
      step.actionType === right[index].actionType && step.element === right[index].element
    );
  }

  private isSignificantNavigation(action: Action): boolean {
    if (action.type === 'navigate' && action.value && action.previousUrl) {
      try {
        const prevDomain = new URL(action.previousUrl).hostname;
        const newDomain = new URL(action.value).hostname;
        const newPath = new URL(action.value).pathname;
        const hasSignificantPath = newPath && newPath !== '/' && newPath.length > 1;
        const hasSignificantQueryParams = new URL(action.value).search.length > 1;

        return prevDomain !== newDomain ||
          hasSignificantPath ||
          hasSignificantQueryParams;
      } catch (error) {
        console.error('Error analyzing navigation significance:', error);
        return false;
      }
    }
    return false;
  }

  private matchesDomain(patternDomain: string, domain: string): boolean {
    return patternDomain === domain ||
      domain.includes(patternDomain) ||
      patternDomain.includes(domain);
  }

  public getSuggestionsForDomain(domain: string): string[] {
    const domainPatterns = this.patterns
      .filter(p => this.matchesDomain(p.domain, domain)
        && (p.actionType !== 'navigate' || this.isInFrequentFailureMode === false))
      .sort((a, b) => {
        if (a.actionType !== 'navigate' && b.actionType === 'navigate') return -1;
        if (a.actionType === 'navigate' && b.actionType !== 'navigate') return 1;
        return b.successCount - a.successCount;
      })
      .slice(0, 3);

    const patternSuggestions = domainPatterns.map(p => {
      if (p.actionType === 'click' || p.actionType === 'input') {
        return `Try using selector "${p.element}" for ${p.actionType} actions (worked ${p.successCount} times)`;
      }
      return `"${p.actionType}" actions work well on this site (worked ${p.successCount} times)`;
    });

    const sequenceSuggestions = this.sequences
      .filter(sequence => this.matchesDomain(sequence.domain, domain))
      .filter(sequence => !this.isInFrequentFailureMode ||
        sequence.steps.some(step => step.actionType !== 'navigate'))
      .sort((a, b) => {
        if (b.steps.length !== a.steps.length) return b.steps.length - a.steps.length;
        return b.successCount - a.successCount;
      })
      .slice(0, 2)
      .map(sequence => {
        const chain = sequence.steps
          .map(step => `${step.actionType}${step.element ? ` "${step.element}"` : ''}`)
          .join(' → ');
        return `Replay sequence (worked ${sequence.successCount} times): ${chain}`;
      });

    const suggestions = [...patternSuggestions, ...sequenceSuggestions];
    if (this.isInFrequentFailureMode) {
      suggestions.unshift(
        'Recent attempts on this site are failing. Prefer a different interaction instead of repeating the last approach.'
      );
    }
    return suggestions.slice(0, 5);
  }

  public recordFailure() {
    const now = Date.now();
    if (now - this.lastFailureTime > 30000) {
      this.failureCount = 0;
    }

    this.failureCount++;
    this.lastFailureTime = now;
    this.currentSequence = null;

    if (this.failureCount >= 3) {
      this.isInFrequentFailureMode = true;
    }
  }

  public resetFailures() {
    this.failureCount = 0;
    this.isInFrequentFailureMode = false;
  }
}

let sharedPatterns: SuccessPatterns | null = null;

export function getSharedSuccessPatterns(filePath?: string): SuccessPatterns {
  if (!sharedPatterns) {
    sharedPatterns = new SuccessPatterns(filePath);
  }
  return sharedPatterns;
}

export function resetSharedSuccessPatterns(): void {
  sharedPatterns = null;
}

export function recordActionSuccess(action: Action, pageUrl: string): void {
  try {
    const domain = new URL(pageUrl).hostname;
    const patterns = getSharedSuccessPatterns();
    patterns.recordSuccess(action, domain);
    patterns.resetFailures();
  } catch (error) {
    logger.error('Error recording success pattern', error);
  }
}

export function recordActionFailure(): void {
  try {
    getSharedSuccessPatterns().recordFailure();
  } catch (error) {
    logger.error('Error recording action failure', error);
  }
}
