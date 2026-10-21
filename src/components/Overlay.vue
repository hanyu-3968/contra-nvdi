<template>
  <div class="overlay">
    <div class="panel" :class="type">
      <h1 v-if="type === 'start'" class="title red">女帝の试炼</h1>
      <h1 v-else-if="type === 'gameover'" class="title red">GAME OVER</h1>
      <h1 v-else-if="type === 'victory'" class="title yellow">VICTORY!</h1>

      <p v-if="type === 'start'" class="subtitle">BOA HANCOCK</p>
      <p v-if="type === 'gameover'" class="subtitle">女帝陨落</p>
      <p v-if="type === 'victory'" class="subtitle">通关成功!</p>

      <div v-if="type !== 'start'" class="final-score">
        FINAL SCORE: <span>{{ String(score).padStart(6, '0') }}</span>
      </div>

      <button class="start-btn" @click="$emit('start')">
        {{ type === 'start' ? '开始游戏' : '再玩一次' }}
      </button>

      <div v-if="type === 'start'" class="instructions">
        <div class="ins-title">操作说明</div>
        <div class="ins-row"><span class="key">← →</span> / <span class="key">A D</span> 移动</div>
        <div class="ins-row"><span class="key">↑</span> 向上瞄准 / <span class="key">↓</span> 蹲下</div>
        <div class="ins-row"><span class="key">Z</span> / <span class="key">空格</span> 跳跃</div>
        <div class="ins-row"><span class="key">X</span> 射击</div>
        <div class="ins-row"><span class="key">C</span> 换弹</div>
        <div class="ins-row"><span class="key">Enter</span> 暂停</div>
        <div class="ins-row mobile-ins">手机: 建议横屏 / 竖屏自动旋转</div>
        <div class="ins-row tip">武器: S散弹 L激光 F喷火 B闪光弹(清屏)</div>
        <div class="ins-row tip" style="color:#fcd8e8">— Made by hanyu —</div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  type: { type: String, default: 'start' }, // start | gameover | victory
  score: { type: Number, default: 0 }
})
defineEmits(['start'])
</script>

<style scoped>
.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse at center, rgba(42,26,58,0.85) 0%, rgba(10,10,26,0.95) 100%);
  z-index: 20;
  padding: 20px;
}

.panel {
  text-align: center;
  font-family: 'Courier New', monospace;
  max-width: 460px;
  padding: 20px 40px;
  background: rgba(20, 10, 30, 0.6);
  border: 2px solid rgba(252, 176, 104, 0.3);
  border-radius: 12px;
  box-shadow: 0 0 40px rgba(252, 40, 72, 0.15), inset 0 0 20px rgba(252, 176, 104, 0.05);
}

.title {
  font-size: 48px;
  font-weight: bold;
  letter-spacing: 4px;
  text-shadow: 3px 3px 0 #000, 6px 6px 0 rgba(0,0,0,0.4), 0 0 20px rgba(252,40,72,0.4);
  margin-bottom: 8px;
}

.title.red { color: #fc3848; }
.title.yellow { color: #fcfc28; }

.subtitle {
  font-size: 20px;
  color: #fcb068;
  letter-spacing: 6px;
  margin-bottom: 24px;
  text-shadow: 2px 2px 0 #000, 0 0 12px rgba(252,176,104,0.3);
}

.final-score {
  color: #fcfcfc;
  font-size: 16px;
  margin-bottom: 24px;
  text-shadow: 1px 1px 0 #000;
}
.final-score span {
  color: #fcfc28;
  font-weight: bold;
  font-size: 20px;
}

.start-btn {
  background: linear-gradient(180deg, #fc4858, #c82838);
  color: #fcfcfc;
  border: 3px solid #fcb068;
  padding: 14px 40px;
  font-size: 18px;
  font-weight: bold;
  letter-spacing: 2px;
  border-radius: 8px;
  box-shadow: 0 4px 0 #6c1828, 0 6px 20px rgba(252,40,72,0.3);
  transition: transform 0.05s, box-shadow 0.05s;
  cursor: pointer;
}
.start-btn:active {
  transform: translateY(3px);
  box-shadow: 0 1px 0 #6c1828, 0 2px 10px rgba(252,40,72,0.2);
}
.start-btn:hover {
  border-color: #fcd898;
  box-shadow: 0 4px 0 #6c1828, 0 6px 24px rgba(252,40,72,0.5);
}

.instructions {
  margin-top: 28px;
  text-align: left;
  display: inline-block;
  color: #c8c8d8;
  font-size: 13px;
  line-height: 1.9;
}
.ins-title {
  color: #fcb068;
  font-weight: bold;
  margin-bottom: 6px;
  text-align: center;
  letter-spacing: 2px;
}
.key {
  display: inline-block;
  background: rgba(252, 176, 104, 0.15);
  border: 1px solid rgba(252, 176, 104, 0.4);
  border-radius: 3px;
  padding: 0 6px;
  margin: 0 2px;
  color: #fcd898;
}
.tip {
  color: #28e8fc;
  margin-top: 8px;
  font-size: 12px;
}
.mobile-ins { color: #fc8c28; }
</style>
