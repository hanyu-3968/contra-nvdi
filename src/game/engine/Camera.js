import { GAME_WIDTH, GAME_HEIGHT } from '../constants.js'

// 摄像机 - 水平跟随玩家, 限制在关卡范围内
export class Camera {
  constructor(levelWidth) {
    this.x = 0
    this.y = 0
    this.levelWidth = levelWidth
    this.levelHeight = GAME_HEIGHT
  }

  update(target) {
    // 玩家在画面中间偏左
    let desired = target.x - GAME_WIDTH * 0.42
    desired = Math.max(0, Math.min(desired, this.levelWidth - GAME_WIDTH))
    this.x = desired
    this.y = 0
  }

  worldToScreenX(wx) { return wx - this.x }
  worldToScreenY(wy) { return wy - this.y }
}
