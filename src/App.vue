<template>
  <div class="game-root" :class="{ touch: isTouch }">
    <div class="game-stage" ref="stageRef">
      <canvas
        ref="canvasRef"
        :width="GAME_WIDTH"
        :height="GAME_HEIGHT"
        class="game-canvas"
      ></canvas>

      <!-- HUD -->
      <HUD
        v-if="gameState === 'playing' || gameState === 'paused' || gameState === 'levelclear'"
        :score="score"
        :lives="lives"
        :weapon="weapon"
        :level="level"
        :sound-on="soundOn"
        :music-on="musicOn"
        @toggle-sound="toggleSound"
        @toggle-music="toggleMusic"
      />

      <!-- 移动端控制 -->
      <MobileControls
        ref="mobileRef"
        :game="game"
        :visible="showMobileControls && (gameState === 'playing' || gameState === 'paused')"
      />

      <!-- 暂停按钮 (移动端) -->
      <button
        v-if="showMobileControls && (gameState === 'playing' || gameState === 'paused')"
        class="pause-btn"
        @click="togglePause"
      >{{ gameState === 'paused' ? '▶' : '❚❚' }}</button>

      <!-- 覆盖层 (levelclear 由 canvas 内绘制, 不显示 Overlay) -->
      <Overlay
        v-if="gameState !== 'playing' && gameState !== 'paused' && gameState !== 'levelclear'"
        :type="overlayType"
        :score="score"
        @start="handleStart"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, computed } from 'vue'
import { Game } from './game/engine/Game.js'
import { GAME_WIDTH, GAME_HEIGHT } from './game/constants.js'
import HUD from './components/HUD.vue'
import MobileControls from './components/MobileControls.vue'
import Overlay from './components/Overlay.vue'

const canvasRef = ref(null)
const stageRef = ref(null)
const mobileRef = ref(null)
const game = ref(null)

const gameState = ref('menu')
const score = ref(0)
const lives = ref(3)
const weapon = ref('N')
const level = ref(1)
const soundOn = ref(true)
const musicOn = ref(true)

const isTouch = ref(false)
const showMobileControls = ref(false)

const overlayType = computed(() => {
  if (gameState.value === 'menu') return 'start'
  if (gameState.value === 'gameover') return 'gameover'
  if (gameState.value === 'victory') return 'victory'
  return 'start'
})

function detectTouch() {
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  isTouch.value = hasTouch
  // 触摸设备 或 窄屏 显示移动控制
  showMobileControls.value = hasTouch || window.innerWidth < 820
}

function handleStart() {
  if (game.value) game.value.startGame()
}

function togglePause() {
  if (!game.value) return
  // 模拟 start 键按下
  game.value.input.state.start = true
  // 下一帧的 beginFrame 会处理 startPressed
  setTimeout(() => { if (game.value) game.value.input.state.start = false }, 0)
}

function toggleSound() {
  if (!game.value) return
  soundOn.value = game.value.toggleSound()
}

function toggleMusic() {
  if (!game.value) return
  musicOn.value = game.value.toggleMusic()
}

function setupGame() {
  game.value = new Game(canvasRef.value, {
    onUpdate: (data) => {
      gameState.value = data.state
      score.value = data.score
      lives.value = data.lives
      weapon.value = data.weapon
      level.value = data.level
    }
  })
  // 暴露游戏实例便于调试 (控制台可通过 window.__contra 访问)
  if (typeof window !== 'undefined') window.__contra = game.value
  game.value.start()

  // 调试: 通过 URL 参数跳关 (?level=2 或 ?level=3) + 无敌模式 (?god=1)
  const params = new URLSearchParams(window.location.search)
  const lv = parseInt(params.get('level'))
  if (lv >= 1 && lv <= 3) {
    game.value.startAtLevel(lv)
  }
  if (params.get('god') === '1') {
    game.value.godMode = true
  }
}

// 自适应缩放: 保持比例, 居中, 填满屏幕
function resize() {
  const stage = stageRef.value
  if (!stage) return
  const w = window.innerWidth
  const h = window.innerHeight
  const scale = Math.max(w / GAME_WIDTH, h / GAME_HEIGHT)
  stage.style.width = GAME_WIDTH * scale + 'px'
  stage.style.height = GAME_HEIGHT * scale + 'px'
  detectTouch()
}

function onResize() { resize() }

onMounted(() => {
  detectTouch()
  setupGame()
  resize()
  window.addEventListener('resize', onResize)
  window.addEventListener('orientationchange', onResize)
  // 防止移动端双击缩放
  document.addEventListener('gesturestart', (e) => e.preventDefault())
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  window.removeEventListener('orientationchange', onResize)
  if (game.value) game.value.stop()
})
</script>

<style scoped>
.game-root {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  overflow: hidden;
}

.game-stage {
  position: relative;
  width: 512px;
  height: 288px;
  background: #5c94fc;
  overflow: hidden;
  transform-origin: center center;
}

.game-canvas {
  display: block;
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}

.pause-btn {
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(252, 252, 252, 0.4);
  color: #fcfcfc;
  width: 36px;
  height: 30px;
  border-radius: 4px;
  font-size: 14px;
  z-index: 6;
  pointer-events: auto;
}

/* 触摸设备隐藏光标 */
.touch .game-stage {
  cursor: default;
}
</style>
