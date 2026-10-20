// 游戏常量配置
export const GAME_WIDTH = 512 // 逻辑分辨率宽 (16:9 内部画布)
export const GAME_HEIGHT = 288 // 逻辑分辨率高 (与经典 NES 比例接近, 放大显示)
export const TILE = 16 // 瓦片大小
export const GRAVITY = 0.5
export const MAX_FALL = 9

// 玩家
export const PLAYER_SPEED = 1.6
export const JUMP_POWER = 8.5
export const PLAYER_W = 14
export const PLAYER_H = 22
export const PLAYER_H_CROUCH = 14
// 游泳 (水下关卡)
export const SWIM_SPEED = 1.2
export const SWIM_BUOYANCY = -0.15 // 轻微上浮力
export const SWIM_FRICTION = 0.92 // 水阻力衰减
export const SWIM_UP_POWER = 2.0 // 按上浮键的推进力

// 子弹
export const BULLET_SPEED = 6
export const PLAYER_FIRE_INTERVAL = 12 // 帧
export const ENEMY_FIRE_INTERVAL = 90

// 颜色 (经典魂斗罗调色板)
export const COLORS = {
  sky: '#5c94fc',
  ground: '#7c4a1a',
  groundDark: '#5c2c0a',
  grass: '#3ca028',
  grassDark: '#246018',
  rock: '#888888',
  rockDark: '#555555',
  water: '#3c6cc8',
  // 女帝 (波雅·汉库克) 配色
  player: '#c82828',       // 红色和服裙
  playerSkin: '#fce8d8',   // 白皙肤色
  playerHat: '#1a1a2a',    // 黑色长发
  playerHair: '#1a1a2a',   // 黑发
  playerAccent: '#fcd8e8', // 粉色装饰
  playerDetail: '#fcb068', // 金色蛇饰
  enemy: '#c82828',
  enemySkin: '#fcbcb0',
  bullet: '#f8f8f8',
  explosion: '#fc8c28',
  text: '#fcfcfc',
  shadow: '#181818',
  // 沙漠主题颜色
  desertSky: '#f8c868',
  desertSkyDark: '#e8a848',
  sand: '#e8b858',
  sandDark: '#c88838',
  sandLight: '#f8d878',
  dune: '#d89838',
  cactus: '#3c7818',
  cactusDark: '#244c10',
  oilTank: '#686868',
  oilTankDark: '#383838',
  metalPlatform: '#888888',
  metalPlatformDark: '#484848',
  mechBody: '#787878',
  mechBodyDark: '#484848',
  mechCockpit: '#2868d8',
  mechJoint: '#282828',
  mechWeapon: '#882828',
  // 水下主题颜色
  underwaterSky: '#0a2868',
  underwaterSkyLight: '#1858a8',
  waterDeep: '#0a2058',
  waterShallow: '#1858a8',
  waterSurface: '#3888d8',
  waterOverlay: 'rgba(20, 80, 180, 0.35)',
  coral: '#fc6488',
  coralDark: '#a83868',
  coralBranch: '#fc8ca8',
  rustMetal: '#8c5828',
  rustMetalDark: '#5c3818',
  rustMetalLight: '#bc7838',
  seaweed: '#2c7c3c',
  seaweedDark: '#1c4c28',
  stoneColumn: '#787898',
  stoneColumnDark: '#484868',
  mineBody: '#383838',
  mineSpike: '#888888',
  mineLight: '#fc2828',
  jellyfish: '#f8a8e8',
  jellyfishDark: '#c868b8',
  torpedo: '#484858',
  torpedoDark: '#282838',
  torpedoTip: '#fc2828',
  octopus: '#a83878',
  octopusDark: '#682848',
  inkColor: '#383848',
  deepMechBody: '#385878',
  deepMechBodyDark: '#283848',
  deepMechLight: '#48a8c8',
  bubble: 'rgba(180, 220, 255, 0.5)'
}

// 武器类型
export const WEAPONS = {
  N: { name: 'NORMAL', interval: 12, speed: 6, color: '#f8f8f8', spread: 0, count: 1 },
  M: { name: 'MACHINE', interval: 6, speed: 7, color: '#fcd028', spread: 0, count: 1 },
  S: { name: 'SPREAD', interval: 16, speed: 5.5, color: '#fc8c28', spread: 0.28, count: 3 },
  L: { name: 'LASER', interval: 14, speed: 11, color: '#28e8fc', spread: 0, count: 1 },
  F: { name: 'FIREBALL', interval: 22, speed: 4.5, color: '#fc4c28', spread: 0, count: 1 }
}
