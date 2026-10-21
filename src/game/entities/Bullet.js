import { drawBullet } from '../engine/Sprites.js'

// 子弹 - 玩家或敌人发射
export class Bullet {
  constructor(x, y, vx, vy, color, type, fromPlayer, extra = {}) {
    this.x = x
    this.y = y
    this.vx = vx
    this.vy = vy
    this.color = color
    this.type = type // normal | laser | fireball | flash
    this.fromPlayer = fromPlayer
    this.dead = false
    this.life = 0
    // 火球有重力
    this.gravity = type === 'fireball' ? 0.18 : 0
    this.w = type === 'laser' ? 12 : type === 'fireball' ? 6 : type === 'flash' ? 8 : 5
    this.h = type === 'laser' ? 3 : type === 'fireball' ? 6 : type === 'flash' ? 8 : 3
    this.damage = 1
    // 激光光束: 轴向/长度/方向 (由Player计算, Game按轴截断并绘制)
    if (type === 'laser') {
      this.axis = extra.axis // 'h' 水平 | 'v' 垂直
      this.length = extra.length
      this.dirSign = extra.dirSign // 1 正向 | -1 反向
    }
    // 喷火: 半圆火焰 (Game按扇形判定, Sprites绘制)
    if (type === 'fireball') {
      this.radius = extra.radius
      this.angle = extra.angle
    }
    // 闪光弹: 短寿命, 到达后引爆清屏 (不撞墙消失, 由Game处理引爆)
    this.maxLife = type === 'flash' ? 45 : 0
  }

  update(level) {
    this.life++
    // 激光/喷火: 瞬时判定, 不移动 (Game按轴/扇形处理碰撞)
    if (this.type === 'laser' || this.type === 'fireball') return
    // 闪光弹: 短寿命, 到期由Game引爆 (不撞地形消失)
    if (this.type === 'flash') {
      if (this.life >= this.maxLife) this.dead = true
      return
    }
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
    // 激光/喷火: 把光束/扇形参数挂到ctx上供drawBullet使用
    if (this.type === 'laser') ctx.__beamRef = this
    if (this.type === 'fireball') ctx.__flameRef = this
    drawBullet(ctx, this.x - camera.x, this.y - camera.y, this.w, this.h, this.color, this.type)
    if (this.type === 'laser') ctx.__beamRef = null
    if (this.type === 'fireball') ctx.__flameRef = null
  }
}
