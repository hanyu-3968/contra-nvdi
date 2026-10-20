import { COLORS, GAME_WIDTH } from '../constants.js'

// 像素绘制工具 - 模仿 8-bit 像素艺术风格
// 使用小方块绘制, 禁用图像平滑以保持像素感

// 绘制单个像素方块
function px(ctx, x, y, w, h, color) {
  ctx.fillStyle = color
  ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(w), Math.ceil(h))
}

// === 女帝图片精灵加载 ===
const SPRITE_URLS = {
  stand: new URL('../../assets/sprites/nvdi_standing.png', import.meta.url).href,
  run1: new URL('../../assets/sprites/nvdi_run1.png', import.meta.url).href,
  run2: new URL('../../assets/sprites/nvdi_run2.png', import.meta.url).href,
  jump: new URL('../../assets/sprites/nvdi_jump.png', import.meta.url).href,
  crouch: new URL('../../assets/sprites/nvdi_crouch.png', import.meta.url).href,
  die: new URL('../../assets/sprites/nvdi_die.png', import.meta.url).href,
  portrait: new URL('../../assets/sprites/nvdi_portrait.png', import.meta.url).href,
}

const spriteCache = {}
let spritesLoaded = false
let spritesLoadFailed = false

function loadSprite(url) {
  if (spriteCache[url]) return spriteCache[url]
  const img = new Image()
  img.src = url
  spriteCache[url] = img
  return img
}

function loadAllSprites() {
  if (spritesLoaded || spritesLoadFailed) return
  spritesLoaded = true
  Object.values(SPRITE_URLS).forEach(url => loadSprite(url))
}

// 页面加载时预加载
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAllSprites)
  } else {
    loadAllSprites()
  }
}

// === 玩家绘制 — 女帝 (波雅·汉库克) ===
// 使用图片精灵渲染
// dir: 1 右, -1 左; state: 'stand'|'run'|'jump'|'crouch'|'die'
// aim: 角度 (弧度); frame: 动画帧
export function drawPlayer(ctx, x, y, w, h, dir, state, aim, frame, weapon) {
  // 如果图片加载失败，回退到代码绘制
  const img = getSpritesForState(state, frame)
  if (!img || !img.complete || img.naturalWidth === 0) {
    drawPlayerFallback(ctx, x, y, w, h, dir, state, aim, frame, weapon)
    return
  }

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

  // 绘制精灵图，缩放到玩家尺寸
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(img, x, y, w, h)

  ctx.restore()
}

function getSpritesForState(state, frame) {
  switch (state) {
    case 'run':
      // 跑步动画: 两帧交替
      const runFrame = Math.floor(frame / 6) % 2
      return loadSprite(runFrame === 0 ? SPRITE_URLS.run1 : SPRITE_URLS.run2)
    case 'jump':
      return loadSprite(SPRITE_URLS.jump)
    case 'crouch':
      return loadSprite(SPRITE_URLS.crouch)
    case 'die':
      return loadSprite(SPRITE_URLS.die)
    case 'stand':
    default:
      return loadSprite(SPRITE_URLS.stand)
  }
}

// === 回退: 代码绘制女帝 (当图片不可用时) ===
function drawPlayerFallback(ctx, x, y, w, h, dir, state, aim, frame, weapon) {
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

  // === 女帝调色板 (三层明暗) ===
  const skin = '#fce8d8'
  const skinHi = '#fff8f0'
  const skinLo = '#e8b898'
  const hair = '#1a1a2a'
  const hairHi = '#3a3a4a'
  const hairLo = '#0a0a14'
  const dress = '#d82838'
  const dressHi = '#fc4858'
  const dressLo = '#8c1828'
  const gold = '#fcb068'
  const goldHi = '#fcd898'
  const goldLo = '#bc8838'
  const accent = '#fcd8e8'
  const gun = '#383838'
  const gunHi = '#686868'
  const boot = '#6c1828'
  const bootHi = '#8c2838'
  const outline = '#0a0a14'

  const crouch = state === 'crouch'
  const die = state === 'die'

  if (die) {
    drawPlayerDie(ctx, x, y, w, h, { skin, skinHi, skinLo, hair, hairHi, hairLo, dress, dressHi, dressLo, gold, goldHi, goldLo, accent, gun, gunHi, boot, bootHi, outline })
    ctx.restore()
    return
  }

  const bodyTop = crouch ? y + 7 : y + 1
  const bodyH = crouch ? 9 : 13
  const legY = y + h - 5

  // 长发
  px(ctx, x + 2, bodyTop - 1, 10, 1, hairLo)
  px(ctx, x + 1, bodyTop, 1, 8, hairLo)
  px(ctx, x + 12, bodyTop, 1, 8, hairLo)
  px(ctx, x + 1, bodyTop + 7, 12, 1, hairLo)
  px(ctx, x + 2, bodyTop, 10, 6, hair)
  px(ctx, x + 2, bodyTop + 6, 10, 1, hairHi)
  px(ctx, x + 4, bodyTop + 1, 1, 4, hairHi)
  px(ctx, x + 9, bodyTop + 1, 1, 4, hairHi)

  if (state === 'run') {
    const hf = Math.floor(frame / 4) % 4
    const ho = [0, 1, 0, -1][hf]
    px(ctx, x - 2 + ho, bodyTop + 1, 2, 1, hairLo)
    px(ctx, x - 1 + ho, bodyTop + 2, 2, 5, hair)
    px(ctx, x - 1 + ho, bodyTop + 6, 2, 1, hairLo)
  }
  if (state === 'jump') {
    px(ctx, x + 1, bodyTop - 3, 10, 1, hairLo)
    px(ctx, x + 1, bodyTop - 2, 10, 2, hair)
    px(ctx, x + 3, bodyTop - 2, 1, 1, hairHi)
    px(ctx, x + 8, bodyTop - 2, 1, 1, hairHi)
  }

  // 头部
  px(ctx, x + 4, bodyTop, 6, 1, skinLo)
  px(ctx, x + 3, bodyTop + 1, 1, 4, skinLo)
  px(ctx, x + 10, bodyTop + 1, 1, 4, skinLo)
  px(ctx, x + 4, bodyTop + 5, 6, 1, skinLo)
  px(ctx, x + 4, bodyTop + 1, 6, 4, skin)
  px(ctx, x + 5, bodyTop + 1, 1, 1, skinHi)

  // 刘海
  px(ctx, x + 3, bodyTop - 1, 8, 1, hairLo)
  px(ctx, x + 3, bodyTop, 2, 2, hair)
  px(ctx, x + 8, bodyTop, 2, 2, hair)
  px(ctx, x + 5, bodyTop, 3, 1, hairHi)
  px(ctx, x + 3, bodyTop + 1, 1, 4, hair)
  px(ctx, x + 10, bodyTop + 1, 1, 4, hair)
  px(ctx, x + 3, bodyTop + 5, 1, 1, hairLo)
  px(ctx, x + 10, bodyTop + 5, 1, 1, hairLo)

  // 眼睛
  px(ctx, x + 5, bodyTop + 2, 2, 1, hair)
  px(ctx, x + 9, bodyTop + 2, 2, 1, hair)
  px(ctx, x + 6, bodyTop + 2, 1, 1, '#000')
  px(ctx, x + 9, bodyTop + 2, 1, 1, '#000')
  px(ctx, x + 6, bodyTop + 3, 1, 1, skinLo)
  px(ctx, x + 9, bodyTop + 3, 1, 1, skinLo)
  px(ctx, x + 7, bodyTop + 4, 2, 1, '#c84868')
  px(ctx, x + 5, bodyTop + 3, 1, 1, '#fc8888')
  px(ctx, x + 10, bodyTop + 3, 1, 1, '#fc8888')

  // 身体
  px(ctx, x + 2, bodyTop + 5, 1, bodyH, dressLo)
  px(ctx, x + 11, bodyTop + 5, 1, bodyH, dressLo)
  px(ctx, x + 2, bodyTop + 5 + bodyH, 10, 1, dressLo)
  px(ctx, x + 3, bodyTop + 5, 8, bodyH, dress)
  px(ctx, x + 3, bodyTop + 5, 8, 1, dressHi)
  px(ctx, x + 5, bodyTop + 5, 4, 1, skin)
  px(ctx, x + 6, bodyTop + 6, 2, 1, skinLo)
  px(ctx, x + 4, bodyTop + 7, 1, 1, accent)
  px(ctx, x + 9, bodyTop + 9, 1, 1, accent)
  px(ctx, x + 6, bodyTop + 8, 1, 1, accent)
  px(ctx, x + 2, bodyTop + 5 + bodyH - 3, 10, 1, goldLo)
  px(ctx, x + 3, bodyTop + 5 + bodyH - 2, 8, 2, gold)
  px(ctx, x + 3, bodyTop + 5 + bodyH - 2, 8, 1, goldHi)
  px(ctx, x + 2, bodyTop + 5 + bodyH, 10, 1, goldLo)
  px(ctx, x + 5, bodyTop + 5 + bodyH - 1, 1, 1, goldLo)
  px(ctx, x + 8, bodyTop + 5 + bodyH - 1, 1, 1, goldLo)

  // 腿
  const runFrame = state === 'run' ? (Math.floor(frame / 4) % 4) : 0
  if (state === 'jump') {
    px(ctx, x + 1, legY - 7, 12, 1, dressLo)
    px(ctx, x + 1, legY - 6, 12, 3, dress)
    px(ctx, x + 2, legY - 6, 10, 1, dressHi)
    px(ctx, x + 3, legY - 3, 1, 3, dressLo)
    px(ctx, x + 4, legY - 3, 2, 3, skin)
    px(ctx, x + 8, legY - 3, 2, 3, skin)
    px(ctx, x + 10, legY - 3, 1, 3, dressLo)
    px(ctx, x + 3, legY, 3, 1, boot)
    px(ctx, x + 3, legY + 1, 3, 3, boot)
    px(ctx, x + 3, legY + 1, 3, 1, bootHi)
    px(ctx, x + 8, legY, 3, 1, boot)
    px(ctx, x + 8, legY + 1, 3, 3, boot)
    px(ctx, x + 8, legY + 1, 3, 1, bootHi)
  } else if (crouch) {
    px(ctx, x + 0, legY - 3, 14, 1, dressLo)
    px(ctx, x + 1, legY - 2, 12, 3, dress)
    px(ctx, x + 1, legY - 2, 12, 1, dressHi)
    px(ctx, x + 2, legY + 1, 4, 1, boot)
    px(ctx, x + 2, legY + 2, 4, 2, boot)
    px(ctx, x + 2, legY + 2, 4, 1, bootHi)
    px(ctx, x + 8, legY + 1, 4, 1, boot)
    px(ctx, x + 8, legY + 2, 4, 2, boot)
    px(ctx, x + 8, legY + 2, 4, 1, bootHi)
  } else {
    const offsets = [[0, 0], [1, -1], [0, 0], [-1, -1]]
    const [o1, o2] = offsets[runFrame]
    px(ctx, x + 1, legY - 5, 12, 1, dressLo)
    px(ctx, x + 2, legY - 4, 10, 3, dress)
    px(ctx, x + 2, legY - 4, 10, 1, dressHi)
    px(ctx, x + 3, legY - 1 + o2, 3, 3, skin)
    px(ctx, x + 3, legY - 1 + o2, 1, 3, skinLo)
    px(ctx, x + 8, legY - 1 + o1, 3, 3, skin)
    px(ctx, x + 8, legY - 1 + o1, 1, 3, skinLo)
    px(ctx, x + 3, legY + 2 + o2, 3, 1, boot)
    px(ctx, x + 3, legY + 3 + o2, 3, 2, boot)
    px(ctx, x + 3, legY + 3 + o2, 3, 1, bootHi)
    px(ctx, x + 8, legY + 2 + o1, 3, 1, boot)
    px(ctx, x + 8, legY + 3 + o1, 3, 2, boot)
    px(ctx, x + 8, legY + 3 + o1, 3, 1, bootHi)
  }

  // 手臂和枪
  drawArmAndGun(ctx, x, bodyTop, bodyH, state, aim, { gun, gunHi, skin, skinHi, skinLo, dress, dressHi, dressLo, outline })

  ctx.restore()
}

// === 死亡姿态 ===
function drawPlayerDie(ctx, x, y, w, h, c) {
  // 长发散开
  px(ctx, x + 0, y + 8, 14, 1, c.hairLo)
  px(ctx, x + 0, y + 9, 14, 3, c.hair)
  px(ctx, x + 2, y + 9, 10, 1, c.hairHi)
  px(ctx, x + 0, y + 12, 14, 1, c.hairLo)
  // 身体 (红色和服)
  px(ctx, x + 3, y + 10, 8, 1, c.dressLo)
  px(ctx, x + 3, y + 11, 8, 3, c.dress)
  px(ctx, x + 3, y + 10, 8, 1, c.dressHi)
  px(ctx, x + 3, y + 14, 8, 1, c.dressLo)
  // 腰带
  px(ctx, x + 3, y + 13, 8, 1, c.gold)
  // 脸
  px(ctx, x + 5, y + 7, 5, 1, c.skinLo)
  px(ctx, x + 5, y + 8, 5, 2, c.skin)
  px(ctx, x + 5, y + 7, 1, 1, c.skinHi)
  // 闭眼 (×)
  px(ctx, x + 6, y + 8, 1, 1, '#000')
  px(ctx, x + 8, y + 8, 1, 1, '#000')
  // 嘴
  px(ctx, x + 7, y + 9, 1, 1, c.skinLo)
  // 枪
  px(ctx, x + 11, y + 11, 4, 1, c.gun)
  px(ctx, x + 11, y + 11, 4, 1, c.gunHi)
  // 腿
  px(ctx, x + 2, y + 14, 4, 1, c.boot)
  px(ctx, x + 2, y + 15, 4, 2, c.boot)
  px(ctx, x + 9, y + 14, 4, 1, c.boot)
  px(ctx, x + 9, y + 15, 4, 2, c.boot)
}

function drawArmAndGun(ctx, x, bodyTop, bodyH, state, aim, c) {
  if (state === 'crouch') {
    // 蹲下射击 — 枪管水平
    px(ctx, x + 9, bodyTop + 4, 6, 1, c.gun)
    px(ctx, x + 9, bodyTop + 4, 6, 1, c.gunHi)
    px(ctx, x + 14, bodyTop + 4, 2, 2, c.skin)
    px(ctx, x + 14, bodyTop + 4, 1, 1, c.skinHi)
    return
  }

  let gunAngle = aim
  if (gunAngle > 1.2) gunAngle = 1.2
  if (gunAngle < -1.2) gunAngle = -1.2

  const upAim = gunAngle < -0.5
  const downAim = gunAngle > 0.5

  if (upAim) {
    // 向上举枪 — 露出手臂(肤色)
    // 和服袖口
    px(ctx, x + 9, bodyTop + 4, 3, 2, c.dress)
    px(ctx, x + 9, bodyTop + 4, 3, 1, c.dressHi)
    px(ctx, x + 9, bodyTop + 6, 3, 1, c.dressLo)
    // 手臂
    px(ctx, x + 10, bodyTop + 1, 2, 4, c.skin)
    px(ctx, x + 10, bodyTop + 1, 1, 4, c.skinHi)
    px(ctx, x + 11, bodyTop + 1, 1, 4, c.skinLo)
    // 枪管向上
    px(ctx, x + 9, bodyTop - 3, 3, 4, c.gun)
    px(ctx, x + 9, bodyTop - 3, 3, 1, c.gunHi)
    px(ctx, x + 9, bodyTop - 3, 1, 4, '#181818')
    // 枪口
    px(ctx, x + 8, bodyTop - 4, 5, 1, c.gun)
  } else if (downAim) {
    // 向下射击
    px(ctx, x + 10, bodyTop + 5, 2, 2, c.dress)  // 袖口
    px(ctx, x + 10, bodyTop + 5, 2, 1, c.dressHi)
    px(ctx, x + 11, bodyTop + 7, 2, 2, c.skin)   // 手臂
    px(ctx, x + 11, bodyTop + 7, 1, 2, c.skinHi)
    px(ctx, x + 12, bodyTop + 8, 5, 2, c.gun)    // 枪管
    px(ctx, x + 12, bodyTop + 8, 5, 1, c.gunHi)
    px(ctx, x + 16, bodyTop + 8, 2, 2, c.skin)   // 手
    px(ctx, x + 16, bodyTop + 8, 1, 1, c.skinHi)
  } else {
    // 水平射击 — 手臂从和服袖子伸出
    // 和服袖口
    px(ctx, x + 10, bodyTop + 5, 3, 3, c.dress)
    px(ctx, x + 10, bodyTop + 5, 3, 1, c.dressHi)
    px(ctx, x + 10, bodyTop + 7, 3, 1, c.dressLo)
    // 手臂
    px(ctx, x + 12, bodyTop + 6, 2, 2, c.skin)
    px(ctx, x + 12, bodyTop + 6, 1, 2, c.skinHi)
    // 枪管
    px(ctx, x + 13, bodyTop + 6, 6, 2, c.gun)
    px(ctx, x + 13, bodyTop + 6, 6, 1, c.gunHi)
    px(ctx, x + 13, bodyTop + 7, 6, 1, '#181818')
    // 枪口闪光
    px(ctx, x + 18, bodyTop + 5, 2, 4, c.gun)
    // 手
    px(ctx, x + 19, bodyTop + 6, 2, 2, c.skin)
    px(ctx, x + 19, bodyTop + 6, 1, 1, c.skinHi)
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

// === 菜单女帝头像 (大像素画, 56x80) ===
export function drawMenuPortrait(ctx, ox, oy) {
  const img = loadSprite(SPRITE_URLS.portrait)
  if (img && img.complete && img.naturalWidth > 0) {
    // 使用图片精灵
    ctx.save()
    ctx.imageSmoothingEnabled = false
    // 绘制到 56x84 的区域 (与原来代码绘制的尺寸匹配)
    ctx.drawImage(img, ox, oy, 56, 84)
    ctx.restore()
    return
  }

  // 回退: 代码绘制
  const skin = '#fce8d8', skinHi = '#fff8f0', skinLo = '#e8b898'
  const hair = '#1a1a2a', hairHi = '#3a3a4a', hairLo = '#0a0a14'
  const dress = '#d82838', dressHi = '#fc4858', dressLo = '#8c1828'
  const gold = '#fcb068', goldHi = '#fcd898', goldLo = '#bc8838'
  const accent = '#fcd8e8'
  const lip = '#c84868'

  const s = 2
  function P(gx, gy, gw, gh, color) {
    px(ctx, ox + gx * s, oy + gy * s, gw * s, gh * s, color)
  }

  P(8, 0, 40, 2, hairLo)
  P(6, 2, 44, 2, hairLo)
  P(4, 4, 48, 36, hairLo)
  P(6, 2, 44, 2, hair)
  P(4, 4, 48, 34, hair)
  P(10, 6, 2, 28, hairHi)
  P(20, 6, 2, 28, hairHi)
  P(38, 6, 2, 28, hairHi)
  P(46, 6, 2, 28, hairHi)
  P(8, 38, 40, 2, hairLo)
  P(12, 40, 32, 2, hairLo)

  P(12, 6, 32, 2, skinLo)
  P(10, 8, 2, 20, skinLo)
  P(44, 8, 2, 20, skinLo)
  P(12, 28, 32, 2, skinLo)
  P(12, 8, 32, 20, skin)
  P(14, 8, 4, 6, skinHi)
  P(38, 8, 4, 6, skinHi)
  P(14, 22, 4, 2, '#fc8888')
  P(38, 22, 4, 2, '#fc8888')

  P(10, 4, 36, 2, hairLo)
  P(10, 6, 36, 2, hair)
  P(12, 8, 6, 4, hair)
  P(26, 8, 4, 4, hair)
  P(36, 8, 6, 4, hair)
  P(12, 8, 4, 2, hairHi)
  P(38, 8, 4, 2, hairHi)
  P(10, 8, 2, 20, hair)
  P(44, 8, 2, 20, hair)

  P(16, 14, 8, 1, hair)
  P(32, 14, 8, 1, hair)
  P(16, 15, 8, 3, '#fcfcfc')
  P(32, 15, 8, 3, '#fcfcfc')
  P(19, 15, 3, 3, '#1a1a2a')
  P(35, 15, 3, 3, '#1a1a2a')
  P(20, 15, 1, 1, '#fcfcfc')
  P(36, 15, 1, 1, '#fcfcfc')
  P(16, 18, 8, 1, skinLo)
  P(32, 18, 8, 1, skinLo)
  P(15, 12, 8, 1, hair)
  P(33, 12, 8, 1, hair)

  P(27, 20, 2, 2, skinLo)
  P(24, 24, 8, 2, lip)
  P(24, 24, 8, 1, '#fc6878')

  P(8, 30, 40, 2, dressLo)
  P(6, 32, 2, 28, dressLo)
  P(48, 32, 2, 28, dressLo)
  P(6, 58, 44, 2, dressLo)
  P(8, 32, 40, 26, dress)
  P(8, 32, 40, 2, dressHi)
  P(8, 34, 4, 22, dressHi)
  P(22, 32, 12, 2, skin)
  P(24, 34, 8, 2, skin)
  P(26, 36, 4, 2, skinLo)
  P(12, 38, 2, 2, accent)
  P(42, 38, 2, 2, accent)
  P(16, 44, 2, 2, accent)
  P(38, 44, 2, 2, accent)
  P(26, 48, 4, 2, accent)

  P(6, 54, 44, 1, goldLo)
  P(8, 55, 40, 3, gold)
  P(8, 55, 40, 1, goldHi)
  P(6, 58, 44, 1, goldLo)
  P(14, 56, 2, 2, goldLo)
  P(26, 56, 2, 2, goldLo)
  P(38, 56, 2, 2, goldLo)

  P(6, 30, 4, 4, gold)
  P(46, 30, 4, 4, gold)
  P(6, 30, 4, 1, goldHi)
  P(46, 30, 4, 1, goldHi)
}
