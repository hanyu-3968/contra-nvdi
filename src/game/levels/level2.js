import { TILE, GAME_HEIGHT } from '../constants.js'

// 第二关 - 沙漠场景
// 瓦片类型: 0 空, 7 沙土地面, 8 沙丘(高地), 9 仙人掌(装饰), 10 油罐(障碍),
//          11 金属平台(浮空), 12 流沙坑(致命)
// 布局: 18 行 x 180 列 (2880px 宽, 比第一关更长)
// 行高 16px: 行 0-9 空中, 行 10 浮空平台, 行 11-12 空气, 行 13 沙地, 行 14-17 沙土

const ROWS = GAME_HEIGHT / TILE // 18
const COLS = 180

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
  emptyRow(), // 10 (浮空金属平台层, 后面填)
  emptyRow(), // 11
  emptyRow(), // 12 (沙丘顶部层)
  's'.repeat(COLS), // 13 沙土地面
  's'.repeat(COLS), // 14 沙土
  's'.repeat(COLS), // 15
  's'.repeat(COLS), // 16
  's'.repeat(COLS)  // 17
]

function buildTiles() {
  const grid = []
  for (let r = 0; r < ROWS; r++) {
    const row = new Array(COLS).fill(0)
    for (let c = 0; c < COLS; c++) {
      const ch = (layout[r] && layout[r][c]) || ' '
      switch (ch) {
        case 's': row[c] = 7; break // 沙土
        default: row[c] = 0; break
      }
    }
    grid.push(row)
  }

  const set = (c, r, t) => { if (grid[r] && c >= 0 && c < COLS) grid[r][c] = t }

  // === 流沙坑 (致命, 可跳跃跨越) ===
  const pits = [[25, 27], [58, 60], [95, 97], [130, 132]]
  for (const [a, b] of pits) {
    for (let c = a; c <= b; c++) {
      for (let r = 13; r < ROWS; r++) set(c, r, 12) // 流沙
    }
  }

  // === 沙丘高地 (高2格, 可跳上) ===
  // 沙丘1: cols 38-44
  for (let c = 38; c <= 44; c++) { set(c, 12, 8); set(c, 13, 8) }
  for (let c = 38; c <= 44; c++) set(c, 12, 7) // 顶部沙土
  // 沙丘2: cols 72-80
  for (let c = 72; c <= 80; c++) { set(c, 12, 8); set(c, 13, 8) }
  for (let c = 72; c <= 80; c++) set(c, 12, 7)
  // 沙丘3: cols 110-118
  for (let c = 110; c <= 118; c++) { set(c, 12, 8); set(c, 13, 8) }
  for (let c = 110; c <= 118; c++) set(c, 12, 7)
  // 沙丘4 (终点前): cols 150-159
  for (let c = 150; c <= 159; c++) { set(c, 12, 8); set(c, 13, 8) }
  for (let c = 150; c <= 159; c++) set(c, 12, 7)

  // === 浮空金属平台 (行 10, 可跳跃到达) ===
  const platforms = [[16, 19], [48, 51], [88, 91], [122, 125], [140, 143]]
  for (const [a, b] of platforms) {
    for (let c = a; c <= b; c++) set(c, 10, 11)
  }

  // === 仙人掌装饰 (放在地面, 不影响碰撞, 但作为视觉障碍) ===
  const cacti = [12, 34, 65, 85, 105, 128, 145]
  for (const c of cacti) set(c, 12, 9)

  // === 油罐障碍 (放在地面, 实体可站顶) ===
  const oilTanks = [22, 52, 90, 124, 148]
  for (const c of oilTanks) set(c, 12, 10)

  return grid
}

export const LEVEL2 = {
  tiles: buildTiles(),
  cols: COLS,
  rows: ROWS,
  get width() { return this.cols * TILE },
  get height() { return this.rows * TILE },
  // 敌人配置 - 主要为机甲兵 (w=24, h=32, 站在地面行13: y=208-32=176=11*TILE)
  // 巡逻范围(range, 像素) 已避开流沙坑: [25-27][58-60][95-97][130-132]
  enemies: [
    // 前段 (安全区 cols 0-24): 步兵
    { x: 14 * TILE, y: 12 * TILE, type: 'soldier', opts: { dir: -1, range: 40, fireInterval: 130, fireDelay: 30 } },
    // 安全区 cols 28-57: 机甲兵 + 步兵 + 炮台
    { x: 33 * TILE, y: 11 * TILE, type: 'mech', opts: { dir: -1, range: 48, fireInterval: 90, fireDelay: 40, hp: 5, speed: 0.8 } },
    { x: 48 * TILE, y: 12 * TILE, type: 'soldier', opts: { dir: -1, range: 40, fireInterval: 120, fireDelay: 20 } },
    { x: 54 * TILE, y: 12 * TILE, type: 'turret', opts: { fireInterval: 100, fireDelay: 30 } },
    // 安全区 cols 61-94: 机甲兵 + 步兵
    { x: 66 * TILE, y: 11 * TILE, type: 'mech', opts: { dir: -1, range: 48, fireInterval: 85, fireDelay: 0, hp: 5, speed: 0.9 } },
    { x: 78 * TILE, y: 12 * TILE, type: 'soldier', opts: { dir: -1, range: 40, fireInterval: 110, fireDelay: 10 } },
    { x: 88 * TILE, y: 11 * TILE, type: 'mech', opts: { dir: -1, range: 56, fireInterval: 80, fireDelay: 20, hp: 6, speed: 1.0 } },
    // 安全区 cols 98-129: 机甲兵 + 炮台 + 步兵
    { x: 104 * TILE, y: 11 * TILE, type: 'mech', opts: { dir: -1, range: 48, fireInterval: 85, fireDelay: 50, hp: 5, speed: 0.9 } },
    { x: 112 * TILE, y: 12 * TILE, type: 'turret', opts: { fireInterval: 90, fireDelay: 0 } },
    { x: 122 * TILE, y: 12 * TILE, type: 'soldier', opts: { dir: -1, range: 40, fireInterval: 100, fireDelay: 30 } },
    // 安全区 cols 133-179: 精英机甲兵
    { x: 140 * TILE, y: 11 * TILE, type: 'mech', opts: { dir: -1, range: 56, fireInterval: 75, fireDelay: 0, hp: 7, speed: 1.1 } },
    { x: 148 * TILE, y: 12 * TILE, type: 'soldier', opts: { dir: -1, range: 40, fireInterval: 90, fireDelay: 20 } },
    { x: 158 * TILE, y: 11 * TILE, type: 'mech', opts: { dir: -1, range: 48, fireInterval: 80, fireDelay: 40, hp: 6, speed: 1.0 } }
  ],
  // 道具 (放在金属平台上方)
  powerUps: [
    { x: 17 * TILE, y: 9 * TILE, letter: 'M' },
    { x: 49 * TILE, y: 9 * TILE, letter: 'S' },
    { x: 89 * TILE, y: 9 * TILE, letter: 'L' },
    { x: 123 * TILE, y: 9 * TILE, letter: 'F' },
    { x: 141 * TILE, y: 9 * TILE, letter: 'L' }
  ],
  // 玩家出生点 (地面行13上方)
  playerStart: { x: 2 * TILE, y: 11 * TILE },
  // 终点
  goalX: 176 * TILE,
  // 关卡主题 (用于背景和天空色)
  theme: 'desert'
}
