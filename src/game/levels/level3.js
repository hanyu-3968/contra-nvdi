import { TILE, GAME_HEIGHT } from '../constants.js'

// 第三关 - 水下场景
// 瓦片类型: 0 空, 13 珊瑚礁地面, 14 锈蚀金属(高地), 15 海藻平台(浮空),
//          16 石柱(遗迹障碍), 17 深海沟(致命)
// 混合移动机制: 地面区域为平台跳跃, 深水区(waterZones)切换为游泳模式
// 布局: 18 行 x 200 列 (3200px 宽)
// 行高 16px: 行 0-9 空中/水中, 行 10 浮空平台, 行 11-12 空气/浅水,
//           行 13 珊瑚地面(平台区) / 空(深水区), 行 14-17 珊瑚/深海沟

const ROWS = GAME_HEIGHT / TILE // 18
const COLS = 200

function emptyRow() { return ' '.repeat(COLS) }

// 基础布局: 平台区有地面(row13-17), 深水区无地面(后fill)
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
  emptyRow(), // 10 (浮空海藻平台层)
  emptyRow(), // 11
  emptyRow(), // 12
  'c'.repeat(COLS), // 13 珊瑚地面 (平台区, 深水区后清除)
  'c'.repeat(COLS), // 14
  'c'.repeat(COLS), // 15
  'c'.repeat(COLS), // 16
  'c'.repeat(COLS)  // 17
]

function buildTiles() {
  const grid = []
  for (let r = 0; r < ROWS; r++) {
    const row = new Array(COLS).fill(0)
    for (let c = 0; c < COLS; c++) {
      const ch = (layout[r] && layout[r][c]) || ' '
      switch (ch) {
        case 'c': row[c] = 13; break // 珊瑚礁
        default: row[c] = 0; break
      }
    }
    grid.push(row)
  }

  const set = (c, r, t) => { if (grid[r] && c >= 0 && c < COLS) grid[r][c] = t }
  const clear = (c, r) => { if (grid[r] && c >= 0 && c < COLS) grid[r][c] = 0 }

  // === 深水区: 清除 row 13-14 的地面, 保留 row 15-17 作为海底 (更低地面) ===
  // 深水区1: cols 30-44 (15列)
  for (let c = 30; c <= 44; c++) {
    clear(c, 13); clear(c, 14)
  }
  // 深水区2: cols 75-94 (20列)
  for (let c = 75; c <= 94; c++) {
    clear(c, 13); clear(c, 14)
  }
  // 深水区3: cols 125-144 (20列, 最长游泳段)
  for (let c = 125; c <= 144; c++) {
    clear(c, 13); clear(c, 14)
  }

  // === 深海沟 (致命坑, 在平台区地面挖坑) ===
  const trenches = [[24, 26], [64, 66], [115, 117], [168, 170]]
  for (const [a, b] of trenches) {
    for (let c = a; c <= b; c++) {
      for (let r = 13; r < ROWS; r++) set(c, r, 17) // 深海沟
    }
  }

  // === 锈蚀金属高地 (高2格, 可跳上) ===
  // 高地1: cols 8-10
  for (let c = 8; c <= 10; c++) { set(c, 11, 14); set(c, 12, 14) }
  // 高地2: cols 52-55
  for (let c = 52; c <= 55; c++) { set(c, 11, 14); set(c, 12, 14) }
  // 高地3: cols 105-108
  for (let c = 105; c <= 108; c++) { set(c, 11, 14); set(c, 12, 14) }
  // 高地4: cols 155-158
  for (let c = 155; c <= 158; c++) { set(c, 11, 14); set(c, 12, 14) }

  // === 浮空海藻平台 (行 10, 可跳跃到达) ===
  const platforms = [[16, 19], [33, 35], [57, 60], [85, 87], [100, 103], [133, 135], [150, 153], [160, 163]]
  for (const [a, b] of platforms) {
    for (let c = a; c <= b; c++) set(c, 10, 15)
  }
  // 深水区中层平台 (行 7, 游泳途中歇脚/障碍)
  const midPlatforms = [[37, 39], [89, 91], [139, 141]]
  for (const [a, b] of midPlatforms) {
    for (let c = a; c <= b; c++) set(c, 7, 15)
  }

  // === 石柱 (古代遗迹, 实体障碍, 行 10-12) ===
  const columns = [20, 48, 82, 112, 148, 165]
  for (const c of columns) {
    set(c, 10, 16); set(c, 11, 16); set(c, 12, 16)
  }

  return grid
}

export const LEVEL3 = {
  tiles: buildTiles(),
  cols: COLS,
  rows: ROWS,
  get width() { return this.cols * TILE },
  get height() { return this.rows * TILE },
  // 水域区域: 玩家中心进入此区域时切换为游泳模式
  // 深水区1: cols 30-44, 深水区2: cols 75-94, 深水区3: cols 125-144
  waterZones: [
    { x: 30 * TILE, y: 0, w: 15 * TILE, h: GAME_HEIGHT },
    { x: 75 * TILE, y: 0, w: 20 * TILE, h: GAME_HEIGHT },
    { x: 125 * TILE, y: 0, w: 20 * TILE, h: GAME_HEIGHT }
  ],
  // 敌人配置 - 水下主题敌人
  // 平台区: frogman(青蛙兵), octopus(章鱼炮台), mine(水雷)
  // 深水区: jellyfish(水母), torpedo(鱼雷), mine(水雷)
  // BOSS区: deepmech(深海机甲)
  enemies: [
    // === 段1 (cols 0-29, 平台区) ===
    { x: 8 * TILE, y: 12 * TILE, type: 'frogman', opts: { dir: -1, range: 40, fireInterval: 120, fireDelay: 30 } },
    { x: 16 * TILE, y: 9 * TILE, type: 'octopus', opts: { fireInterval: 110, fireDelay: 60 } },
    { x: 22 * TILE, y: 12 * TILE, type: 'frogman', opts: { dir: -1, range: 36, fireInterval: 110, fireDelay: 10 } },

    // === 段2 (cols 30-44, 深水区) ===
    { x: 33 * TILE, y: 5 * TILE, type: 'jellyfish', opts: {} },
    { x: 37 * TILE, y: 10 * TILE, type: 'mine', opts: {} },
    { x: 41 * TILE, y: 3 * TILE, type: 'jellyfish', opts: {} },

    // === 段3 (cols 45-74, 平台区) ===
    { x: 48 * TILE, y: 12 * TILE, type: 'frogman', opts: { dir: -1, range: 40, fireInterval: 110, fireDelay: 20 } },
    { x: 57 * TILE, y: 9 * TILE, type: 'octopus', opts: { fireInterval: 100, fireDelay: 40 } },
    { x: 62 * TILE, y: 12 * TILE, type: 'mine', opts: {} },
    { x: 68 * TILE, y: 12 * TILE, type: 'frogman', opts: { dir: -1, range: 36, fireInterval: 100, fireDelay: 0 } },

    // === 段4 (cols 75-94, 深水区, 最长) ===
    { x: 77 * TILE, y: 4 * TILE, type: 'jellyfish', opts: {} },
    { x: 80 * TILE, y: 8 * TILE, type: 'torpedo', opts: { dir: -1, speed: 4.0 } },
    { x: 83 * TILE, y: 11 * TILE, type: 'mine', opts: {} },
    { x: 87 * TILE, y: 3 * TILE, type: 'jellyfish', opts: {} },
    { x: 91 * TILE, y: 9 * TILE, type: 'torpedo', opts: { dir: -1, speed: 4.0 } },

    // === 段5 (cols 95-124, 平台区) ===
    { x: 98 * TILE, y: 12 * TILE, type: 'frogman', opts: { dir: -1, range: 40, fireInterval: 100, fireDelay: 20 } },
    { x: 105 * TILE, y: 9 * TILE, type: 'octopus', opts: { fireInterval: 95, fireDelay: 30 } },
    { x: 112 * TILE, y: 12 * TILE, type: 'frogman', opts: { dir: -1, range: 36, fireInterval: 95, fireDelay: 0 } },
    { x: 120 * TILE, y: 12 * TILE, type: 'mine', opts: {} },
    { x: 122 * TILE, y: 9 * TILE, type: 'octopus', opts: { fireInterval: 90, fireDelay: 50 } },

    // === 段6 (cols 125-144, 深水区, 最难) ===
    { x: 127 * TILE, y: 4 * TILE, type: 'jellyfish', opts: {} },
    { x: 131 * TILE, y: 7 * TILE, type: 'torpedo', opts: { dir: -1, speed: 4.5 } },
    { x: 135 * TILE, y: 10 * TILE, type: 'mine', opts: {} },
    { x: 139 * TILE, y: 5 * TILE, type: 'jellyfish', opts: {} },
    { x: 143 * TILE, y: 8 * TILE, type: 'torpedo', opts: { dir: 1, speed: 4.5 } },

    // === 段7 (cols 145-174, 平台区, 精英) ===
    { x: 148 * TILE, y: 12 * TILE, type: 'frogman', opts: { dir: -1, range: 40, fireInterval: 90, fireDelay: 20 } },
    { x: 155 * TILE, y: 9 * TILE, type: 'octopus', opts: { fireInterval: 85, fireDelay: 30 } },
    { x: 162 * TILE, y: 12 * TILE, type: 'frogman', opts: { dir: -1, range: 36, fireInterval: 85, fireDelay: 0 } },
    { x: 168 * TILE, y: 12 * TILE, type: 'mine', opts: {} },

    // === 段8 (cols 175-199, BOSS区, 平台区) ===
    { x: 185 * TILE, y: 10 * TILE, type: 'deepmech', opts: { dir: -1, range: 80, fireInterval: 140, fireDelay: 60, hp: 8, speed: 0.7 } }
  ],
  // 道具 (放在海藻平台上方)
  powerUps: [
    { x: 17 * TILE, y: 9 * TILE, letter: 'B' },
    { x: 58 * TILE, y: 9 * TILE, letter: 'S' },
    { x: 101 * TILE, y: 9 * TILE, letter: 'L' },
    { x: 151 * TILE, y: 9 * TILE, letter: 'F' },
    { x: 161 * TILE, y: 9 * TILE, letter: 'S' }
  ],
  // 玩家出生点 (地面行13上方)
  playerStart: { x: 2 * TILE, y: 11 * TILE },
  // 终点
  goalX: 196 * TILE,
  // 关卡主题
  theme: 'underwater'
}
