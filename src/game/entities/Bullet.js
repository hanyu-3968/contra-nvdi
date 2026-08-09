import { drawBullet } from '../engine/Sprites.js'

// 子弹 - 玩家或敌人发射
export class Bullet {
  constructor(x, y, vx, vy, color, type, fromPlayer) {
    this.x = x
    this.y = y
    this.vx = vx
    this.vy = vy
    this.color = color
    this.type = type // normal | laser | fireball
    this.fromPlayer = fromPlayer
    this.dead = false
    this.life = 0
    // 火球有重力
    this.gravity = type === 'fireball' ? 0.18 : 0
    this.w = type === 'laser' ? 12 : type === 'fireball' ? 6 : 5
    this.h = type === 'laser' ? 3 : type === 'fireball' ? 6 : 3
    this.damage = 1
  }

  update(level) {
    this.life++
    this.vy += this.gravity
    this.x += this.vx
    this.y += this.vy

    // 出界
    if (this.x < -20 || this.x > level.width + 20 || this.y > level.height + 20 || this.y < -20) {
      this.dead = true
      return
    }
    // 撞地形
    const tiles = level.getSolidTiles(this.x, this.y, this.w, this.h)
    if (tiles.length > 0) {
      this.dead = true
    }
  }

  draw(ctx, camera) {
    drawBullet(ctx, this.x - camera.x, this.y - camera.y, this.w, this.h, this.color, this.type)
  }
}
