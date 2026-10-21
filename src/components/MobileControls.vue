<template>
  <div class="mobile-controls" v-if="visible">
    <!-- 方向键 -->
    <div class="dpad">
      <button
        class="dpad-btn up"
        :class="{ active: actions.left && actions.up }"
        @touchstart.prevent="press('up', true)"
        @touchend.prevent="press('up', false)"
        @touchcancel.prevent="press('up', false)"
        @mousedown.prevent="press('up', true)"
        @mouseup.prevent="press('up', false)"
        @mouseleave="press('up', false)"
      >▲</button>
      <button
        class="dpad-btn left"
        :class="{ active: actions.left }"
        @touchstart.prevent="press('left', true)"
        @touchend.prevent="press('left', false)"
        @touchcancel.prevent="press('left', false)"
        @mousedown.prevent="press('left', true)"
        @mouseup.prevent="press('left', false)"
        @mouseleave="press('left', false)"
      >◀</button>
      <button
        class="dpad-btn right"
        :class="{ active: actions.right }"
        @touchstart.prevent="press('right', true)"
        @touchend.prevent="press('right', false)"
        @touchcancel.prevent="press('right', false)"
        @mousedown.prevent="press('right', true)"
        @mouseup.prevent="press('right', false)"
        @mouseleave="press('right', false)"
      >▶</button>
      <button
        class="dpad-btn down"
        :class="{ active: actions.down }"
        @touchstart.prevent="press('down', true)"
        @touchend.prevent="press('down', false)"
        @touchcancel.prevent="press('down', false)"
        @mousedown.prevent="press('down', true)"
        @mouseup.prevent="press('down', false)"
        @mouseleave="press('down', false)"
      >▼</button>
      <div class="dpad-center"></div>
    </div>

    <!-- 动作按钮 -->
    <div class="actions">
      <button
        class="action-btn swap"
        @touchstart.prevent="press('swap', true)"
        @touchend.prevent="press('swap', false)"
        @touchcancel.prevent="press('swap', false)"
        @mousedown.prevent="press('swap', true)"
        @mouseup.prevent="press('swap', false)"
        @mouseleave="press('swap', false)"
      >换弹</button>
      <button
        class="action-btn shoot"
        :class="{ active: actions.shoot }"
        @touchstart.prevent="press('shoot', true)"
        @touchend.prevent="press('shoot', false)"
        @touchcancel.prevent="press('shoot', false)"
        @mousedown.prevent="press('shoot', true)"
        @mouseup.prevent="press('shoot', false)"
        @mouseleave="press('shoot', false)"
      >射击</button>
      <button
        class="action-btn jump"
        :class="{ active: actions.jump }"
        @touchstart.prevent="press('jump', true)"
        @touchend.prevent="press('jump', false)"
        @touchcancel.prevent="press('jump', false)"
        @mousedown.prevent="press('jump', true)"
        @mouseup.prevent="press('jump', false)"
        @mouseleave="press('jump', false)"
      >跳跃</button>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'

const props = defineProps({
  game: { type: Object, default: null },
  visible: { type: Boolean, default: false }
})

const actions = reactive({
  left: false, right: false, up: false, down: false, jump: false, shoot: false, swap: false
})

function press(action, val) {
  actions[action] = val
  if (props.game) props.game.setTouch(action, val)
}

// 当组件卸载或隐藏时, 释放所有按键
function releaseAll() {
  Object.keys(actions).forEach(k => {
    if (actions[k] && props.game) props.game.setTouch(k, false)
    actions[k] = false
  })
}

defineExpose({ releaseAll })
</script>

<style scoped>
.mobile-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 180px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 0 20px 24px;
  pointer-events: none;
  z-index: 10;
}

.dpad {
  position: relative;
  width: 150px;
  height: 150px;
  pointer-events: auto;
}

.dpad-btn {
  position: absolute;
  width: 50px;
  height: 50px;
  background: rgba(30, 20, 40, 0.65);
  border: 2px solid rgba(252, 176, 104, 0.4);
  color: #fcb068;
  font-size: 18px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
  transition: all 0.05s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

.dpad-btn.active {
  background: rgba(252, 176, 104, 0.7);
  border-color: #fcd898;
  color: #1a0a2a;
  box-shadow: 0 0 16px rgba(252,176,104,0.5), 0 2px 8px rgba(0,0,0,0.3);
  transform: scale(0.95);
}

.dpad-btn.up { top: 0; left: 50px; }
.dpad-btn.down { bottom: 0; left: 50px; }
.dpad-btn.left { top: 50px; left: 0; }
.dpad-btn.right { top: 50px; right: 0; }

.dpad-center {
  position: absolute;
  top: 50px;
  left: 50px;
  width: 50px;
  height: 50px;
  background: rgba(20, 10, 30, 0.5);
  border: 2px solid rgba(252, 176, 104, 0.2);
  border-radius: 10px;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-end;
  pointer-events: auto;
}

.action-btn {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  border: 3px solid rgba(252, 176, 104, 0.5);
  color: #fcfcfc;
  font-size: 14px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
  transition: all 0.05s;
  box-shadow: 0 2px 12px rgba(0,0,0,0.3);
}

.action-btn.shoot {
  background: rgba(200, 40, 56, 0.6);
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
}
.action-btn.shoot.active {
  background: rgba(252, 72, 88, 0.9);
  border-color: #fcd898;
  box-shadow: 0 0 20px rgba(252,72,88,0.6), 0 2px 12px rgba(0,0,0,0.3);
  transform: scale(0.92);
}

.action-btn.jump {
  background: rgba(40, 100, 200, 0.6);
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
}
.action-btn.jump.active {
  background: rgba(80, 160, 252, 0.9);
  border-color: #fcd898;
  box-shadow: 0 0 20px rgba(80,160,252,0.6), 0 2px 12px rgba(0,0,0,0.3);
  transform: scale(0.92);
}

.action-btn.swap {
  background: rgba(120, 40, 160, 0.6);
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
}
.action-btn.swap:active {
  background: rgba(180, 80, 252, 0.9);
  border-color: #fcd898;
  box-shadow: 0 0 20px rgba(180,80,252,0.6), 0 2px 12px rgba(0,0,0,0.3);
  transform: scale(0.92);
}
</style>
