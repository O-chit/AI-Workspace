import { describe, it, expect } from 'vitest';
import { FlashcardService, SrsRating } from './flashcard.service.js';

describe('FlashcardService SRS SM-2 Algorithm', () => {
  it('should reset interval to 1 day on "again" rating', () => {
    const result = FlashcardService.calculateNextReview(2.5, 6, 'again');
    expect(result.intervalDays).toBe(1);
    expect(result.status).toBe('learning');
    expect(result.easeFactor).toBe(2.3);
  });

  it('should never let easeFactor drop below 1.3', () => {
    const result = FlashcardService.calculateNextReview(1.35, 1, 'again');
    expect(result.easeFactor).toBe(1.3);
  });

  it('should increase interval appropriately on "good" rating', () => {
    // New card
    const firstReview = FlashcardService.calculateNextReview(2.5, 0, 'good');
    expect(firstReview.intervalDays).toBe(1);
    expect(firstReview.status).toBe('learning');

    // Second review
    const secondReview = FlashcardService.calculateNextReview(2.5, 1, 'good');
    expect(secondReview.intervalDays).toBe(3);

    // Third review: 3 * 2.5 = 7.5 -> 8
    const thirdReview = FlashcardService.calculateNextReview(2.5, 3, 'good');
    expect(thirdReview.intervalDays).toBe(8);
    expect(thirdReview.status).toBe('mastered');
  });

  it('should boost easeFactor and jump interval on "easy" rating', () => {
    const result = FlashcardService.calculateNextReview(2.5, 3, 'easy');
    expect(result.easeFactor).toBe(2.65);
    // 3 * 2.5 * 1.3 = 9.75 -> 10
    expect(result.intervalDays).toBe(10);
    expect(result.status).toBe('mastered');
  });

  it('should calculate future dueDate based on intervalDays', () => {
    const result = FlashcardService.calculateNextReview(2.5, 0, 'good');
    const now = new Date();
    const diffHours = (result.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    expect(diffHours).toBeGreaterThanOrEqual(23);
    expect(diffHours).toBeLessThanOrEqual(25);
  });
});
