<template>
  <div class="hud">
    <div class="hud-left">
      <div class="hud-item">SCORE <span class="val">{{ String(score).padStart(6, '0') }}</span></div>
      <div class="hud-item">LIVES <span class="val">{{ '♥'.repeat(Math.max(0, lives)) }}</span></div>
    </div>
    <div class="hud-center">
      <div class="hud-item stage">STAGE <span class="val">{{ level }}</span></div>
    </div>
    <div class="hud-right">
      <div class="hud-item">WPN <span class="val weapon">{{ weaponName }}</span></div>
      <div class="sound-toggles">
        <button class="icon-btn" @click="$emit('toggleSound')">{{ soundOn ? '🔊' : '🔇' }}</button>
        <button class="icon-btn" @click="$emit('toggleMusic')">{{ musicOn ? '🎵' : '🎵̸' }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { WEAPONS } from '../game/constants.js'

const props = defineProps({
  score: { type: Number, default: 0 },
  lives: { type: Number, default: 3 },
  weapon: { type: String, default: 'N' },
  level: { type: Number, default: 1 },
  soundOn: { type: Boolean, default: true },
  musicOn: { type: Boolean, default: true }
})

defineEmits(['toggleSound', 'toggleMusic'])

const weaponName = computed(() => WEAPONS[props.weapon]?.name || 'NORMAL')
</script>

<style scoped>
.hud {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 8px 12px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #fcfcfc;
  text-shadow: 1px 1px 0 #000, 2px 2px 0 #000;
  pointer-events: none;
  z-index: 5;
}

.hud-left, .hud-right {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: rgba(20, 10, 30, 0.5);
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid rgba(252, 176, 104, 0.2);
  pointer-events: auto;
}

.hud-center {
  background: rgba(20, 10, 30, 0.5);
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid rgba(252, 176, 104, 0.2);
  pointer-events: auto;
}

.hud-item.stage .val {
  color: #fcb068;
}

.hud-right {
  align-items: flex-end;
}

.hud-item {
  white-space: nowrap;
  letter-spacing: 1px;
}

.val {
  color: #fcfc28;
  font-weight: bold;
}

.val.weapon {
  color: #28e8fc;
}

.sound-toggles {
  display: flex;
  gap: 6px;
  margin-top: 2px;
}

.icon-btn {
  background: rgba(20, 10, 30, 0.6);
  border: 1px solid rgba(252, 176, 104, 0.3);
  color: #fcb068;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.icon-btn:hover {
  border-color: #fcd898;
}
</style>
