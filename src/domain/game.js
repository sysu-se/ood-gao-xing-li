import { createSudokuFromJSON } from './sudoku.js'

function isSudokuLike(value) {
  return Boolean(
    value &&
      typeof value.getGrid === 'function' &&
      typeof value.guess === 'function' &&
      typeof value.clone === 'function' &&
      typeof value.toJSON === 'function',
  )
}

function normalizeHistory(history = {}) {
  return {
    past: Array.isArray(history.past) ? structuredClone(history.past) : [],
    future: Array.isArray(history.future) ? structuredClone(history.future) : [],
  }
}

class Game {
  constructor(sudoku, history = { past: [], future: [] }) {
    if (!isSudokuLike(sudoku)) {
      throw new TypeError('sudoku must be a Sudoku-like object')
    }

    this.current = sudoku.clone()
    const normalized = normalizeHistory(history)
    this.past = normalized.past
    this.future = normalized.future

    // Explore mode state
    this.isExploring = false
    this.exploreCheckpoint = null
    this.deadEndKeys = new Set()
  }

  snapshotOf(sudoku) {
    return sudoku.toJSON()
  }

  getSudoku() {
    return this.current.clone()
  }

  guess(move) {
    this.past.push(this.snapshotOf(this.current))
    try {
      this.current.guess(move)
      this.future = []
    } catch (err) {
      this.past.pop()
      throw err
    }
  }

  undo() {
    if (this.past.length === 0) return
    this.future.push(this.snapshotOf(this.current))
    const prev = this.past.pop()
    this.current = createSudokuFromJSON(prev)
  }

  redo() {
    if (this.future.length === 0) return
    this.past.push(this.snapshotOf(this.current))
    const next = this.future.pop()
    this.current = createSudokuFromJSON(next)
  }

  canUndo() {
    return this.past.length > 0
  }

  canRedo() {
    return this.future.length > 0
  }

  toJSON() {
    return {
      sudoku: this.snapshotOf(this.current),
      past: structuredClone(this.past),
      future: structuredClone(this.future),
    }
  }

  // ─── Hint ───

  getCandidates(row, col) {
    return this.current.getCandidates(row, col)
  }

  getHint() {
    return this.current.findHint()
  }

  // ─── Explore Mode ───

  startExplore() {
    if (this.isExploring) return
    this.isExploring = true
    this.exploreCheckpoint = {
      sudoku: this.snapshotOf(this.current),
      pastSnapshot: structuredClone(this.past),
    }
  }

  abandonExplore() {
    if (!this.isExploring || !this.exploreCheckpoint) return

    if (!this.current.validate().valid) {
      this.deadEndKeys.add(this._stateKey())
    }

    this.current = createSudokuFromJSON(this.exploreCheckpoint.sudoku)
    this.past = this.exploreCheckpoint.pastSnapshot
    this.future = []
    this.isExploring = false
    this.exploreCheckpoint = null
  }

  commitExplore() {
    if (!this.isExploring) return
    this.isExploring = false
    this.exploreCheckpoint = null
  }

  checkDeadEnd() {
    if (!this.isExploring) return false
    return this.deadEndKeys.has(this._stateKey())
  }

  _stateKey() {
    return JSON.stringify(this.snapshotOf(this.current))
  }

  // eslint-disable-next-line accessor-pairs
  static fromJSON(json) {
    if (!json || typeof json !== 'object') {
      throw new TypeError('json must be an object')
    }
    if (!json.sudoku) {
      throw new TypeError('json.sudoku is required')
    }

    return new Game(
      createSudokuFromJSON(json.sudoku),
      normalizeHistory({ past: json.past, future: json.future }),
    )
  }
}

export function createGame({ sudoku, history = { past: [], future: [] } } = {}) {
  return new Game(sudoku, history)
}

export function createGameFromJSON(json) {
  return Game.fromJSON(json)
}
