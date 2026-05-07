import { describe, it, expect } from 'vitest'
import { createSudoku } from '../src/domain/sudoku.js'
import { createGame } from '../src/domain/game.js'

describe('Homework 2 Features', () => {
  const grid = [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9]
  ]

  describe('Hint Functionality', () => {
    it('should provide correct candidates for a cell', () => {
      const sudoku = createSudoku(grid)
      const candidates = sudoku.getCandidates(0, 2)
      // Row 0: 5, 3, 7 are present.
      // Col 2: 8 are present.
      // Box 0: 5, 3, 6, 9, 8 are present.
      // Remaining for (0,2): 1, 2, 4
      expect(candidates).toContain(1)
      expect(candidates).toContain(2)
      expect(candidates).toContain(4)
      expect(candidates).not.toContain(3)
      expect(candidates).not.toContain(5)
    })

    it('should find a hint for the board', () => {
      const sudoku = createSudoku(grid)
      const hint = sudoku.findHint()
      expect(hint).not.toBeNull()
      expect(hint).toHaveProperty('row')
      expect(hint).toHaveProperty('col')
      expect(hint).toHaveProperty('candidates')
    })
  })

  describe('Explore Mode', () => {
    it('should start, commit and exit explore mode', () => {
      const sudoku = createSudoku(grid)
      const game = createGame({ sudoku })
      
      expect(game.isExploring).toBe(false)
      game.startExplore()
      expect(game.isExploring).toBe(true)
      
      game.guess({ row: 0, col: 2, value: 1 })
      expect(game.getSudoku().getGrid()[0][2]).toBe(1)
      
      game.commitExplore()
      expect(game.isExploring).toBe(false)
      expect(game.getSudoku().getGrid()[0][2]).toBe(1)
    })

    it('should abandon explore mode and rollback changes', () => {
      const sudoku = createSudoku(grid)
      const game = createGame({ sudoku })
      
      game.startExplore()
      game.guess({ row: 0, col: 2, value: 1 })
      expect(game.getSudoku().getGrid()[0][2]).toBe(1)
      
      game.abandonExplore()
      expect(game.isExploring).toBe(false)
      expect(game.getSudoku().getGrid()[0][2]).toBe(0)
    })

    it('should detect dead ends during exploration', () => {
      const sudoku = createSudoku(grid)
      const game = createGame({ sudoku })
      
      game.startExplore()
      // Make a move that causes a conflict later
      game.guess({ row: 0, col: 2, value: 1 })
      
      // Manually create a conflict to simulate a dead end
      // For example, fill (0, 3) with a conflicting value if possible
      // Actually abandonExplore records dead end if the current board is invalid
      
      // Let's force an invalid state
      game.current.grid[0][3] = 5 // Conflict with (0, 0)
      
      game.abandonExplore()
      
      // Now if we reach that same state again, it should be a dead end
      game.startExplore()
      game.guess({ row: 0, col: 2, value: 1 })
      game.current.grid[0][3] = 5
      
      expect(game.checkDeadEnd()).toBe(true)
    })
  })
})
