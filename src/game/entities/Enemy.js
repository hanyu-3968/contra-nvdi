import {
  drawSoldier, drawTurret, drawMech,
  drawFrogman, drawMine, drawJellyfish, drawTorpedo, drawOctopus, drawDeepMech
} from '../engine/Sprites.js'

// 敌人类型集合
// 关卡1-2: soldier | turret | mech
// 关卡3(水下): frogman | mine | jellyfish | torpedo | octopus | deepmech
export class Enemy {
  constructor(x, y, type = 'soldier', opts = {}) {
    this.x = x
    this.y = y
    this.type = type
    this.spawnX = x
    this.spawnY = y

    // 尺寸配置
    const sizes = {
      turret: [18, 14], mech: [24, 32],
      frogman: [14, 20], mine: [16, 16], jellyfish: [16, 14],
      torpedo: [18, 10], octopus: [20, 16], deepmech: [28, 36]
    }
    const sz = sizes[type] || [14, 20]
    this.w = sz[0]; this.h = sz[1]

    this.vx = 0
    this.vy = 0
    this.dir = opts.dir || -1
    this.alive = true
    this.frame = 0
    this.fireTimer = opts.fireDelay !== undefined ? opts.fireDelay : 60
    this.fireInterval = opts.fireInterval || 110
    this.patrolRange = opts.range || 48
    this.activated = false
    this.aimAngle = 0
    this.onGround = false
    this.color = opts.color

    // HP 配置
    const hpMap = { turret: 3, mech: 5, frogman: 1, mine: 1, jellyfish: 2, torpedo: 2, octopus: 4, deepmech: 8 }
    this.hp = opts.hp !== undefined ? opts.hp : (hpMap[type] || 1)

    // 分数配置
    const scoreMap = { turret: 300, mech: 500, frogman: 100, mine: 150, jellyfish: 200, torpedo: 250, octopus: 400, deepmech: 1000 }
    this.score = scoreMap[type] || 100

    // 速度配置
    this.speed = opts.speed || (type === 'deepmech' ? 0.6 : type === 'torpedo' ? 4.0 : 0.6)

    // 物理特性
    this.usesGravity = !['mine', 'jellyfish', 'torpedo', 'octopus'].includes(type)
    this.collidesTerrain = type !== 'jellyfish' // 水母可穿过地形

    // 特殊属性
    this.fuseTimer = 0 // 水雷引信
    this.triggered = false // 水雷触发
    this.exploded = false // 爆炸标记 (用于范围伤害)
    this.burstCount = 0 // 深海机甲连发计数
    this.burstTimer = 0 // 连发间隔
  }

  update(level, player, audio, spawnBullet) {
    if (!this.alive) return
    this.frame++

    // 激活检测
    const dist = Math.abs(player.x - this.x)
    const activateRange = this.type === 'deepmech' ? 400 : 280
    if (!this.activated && dist < activateRange) {
      this.activated = true
    }
    // 水雷和鱼雷需要更早激活 (鱼雷从远处冲刺)
    if (!this.activated && (this.type === 'torpedo') && dist < 400) {
      this.activated = true
    }
    if (!this.activated) return

    switch (this.type) {
      case 'turret': this.updateTurret(player, audio, spawnBullet); break
      case 'mech': this.updateMech(level, player, audio, spawnBullet); break
      case 'frogman': this.updateFrogman(level, player, audio, spawnBullet); break
      case 'mine': this.updateMine(player, audio); break
      case 'jellyfish': this.updateJellyfish(player, audio); break
      case 'torpedo': this.updateTorpedo(level, player, audio); break
      case 'octopus': this.updateOctopus(player, audio, spawnBullet); break
      case 'deepmech': this.updateDeepMech(level, player, audio, spawnBullet); break
      default: this.updateSoldier(level, player, audio, spawnBullet); break
    }
  }

  // === 青蛙兵: 类似步兵, 发射鱼雷弹 ===
  updateFrogman(level, player, audio, spawnBullet) {
    this.dir = player.x < this.x ? -1 : 1
    this.vx = this.dir * this.speed
    if (this.x < this.spawnX - this.patrolRange) { this.x = this.spawnX - this.patrolRange; this.dir = 1 }
    else if (this.x > this.spawnX + this.patrolRange) { this.x = this.spawnX + this.patrolRange; this.dir = -1 }

    this.vy += 0.5
    if (this.vy > 8) this.vy = 8
    this.moveX(level)
    this.moveY(level)
    if (this.vx === 0) this.dir = -this.dir

    this.fireTimer--
    if (this.fireTimer <= 0 && Math.abs(player.y - this.y) < 80) {
      const bx = this.dir > 0 ? this.x + this.w : this.x - 6
      const by = this.y + 9
      spawnBullet(bx, by, this.dir * 3.5, 0, '#fc8c28', 'torpedo', false)
      this.fireTimer = this.fireInterval
      audio.machineGun()
    }
  }

  // === 水雷: 静止, 靠近引爆 ===
  updateMine(player, audio) {
    const dx = player.x + player.w / 2 - (this.x + this.w / 2)
    const dy = player.y + player.h / 2 - (this.y + this.h / 2)
    const distSq = dx * dx + dy * dy

    if (!this.triggered && distSq < 40 * 40) {
      this.triggered = true
      this.fuseTimer = 20 // 20帧引信
    }

    if (this.triggered) {
      this.fuseTimer--
      if (this.fuseTimer <= 0) {
        // 引爆
        this.alive = false
        this.exploded = true
        audio.explosion()
      }
    }
  }

  // === 水母: 正弦上下浮动, 接触伤害 ===
  updateJellyfish(player, audio) {
    // 正弦运动 (围绕出生点上下浮动)
    const amplitude = 32
    const targetY = this.spawnY + Math.sin(this.frame * 0.04) * amplitude
    this.y += (targetY - this.y) * 0.1
    // 轻微水平漂移
    this.x += Math.sin(this.frame * 0.02) * 0.3
  }

  // === 鱼雷: 高速直线冲刺, 撞墙消失 ===
  updateTorpedo(level, player, audio) {
    // 朝玩家方向冲刺
    this.vx = this.dir * this.speed
    this.x += this.vx

    // 检测墙壁碰撞
    if (this.collidesTerrain) {
      const tiles = level.getSolidTiles(this.x, this.y, this.w, this.h)
      if (tiles.length > 0) {
        // 撞墙, 自爆
        this.alive = false
        this.exploded = true
        audio.explosion()
      }
    }

    // 超出关卡边界则消失
    if (this.x < -40 || this.x > level.width + 40) {
      this.alive = false
    }
  }

  // === 章鱼炮台: 固定, 3发散射墨弹 ===
  updateOctopus(player, audio, spawnBullet) {
    const cx = this.x + this.w / 2
    const cy = this.y + this.h / 2
    this.aimAngle = Math.atan2(player.y - cy, player.x - cx)

    this.fireTimer--
    if (this.fireTimer <= 0) {
      const speed = 3.5
      const baseAngle = this.aimAngle
      const spreads = [-0.3, 0, 0.3] // 3发散射
      for (const sp of spreads) {
        const a = baseAngle + sp
        const bvx = Math.cos(a) * speed
        const bvy = Math.sin(a) * speed
        spawnBullet(cx + bvx * 3, cy + bvy * 3, bvx, bvy, '#383848', 'ink', false)
      }
      this.fireTimer = this.fireInterval
      audio.shoot()
    }
  }

  // === 深海机甲 (BOSS): 追踪 + 鱼雷连发 ===
  updateDeepMech(level, player, audio, spawnBullet) {
    this.dir = player.x < this.x ? -1 : 1
    const distToPlayer = Math.abs(player.x - this.x)

    // 缓慢追踪
    if (distToPlayer > 120) {
      this.vx = this.dir * this.speed
    } else if (distToPlayer < 80) {
      this.vx = -this.dir * this.speed * 0.5
    } else {
      this.vx = 0
    }

    // 限制巡逻范围 (BOSS活动范围更大)
    const bossRange = this.patrolRange
    if (this.x < this.spawnX - bossRange) { this.x = this.spawnX - bossRange; this.vx = Math.abs(this.vx) }
    else if (this.x > this.spawnX + bossRange) { this.x = this.spawnX + bossRange; this.vx = -Math.abs(this.vx) }

    // 重力
    this.vy += 0.5
    if (this.vy > 8) this.vy = 8
    this.moveX(level)
    this.moveY(level)

    // 瞄准
    const cx = this.x + this.w / 2
    const cy = this.y + 13
    this.aimAngle = Math.atan2(player.y - cy, player.x - cx)
    if (this.aimAngle > 0.6) this.aimAngle = 0.6
    if (this.aimAngle < -1.2) this.aimAngle = -1.2

    // 鱼雷连发 (3连发)
    if (this.burstCount > 0) {
      this.burstTimer--
      if (this.burstTimer <= 0) {
        this.fireTorpedo(audio, spawnBullet)
        this.burstCount--
        this.burstTimer = 8 // 连发间隔
      }
    } else {
      this.fireTimer--
      if (this.fireTimer <= 0 && distToPlayer < 350) {
        this.burstCount = 3 // 开始一轮3连发
        this.burstTimer = 0
        this.fireTimer = this.fireInterval
      }
    }
  }

  fireTorpedo(audio, spawnBullet) {
    const bx = this.dir > 0 ? this.x + this.w + 4 : this.x - 10
    const by = this.y + 13
    const speed = 3.5
    spawnBullet(bx, by, this.dir * speed, 0, '#fc8c28', 'torpedo', false)
    audio.fireball()
  }

  // === 原有敌人 AI ===
  updateSoldier(level, player, audio, spawnBullet) {
    this.dir = player.x < this.x ? -1 : 1
    this.vx = this.dir * this.speed
    if (this.x < this.spawnX - this.patrolRange) { this.x = this.spawnX - this.patrolRange; this.dir = 1 }
    else if (this.x > this.spawnX + this.patrolRange) { this.x = this.spawnX + this.patrolRange; this.dir = -1 }

    this.vy += 0.5
    if (this.vy > 8) this.vy = 8
    this.moveX(level)
    this.moveY(level)
    if (this.vx === 0) this.dir = -this.dir

    this.fireTimer--
    if (this.fireTimer <= 0 && Math.abs(player.y - this.y) < 60) {
      const bx = this.dir > 0 ? this.x + this.w : this.x - 4
      const by = this.y + 9
      spawnBullet(bx, by, this.dir * 3.5, 0, '#fcd028', 'normal', false)
      this.fireTimer = this.fireInterval
      audio.machineGun()
    }
  }

  updateMech(level, player, audio, spawnBullet) {
    this.dir = player.x < this.x ? -1 : 1
    const distToPlayer = Math.abs(player.x - this.x)
    if (distToPlayer > 80) { this.vx = this.dir * this.speed }
    else if (distToPlayer < 50) { this.vx = -this.dir * this.speed * 0.5 }
    else { this.vx = 0 }

    if (this.x < this.spawnX - this.patrolRange) { this.x = this.spawnX - this.patrolRange; this.vx = Math.abs(this.vx) }
    else if (this.x > this.spawnX + this.patrolRange) { this.x = this.spawnX + this.patrolRange; this.vx = -Math.abs(this.vx) }

    this.vy += 0.5
    if (this.vy > 8) this.vy = 8
    this.moveX(level)
    this.moveY(level)

    const cx = this.x + this.w / 2
    const cy = this.y + 13
    this.aimAngle = Math.atan2(player.y - cy, player.x - cx)
    if (this.aimAngle > 0.6) this.aimAngle = 0.6
    if (this.aimAngle < -1.2) this.aimAngle = -1.2

    this.fireTimer--
    if (this.fireTimer <= 0 && distToPlayer < 280 && Math.abs(player.y - this.y) < 120) {
      const bx = this.dir > 0 ? this.x + this.w + 4 : this.x - 8
      const by = this.y + 13
      spawnBullet(bx, by, this.dir * 3, 0, '#fc4c28', 'fireball', false)
      this.fireTimer = this.fireInterval
      audio.fireball()
    }
  }

  updateTurret(player, audio, spawnBullet) {
    const cx = this.x + this.w / 2
    const cy = this.y + 6
    this.aimAngle = Math.atan2(player.y - cy, player.x - cx)
    if (this.aimAngle > 0.5) this.aimAngle = 0.5
    if (this.aimAngle < -1.3) this.aimAngle = -1.3

    this.fireTimer--
    if (this.fireTimer <= 0) {
      const speed = 4
      const bvx = Math.cos(this.aimAngle) * speed
      const bvy = Math.sin(this.aimAngle) * speed
      spawnBullet(cx + bvx * 2, cy + bvy * 2, bvx, bvy, '#fc6428', 'normal', false)
      this.fireTimer = this.fireInterval
      audio.shoot()
    }
  }

  // === 物理移动 ===
  moveX(level) {
    if (!this.collidesTerrain || this.type === 'turret' || this.type === 'octopus' || this.type === 'mine') return
    this.x += this.vx
    const tiles = level.getSolidTiles(this.x, this.y, this.w, this.h)
    for (const t of tiles) {
      if (this.vx > 0) this.x = t.x - this.w
      else if (this.vx < 0) this.x = t.x + t.w
      this.vx = 0
    }
  }

  moveY(level) {
    if (!this.usesGravity) return
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

  takeHit(dmg, audio) {
    this.hp -= dmg
    audio.hit()
    if (this.hp <= 0) {
      this.alive = false
      if (this.type === 'mech' || this.type === 'deepmech') {
        audio.explosion()
        audio.enemyDie()
      } else if (this.type === 'mine') {
        this.exploded = true
        audio.explosion()
      } else {
        audio.enemyDie()
      }
    }
  }

  draw(ctx, camera) {
    const sx = this.x - camera.x
    const sy = this.y - camera.y
    switch (this.type) {
      case 'turret': drawTurret(ctx, sx, sy, this.w, this.h, this.aimAngle); break
      case 'mech': drawMech(ctx, sx, sy, this.w, this.h, this.dir, this.frame, this.aimAngle); break
      case 'frogman': drawFrogman(ctx, sx, sy, this.w, this.h, this.dir, this.frame, this.color); break
      case 'mine': drawMine(ctx, sx, sy, this.w, this.h, this.frame); break
      case 'jellyfish': drawJellyfish(ctx, sx, sy, this.w, this.h, this.frame); break
      case 'torpedo': drawTorpedo(ctx, sx, sy, this.w, this.h, this.dir, this.frame); break
      case 'octopus': drawOctopus(ctx, sx, sy, this.w, this.h, this.frame, this.aimAngle); break
      case 'deepmech': drawDeepMech(ctx, sx, sy, this.w, this.h, this.dir, this.frame, this.aimAngle); break
      default: drawSoldier(ctx, sx, sy, this.w, this.h, this.dir, this.frame, this.color); break
    }
  }
}
