/**
 * Unit-style tests for the bracket logic — no browser needed.
 * These run as Playwright tests for consistency but don't open any page.
 * They catch regressions in score validation, composition constraints, etc.
 */
import { test, expect } from '@playwright/test'
import {
  isValidSetScore,
  gameWinner,
  encounterWinner,
  validateCompositionPoints,
  QF_SEEDS,
} from '../src/lib/tournament/bracket'

test.describe('Score validation', () => {
  test('standard wins are valid', () => {
    expect(isValidSetScore(15, 10)).toBe(true)
    expect(isValidSetScore(10, 15)).toBe(true)
    expect(isValidSetScore(17, 15)).toBe(true)
    expect(isValidSetScore(20, 18)).toBe(true)
  })

  test('win by 1 above 14-all is invalid', () => {
    expect(isValidSetScore(16, 15)).toBe(false)
    expect(isValidSetScore(18, 17)).toBe(false)
  })

  test('only 21-20 is valid at hard cap', () => {
    expect(isValidSetScore(21, 20)).toBe(true)
    expect(isValidSetScore(21, 19)).toBe(false)
    expect(isValidSetScore(22, 20)).toBe(false)
  })

  test('game not finished yet (high < 15) is invalid', () => {
    expect(isValidSetScore(14, 10)).toBe(false)
  })

  test('15-13 valid, 15-14 invalid', () => {
    expect(isValidSetScore(15, 13)).toBe(true)
    expect(isValidSetScore(15, 14)).toBe(false)
  })

  test('negative scores are invalid', () => {
    expect(isValidSetScore(-1, 15)).toBe(false)
    expect(isValidSetScore(15, -1)).toBe(false)
  })

  test('tie is invalid', () => {
    expect(isValidSetScore(15, 15)).toBe(false)
  })
})

test.describe('Game winner (BO3)', () => {
  test('2-0 win for A', () => {
    expect(gameWinner([
      { score_a: 15, score_b: 5 },
      { score_a: 15, score_b: 8 },
    ])).toBe('a')
  })

  test('2-0 win for B', () => {
    expect(gameWinner([
      { score_a: 5, score_b: 15 },
      { score_a: 8, score_b: 15 },
    ])).toBe('b')
  })

  test('2-1 win for A', () => {
    expect(gameWinner([
      { score_a: 15, score_b: 5 },
      { score_a: 8, score_b: 15 },
      { score_a: 15, score_b: 10 },
    ])).toBe('a')
  })

  test('incomplete (1-0) returns null', () => {
    expect(gameWinner([
      { score_a: 15, score_b: 5 },
    ])).toBe(null)
  })

  test('empty sets returns null', () => {
    expect(gameWinner([])).toBe(null)
  })
})

test.describe('Encounter winner (3 of 5 games)', () => {
  test('3-0 sweep by A', () => {
    expect(encounterWinner(['a', 'a', 'a', null, null])).toBe('a')
  })

  test('3-2 comeback by A', () => {
    expect(encounterWinner(['b', 'b', 'a', 'a', 'a'])).toBe('a')
  })

  test('3-1 win by B', () => {
    expect(encounterWinner(['b', 'a', 'b', 'b', null])).toBe('b')
  })

  test('incomplete (2-2) returns null', () => {
    expect(encounterWinner(['a', 'a', 'b', 'b', null])).toBe(null)
  })

  test('all null returns null', () => {
    expect(encounterWinner([null, null, null, null, null])).toBe(null)
  })
})

test.describe('Composition constraints', () => {
  test('valid: Mixed 1 >= Mixed 2, Open 1 >= Open 2', () => {
    const result = validateCompositionPoints({
      mixed1_man_mixed: 60,
      mixed1_woman_mixed: 50,   // Mixed 1 = 110
      mixed2_man_mixed: 40,
      mixed2_woman_mixed: 40,   // Mixed 2 = 80
      open1_p1_open: 50,
      open1_p2_open: 50,        // Open 1 = 100
      open2_p1_open: 40,
      open2_p2_open: 30,        // Open 2 = 70
    })
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  test('invalid: Mixed 1 total < Mixed 2 total', () => {
    const result = validateCompositionPoints({
      mixed1_man_mixed: 30,
      mixed1_woman_mixed: 30,   // Mixed 1 = 60
      mixed2_man_mixed: 50,
      mixed2_woman_mixed: 50,   // Mixed 2 = 100
      open1_p1_open: 50,
      open1_p2_open: 50,
      open2_p1_open: 30,
      open2_p2_open: 30,
    })
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('Mixed 1'))).toBe(true)
  })

  test('invalid: Open 1 total < Open 2 total', () => {
    const result = validateCompositionPoints({
      mixed1_man_mixed: 60,
      mixed1_woman_mixed: 40,
      mixed2_man_mixed: 40,
      mixed2_woman_mixed: 40,
      open1_p1_open: 20,
      open1_p2_open: 20,        // Open 1 = 40
      open2_p1_open: 50,
      open2_p2_open: 50,        // Open 2 = 100
    })
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('Open 1'))).toBe(true)
  })

  test('equal totals are valid (>= not >)', () => {
    const result = validateCompositionPoints({
      mixed1_man_mixed: 50,
      mixed1_woman_mixed: 50,   // Mixed 1 = 100
      mixed2_man_mixed: 60,
      mixed2_woman_mixed: 40,   // Mixed 2 = 100
      open1_p1_open: 50,
      open1_p2_open: 50,
      open2_p1_open: 50,
      open2_p2_open: 50,
    })
    expect(result.valid).toBe(true)
  })
})

test.describe('QF seeding', () => {
  const qfSlots = ['qf_a', 'qf_b', 'qf_c', 'qf_d'] as const

  test('all 8 seeds appear exactly once across 4 QF matchups', () => {
    const seeds = qfSlots.flatMap((slot) => QF_SEEDS[slot])
    expect(seeds.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })

  test('seed 1 plays seed 8 (qf_a)', () => {
    expect(QF_SEEDS['qf_a']).toEqual([1, 8])
  })

  test('seed 2 plays seed 7 (qf_c)', () => {
    expect(QF_SEEDS['qf_c']).toEqual([2, 7])
  })
})
