import { 
  detectProgress, 
  calculateProgressPercentage, 
  isStuck,
  getProgressSummary,
  formatProgressForPrompt,
  PageState
} from '../../core/automation/progress.js';
import { GraphContext } from '../../browserExecutor.js';
import { Action } from '../../core/actions/types.js';

describe('Progress Tracking', () => {
  describe('detectProgress', () => {
    test('detects URL change as progress', () => {
      // Arrange
      const ctx = {} as GraphContext;
      const prevState = {
        url: 'https://example.com',
        title: 'Example'
      } as PageState;
      
      const currentState = {
        url: 'https://example.com/search',
        title: 'Example'
      } as PageState;
      
      // Act
      detectProgress(ctx, prevState, currentState);
      
      // Assert
      expect(ctx.actionFeedback).toContain('navigated from');
      expect(ctx.actionFeedback).toContain('https://example.com');
      expect(ctx.actionFeedback).toContain('https://example.com/search');
    });
    
    test('detects title change as progress', () => {
      // Arrange
      const ctx = {} as GraphContext;
      const prevState = {
        url: 'https://example.com',
        title: 'Home'
      } as PageState;
      
      const currentState = {
        url: 'https://example.com',
        title: 'Search Results'
      } as PageState;
      
      // Act
      detectProgress(ctx, prevState, currentState);
      
      // Assert
      expect(ctx.actionFeedback).toContain('page title changed from');
      expect(ctx.actionFeedback).toContain('Home');
      expect(ctx.actionFeedback).toContain('Search Results');
    });
    
    test('detects new interactive elements', () => {
      // Arrange
      const ctx = {} as GraphContext;
      const prevState = {
        url: 'https://example.com',
        title: 'Example',
        domSnapshot: {
          buttons: [],
          inputs: [{}],
          links: [{}]
        }
      } as PageState;
      
      const currentState = {
        url: 'https://example.com',
        title: 'Example',
        domSnapshot: {
          buttons: [{}, {}, {}], // New buttons appeared
          inputs: [{}],          // Same number of inputs
          links: [{}]            // Same number of links
        }
      } as PageState;
      
      // Act
      detectProgress(ctx, prevState, currentState);
      
      // Assert
      expect(ctx.actionFeedback).toContain('new buttons appeared');
    });
    
    test('handles null states gracefully', () => {
      // Arrange
      const ctx = {} as GraphContext;
      
      // Act - should not throw
      detectProgress(ctx, null, null);
      
      // Assert
      expect(ctx.actionFeedback).toBeUndefined();
    });
  });
  
  describe('calculateProgressPercentage', () => {
    test('calculates percentage based on milestones', () => {
      // Arrange
      const ctx = {
        milestones: ['milestone1', 'milestone2', 'milestone3', 'milestone4'],
        recognizedMilestones: ['milestone1', 'milestone2']
      } as GraphContext;
      
      // Act
      const result = calculateProgressPercentage(ctx);
      
      // Assert
      expect(result).toBe(50); // 2 out of 4 = 50%
    });
    
    test('returns 0 when no milestones exist', () => {
      // Arrange
      const ctx = {} as GraphContext;
      
      // Act
      const result = calculateProgressPercentage(ctx);
      
      // Assert
      expect(result).toBe(0);
    });
    
    test('returns 100 when all milestones are recognized', () => {
      // Arrange
      const ctx = {
        milestones: ['milestone1', 'milestone2'],
        recognizedMilestones: ['milestone1', 'milestone2']
      } as GraphContext;
      
      // Act
      const result = calculateProgressPercentage(ctx);
      
      // Assert
      expect(result).toBe(100);
    });
  });
  
  describe('isStuck', () => {
    test('detects when retries exceed threshold', () => {
      // Arrange
      const ctx = {
        retries: 4 // Above the threshold of 3
      } as GraphContext;
      
      // Act
      const result = isStuck(ctx);
      
      // Assert
      expect(result).toBe(true);
    });
    
    test('detects repeated actions', () => {
      // Arrange
      const repeatedAction: Action = {
        type: 'click',
        element: '#submit-button',
        selectorType: 'css',
        maxWait: 1000
      };
      
      const ctx = {
        retries: 0,
        actionHistory: [
          repeatedAction,
          repeatedAction,
          repeatedAction,
          repeatedAction,
          repeatedAction
        ]
      } as GraphContext;
      
      // Act
      const result = isStuck(ctx);
      
      // Assert
      expect(result).toBe(true);
    });
    
    test('returns false when making progress', () => {
      // Arrange
      const ctx = {
        retries: 0,
        actionHistory: [
          { type: 'navigate', value: 'https://example.com', selectorType: 'css', maxWait: 1000 },
          { type: 'click', element: '#menu', selectorType: 'css', maxWait: 1000 },
          { type: 'click', element: '#login', selectorType: 'css', maxWait: 1000 },
          { type: 'input', element: '#username', value: 'user', selectorType: 'css', maxWait: 1000 },
          { type: 'input', element: '#password', value: 'pass', selectorType: 'css', maxWait: 1000 }
        ]
      } as GraphContext;
      
      // Act
      const result = isStuck(ctx);
      
      // Assert
      expect(result).toBe(false);
    });
  });
  
  describe('getProgressSummary', () => {
    test('formats progress summary correctly', () => {
      // Arrange
      const ctx = {
        milestones: ['milestone1', 'milestone2', 'milestone3'],
        recognizedMilestones: ['milestone1']
      } as GraphContext;
      
      // Act
      const result = getProgressSummary(ctx);
      
      // Assert
      expect(result).toBe('Progress: 33% (1/3 milestones)');
    });
    
    test('handles missing milestones gracefully', () => {
      // Arrange
      const ctx = {} as GraphContext;
      
      // Act
      const result = getProgressSummary(ctx);
      
      // Assert
      expect(result).toBe('Progress: 0% (0/0 milestones)');
    });
  });

  describe('formatProgressForPrompt', () => {
    test('names the next milestone for the action prompt', () => {
      const ctx = {
        milestones: ['reach_search_page', 'enter_search_query'],
        recognizedMilestones: ['reach_search_page']
      } as GraphContext;

      const result = formatProgressForPrompt(ctx);

      expect(result).toContain('Progress: 50% (1/2 milestones)');
      expect(result).toContain('Completed: reach_search_page');
      expect(result).toContain('Next milestone: enter search query');
    });

    test('stays quiet before milestones exist', () => {
      expect(formatProgressForPrompt({} as GraphContext)).toBe('');
    });
  });
});
