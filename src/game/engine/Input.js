// 输入系统 - 统一处理键盘和触摸输入
export class Input {
  constructor() {
    // 按键状态: left, right, up, down, jump, shoot, start
    this.state = {
      left: false, right: false, up: false, down: false,
      jump: false, shoot: false, start: false,
      jumpPressed: false, shootPressed: false, startPressed: false
    }
    this._prev = {}
    this._touchMap = {} // touchId -> action
    this._listeners = []
  }

  attach() {
    const onKeyDown = (e) => {
      this._handleKey(e, true)
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault()
      }
    }
    const onKeyUp = (e) => this._handleKey(e, false)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    this._listeners.push(['keydown', onKeyDown], ['keyup', onKeyUp])
  }

  detach() {
    this._listeners.forEach(([ev, fn]) => window.removeEventListener(ev, fn))
    this._listeners = []
  }

  _handleKey(e, val) {
    const k = e.key.toLowerCase()
    const s = this.state
    switch (k) {
      case 'arrowleft': case 'a': s.left = val; break
      case 'arrowright': case 'd': s.right = val; break
      case 'arrowup': case 'w': s.up = val; break
      case 'arrowdown': case 's': s.down = val; break
      case ' ': case 'z': case 'k': s.jump = val; break
      case 'x': case 'j': s.shoot = val; break
      case 'enter': s.start = val; break
      default: break
    }
  }

  // 由触摸控制按钮调用
  setTouch(action, val) {
    if (this.state[action] === val) return
    this.state[action] = val
  }

  // 在每帧开始时调用, 计算边沿触发
  beginFrame() {
    const s = this.state
    const p = this._prev
    s.jumpPressed = s.jump && !p.jump
    s.shootPressed = s.shoot && !p.shoot
    s.startPressed = s.start && !p.start
    p.jump = s.jump
    p.shoot = s.shoot
    p.start = s.start
  }
}
