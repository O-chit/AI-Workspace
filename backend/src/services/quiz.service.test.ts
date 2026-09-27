import { describe, it, expect } from 'vitest';
import { QuizService } from './quiz.service.js';

describe('QuizService Running Accuracy & Scoring', () => {
  it('should return 0 accuracy when answered count is 0', () => {
    expect(QuizService.calculateRunningAccuracy(0, 0)).toBe(0);
  });

  it('should calculate 100% accuracy when all answered are correct', () => {
    expect(QuizService.calculateRunningAccuracy(3, 3)).toBe(100);
  });

  it('should calculate accurate percentage on partial scores', () => {
    expect(QuizService.calculateRunningAccuracy(2, 3)).toBe(67);
    expect(QuizService.calculateRunningAccuracy(1, 4)).toBe(25);
    expect(QuizService.calculateRunningAccuracy(7, 10)).toBe(70);
  });
});
