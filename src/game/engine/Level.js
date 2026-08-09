import { TILE } from '../constants.js'
import { LEVEL1 } from '../levels/level1.js'
import { LEVEL2 } from '../levels/level2.js'
import { LEVEL3 } from '../levels/level3.js'
import { drawTile, drawBackground, drawDesertBackground, drawUnderwaterBackground, drawWaterOverlay } from '../engine/Sprites.js'

// 关卡 - 管理瓦片地图, 碰撞查询和绘制
export class Level {
  constructor(data) {
    this.data = data
    this.tiles = data.tiles
    this.cols = data.cols
    this.rows = data.rows
    this.width = data.width
    this.height = data.height
    this.theme = data.theme || 'jungle'
  }

  static createLevel1() {
    return new Level(LEVEL1)
  }

  static createLevel2() {
    return new Level(LEVEL2)
  }

  static createLevel3() {
    return new Level(LEVEL3)
  }

  // 获取瓦片类型 (世界坐标)
  getTileAt(wx, wy) {
    const c = Math.floor(wx / TILE)
    const r = Math.floor(wy / TILE)
    if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) return 0
    return this.tiles[r][c]
  }

  // 判断瓦片是否实体 (可碰撞)
  // 丛林: 1草 2泥 3岩 4草平台 6木板
  // 沙漠: 7沙土 8沙丘 9仙人掌 10油罐 11金属平台 (12流沙为致命, 非实体)
  // 水下: 13珊瑚礁 14锈蚀金属 15海藻平台 16石柱 (17深海沟为致命, 非实体)
  isSolid(tileType) {
    return tileType === 1 || tileType === 2 || tileType === 3 || tileType === 4 || tileType === 6
      || tileType === 7 || tileType === 8 || tileType === 9 || tileType === 10 || tileType === 11
      || tileType === 13 || tileType === 14 || tileType === 15 || tileType === 16
  }

  // 查询与矩形相交的所有实体瓦片
  getSolidTiles(x, y, w, h) {
    const result = []
    const c0 = Math.floor(x / TILE)
    const c1 = Math.floor((x + w - 0.01) / TILE)
    const r0 = Math.floor(y / TILE)
    const r1 = Math.floor((y + h - 0.01) / TILE)
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) continue
        const t = this.tiles[r][c]
        if (this.isSolid(t)) {
          result.push({ x: c * TILE, y: r * TILE, w: TILE, h: TILE, type: t })
        }
      }
    }
    return result
  }

  // 绘制可见瓦片
  draw(ctx, camera, frame = 0) {
    // 背景 (根据主题选择)
    if (this.theme === 'underwater') {
      drawUnderwaterBackground(ctx, camera.x, this.width, frame)
    } else if (this.theme === 'desert') {
      drawDesertBackground(ctx, camera.x, this.width)
    } else {
      drawBackground(ctx, camera.x, this.width)
    }

    const c0 = Math.floor(camera.x / TILE)
    const c1 = Math.ceil((camera.x + 512) / TILE)
    for (let r = 0; r < this.rows; r++) {
      for (let c = c0; c <= c1; c++) {
        if (c < 0 || c >= this.cols) continue
        const t = this.tiles[r][c]
        if (t !== 0) {
          drawTile(ctx, c * TILE - camera.x, r * TILE - camera.y, t)
        }
      }
    }

    // 水域蒙版 (水下关卡深水区半透明蓝色覆盖)
    if (this.data.waterZones) {
      for (const zone of this.data.waterZones) {
        drawWaterOverlay(ctx, zone, camera)
      }
    }

    // 绘制终点旗
    const gx = this.data.goalX - camera.x
    if (gx > -20 && gx < 520) {
      ctx.fillStyle = '#fc2828'
      ctx.fillRect(gx, 6 * TILE, 2, 8 * TILE)
      ctx.beginPath()
      ctx.moveTo(gx + 2, 6 * TILE)
      ctx.lineTo(gx + 18, 6 * TILE + 6)
      ctx.lineTo(gx + 2, 6 * TILE + 12)
      ctx.closePath()
      ctx.fill()
      // 文字 GOAL
      ctx.fillStyle = '#fcfc28'
      ctx.font = 'bold 8px monospace'
      ctx.fillText('GOAL', gx - 2, 5 * TILE)
    }
  }
}
