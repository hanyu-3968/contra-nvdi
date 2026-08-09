import { drawPowerUp } from '../engine/Sprites.js'

// 道具: 武器升级 (M/S/L/F) 和 1UP
export class PowerUp {
  constructor(x, y, letter) {
    this.x = x
    this.y = y
    this.w = 14
    this.h = 10
    this.letter = letter
    this.dead = false
    this.frame = 0
    this.vy = -1.2
    this.onGround = false
    this.life = 600 // 10秒后消失
  }

  update(level) {
    this.frame++
    this.life--
    if (this.life <= 0) { this.dead = true; return }

    // 漂浮缓降
    if (!this.onGround) {
      this.vy += 0.06
      this.y += this.vy
      const tiles = level.getSolidTiles(this.x, this.y, this.w, this.h)
      for (const t of tiles) {
        if (this.vy > 0) {
          this.y = t.y - this.h
          this.vy = 0
          this.onGround = true
        }
      }
    }
  }

  draw(ctx, camera) {
    drawPowerUp(ctx, this.x - camera.x, this.y - camera.y, this.frame, this.letter)
  }
}
