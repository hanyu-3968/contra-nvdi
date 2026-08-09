import { COLORS, GAME_WIDTH } from '../constants.js'

// 像素绘制工具 - 模仿 8-bit 像素艺术风格
// 使用小方块绘制, 禁用图像平滑以保持像素感

// 绘制单个像素方块
function px(ctx, x, y, w, h, color) {
  ctx.fillStyle = color
  ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(w), Math.ceil(h))
}

// === 玩家绘制 ===
// dir: 1 右, -1 左; state: 'stand'|'run'|'jump'|'crouch'|'die'
// aim: 角度 (弧度); frame: 动画帧
export function drawPlayer(ctx, x, y, w, h, dir, state, aim, frame, weapon) {
  ctx.save()
  // 翻转处理
  const flip = dir < 0
  if (flip) {
    ctx.translate(Math.floor(x + w), 0)
    ctx.scale(-1, 1)
    x = 0
  } else {
    x = Math.floor(x)
  }
  y = Math.floor(y)

  const skin = COLORS.playerSkin
  const suit = COLORS.player
  const hat = COLORS.playerHat
  const boot = '#4a2c10'
  const gun = '#383838'
  const dark = '#1a3a8a'

  const crouch = state === 'crouch'
  const bodyTop = crouch ? y + 6 : y + 2
  const bodyH = crouch ? 8 : 12
  const legY = y + h - 4

  if (state === 'die') {
    // 死亡姿态 - 仰躺
    px(ctx, x + 2, y + 8, 10, 4, suit)
    px(ctx, x + 4, y + 6, 6, 3, skin)
    px(ctx, x + 10, y + 9, 4, 2, gun)
    px(ctx, x + 1, y + 12, 5, 3, boot)
    px(ctx, x + 8, y + 12, 5, 3, boot)
    ctx.restore()
    return
  }

  // 头部
  px(ctx, x + 4, bodyTop, 6, 5, skin)
  // 帽子
  px(ctx, x + 3, bodyTop - 1, 8, 2, hat)
  px(ctx, x + 5, bodyTop, 4, 1, hat)
  // 眼睛
  px(ctx, x + 7, bodyTop + 2, 1, 1, '#000')
  // 身体
  px(ctx, x + 3, bodyTop + 5, 8, bodyH, suit)
  // 腰带
  px(ctx, x + 3, bodyTop + 5 + bodyH - 2, 8, 2, dark)

  // 腿
  const runFrame = state === 'run' ? (Math.floor(frame / 4) % 4) : 0
  if (state === 'jump') {
    // 跳跃时腿弯曲
    px(ctx, x + 3, legY - 4, 3, 4, suit)
    px(ctx, x + 8, legY - 4, 3, 4, suit)
    px(ctx, x + 3, legY, 3, 3, boot)
    px(ctx, x + 8, legY, 3, 3, boot)
  } else if (crouch) {
    px(ctx, x + 2, legY, 5, 3, boot)
    px(ctx, x + 8, legY, 5, 3, boot)
  } else {
    const offsets = [[0, 0], [1, -1], [0, 0], [-1, -1]]
    const [o1, o2] = offsets[runFrame]
    px(ctx, x + 3, legY - 2 + o2, 3, 4, suit)
    px(ctx, x + 8, legY - 2 + o1, 3, 4, suit)
    px(ctx, x + 3, legY + 2 + o2, 3, 2, boot)
    px(ctx, x + 8, legY + 2 + o1, 3, 2, boot)
  }

  // 手臂和枪 - 根据瞄准角度
  // aim: 0=水平向右, 负=向上, 正=向下
  drawArmAndGun(ctx, x, bodyTop, bodyH, state, aim, gun, skin, suit)

  ctx.restore()
}

function drawArmAndGun(ctx, x, bodyTop, bodyH, state, aim, gun, skin, suit) {
  // 简化: 根据 aim 决定手臂方向
  const cx = x + 11
  const cy = bodyTop + 7
  if (state === 'crouch') {
    px(ctx, x + 9, bodyTop + 4, 5, 2, gun)
    px(ctx, x + 13, bodyTop + 4, 2, 2, skin)
    return
  }
  // 默认水平
  let gunAngle = aim
  // 限制
  if (gunAngle > 1.2) gunAngle = 1.2
  if (gunAngle < -1.2) gunAngle = -1.2

  const upAim = gunAngle < -0.5
  const downAim = gunAngle > 0.5

  if (upAim) {
    // 向上举枪
    px(ctx, x + 9, bodyTop - 1, 2, 8, suit)
    px(ctx, x + 9, bodyTop - 3, 3, 3, gun)
  } else if (downAim) {
    px(ctx, x + 11, bodyTop + 6, 5, 2, gun)
    px(ctx, x + 15, bodyTop + 6, 2, 2, skin)
  } else {
    px(ctx, x + 10, bodyTop + 6, 6, 2, gun)
    px(ctx, x + 15, bodyTop + 6, 2, 2, skin)
  }
}

// === 敌人士兵绘制 ===
export function drawSoldier(ctx, x, y, w, h, dir, frame, color = COLORS.enemy) {
  ctx.save()
  const flip = dir < 0
  if (flip) {
    ctx.translate(Math.floor(x + w), 0)
    ctx.scale(-1, 1)
    x = 0
  } else {
    x = Math.floor(x)
  }
  y = Math.floor(y)
  const skin = COLORS.enemySkin
  const boot = '#3a1010'
  const dark = '#6a1818'

  // 头
  px(ctx, x + 4, y + 2, 6, 5, skin)
  // 头盔
  px(ctx, x + 3, y + 1, 8, 2, color)
  px(ctx, x + 4, y, 6, 1, color)
  // 眼
  px(ctx, x + 7, y + 4, 1, 1, '#000')
  // 身体
  px(ctx, x + 3, y + 7, 8, 9, color)
  px(ctx, x + 3, y + 13, 8, 2, dark)
  // 腿
  const f = Math.floor(frame / 6) % 2
  if (f === 0) {
    px(ctx, x + 3, y + 16, 3, 4, boot)
    px(ctx, x + 8, y + 16, 3, 4, boot)
  } else {
    px(ctx, x + 4, y + 16, 3, 4, boot)
    px(ctx, x + 7, y + 16, 3, 4, boot)
  }
  // 枪
  px(ctx, x + 10, y + 9, 5, 2, '#383838')
  ctx.restore()
}

// 炮台
export function drawTurret(ctx, x, y, w, h, aimAngle) {
  x = Math.floor(x); y = Math.floor(y)
  // 底座
  px(ctx, x, y + 6, w, h - 6, COLORS.rockDark)
  px(ctx, x + 1, y + 6, w - 2, 2, COLORS.rock)
  // 炮管
  const cx = x + w / 2
  const cy = y + 6
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(aimAngle)
  px(ctx, 0, -2, 10, 4, '#383838')
  px(ctx, 8, -3, 3, 6, '#282828')
  ctx.restore()
  // 中心
  px(ctx, x + w / 2 - 2, y + 4, 4, 4, '#585858')
}

// === 机甲兵绘制 (沙漠关卡敌人) ===
// dir: 1 右, -1 左; frame: 动画帧; aimAngle: 武器角度
export function drawMech(ctx, x, y, w, h, dir, frame, aimAngle = 0) {
  ctx.save()
  const flip = dir < 0
  if (flip) {
    ctx.translate(Math.floor(x + w), 0)
    ctx.scale(-1, 1)
    x = 0
  } else {
    x = Math.floor(x)
  }
  y = Math.floor(y)

  const body = COLORS.mechBody
  const bodyDark = COLORS.mechBodyDark
  const cockpit = COLORS.mechCockpit
  const joint = COLORS.mechJoint
  const weapon = COLORS.mechWeapon

  // 腿部 (行走动画, 重型机甲双足)
  const legFrame = Math.floor(frame / 8) % 4
  const legOffsets = [[0, 0], [1, 0], [0, 0], [-1, 0]]
  const [lo1, lo2] = legOffsets[legFrame]
  // 左腿
  px(ctx, x + 3, y + 22, 6, 8, bodyDark)
  px(ctx, x + 3 + lo1, y + 22, 6, 2, body)
  px(ctx, x + 2 + lo1, y + 28, 8, 4, joint) // 脚掌
  // 右腿
  px(ctx, x + 15, y + 22, 6, 8, bodyDark)
  px(ctx, x + 15 + lo2, y + 22, 6, 2, body)
  px(ctx, x + 14 + lo2, y + 28, 8, 4, joint)

  // 主体 (金属躯干)
  px(ctx, x + 2, y + 8, 20, 16, body)
  px(ctx, x + 2, y + 8, 20, 2, COLORS.metalPlatform) // 高光
  px(ctx, x + 2, y + 22, 20, 2, bodyDark) // 阴影
  // 装甲分缝
  px(ctx, x + 11, y + 10, 2, 12, bodyDark)
  px(ctx, x + 4, y + 14, 16, 1, bodyDark)
  // 铆钉细节
  px(ctx, x + 4, y + 10, 2, 2, joint)
  px(ctx, x + 18, y + 10, 2, 2, joint)
  px(ctx, x + 4, y + 20, 2, 2, joint)
  px(ctx, x + 18, y + 20, 2, 2, joint)

  // 驾驶舱 (蓝色玻璃, 闪烁)
  const flash = Math.floor(frame / 20) % 2 === 0
  px(ctx, x + 7, y + 4, 10, 6, flash ? cockpit : '#1848a8')
  px(ctx, x + 7, y + 4, 10, 1, '#88c8fc') // 反光
  px(ctx, x + 8, y + 5, 2, 2, '#a8e8fc') // 高光点

  // 头部传感器 (小型)
  px(ctx, x + 10, y + 2, 4, 3, bodyDark)
  px(ctx, x + 11, y + 3, 2, 1, '#fc2828') // 红色单眼

  // 肩部装甲
  px(ctx, x + 0, y + 9, 3, 6, bodyDark)
  px(ctx, x + 21, y + 9, 3, 6, bodyDark)

  // 手臂武器 (重型火炮, 根据瞄准角度)
  const armX = x + 22
  const armY = y + 13
  // 肩关节
  px(ctx, armX - 1, armY - 1, 4, 4, joint)
  // 武器主体
  px(ctx, armX, armY, 10, 5, weapon)
  px(ctx, armX, armY, 10, 1, '#c84848') // 高光
  // 炮口
  px(ctx, armX + 10, armY - 1, 3, 7, joint)
  px(ctx, armX + 13, armY + 1, 1, 3, '#fc6428') // 炮口火光提示

  // 背部排气装置
  px(ctx, x + 8, y + 6, 8, 3, bodyDark)
  px(ctx, x + 9, y + 6, 2, 2, '#c84828') // 排气热色
  px(ctx, x + 13, y + 6, 2, 2, '#c84828')

  ctx.restore()
}

// === 青蛙兵 (水下步兵) ===
export function drawFrogman(ctx, x, y, w, h, dir, frame, color = COLORS.seaweed) {
  ctx.save()
  const flip = dir < 0
  if (flip) {
    ctx.translate(Math.floor(x + w), 0)
    ctx.scale(-1, 1)
    x = 0
  } else {
    x = Math.floor(x)
  }
  y = Math.floor(y)
  const skin = COLORS.enemySkin
  const suit = color
  const dark = COLORS.seaweedDark
  const boot = '#1c3818'

  // 头 (潜水头盔)
  px(ctx, x + 4, y + 2, 6, 5, skin)
  px(ctx, x + 3, y + 1, 8, 2, suit)
  px(ctx, x + 4, y, 6, 1, suit)
  // 面罩
  px(ctx, x + 6, y + 3, 4, 3, '#3898d8')
  px(ctx, x + 7, y + 3, 1, 1, '#a8e8fc') // 反光
  // 眼
  px(ctx, x + 8, y + 4, 1, 1, '#000')
  // 身体 (潜水服)
  px(ctx, x + 3, y + 7, 8, 9, suit)
  px(ctx, x + 3, y + 13, 8, 2, dark)
  // 氧气瓶 (背部)
  px(ctx, x + 1, y + 7, 2, 8, '#585858')
  px(ctx, x + 1, y + 7, 1, 8, '#787878')
  // 腿 (脚蹼)
  const f = Math.floor(frame / 6) % 2
  if (f === 0) {
    px(ctx, x + 3, y + 16, 3, 3, boot)
    px(ctx, x + 8, y + 16, 3, 3, boot)
    px(ctx, x + 2, y + 18, 5, 2, dark) // 脚蹼
    px(ctx, x + 7, y + 18, 5, 2, dark)
  } else {
    px(ctx, x + 4, y + 16, 3, 3, boot)
    px(ctx, x + 7, y + 16, 3, 3, boot)
    px(ctx, x + 3, y + 18, 5, 2, dark)
    px(ctx, x + 8, y + 18, 5, 2, dark)
  }
  // 鱼叉枪
  px(ctx, x + 10, y + 9, 6, 2, '#383838')
  px(ctx, x + 15, y + 8, 2, 4, '#585858')
  ctx.restore()
}

// === 水雷 (静止, 靠近引爆) ===
export function drawMine(ctx, x, y, w, h, frame) {
  x = Math.floor(x); y = Math.floor(y)
  const body = COLORS.mineBody
  const spike = COLORS.mineSpike
  // 闪烁红灯
  const blink = Math.floor(frame / 15) % 2 === 0
  const light = blink ? COLORS.mineLight : '#882828'

  // 主体 (球形)
  px(ctx, x + 4, y + 4, 8, 8, body)
  px(ctx, x + 4, y + 4, 8, 1, '#585858') // 高光
  px(ctx, x + 4, y + 11, 8, 1, '#181818') // 阴影
  // 尖刺 (8方向)
  px(ctx, x + 7, y + 1, 2, 3, spike) // 上
  px(ctx, x + 7, y + 12, 2, 3, spike) // 下
  px(ctx, x + 1, y + 7, 3, 2, spike) // 左
  px(ctx, x + 12, y + 7, 3, 2, spike) // 右
  px(ctx, x + 2, y + 2, 2, 2, spike) // 左上
  px(ctx, x + 12, y + 2, 2, 2, spike) // 右上
  px(ctx, x + 2, y + 12, 2, 2, spike) // 左下
  px(ctx, x + 12, y + 12, 2, 2, spike) // 右下
  // 闪烁灯 (中心)
  px(ctx, x + 7, y + 7, 2, 2, light)
  // 锚链 (底部)
  px(ctx, x + 7, y + 14, 2, 2, '#282828')
}

// === 水母 (上下正弦游动) ===
export function drawJellyfish(ctx, x, y, w, h, frame) {
  x = Math.floor(x); y = Math.floor(y)
  const body = COLORS.jellyfish
  const dark = COLORS.jellyfishDark
  // 触手摆动
  const wave = Math.sin(frame * 0.1) * 2

  // 伞盖 (半圆)
  px(ctx, x + 3, y + 2, 10, 1, dark)
  px(ctx, x + 2, y + 3, 12, 4, body)
  px(ctx, x + 2, y + 3, 12, 1, '#fcd8f8') // 高光
  px(ctx, x + 3, y + 7, 10, 1, dark)
  // 内部纹理
  px(ctx, x + 5, y + 4, 2, 3, dark)
  px(ctx, x + 9, y + 4, 2, 3, dark)
  // 触手 (4条, 摆动)
  for (let i = 0; i < 4; i++) {
    const tx = x + 4 + i * 3
    for (let j = 0; j < 6; j++) {
      const offset = Math.sin(frame * 0.1 + i + j * 0.5) * 1.5
      px(ctx, tx + Math.round(offset), y + 8 + j, 1, 1, dark)
    }
  }
}

// === 鱼雷无人机 (高速直线冲刺) ===
export function drawTorpedo(ctx, x, y, w, h, dir, frame) {
  ctx.save()
  const flip = dir < 0
  if (flip) {
    ctx.translate(Math.floor(x + w), 0)
    ctx.scale(-1, 1)
    x = 0
  } else {
    x = Math.floor(x)
  }
  y = Math.floor(y)
  const body = COLORS.torpedo
  const dark = COLORS.torpedoDark
  const tip = COLORS.torpedoTip

  // 主体 (流线型)
  px(ctx, x + 2, y + 3, 12, 4, body)
  px(ctx, x + 2, y + 3, 12, 1, '#686878') // 高光
  px(ctx, x + 2, y + 6, 12, 1, dark) // 阴影
  // 弹头 (红色尖端)
  px(ctx, x + 14, y + 3, 2, 4, tip)
  px(ctx, x + 16, y + 4, 1, 2, '#fc8c28')
  // 尾翼
  px(ctx, x, y + 2, 2, 1, dark)
  px(ctx, x, y + 7, 2, 1, dark)
  px(ctx, x + 1, y + 3, 1, 4, dark)
  // 推进器火焰 (闪烁)
  const flame = Math.floor(frame / 3) % 2 === 0
  if (flame) {
    px(ctx, x - 2, y + 4, 2, 2, '#fcd028')
    px(ctx, x - 1, y + 4, 1, 2, '#fc6428')
  } else {
    px(ctx, x - 1, y + 4, 1, 2, '#fcd028')
  }
  ctx.restore()
}

// === 章鱼炮台 (固定, 散射墨弹) ===
export function drawOctopus(ctx, x, y, w, h, frame, aimAngle = 0) {
  x = Math.floor(x); y = Math.floor(y)
  const body = COLORS.octopus
  const dark = COLORS.octopusDark

  // 触手 (8条, 底部摆动)
  for (let i = 0; i < 8; i++) {
    const tx = x + 1 + i * 2
    const wave = Math.sin(frame * 0.08 + i * 0.5) * 2
    px(ctx, tx + Math.round(wave * 0.5), y + 10, 1, 4, dark)
    px(ctx, tx + Math.round(wave), y + 13, 1, 3, dark)
  }
  // 头部 (圆球)
  px(ctx, x + 4, y + 1, 12, 2, dark)
  px(ctx, x + 3, y + 2, 14, 8, body)
  px(ctx, x + 3, y + 2, 14, 1, '#c868a8') // 高光
  px(ctx, x + 3, y + 9, 14, 1, dark) // 阴影
  // 眼睛 (大眼, 瞄准方向)
  const eyeX = x + 8 + Math.round(Math.cos(aimAngle) * 1)
  const eyeY = y + 4 + Math.round(Math.sin(aimAngle) * 1)
  px(ctx, eyeX, eyeY, 4, 4, '#fcfcfc')
  px(ctx, eyeX + 1, eyeY + 1, 2, 2, '#000')
  // 嘴 (喷墨口)
  px(ctx, x + 8, y + 8, 4, 2, dark)
  // 闪烁标记
  const blink = Math.floor(frame / 20) % 2 === 0
  if (blink) px(ctx, x + 10, y + 3, 2, 1, '#fcfc28')
}

// === 深海机甲 (关底BOSS, 大型) ===
export function drawDeepMech(ctx, x, y, w, h, dir, frame, aimAngle = 0) {
  ctx.save()
  const flip = dir < 0
  if (flip) {
    ctx.translate(Math.floor(x + w), 0)
    ctx.scale(-1, 1)
    x = 0
  } else {
    x = Math.floor(x)
  }
  y = Math.floor(y)

  const body = COLORS.deepMechBody
  const bodyDark = COLORS.deepMechBodyDark
  const light = COLORS.deepMechLight
  const joint = '#181828'

  // 腿部 (重型双足, 水下推进器)
  const legFrame = Math.floor(frame / 10) % 4
  const legOffsets = [[0, 0], [1, 0], [0, 0], [-1, 0]]
  const [lo1, lo2] = legOffsets[legFrame]
  // 左腿 + 推进器
  px(ctx, x + 4, y + 26, 7, 8, bodyDark)
  px(ctx, x + 4 + lo1, y + 26, 7, 2, body)
  px(ctx, x + 3 + lo1, y + 32, 9, 4, joint)
  // 推进器火焰
  const flame = Math.floor(frame / 3) % 2 === 0
  if (flame) {
    px(ctx, x + 5 + lo1, y + 36, 5, 2, light)
    px(ctx, x + 6 + lo1, y + 36, 3, 2, '#fcfcfc')
  }
  // 右腿 + 推进器
  px(ctx, x + 17, y + 26, 7, 8, bodyDark)
  px(ctx, x + 17 + lo2, y + 26, 7, 2, body)
  px(ctx, x + 16 + lo2, y + 32, 9, 4, joint)
  if (flame) {
    px(ctx, x + 18 + lo2, y + 36, 5, 2, light)
    px(ctx, x + 19 + lo2, y + 36, 3, 2, '#fcfcfc')
  }

  // 主体 (大型躯干)
  px(ctx, x + 2, y + 8, 24, 20, body)
  px(ctx, x + 2, y + 8, 24, 2, light) // 高光
  px(ctx, x + 2, y + 26, 24, 2, bodyDark) // 阴影
  // 装甲分缝
  px(ctx, x + 13, y + 10, 2, 16, bodyDark)
  px(ctx, x + 4, y + 16, 20, 1, bodyDark)
  // 铆钉/指示灯
  px(ctx, x + 5, y + 11, 2, 2, light)
  px(ctx, x + 21, y + 11, 2, 2, light)
  const blink = Math.floor(frame / 15) % 2 === 0
  px(ctx, x + 5, y + 22, 2, 2, blink ? '#fc2828' : '#882828')
  px(ctx, x + 21, y + 22, 2, 2, blink ? '#fc2828' : '#882828')

  // 驾驶舱 (大型蓝色玻璃)
  px(ctx, x + 8, y + 3, 12, 7, blink ? '#2898d8' : '#1858a8')
  px(ctx, x + 8, y + 3, 12, 1, '#88d8fc') // 反光
  px(ctx, x + 9, y + 4, 3, 2, '#a8e8fc') // 高光
  // 驾驶舱框架
  px(ctx, x + 7, y + 2, 14, 1, bodyDark)
  px(ctx, x + 7, y + 9, 14, 1, bodyDark)

  // 头部传感器
  px(ctx, x + 12, y, 4, 3, bodyDark)
  px(ctx, x + 13, y + 1, 2, 1, '#fc2828') // 红色单眼

  // 肩部装甲 (大型)
  px(ctx, x + 0, y + 9, 3, 8, bodyDark)
  px(ctx, x + 25, y + 9, 3, 8, bodyDark)
  px(ctx, x + 0, y + 9, 3, 1, light)
  px(ctx, x + 25, y + 9, 3, 1, light)

  // 双臂武器 (两侧重型火炮)
  // 左臂
  px(ctx, x - 2, y + 12, 4, 4, joint)
  px(ctx, x - 4, y + 13, 6, 3, COLORS.mechWeapon)
  px(ctx, x - 4, y + 13, 6, 1, '#c84848')
  // 右臂
  px(ctx, x + 26, y + 12, 4, 4, joint)
  px(ctx, x + 26, y + 13, 6, 3, COLORS.mechWeapon)
  px(ctx, x + 26, y + 13, 6, 1, '#c84848')

  // 背部鱼雷发射管
  px(ctx, x + 8, y + 5, 12, 3, bodyDark)
  px(ctx, x + 9, y + 5, 2, 3, '#181828')
  px(ctx, x + 13, y + 5, 2, 3, '#181828')
  px(ctx, x + 17, y + 5, 2, 3, '#181828')

  ctx.restore()
}

// 子弹
export function drawBullet(ctx, x, y, w, h, color, type = 'normal') {
  x = Math.floor(x); y = Math.floor(y)
  if (type === 'laser') {
    px(ctx, x, y, w, h, color)
    px(ctx, x - 2, y - 1, w + 4, h + 2, 'rgba(40,232,252,0.3)')
  } else if (type === 'fireball') {
    px(ctx, x, y, w, h, color)
    px(ctx, x - 1, y - 1, w + 2, h + 2, '#fcd028')
    px(ctx, x + 1, y + 1, w - 2, h - 2, '#fcfc88')
  } else if (type === 'ink') {
    // 墨弹 (章鱼炮台)
    px(ctx, x, y, w, h, color)
    px(ctx, x - 1, y - 1, w + 2, h + 2, 'rgba(56,56,72,0.5)')
    px(ctx, x + 1, y + 1, w - 2, h - 2, '#686888')
  } else if (type === 'torpedo') {
    // 鱼雷弹 (青蛙兵/深海机甲)
    px(ctx, x, y, w, h, color)
    px(ctx, x - 1, y - 1, w + 2, h + 2, '#fcd028')
    px(ctx, x + 1, y + 1, w - 2, h - 2, '#fc8c28')
  } else {
    px(ctx, x, y, w, h, color)
  }
}

// 爆炸
export function drawExplosion(ctx, x, y, frame, maxFrame) {
  const t = frame / maxFrame
  const r = 4 + t * 14
  const cx = Math.floor(x)
  const cy = Math.floor(y)
  // 外圈
  ctx.fillStyle = `rgba(252,140,40,${1 - t})`
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()
  // 内圈
  ctx.fillStyle = `rgba(252,252,136,${1 - t})`
  ctx.beginPath()
  ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2)
  ctx.fill()
  // 火星
  if (frame < maxFrame * 0.6) {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + frame * 0.1
      const d = r * 1.1
      px(ctx, cx + Math.cos(a) * d - 1, cy + Math.sin(a) * d - 1, 2, 2, '#fcd028')
    }
  }
}

// 道具
export function drawPowerUp(ctx, x, y, frame, letter) {
  x = Math.floor(x); y = Math.floor(y)
  const bob = Math.sin(frame * 0.1) * 1.5
  y += bob
  // 外框 (闪烁)
  const flash = Math.floor(frame / 8) % 2 === 0
  const border = flash ? '#fcfc28' : '#fc8c28'
  px(ctx, x, y, 14, 10, border)
  px(ctx, x + 1, y + 1, 12, 8, '#2828a8')
  // 字母
  ctx.fillStyle = '#fcfc28'
  ctx.font = 'bold 8px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(letter, x + 7, y + 5)
}

// === 地形瓦片绘制 ===
export function drawTile(ctx, sx, sy, type) {
  switch (type) {
    case 1: // 草地地面
      px(ctx, sx, sy, 16, 16, COLORS.ground)
      px(ctx, sx, sy, 16, 3, COLORS.grass)
      px(ctx, sx, sy + 3, 16, 1, COLORS.grassDark)
      // 纹理
      px(ctx, sx + 2, sy + 6, 2, 2, COLORS.groundDark)
      px(ctx, sx + 10, sy + 9, 3, 2, COLORS.groundDark)
      px(ctx, sx + 5, sy + 12, 2, 2, COLORS.groundDark)
      break
    case 2: // 泥土
      px(ctx, sx, sy, 16, 16, COLORS.ground)
      px(ctx, sx + 1, sy + 2, 3, 2, COLORS.groundDark)
      px(ctx, sx + 9, sy + 6, 3, 2, COLORS.groundDark)
      px(ctx, sx + 4, sy + 11, 2, 2, COLORS.groundDark)
      break
    case 3: // 岩石
      px(ctx, sx, sy, 16, 16, COLORS.rock)
      px(ctx, sx, sy, 16, 2, COLORS.rockDark)
      px(ctx, sx + 3, sy + 4, 4, 3, COLORS.rockDark)
      px(ctx, sx + 10, sy + 8, 3, 4, COLORS.rockDark)
      break
    case 4: // 草丛平台 (可站)
      px(ctx, sx, sy, 16, 5, COLORS.grass)
      px(ctx, sx, sy + 4, 16, 1, COLORS.grassDark)
      px(ctx, sx, sy + 5, 16, 11, COLORS.ground)
      break
    case 5: // 水面 (装饰, 不可站)
      px(ctx, sx, sy, 16, 16, COLORS.water)
      px(ctx, sx, sy + 2, 16, 1, '#5c8ce8')
      px(ctx, sx, sy + 8, 16, 1, '#5c8ce8')
      break
    case 6: // 桥/木板
      px(ctx, sx, sy, 16, 16, '#9c6432')
      px(ctx, sx, sy, 16, 1, '#6c3c18')
      px(ctx, sx, sy + 8, 16, 1, '#6c3c18')
      px(ctx, sx, sy + 15, 16, 1, '#6c3c18')
      break
    case 7: // 沙土地面
      px(ctx, sx, sy, 16, 16, COLORS.sand)
      px(ctx, sx, sy, 16, 2, COLORS.sandLight)
      px(ctx, sx, sy + 2, 16, 1, COLORS.sandDark)
      // 沙纹
      px(ctx, sx + 2, sy + 6, 3, 1, COLORS.sandDark)
      px(ctx, sx + 9, sy + 9, 4, 1, COLORS.sandDark)
      px(ctx, sx + 5, sy + 13, 3, 1, COLORS.sandDark)
      break
    case 8: // 沙丘 (深色沙, 高地)
      px(ctx, sx, sy, 16, 16, COLORS.dune)
      px(ctx, sx, sy, 16, 2, COLORS.sandLight)
      px(ctx, sx, sy + 2, 16, 1, COLORS.sandDark)
      px(ctx, sx + 2, sy + 5, 3, 2, COLORS.sandDark)
      px(ctx, sx + 10, sy + 8, 3, 2, COLORS.sandDark)
      px(ctx, sx + 4, sy + 12, 2, 2, COLORS.sandDark)
      break
    case 9: // 仙人掌 (装饰, 实体可站顶)
      px(ctx, sx, sy, 16, 16, COLORS.sand)
      // 仙人掌主体
      px(ctx, sx + 6, sy + 2, 4, 14, COLORS.cactus)
      px(ctx, sx + 6, sy + 2, 4, 1, COLORS.cactusDark)
      // 分支
      px(ctx, sx + 2, sy + 6, 4, 3, COLORS.cactus)
      px(ctx, sx + 10, sy + 9, 4, 3, COLORS.cactus)
      // 刺点
      px(ctx, sx + 7, sy + 5, 1, 1, COLORS.cactusDark)
      px(ctx, sx + 8, sy + 10, 1, 1, COLORS.cactusDark)
      px(ctx, sx + 3, sy + 7, 1, 1, COLORS.cactusDark)
      px(ctx, sx + 11, sy + 10, 1, 1, COLORS.cactusDark)
      break
    case 10: // 油罐 (金属障碍物)
      px(ctx, sx, sy, 16, 16, COLORS.sand)
      // 油罐主体
      px(ctx, sx + 2, sy + 4, 12, 10, COLORS.oilTank)
      px(ctx, sx + 2, sy + 4, 12, 1, COLORS.metalPlatform) // 顶部高光
      px(ctx, sx + 2, sy + 13, 12, 1, COLORS.oilTankDark) // 底部阴影
      // 罐体环箍
      px(ctx, sx + 2, sy + 8, 12, 1, COLORS.oilTankDark)
      // 顶部阀门
      px(ctx, sx + 6, sy + 2, 4, 2, COLORS.oilTankDark)
      px(ctx, sx + 7, sy + 1, 2, 1, COLORS.oilTankDark)
      // 危险标志
      px(ctx, sx + 7, sy + 9, 2, 2, '#fcfc28')
      break
    case 11: // 金属平台 (可站)
      px(ctx, sx, sy, 16, 16, COLORS.metalPlatformDark)
      px(ctx, sx, sy, 16, 3, COLORS.metalPlatform)
      px(ctx, sx, sy + 2, 16, 1, '#b8b8b8')
      // 支架纹理
      px(ctx, sx + 1, sy + 5, 2, 2, COLORS.metalPlatformDark)
      px(ctx, sx + 7, sy + 5, 2, 2, COLORS.metalPlatformDark)
      px(ctx, sx + 13, sy + 5, 2, 2, COLORS.metalPlatformDark)
      px(ctx, sx + 4, sy + 9, 2, 2, COLORS.metalPlatformDark)
      px(ctx, sx + 10, sy + 9, 2, 2, COLORS.metalPlatformDark)
      px(ctx, sx + 1, sy + 13, 2, 2, COLORS.metalPlatformDark)
      px(ctx, sx + 7, sy + 13, 2, 2, COLORS.metalPlatformDark)
      px(ctx, sx + 13, sy + 13, 2, 2, COLORS.metalPlatformDark)
      break
    case 12: // 流沙坑 (致命, 类似第一关水)
      px(ctx, sx, sy, 16, 16, COLORS.sandDark)
      px(ctx, sx, sy + 2, 16, 1, '#a87828')
      px(ctx, sx, sy + 8, 16, 1, '#a87828')
      // 漩涡纹理
      px(ctx, sx + 3, sy + 5, 3, 1, '#a87828')
      px(ctx, sx + 9, sy + 11, 4, 1, '#a87828')
      break
    case 13: // 珊瑚礁地面 (可站)
      px(ctx, sx, sy, 16, 16, COLORS.coral)
      px(ctx, sx, sy, 16, 2, COLORS.coralBranch)
      px(ctx, sx, sy + 2, 16, 1, COLORS.coralDark)
      // 珊瑚纹理 (分叉)
      px(ctx, sx + 2, sy + 5, 2, 3, COLORS.coralDark)
      px(ctx, sx + 3, sy + 7, 1, 2, COLORS.coralBranch)
      px(ctx, sx + 8, sy + 6, 3, 2, COLORS.coralDark)
      px(ctx, sx + 9, sy + 8, 1, 3, COLORS.coralBranch)
      px(ctx, sx + 12, sy + 10, 2, 2, COLORS.coralDark)
      px(ctx, sx + 5, sy + 12, 2, 2, COLORS.coralDark)
      break
    case 14: // 锈蚀金属 (高地/障碍, 可站)
      px(ctx, sx, sy, 16, 16, COLORS.rustMetal)
      px(ctx, sx, sy, 16, 2, COLORS.rustMetalLight)
      px(ctx, sx, sy + 2, 16, 1, COLORS.rustMetalDark)
      // 锈斑
      px(ctx, sx + 2, sy + 5, 3, 2, COLORS.rustMetalDark)
      px(ctx, sx + 9, sy + 7, 2, 2, '#6c4818')
      px(ctx, sx + 5, sy + 10, 3, 2, COLORS.rustMetalDark)
      px(ctx, sx + 11, sy + 12, 2, 2, '#6c4818')
      // 铆钉
      px(ctx, sx + 1, sy + 3, 1, 1, '#382818')
      px(ctx, sx + 14, sy + 3, 1, 1, '#382818')
      px(ctx, sx + 1, sy + 14, 1, 1, '#382818')
      px(ctx, sx + 14, sy + 14, 1, 1, '#382818')
      break
    case 15: // 海藻平台 (浮空, 可站)
      px(ctx, sx, sy, 16, 16, COLORS.waterDeep)
      px(ctx, sx, sy, 16, 4, COLORS.seaweed)
      px(ctx, sx, sy + 3, 16, 1, COLORS.seaweedDark)
      // 海藻垂下
      px(ctx, sx + 2, sy + 4, 1, 5, COLORS.seaweed)
      px(ctx, sx + 5, sy + 4, 1, 8, COLORS.seaweedDark)
      px(ctx, sx + 8, sy + 4, 1, 6, COLORS.seaweed)
      px(ctx, sx + 11, sy + 4, 1, 9, COLORS.seaweedDark)
      px(ctx, sx + 14, sy + 4, 1, 5, COLORS.seaweed)
      break
    case 16: // 石柱 (古代遗迹, 实体)
      px(ctx, sx, sy, 16, 16, COLORS.stoneColumn)
      px(ctx, sx, sy, 16, 2, COLORS.stoneColumnDark)
      px(ctx, sx, sy + 14, 16, 2, COLORS.stoneColumnDark)
      // 柱身纹理
      px(ctx, sx + 3, sy + 4, 2, 8, COLORS.stoneColumnDark)
      px(ctx, sx + 11, sy + 4, 2, 8, COLORS.stoneColumnDark)
      px(ctx, sx + 6, sy + 6, 4, 1, '#9898b8')
      px(ctx, sx + 6, sy + 10, 4, 1, '#9898b8')
      // 破损
      px(ctx, sx + 1, sy + 8, 2, 2, COLORS.stoneColumnDark)
      px(ctx, sx + 13, sy + 11, 2, 2, COLORS.stoneColumnDark)
      break
    case 17: // 深海沟 (致命, 类似水/流沙)
      px(ctx, sx, sy, 16, 16, COLORS.waterDeep)
      px(ctx, sx, sy + 2, 16, 1, '#081838')
      px(ctx, sx, sy + 8, 16, 1, '#081838')
      // 暗流气泡
      px(ctx, sx + 3, sy + 5, 1, 1, 'rgba(180,220,255,0.3)')
      px(ctx, sx + 10, sy + 10, 1, 1, 'rgba(180,220,255,0.3)')
      px(ctx, sx + 7, sy + 13, 1, 1, 'rgba(180,220,255,0.2)')
      break
    default:
      break
  }
}

// === 水域蒙版 (深水区半透明蓝色覆盖) ===
export function drawWaterOverlay(ctx, zone, camera) {
  const sx = zone.x - camera.x
  const sy = zone.y - camera.y
  if (sx + zone.w < 0 || sx > GAME_WIDTH) return
  ctx.fillStyle = COLORS.waterOverlay
  ctx.fillRect(Math.floor(sx), Math.floor(sy), zone.w, zone.h)
  // 水面波纹 (顶部)
  ctx.fillStyle = 'rgba(120, 180, 240, 0.4)'
  const waveOffset = Math.floor(camera.x * 0.5) % 8
  for (let i = 0; i < zone.w; i += 8) {
    px(ctx, sx + i + waveOffset, sy, 4, 1, 'rgba(120, 180, 240, 0.5)')
    px(ctx, sx + i + waveOffset + 5, sy + 1, 3, 1, 'rgba(100, 160, 220, 0.3)')
  }
}

// === 气泡粒子绘制 ===
export function drawBubble(ctx, x, y, size, alpha) {
  ctx.fillStyle = `rgba(180, 220, 255, ${alpha})`
  ctx.beginPath()
  ctx.arc(Math.floor(x), Math.floor(y), size, 0, Math.PI * 2)
  ctx.fill()
  // 高光
  ctx.fillStyle = `rgba(220, 240, 255, ${alpha * 0.8})`
  ctx.beginPath()
  ctx.arc(Math.floor(x - size * 0.3), Math.floor(y - size * 0.3), size * 0.3, 0, Math.PI * 2)
  ctx.fill()
}

// === 水下背景 (远景沉船/海底岩层 + 光线) ===
export function drawUnderwaterBackground(ctx, cameraX, levelWidth, frame) {
  // 远景海底岩层 (视差 0.2)
  const rockOffset = -cameraX * 0.2
  ctx.fillStyle = '#081848'
  for (let i = 0; i < levelWidth / 200 + 2; i++) {
    const mx = i * 200 + (rockOffset % 200)
    ctx.beginPath()
    ctx.moveTo(mx, 260)
    ctx.lineTo(mx + 40, 200)
    ctx.lineTo(mx + 80, 240)
    ctx.lineTo(mx + 120, 190)
    ctx.lineTo(mx + 160, 230)
    ctx.lineTo(mx + 200, 210)
    ctx.lineTo(mx + 200, 288)
    ctx.lineTo(mx, 288)
    ctx.closePath()
    ctx.fill()
  }
  // 远景沉船 (视差 0.35)
  const shipOffset = -cameraX * 0.35
  ctx.fillStyle = '#102858'
  for (let i = 0; i < levelWidth / 320 + 2; i++) {
    const sx = i * 320 + (shipOffset % 320)
    // 船体
    ctx.beginPath()
    ctx.moveTo(sx, 220)
    ctx.lineTo(sx + 60, 200)
    ctx.lineTo(sx + 100, 220)
    ctx.lineTo(sx + 90, 250)
    ctx.lineTo(sx + 10, 250)
    ctx.closePath()
    ctx.fill()
    // 桅杆 (断裂)
    ctx.fillStyle = '#0c2048'
    ctx.fillRect(sx + 45, 160, 3, 50)
    ctx.fillStyle = '#102858'
  }
  // 光线穿透 (缓慢移动)
  ctx.fillStyle = 'rgba(100, 160, 220, 0.08)'
  const lightOffset = (frame * 0.3) % 60
  for (let i = 0; i < 8; i++) {
    const lx = (i * 80 + lightOffset) % (levelWidth) - cameraX
    if (lx > -20 && lx < GAME_WIDTH + 20) {
      ctx.beginPath()
      ctx.moveTo(lx, 0)
      ctx.lineTo(lx + 30, 0)
      ctx.lineTo(lx + 50, 288)
      ctx.lineTo(lx + 20, 288)
      ctx.closePath()
      ctx.fill()
    }
  }
  // 远景气泡 (视差 0.5)
  const bubbleOffset = (frame * 0.5) % 40
  ctx.fillStyle = 'rgba(180, 220, 255, 0.2)'
  for (let i = 0; i < 15; i++) {
    const bx = (i * 53 - cameraX * 0.5 + bubbleOffset) % GAME_WIDTH
    const by = (288 - (i * 37 + bubbleOffset * 2) % 288)
    const size = 1 + (i % 3)
    ctx.beginPath()
    ctx.arc(bx, by, size, 0, Math.PI * 2)
    ctx.fill()
  }
}

// === 沙漠背景 (远景沙丘/金字塔) ===
export function drawDesertBackground(ctx, cameraX, levelWidth) {
  // 远景沙丘 (视差 0.3) - 深色
  const duneOffset = -cameraX * 0.3
  ctx.fillStyle = COLORS.dune
  for (let i = 0; i < levelWidth / 180 + 2; i++) {
    const mx = i * 180 + (duneOffset % 180)
    ctx.beginPath()
    ctx.moveTo(mx, 210)
    ctx.quadraticCurveTo(mx + 45, 150, mx + 90, 200)
    ctx.quadraticCurveTo(mx + 135, 160, mx + 180, 205)
    ctx.lineTo(mx + 180, 288)
    ctx.lineTo(mx, 288)
    ctx.closePath()
    ctx.fill()
  }
  // 远景金字塔 (视差 0.4)
  const pyramidOffset = -cameraX * 0.4
  ctx.fillStyle = '#c89838'
  for (let i = 0; i < levelWidth / 240 + 2; i++) {
    const px2 = i * 240 + (pyramidOffset % 240)
    ctx.beginPath()
    ctx.moveTo(px2, 210)
    ctx.lineTo(px2 + 50, 120)
    ctx.lineTo(px2 + 100, 210)
    ctx.closePath()
    ctx.fill()
    // 阴影面
    ctx.fillStyle = '#a87828'
    ctx.beginPath()
    ctx.moveTo(px2 + 50, 120)
    ctx.lineTo(px2 + 100, 210)
    ctx.lineTo(px2 + 50, 210)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#c89838'
  }
  // 近景沙丘 (视差 0.6)
  ctx.fillStyle = COLORS.sandDark
  const sandOffset = -cameraX * 0.6
  for (let i = 0; i < levelWidth / 100 + 2; i++) {
    const sx2 = i * 100 + (sandOffset % 100)
    ctx.beginPath()
    ctx.moveTo(sx2, 230)
    ctx.quadraticCurveTo(sx2 + 25, 205, sx2 + 50, 225)
    ctx.quadraticCurveTo(sx2 + 75, 210, sx2 + 100, 230)
    ctx.lineTo(sx2 + 100, 288)
    ctx.lineTo(sx2, 288)
    ctx.closePath()
    ctx.fill()
  }
}

// 背景装饰 (远景树/山)
export function drawBackground(ctx, cameraX, levelWidth) {
  // 天空已由 canvas 背景填充
  // 远山 (视差 0.3)
  const mountainOffset = -cameraX * 0.3
  ctx.fillStyle = '#3c7c1c'
  for (let i = 0; i < levelWidth / 160 + 2; i++) {
    const mx = i * 160 + (mountainOffset % 160)
    ctx.beginPath()
    ctx.moveTo(mx, 200)
    ctx.lineTo(mx + 60, 120)
    ctx.lineTo(mx + 120, 200)
    ctx.closePath()
    ctx.fill()
  }
  // 近树 (视差 0.6)
  ctx.fillStyle = '#1c4c10'
  const treeOffset = -cameraX * 0.6
  for (let i = 0; i < levelWidth / 80 + 2; i++) {
    const tx = i * 80 + (treeOffset % 80)
    ctx.beginPath()
    ctx.arc(tx + 10, 190, 14, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#4c2c08'
    ctx.fillRect(tx + 8, 195, 4, 8)
    ctx.fillStyle = '#1c4c10'
  }
}
