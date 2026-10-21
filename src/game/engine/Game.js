import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../constants.js'
import { Input } from './Input.js'
import { AudioSystem } from './Audio.js'
import { Camera } from './Camera.js'
import { Level } from './Level.js'
import { Player } from '../entities/Player.js'
import { Enemy } from '../entities/Enemy.js'
import { Bullet } from '../entities/Bullet.js'
import { PowerUp } from '../entities/PowerUp.js'
import { Explosion } from '../entities/Explosion.js'
import { drawBubble, drawMenuPortrait } from './Sprites.js'

// 主游戏控制器
export class Game {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.ctx.imageSmoothingEnabled = false
    this.callbacks = callbacks // onStateChange, onScoreChange 等

    this.input = new Input()
    this.audio = new AudioSystem()

    this.state = 'menu' // menu | playing | paused | gameover | victory | levelclear
    this.score = 0
    this.frame = 0
    this.running = false
    this.lastTime = 0
    this.accumulator = 0
    this.fixedDt = 1000 / 60

    this.player = null
    this.enemies = []
    this.bullets = []
    this.powerUps = []
    this.explosions = []
    this.level = null
    this.camera = null

    this.shake = 0
    this.flash = 0 // 闪光弹白光特效帧数
    this.currentLevel = 1 // 当前关卡编号
    this.totalLevels = 3 // 总关卡数
    this.levelClearTimer = 0 // 关卡过渡计时器
    this.bubbles = [] // 水下气泡粒子
    this.godMode = false // 调试用无敌模式
  }

  start() {
    this.input.attach()
    this.audio.init()
    this.running = true
    this.lastTime = performance.now()
    requestAnimationFrame(this.loop)
  }

  stop() {
    this.running = false
    this.input.detach()
    this.audio.stopMusic()
  }

  // 由 Vue 触发: 开始游戏 (从头开始, 第一关)
  startGame() {
    this.audio.init()
    this.audio.resume()
    this.score = 0
    this.frame = 0
    this.currentLevel = 1
    this.loadLevel(1, { fresh: true })
  }

  // 调试用: 直接跳到指定关卡 (通过 URL 参数 ?level=N 触发)
  startAtLevel(levelNum) {
    this.audio.init()
    this.audio.resume()
    this.score = 0
    this.frame = 0
    this.loadLevel(levelNum, { fresh: true })
  }

  // 加载指定关卡 (保留分数和生命用于关卡切换)
  loadLevel(levelNum, opts = {}) {
    this.currentLevel = levelNum
    this.frame = 0
    this.levelClearTimer = 0
    this.level = levelNum === 1
      ? Level.createLevel1()
      : levelNum === 2
        ? Level.createLevel2()
        : Level.createLevel3()
    this.camera = new Camera(this.level.width)
    this.enemies = this.level.data.enemies.map(e =>
      new Enemy(e.x, e.y, e.type, e.opts)
    )
    this.powerUps = this.level.data.powerUps.map(p =>
      new PowerUp(p.x, p.y, p.letter)
    )
    this.bullets = []
    this.explosions = []
    this.bubbles = []
    const ps = this.level.data.playerStart
    const prevLives = (opts.fresh || !this.player) ? 3 : this.player.lives
    const prevScore = (opts.fresh || !this.player) ? this.score : this.score
    const prevWeapon = (opts.fresh || !this.player) ? 'S' : this.player.weapon
    this.player = new Player(ps.x, ps.y)
    this.player.lives = prevLives
    this.player.weapon = prevWeapon
    this.player.invuln = 1800 // 开局无敌30秒 (60fps * 30)
    this.score = prevScore
    this.setState('playing')
    this.audio.startMusic()
    this.emit()
  }

  setState(s) {
    this.state = s
    if (s !== 'playing') this.audio.stopMusic()
    this.emit()
  }

  emit() {
    if (this.callbacks.onUpdate) {
      this.callbacks.onUpdate({
        state: this.state,
        score: this.score,
        lives: this.player ? this.player.lives : 0,
        weapon: this.player ? this.player.weapon : 'N',
        level: this.currentLevel,
        totalLevels: this.totalLevels
      })
    }
  }

  loop = (now) => {
    if (!this.running) return
    const elapsed = now - this.lastTime
    this.lastTime = now
    this.accumulator += elapsed
    // 固定时间步长
    let steps = 0
    while (this.accumulator >= this.fixedDt && steps < 5) {
      this.update()
      this.accumulator -= this.fixedDt
      steps++
    }
    this.render()
    requestAnimationFrame(this.loop)
  }

  update() {
    this.input.beginFrame()
    this.frame++

    if (this.input.state.startPressed) {
      if (this.state === 'playing') this.setState('paused')
      else if (this.state === 'paused') {
        this.setState('playing')
        this.audio.startMusic()
      }
    }

    if (this.state !== 'playing') {
      // 关卡过渡: 等待计时结束后自动进入下一关
      if (this.state === 'levelclear') {
        this.levelClearTimer--
        if (this.levelClearTimer <= 0) {
          this.loadLevel(this.currentLevel + 1)
        }
        return
      }
      if (this.input.state.startPressed && (this.state === 'gameover' || this.state === 'victory')) {
        this.startGame()
      }
      return
    }

    // 玩家更新
    if (this.godMode) this.player.invuln = 999

    // 换弹 (C键/换弹按钮): 在五种武器间循环切换
    if (this.input.state.swapPressed && this.player.alive) {
      this.player.swapWeapon()
      this.audio.swapWeapon()
      this.emit()
    }

    this.player.update(this.input.state, this.level, this.audio, (x, y, vx, vy, c, t, fp, extra) => {
      this.bullets.push(new Bullet(x, y, vx, vy, c, t, fp, extra))
    })

    // 水花音效 (出入水时播放)
    if (this.player.justEnteredWater || this.player.justExitedWater) {
      this.audio.splash()
    }

    // 气泡粒子 (游泳时持续产生)
    if (this.player.swimming && this.player.alive && this.frame % 6 === 0) {
      this.bubbles.push({
        x: this.player.x + Math.random() * this.player.w,
        y: this.player.y + Math.random() * this.player.h,
        vy: -0.4 - Math.random() * 0.6,
        vx: (Math.random() - 0.5) * 0.3,
        size: 1 + Math.random() * 2,
        life: 50 + Math.random() * 20,
        maxLife: 70
      })
    }
    // 更新气泡
    for (const b of this.bubbles) {
      b.y += b.vy
      b.x += b.vx
      b.life--
    }

    // 玩家死亡处理
    if (!this.player.alive && this.player.deathTimer > 90) {
      if (this.player.lives > 0) {
        const ps = this.level.data.playerStart
        // 复活在摄像机左侧安全点 (避免复活在坑里)
        const respawnX = Math.max(ps.x, this.camera.x + 40)
        const respawnY = ps.y
        this.player.reset(respawnX, respawnY)
        this.emit()
      } else {
        this.setState('gameover')
        return
      }
    }

    // 敌人更新
    for (const e of this.enemies) {
      e.update(this.level, this.player, this.audio, (x, y, vx, vy, c, t, fp) => {
        this.bullets.push(new Bullet(x, y, vx, vy, c, t, fp))
      })
    }

    // 处理自毁敌人 (水雷靠近引爆 / 鱼雷撞墙自爆)
    for (const e of this.enemies) {
      if (!e.alive && e.exploded) {
        const big = e.type === 'mine' || e.type === 'torpedo' || e.type === 'deepmech'
        this.explosions.push(new Explosion(e.x + e.w / 2, e.y + e.h / 2, big))
        // 水雷范围伤害
        if (e.type === 'mine') {
          this.shake = 8
          const dx = this.player.x + this.player.w / 2 - (e.x + e.w / 2)
          const dy = this.player.y + this.player.h / 2 - (e.y + e.h / 2)
          if (dx * dx + dy * dy < 40 * 40) {
            if (this.player.takeHit(this.audio)) {
              this.explosions.push(new Explosion(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2, true))
              this.shake = 12
              this.emit()
            }
          }
        }
        e.exploded = false
      }
    }

    // 子弹更新
    for (const b of this.bullets) b.update(this.level)

    // 闪光弹引爆: 清屏 (击杀所有存活敌人)
    for (const b of this.bullets) {
      if (b.dead || !b.fromPlayer || b.type !== 'flash') continue
      b.dead = true
      this.triggerFlash(b.x + b.w / 2, b.y + b.h / 2)
    }

    // 碰撞: 玩家子弹 vs 敌人
    for (const b of this.bullets) {
      if (b.dead || !b.fromPlayer) continue
      // 激光: 按轴截断长度 (撞墙/出界), 单帧瞬时判定
      if (b.type === 'laser') {
        b.length = this.truncateLaser(b)
        if (b.length <= 0) { b.dead = true; continue }
      }
      for (const e of this.enemies) {
        if (!e.alive) continue
        const hit = b.type === 'laser'
          ? this.laserHit(b, e.x, e.y, e.w, e.h)
          : b.type === 'fireball'
            ? this.fireHit(b, e.x, e.y, e.w, e.h)
            : this.aabb(b.x, b.y, b.w, b.h, e.x, e.y, e.w, e.h)
        if (hit) {
          e.takeHit(b.damage, this.audio)
          if (!e.alive) {
            // 大型敌人爆炸更大
            const big = e.type === 'turret' || e.type === 'mech' || e.type === 'octopus' || e.type === 'deepmech' || e.type === 'mine'
            this.explosions.push(new Explosion(e.x + e.w / 2, e.y + e.h / 2, big))
            this.score += e.score
            this.emit()
          }
          // 激光/喷火: 单帧瞬时 (命中不消失, 同帧内可命中多个敌人)
          if (b.type === 'laser' || b.type === 'fireball') continue
          b.dead = true
          break
        }
      }
    }

    // 碰撞: 敌人子弹 vs 玩家
    for (const b of this.bullets) {
      if (b.dead || b.fromPlayer) continue
      if (this.aabb(b.x, b.y, b.w, b.h, this.player.x, this.player.y, this.player.w, this.player.h)) {
        b.dead = true
        if (this.player.takeHit(this.audio)) {
          this.explosions.push(new Explosion(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2, true))
          this.shake = 12
          this.emit()
        }
      }
    }

    // 玩家 vs 敌人接触
    for (const e of this.enemies) {
      if (!e.alive) continue
      if (this.aabb(this.player.x, this.player.y, this.player.w, this.player.h, e.x, e.y, e.w, e.h)) {
        if (this.player.takeHit(this.audio)) {
          this.explosions.push(new Explosion(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2, true))
          this.shake = 12
          this.emit()
        }
      }
    }

    // 道具更新 + 拾取
    for (const p of this.powerUps) {
      p.update(this.level)
      if (!p.dead && this.aabb(this.player.x, this.player.y, this.player.w, this.player.h, p.x, p.y, p.w, p.h)) {
        p.dead = true
        this.player.pickWeapon(p.letter)
        this.score += 500
        this.audio.powerUp()
        this.emit()
      }
    }

    // 爆炸更新
    for (const ex of this.explosions) ex.update()

    // 清理
    this.bullets = this.bullets.filter(b => !b.dead)
    this.enemies = this.enemies.filter(e => e.alive)
    this.powerUps = this.powerUps.filter(p => !p.dead)
    this.explosions = this.explosions.filter(ex => !ex.dead)
    this.bubbles = this.bubbles.filter(b => b.life > 0)

    // 摄像机
    this.camera.update(this.player)

    // 屏幕震动衰减
    if (this.shake > 0) this.shake--
    // 闪光弹白光衰减
    if (this.flash > 0) this.flash--

    // 胜利判定 - 到达终点
    if (this.player.x > this.level.data.goalX) {
      this.score += 1000
      if (this.currentLevel < this.totalLevels) {
        // 还有下一关: 进入关卡过渡状态
        this.setState('levelclear')
        this.levelClearTimer = 180 // 3秒过渡 (60fps)
        this.emit()
      } else {
        // 最后一关: 最终胜利
        this.setState('victory')
        this.emit()
      }
    }
  }

  // 闪光弹引爆: 白光 + 震屏 + 击杀所有存活敌人
  triggerFlash(fx, fy) {
    this.flash = 16
    this.shake = 10
    this.audio.flash()
    this.explosions.push(new Explosion(fx, fy, true))
    for (const e of this.enemies) {
      if (!e.alive) continue
      e.takeHit(99, this.audio)
      if (!e.alive) {
        const big = e.type === 'turret' || e.type === 'mech' || e.type === 'octopus' || e.type === 'deepmech' || e.type === 'mine'
        this.explosions.push(new Explosion(e.x + e.w / 2, e.y + e.h / 2, big))
        this.score += e.score
      }
    }
    this.emit()
  }

  aabb(x1, y1, w1, h1, x2, y2, w2, h2) {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2
  }

  // 激光光束: 沿轴采样, 遇到实心瓦片或出界则截断, 返回有效长度
  truncateLaser(b) {
    const len = b.length
    const step = 8
    const thick = 4
    const cx = b.axis === 'h' ? b.x : b.x + b.w / 2
    const cy = b.axis === 'v' ? b.y : b.y + b.h / 2
    let d = 0
    for (; d <= len; d += step) {
      const px = b.axis === 'h' ? b.x + b.dirSign * d : cx
      const py = b.axis === 'v' ? b.y + b.dirSign * d : cy
      const ww = b.axis === 'h' ? thick : b.w
      const hh = b.axis === 'h' ? b.h : thick
      const tiles = this.level.getSolidTiles(px, py, ww, hh)
      if (tiles.length > 0) return d
      // 出界截断
      if (px < -8 || px > this.level.width + 8 || py < -8 || py > this.level.height + 8) return d
    }
    return len
  }

  // 激光命中检测: 敌人盒与光束线段相交
  laserHit(b, ex, ey, ew, eh) {
    if (b.axis === 'h') {
      const x0 = Math.min(b.x, b.x + b.dirSign * b.length)
      const x1 = Math.max(b.x, b.x + b.dirSign * b.length)
      const y0 = b.y - 2
      const y1 = b.y + b.h + 2
      return ex < x1 && ex + ew > x0 && ey < y1 && ey + eh > y0
    } else {
      const y0 = Math.min(b.y, b.y + b.dirSign * b.length)
      const y1 = Math.max(b.y, b.y + b.dirSign * b.length)
      const x0 = b.x - 2
      const x1 = b.x + b.w + 2
      return ex < x1 && ex + ew > x0 && ey < y1 && ey + eh > y0
    }
  }

  // 喷火命中检测: 敌人盒中心是否在半圆扇形内
  fireHit(b, ex, ey, ew, eh) {
    const ecx = ex + ew / 2
    const ecy = ey + eh / 2
    const dx = ecx - b.x
    const dy = ecy - b.y
    const dist = Math.hypot(dx, dy)
    if (dist > b.radius) return false
    // 扇形角度判定 (允许 ±0.35 弧度容差, 让边缘敌人也能被擦到)
    const ang = Math.atan2(dy, dx)
    let diff = ang - b.angle
    while (diff > Math.PI) diff -= Math.PI * 2
    while (diff < -Math.PI) diff += Math.PI * 2
    return Math.abs(diff) <= b.angle / 2 + 0.35
  }

  render() {
    const ctx = this.ctx
    // 清屏 - 根据关卡主题选择天空色
    let skyColor = COLORS.sky
    if (this.level) {
      if (this.level.theme === 'desert') skyColor = COLORS.desertSky
      else if (this.level.theme === 'underwater') skyColor = COLORS.underwaterSky
    }
    ctx.fillStyle = skyColor
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

    if (this.state === 'menu') {
      this.renderMenu()
      return
    }

    // 屏幕震动
    ctx.save()
    if (this.shake > 0) {
      ctx.translate(
        (Math.random() - 0.5) * this.shake,
        (Math.random() - 0.5) * this.shake
      )
    }

    // 关卡 (传递 frame 用于水下背景动画)
    this.level.draw(ctx, this.camera, this.frame)
    // 道具
    for (const p of this.powerUps) p.draw(ctx, this.camera)
    // 敌人
    for (const e of this.enemies) e.draw(ctx, this.camera)
    // 玩家
    if (this.player) this.player.draw(ctx, this.camera)
    // 子弹
    for (const b of this.bullets) b.draw(ctx, this.camera)
    // 爆炸
    for (const ex of this.explosions) ex.draw(ctx, this.camera)
    // 气泡粒子 (水下关卡)
    for (const b of this.bubbles) {
      const alpha = (b.life / b.maxLife) * 0.5
      drawBubble(ctx, b.x - this.camera.x, b.y - this.camera.y, b.size, alpha)
    }

    ctx.restore()

    // 水下整体蓝色蒙版 (增强水下氛围)
    if (this.level && this.level.theme === 'underwater') {
      ctx.fillStyle = 'rgba(10, 40, 100, 0.12)'
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
    }

    // 闪光弹白光覆盖 (清屏特效)
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255, 255, 230, ${this.flash / 16})`
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
    }

    // 暂停覆盖层
    if (this.state === 'paused') {
      ctx.fillStyle = 'rgba(0,0,0,0.5)'
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
      ctx.fillStyle = '#fcfcfc'
      ctx.font = 'bold 20px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('PAUSE', GAME_WIDTH / 2, GAME_HEIGHT / 2)
      ctx.textAlign = 'left'
    }

    // 关卡过渡覆盖层 (由 canvas 直接绘制, 不阻塞游戏循环)
    if (this.state === 'levelclear') {
      ctx.fillStyle = 'rgba(0,0,0,0.6)'
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
      ctx.fillStyle = '#fcfc28'
      ctx.font = 'bold 22px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('LEVEL CLEAR!', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20)
      ctx.fillStyle = '#fcfcfc'
      ctx.font = 'bold 14px monospace'
      ctx.fillText(`STAGE ${this.currentLevel} 完成`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 8)
      const next = this.currentLevel + 1
      // 闪烁提示
      if (Math.floor(this.frame / 20) % 2 === 0) {
        ctx.fillStyle = '#28e8fc'
        ctx.font = '12px monospace'
        ctx.fillText(`进入第 ${next} 关...`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 32)
      }
      ctx.textAlign = 'left'
    }
  }

  renderMenu() {
    const ctx = this.ctx
    // 渐变背景
    const grad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT)
    grad.addColorStop(0, '#1a0a2a')
    grad.addColorStop(0.5, '#2a1a3a')
    grad.addColorStop(1, '#0a0a1a')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

    // 装饰星星
    for (let i = 0; i < 30; i++) {
      const sx = (i * 37 + this.frame * 0.3) % GAME_WIDTH
      const sy = (i * 23) % 120
      const tw = Math.sin(this.frame * 0.05 + i) * 0.5 + 0.5
      ctx.fillStyle = `rgba(252,252,252,${tw * 0.4})`
      ctx.fillRect(sx, sy, 1, 1)
    }

    // === 女帝像素头像 (大图, 居中上方) ===
    drawMenuPortrait(ctx, GAME_WIDTH / 2 - 28, 30)

    // 标题
    ctx.textAlign = 'center'
    ctx.fillStyle = '#fc2848'
    ctx.font = 'bold 32px monospace'
    ctx.fillText('女帝の试炼', GAME_WIDTH / 2, 130)
    // 副标题
    ctx.fillStyle = '#fcb068'
    ctx.font = 'bold 14px monospace'
    ctx.fillText('BOA HANCOCK', GAME_WIDTH / 2, 150)
    // 装饰线
    ctx.fillStyle = '#fc2848'
    ctx.fillRect(GAME_WIDTH / 2 - 60, 156, 120, 2)
    ctx.fillStyle = '#fcb068'
    ctx.fillRect(GAME_WIDTH / 2 - 40, 159, 80, 1)

    // 闪烁提示
    if (Math.floor(this.frame / 30) % 2 === 0) {
      ctx.fillStyle = '#fcfcfc'
      ctx.font = 'bold 14px monospace'
      ctx.fillText('▶ 点击开始 ◀', GAME_WIDTH / 2, 185)
    }

    // 操作说明
    ctx.fillStyle = '#a8a8c8'
    ctx.font = '10px monospace'
    ctx.fillText('PC: 方向键移动  Z跳跃  X射击  C换弹  Enter暂停', GAME_WIDTH / 2, 215)
    ctx.fillText('手机: 横屏体验最佳 (竖屏自动旋转)', GAME_WIDTH / 2, 230)
    ctx.fillStyle = '#fcd8e8'
    ctx.font = 'bold 10px monospace'
    ctx.fillText('— Made by hanyu —', GAME_WIDTH / 2, 250)
    ctx.textAlign = 'left'
  }

  // 触摸控制接口
  setTouch(action, val) {
    this.input.setTouch(action, val)
  }

  toggleSound() {
    const v = this.audio.toggleSound()
    return v
  }

  toggleMusic() {
    const v = this.audio.toggleMusic()
    return v
  }
}
