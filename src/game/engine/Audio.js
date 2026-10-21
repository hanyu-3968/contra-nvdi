// 音效系统 - 使用 Web Audio API 程序化生成经典 8-bit 音效
export class AudioSystem {
  constructor() {
    this.ctx = null
    this.master = null
    this.enabled = true
    this.musicEnabled = true
    this.musicTimer = null
    this.musicStep = 0
  }

  init() {
    if (this.ctx) return
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext
      this.ctx = new Ctx()
      this.master = this.ctx.createGain()
      this.master.gain.value = 0.35
      this.master.connect(this.ctx.destination)
    } catch (e) {
      this.enabled = false
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  // 通用方波音 (8-bit 风格)
  tone(freq, dur, type = 'square', vol = 0.3, when = 0) {
    if (!this.ctx || !this.enabled) return
    const t = this.ctx.currentTime + when
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t)
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    osc.connect(gain)
    gain.connect(this.master)
    osc.start(t)
    osc.stop(t + dur + 0.02)
  }

  // 扫频音 (跳跃/激光)
  sweep(from, to, dur, type = 'square', vol = 0.3) {
    if (!this.ctx || !this.enabled) return
    const t = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(from, t)
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur)
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    osc.connect(gain)
    gain.connect(this.master)
    osc.start(t)
    osc.stop(t + dur + 0.02)
  }

  // 噪声 (爆炸)
  noise(dur, vol = 0.4, filterFreq = 1000) {
    if (!this.ctx || !this.enabled) return
    const t = this.ctx.currentTime
    const bufferSize = Math.floor(this.ctx.sampleRate * dur)
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
    }
    const src = this.ctx.createBufferSource()
    src.buffer = buffer
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = filterFreq
    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(vol, t)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    src.connect(filter)
    filter.connect(gain)
    gain.connect(this.master)
    src.start(t)
    src.stop(t + dur + 0.02)
  }

  shoot() { this.sweep(880, 440, 0.08, 'square', 0.18) }
  machineGun() { this.tone(620, 0.04, 'square', 0.14) }
  spread() { this.sweep(700, 1200, 0.1, 'square', 0.16) }
  laser() { this.sweep(1400, 300, 0.12, 'sawtooth', 0.18) }
  fireball() { this.sweep(300, 900, 0.14, 'triangle', 0.2) }
  flash() {
    // 闪光弹: 高频"叮" + 快速衰减
    this.tone(2200, 0.25, 'sine', 0.3)
    this.tone(1600, 0.3, 'sine', 0.2, 0.05)
    this.sweep(3000, 200, 0.2, 'square', 0.12)
  }

  jump() { this.sweep(300, 760, 0.18, 'square', 0.22) }

  // 水花/潜水音效 (出入水时播放)
  splash() {
    this.noise(0.18, 0.3, 1200)
    this.sweep(800, 200, 0.15, 'sine', 0.18)
  }

  hit() { this.noise(0.12, 0.3, 800) }

  explosion() {
    this.noise(0.35, 0.45, 600)
    this.tone(120, 0.35, 'sawtooth', 0.2)
  }

  powerUp() {
    const notes = [523, 659, 784, 1047]
    notes.forEach((n, i) => this.tone(n, 0.1, 'square', 0.22, i * 0.08))
  }

  // 换弹音效 (咔哒两声)
  swapWeapon() {
    this.tone(700, 0.05, 'square', 0.18)
    this.tone(440, 0.07, 'square', 0.18, 0.06)
  }

  playerDie() {
    const notes = [523, 440, 349, 262, 196]
    notes.forEach((n, i) => this.tone(n, 0.18, 'square', 0.25, i * 0.14))
  }

  enemyDie() { this.noise(0.18, 0.28, 900) }

  // 简单背景音乐 (循环旋律, 经典进行曲风格)
  startMusic() {
    if (!this.ctx || !this.musicEnabled) return
    this.stopMusic()
    // 旋律 (C大调进行曲风格)
    const melody = [
      330, 330, 330, 392, 440, 392, 330, 294,
      262, 262, 294, 330, 330, 294, 294, 330,
      392, 392, 440, 494, 440, 392, 330, 294,
      330, 392, 330, 262, 262, 330, 294, 262
    ]
    const bass = [131, 131, 165, 165, 196, 196, 165, 165]
    const stepDur = 0.16
    this.musicStep = 0

    const playStep = () => {
      if (!this.ctx || !this.musicEnabled) return
      const i = this.musicStep % melody.length
      const note = melody[i]
      this.tone(note, stepDur * 1.1, 'square', 0.12, 0)
      // 低音每两拍
      if (this.musicStep % 4 === 0) {
        const b = bass[(this.musicStep / 4) % bass.length]
        this.tone(b, stepDur * 2, 'triangle', 0.18, 0)
      }
      // 鼓点
      if (this.musicStep % 2 === 0) this.noise(0.04, 0.12, 400)
      this.musicStep++
      this.musicTimer = setTimeout(playStep, stepDur * 1000)
    }
    playStep()
  }

  stopMusic() {
    if (this.musicTimer) {
      clearTimeout(this.musicTimer)
      this.musicTimer = null
    }
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled
    if (this.musicEnabled) this.startMusic()
    else this.stopMusic()
    return this.musicEnabled
  }

  toggleSound() {
    this.enabled = !this.enabled
    if (!this.enabled) this.stopMusic()
    return this.enabled
  }
}
