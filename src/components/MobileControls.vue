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
  left: false, right: false, up: false, down: false, jump: false, shoot: false
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
  background: rgba(40, 40, 40, 0.6);
  border: 2px solid rgba(252, 252, 252, 0.4);
  color: #fcfcfc;
  font-size: 18px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(2px);
  transition: background 0.05s;
}

.dpad-btn.active {
  background: rgba(252, 200, 40, 0.7);
  border-color: #fcfc28;
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
  background: rgba(20, 20, 20, 0.5);
  border: 2px solid rgba(252, 252, 252, 0.2);
  border-radius: 8px;
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
  border: 3px solid rgba(252, 252, 252, 0.5);
  color: #fcfcfc;
  font-size: 14px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(2px);
  transition: background 0.05s;
}

.action-btn.shoot {
  background: rgba(200, 40, 40, 0.55);
}
.action-btn.shoot.active {
  background: rgba(252, 80, 80, 0.85);
}

.action-btn.jump {
  background: rgba(40, 120, 220, 0.55);
}
.action-btn.jump.active {
  background: rgba(80, 160, 252, 0.85);
}
</style>
