import {
  PLAYER_SPEED, JUMP_POWER, PLAYER_W, PLAYER_H, PLAYER_H_CROUCH,
  GRAVITY, MAX_FALL, WEAPONS, BULLET_SPEED,
  SWIM_SPEED, SWIM_BUOYANCY, SWIM_FRICTION, SWIM_UP_POWER
} from '../constants.js'
import { drawPlayer } from '../engine/Sprites.js'

export class Player {
  constructor(x, y) {
    this.x = x
    this.y = y
    this.w = PLAYER_W
    this.h = PLAYER_H
    this.vx = 0
    this.vy = 0
    this.dir = 1
    this.onGround = false
    this.crouch = false
    this.aim = 0 // 弧度, 0=水平, 负=上, 正=下
    this.state = 'stand'
    this.frame = 0
    this.alive = true
    this.lives = 3
    this.invuln = 0 // 无敌帧
    this.fireTimer = 0
    this.weapon = 'N'
    this.deathTimer = 0
    this.respawnTimer = 0
    this.spawnX = x
    this.spawnY = y
    // 游泳状态
    this.swimming = false
    this.justEnteredWater = false
    this.justExitedWater = false
  }

  reset(x, y) {
    this.x = x; this.y = y
    this.vx = 0; this.vy = 0
    this.w = PLAYER_W; this.h = PLAYER_H
    this.dir = 1; this.onGround = false; this.crouch = false
    this.aim = 0; this.state = 'stand'; this.frame = 0
    this.alive = true; this.invuln = 120
    this.fireTimer = 0; this.weapon = 'N'
    this.deathTimer = 0; this.respawnTimer = 0
    this.swimming = false
    this.justEnteredWater = false
    this.justExitedWater = false
  }

  // 检测玩家中心是否在水域内
  checkInWater(level) {
    if (!level.data.waterZones) return false
    const cx = this.x + this.w / 2
    const cy = this.y + this.h / 2
    for (const z of level.data.waterZones) {
      if (cx >= z.x && cx <= z.x + z.w && cy >= z.y && cy <= z.y + z.h) {
        return true
      }
    }
    return false
  }

  update(input, level, audio, spawnBullet) {
    this.frame++
    if (!this.alive) {
      this.deathTimer++
      if (this.deathTimer > 90) {
        this.respawnTimer++
      }
      return
    }

    // 水域检测 + 出入水事件
    this.justEnteredWater = false
    this.justExitedWater = false
    const wasSwimming = this.swimming
    this.swimming = this.checkInWater(level)
    if (this.swimming && !wasSwimming) {
      this.justEnteredWater = true
    } else if (!this.swimming && wasSwimming) {
      this.justExitedWater = true
    }

    if (this.invuln > 0) this.invuln--
    if (this.fireTimer > 0) this.fireTimer--

    if (this.swimming) {
      this.updateSwimming(input, level, audio, spawnBullet)
    } else {
      this.updatePlatformer(input, level, audio, spawnBullet)
    }

    // 边界
    if (this.x < 0) this.x = 0
    if (this.x + this.w > level.width) this.x = level.width - this.w
    if (this.y < 0) { this.y = 0; this.vy = 0 }
    if (this.y > level.height + 40) {
      this.die(audio)
    }
  }

  // === 游泳物理 ===
  updateSwimming(input, level, audio, spawnBullet) {
    const movingLeft = input.left && !input.right
    const movingRight = input.right && !input.left
    const movingUp = input.up || input.jump // 跳跃键 = 上浮
    const movingDown = input.down && !input.up

    // 蹲下在水下禁用
    this.crouch = false
    this.h = PLAYER_H

    // 水平移动
    if (movingLeft) { this.vx = -SWIM_SPEED; this.dir = -1 }
    else if (movingRight) { this.vx = SWIM_SPEED; this.dir = 1 }
    else { this.vx *= SWIM_FRICTION; if (Math.abs(this.vx) < 0.1) this.vx = 0 }

    // 垂直移动 (上浮键 / 下潜键 + 浮力)
    if (movingUp) {
      this.vy -= SWIM_UP_POWER * 0.3 // 持续上浮推力
      if (this.vy < -SWIM_SPEED * 1.5) this.vy = -SWIM_SPEED * 1.5
    } else if (movingDown) {
      this.vy += SWIM_UP_POWER * 0.3
      if (this.vy > SWIM_SPEED * 1.5) this.vy = SWIM_SPEED * 1.5
    } else {
      // 无输入时: 浮力 + 阻力
      this.vy += SWIM_BUOYANCY
      this.vy *= SWIM_FRICTION
      if (Math.abs(this.vy) < 0.1) this.vy = 0
    }

    // 八方向瞄准
    if (movingUp && movingLeft) { this.aim = -0.75; this.dir = -1 }
    else if (movingUp && movingRight) { this.aim = -0.75; this.dir = 1 }
    else if (movingDown && movingLeft) { this.aim = 0.75; this.dir = -1 }
    else if (movingDown && movingRight) { this.aim = 0.75; this.dir = 1 }
    else if (movingUp) { this.aim = -1.1 }
    else if (movingDown) { this.aim = 1.1 }
    else { this.aim = 0 }

    // 射击
    if (input.shoot && this.fireTimer <= 0) {
      this.fire(level, audio, spawnBullet)
      const w = WEAPONS[this.weapon]
      this.fireTimer = w.interval
    }

    // 物理移动 + 碰撞
    this.moveX(level)
    this.moveY(level)

    // 状态 (游泳时用 run 表示移动, stand 表示静止)
    if (this.vx !== 0 || this.vy !== 0) this.state = 'run'
    else this.state = 'stand'
  }

  // === 平台跳跃物理 (原有逻辑) ===
  updatePlatformer(input, level, audio, spawnBullet) {
    const movingLeft = input.left && !input.right
    const movingRight = input.right && !input.left
    const aimUp = input.up && !input.down
    const aimDown = input.down && !input.up && !this.onGround

    const wantCrouch = input.down && this.onGround && !movingLeft && !movingRight && !aimUp
    this.crouch = wantCrouch
    this.h = this.crouch ? PLAYER_H_CROUCH : PLAYER_H

    if (this.crouch) {
      this.vx = 0
    } else {
      if (movingLeft) { this.vx = -PLAYER_SPEED; this.dir = -1 }
      else if (movingRight) { this.vx = PLAYER_SPEED; this.dir = 1 }
      else { this.vx = 0 }
    }

    if (input.jumpPressed && this.onGround) {
      this.vy = -JUMP_POWER
      this.onGround = false
      audio.jump()
    }

    if (aimUp) {
      this.aim = -1.1
    } else if (aimDown) {
      this.aim = 1.1
    } else if ((movingLeft || movingRight) && input.up) {
      this.aim = -1.1
    } else {
      this.aim = 0
    }

    if (input.shoot && this.fireTimer <= 0) {
      this.fire(level, audio, spawnBullet)
      const w = WEAPONS[this.weapon]
      this.fireTimer = w.interval
    }

    this.vy += GRAVITY
    if (this.vy > MAX_FALL) this.vy = MAX_FALL

    this.moveX(level)
    this.moveY(level)

    if (!this.onGround) this.state = 'jump'
    else if (this.crouch) this.state = 'crouch'
    else if (this.vx !== 0) this.state = 'run'
    else this.state = 'stand'
  }

  fire(level, audio, spawnBullet) {
    const w = WEAPONS[this.weapon]
    let bx, by, bvx, bvy
    const cx = this.x + this.w / 2
    const cy = this.y + (this.crouch ? 6 : 9)

    const dir = this.dir
    let angle
    if (this.aim === -1.1) {
      angle = -Math.PI / 2
      bx = cx - 1
      by = this.y - 2
    } else if (this.aim === 1.1) {
      angle = Math.PI / 2
      bx = cx - 1
      by = this.y + this.h
    } else if (this.aim === -0.75) {
      // 游泳时斜上瞄准
      angle = -Math.PI / 4
      bx = dir > 0 ? this.x + this.w : this.x - 6
      by = this.y + 2
    } else if (this.aim === 0.75) {
      // 游泳时斜下瞄准
      angle = Math.PI / 4
      bx = dir > 0 ? this.x + this.w : this.x - 6
      by = this.y + this.h - 4
    } else {
      angle = 0
      bx = dir > 0 ? this.x + this.w : this.x - 6
      by = cy
    }

    const baseVx = Math.cos(angle) * w.speed * (angle === 0 ? dir : 1)
    const baseVy = Math.sin(angle) * w.speed

    for (let i = 0; i < w.count; i++) {
      let spreadAngle = 0
      if (w.count > 1) {
        spreadAngle = (i - (w.count - 1) / 2) * w.spread
      }
      const speed = Math.hypot(baseVx, baseVy) || w.speed
      const finalAngle = Math.atan2(baseVy, baseVx) + spreadAngle
      const fvx = Math.cos(finalAngle) * speed
      const fvy = Math.sin(finalAngle) * speed
      const btype = this.weapon === 'L' ? 'laser' : this.weapon === 'F' ? 'fireball' : 'normal'
      spawnBullet(bx, by, fvx, fvy, w.color, btype, true)
    }

    switch (this.weapon) {
      case 'M': audio.machineGun(); break
      case 'S': audio.spread(); break
      case 'L': audio.laser(); break
      case 'F': audio.fireball(); break
      default: audio.shoot(); break
    }
  }

  moveX(level) {
    this.x += this.vx
    const tiles = level.getSolidTiles(this.x, this.y, this.w, this.h)
    for (const t of tiles) {
      if (this.vx > 0) {
        this.x = t.x - this.w
      } else if (this.vx < 0) {
        this.x = t.x + t.w
      }
    }
  }

  moveY(level) {
    this.y += this.vy
    this.onGround = false
    const tiles = level.getSolidTiles(this.x, this.y, this.w, this.h)
    for (const t of tiles) {
      if (this.vy > 0) {
        this.y = t.y - this.h
        this.vy = 0
        this.onGround = true
      } else if (this.vy < 0) {
        this.y = t.y + t.h
        this.vy = 0
      }
    }
  }

  takeHit(audio) {
    if (this.invuln > 0 || !this.alive) return false
    this.die(audio)
    return true
  }

  die(audio) {
    if (!this.alive) return
    this.alive = false
    this.state = 'die'
    this.deathTimer = 0
    this.vy = -6
    this.vx = 0
    this.lives--
    audio.playerDie()
    audio.explosion()
  }

  pickWeapon(letter) {
    this.weapon = letter
  }

  draw(ctx, camera) {
    const sx = this.x - camera.x
    const sy = this.y - camera.y
    if (this.invuln > 0 && Math.floor(this.invuln / 4) % 2 === 0) return
    drawPlayer(ctx, sx, sy, this.w, this.h, this.dir, this.state, this.aim, this.frame, this.weapon)
  }
}
