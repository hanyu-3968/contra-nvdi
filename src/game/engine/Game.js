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
import { drawBubble } from './Sprites.js'

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
    const prevWeapon = (opts.fresh || !this.player) ? 'N' : this.player.weapon
    this.player = new Player(ps.x, ps.y)
    this.player.lives = prevLives
    this.player.weapon = prevWeapon
    this.player.invuln = 120
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
    this.player.update(this.input.state, this.level, this.audio, (x, y, vx, vy, c, t, fp) => {
      this.bullets.push(new Bullet(x, y, vx, vy, c, t, fp))
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

    // 碰撞: 玩家子弹 vs 敌人
    for (const b of this.bullets) {
      if (b.dead || !b.fromPlayer) continue
      for (const e of this.enemies) {
        if (!e.alive) continue
        if (this.aabb(b.x, b.y, b.w, b.h, e.x, e.y, e.w, e.h)) {
          e.takeHit(b.damage, this.audio)
          if (!e.alive) {
            // 大型敌人爆炸更大
            const big = e.type === 'turret' || e.type === 'mech' || e.type === 'octopus' || e.type === 'deepmech' || e.type === 'mine'
            this.explosions.push(new Explosion(e.x + e.w / 2, e.y + e.h / 2, big))
            this.score += e.score
            this.emit()
          }
          if (b.type !== 'laser') b.dead = true
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

  aabb(x1, y1, w1, h1, x2, y2, w2, h2) {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2
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
    // 标题画面
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
    // 标题
    ctx.fillStyle = '#fc2828'
    ctx.font = 'bold 36px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('CONTRA', GAME_WIDTH / 2, 80)
    ctx.fillStyle = '#fcfc28'
    ctx.font = 'bold 16px monospace'
    ctx.fillText('魂 斗 罗', GAME_WIDTH / 2, 110)
    // 闪烁提示
    if (Math.floor(this.frame / 30) % 2 === 0) {
      ctx.fillStyle = '#fcfcfc'
      ctx.font = '12px monospace'
      ctx.fillText('PRESS START / 点击开始', GAME_WIDTH / 2, 180)
    }
    // 操作说明
    ctx.fillStyle = '#aaa'
    ctx.font = '10px monospace'
    ctx.fillText('PC: 方向键移动  Z跳跃  X射击  Enter暂停', GAME_WIDTH / 2, 220)
    ctx.fillText('手机: 屏幕按钮控制', GAME_WIDTH / 2, 236)
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
