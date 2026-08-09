import { drawExplosion } from '../engine/Sprites.js'

// 爆炸特效
export class Explosion {
  constructor(x, y, big = false) {
    this.x = x
    this.y = y
    this.frame = 0
    this.maxFrame = big ? 36 : 22
    this.dead = false
  }

  update() {
    this.frame++
    if (this.frame >= this.maxFrame) this.dead = true
  }

  draw(ctx, camera) {
    drawExplosion(ctx, this.x - camera.x, this.y - camera.y, this.frame, this.maxFrame)
  }
}
