import { TILE, GAME_HEIGHT } from '../constants.js'

// 关卡 - 瓦片地图 + 实体生成配置
// 瓦片类型: 0 空, 1 草地地面, 2 泥土, 3 岩石, 4 草丛平台, 5 水(致命坑), 6 木板
// 布局: 18 行 x 160 列 (2560px 宽)
// 行高 16px: 行 0-9 空中, 行 10 浮空平台, 行 11-12 空气, 行 13 草地, 行 14-17 泥土

const ROWS = GAME_HEIGHT / TILE // 18
const COLS = 160

function emptyRow() { return ' '.repeat(COLS) }

const layout = [
  emptyRow(), // 0
  emptyRow(), // 1
  emptyRow(), // 2
  emptyRow(), // 3
  emptyRow(), // 4
  emptyRow(), // 5
  emptyRow(), // 6
  emptyRow(), // 7
  emptyRow(), // 8
  emptyRow(), // 9
  emptyRow(), // 10 (浮空平台层, 后面填)
  emptyRow(), // 11
  emptyRow(), // 12 (高地顶部层)
  'g'.repeat(COLS), // 13 草地地面
  'd'.repeat(COLS), // 14 泥土
  'd'.repeat(COLS), // 15
  'd'.repeat(COLS), // 16
  'd'.repeat(COLS)  // 17
]

function buildTiles() {
  const grid = []
  for (let r = 0; r < ROWS; r++) {
    const row = new Array(COLS).fill(0)
    for (let c = 0; c < COLS; c++) {
      const ch = (layout[r] && layout[r][c]) || ' '
      switch (ch) {
        case 'g': row[c] = 1; break
        case 'd': row[c] = 2; break
        case 'r': row[c] = 3; break
        case 'p': row[c] = 4; break
        case 'w': row[c] = 5; break
        case 'b': row[c] = 6; break
        default: row[c] = 0; break
      }
    }
    grid.push(row)
  }

  const set = (c, r, t) => { if (grid[r] && c >= 0 && c < COLS) grid[r][c] = t }

  // === 坑 (水, 致命) - 3格宽, 可跳跃跨越 ===
  const pits = [[28, 30], [70, 72], [115, 117]]
  for (const [a, b] of pits) {
    for (let c = a; c <= b; c++) {
      for (let r = 13; r < ROWS; r++) set(c, r, 5) // 水
    }
  }

  // === 高地 (岩石, 高2格, 可跳上) ===
  // 高地1: cols 44-49
  for (let c = 44; c <= 49; c++) { set(c, 12, 3); set(c, 13, 3) }
  for (let c = 44; c <= 49; c++) set(c, 12, 1) // 顶部草地
  // 高地2: cols 90-96
  for (let c = 90; c <= 96; c++) { set(c, 12, 3); set(c, 13, 3) }
  for (let c = 90; c <= 96; c++) set(c, 12, 1)
  // 高地3 (终点): cols 148-159
  for (let c = 148; c <= 159; c++) { set(c, 12, 3); set(c, 13, 3) }
  for (let c = 148; c <= 159; c++) set(c, 12, 1)

  // === 浮空平台 (行 10, 高处, 可跳跃到达) ===
  const platforms = [[20, 23], [56, 59], [102, 105], [130, 133]]
  for (const [a, b] of platforms) {
    for (let c = a; c <= b; c++) set(c, 10, 4)
  }

  return grid
}

export const LEVEL1 = {
  tiles: buildTiles(),
  cols: COLS,
  rows: ROWS,
  get width() { return this.cols * TILE },
  get height() { return this.rows * TILE },
  // 敌人配置 (y 设为站在地面行13: y=208-20=188)
  enemies: [
    { x: 20 * TILE, y: 11 * TILE, type: 'soldier', opts: { dir: -1, range: 40, fireInterval: 130, fireDelay: 40 } },
    { x: 38 * TILE, y: 12 * TILE, type: 'soldier', opts: { dir: -1, range: 60, fireInterval: 120, fireDelay: 20 } },
    { x: 52 * TILE, y: 12 * TILE, type: 'soldier', opts: { dir: -1, range: 50, fireInterval: 110, fireDelay: 0 } },
    { x: 62 * TILE, y: 12 * TILE, type: 'turret', opts: { fireInterval: 100, fireDelay: 30 } },
    { x: 82 * TILE, y: 12 * TILE, type: 'soldier', opts: { dir: -1, range: 70, fireInterval: 100, fireDelay: 10 } },
    { x: 98 * TILE, y: 11 * TILE, type: 'soldier', opts: { dir: -1, range: 50, fireInterval: 120, fireDelay: 50 } },
    { x: 108 * TILE, y: 12 * TILE, type: 'turret', opts: { fireInterval: 90, fireDelay: 0 } },
    { x: 124 * TILE, y: 12 * TILE, type: 'soldier', opts: { dir: -1, range: 60, fireInterval: 100, fireDelay: 30 } },
    { x: 140 * TILE, y: 12 * TILE, type: 'soldier', opts: { dir: -1, range: 50, fireInterval: 110, fireDelay: 0 } },
    { x: 145 * TILE, y: 12 * TILE, type: 'soldier', opts: { dir: -1, range: 40, fireInterval: 90, fireDelay: 20 } }
  ],
  // 道具 (放在浮空平台上方)
  powerUps: [
    { x: 21 * TILE, y: 9 * TILE, letter: 'B' },
    { x: 57 * TILE, y: 9 * TILE, letter: 'S' },
    { x: 103 * TILE, y: 9 * TILE, letter: 'F' },
    { x: 131 * TILE, y: 9 * TILE, letter: 'L' }
  ],
  // 玩家出生点 (地面行13上方)
  playerStart: { x: 2 * TILE, y: 11 * TILE },
  // 终点
  goalX: 156 * TILE
}
