<template>
  <div class="overlay">
    <div class="panel" :class="type">
      <h1 v-if="type === 'start'" class="title red">CONTRA</h1>
      <h1 v-else-if="type === 'gameover'" class="title red">GAME OVER</h1>
      <h1 v-else-if="type === 'victory'" class="title yellow">VICTORY!</h1>

      <p v-if="type === 'start'" class="subtitle">魂 斗 罗</p>
      <p v-if="type === 'gameover'" class="subtitle">游戏结束</p>
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
        <div class="ins-row"><span class="key">Enter</span> 暂停</div>
        <div class="ins-row mobile-ins">手机: 屏幕方向键 + 动作按钮</div>
        <div class="ins-row tip">道具: M机关枪 S散弹 L激光 F火球</div>
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
  background: rgba(0, 0, 0, 0.75);
  z-index: 20;
  padding: 20px;
}

.panel {
  text-align: center;
  font-family: 'Courier New', monospace;
  max-width: 460px;
}

.title {
  font-size: 48px;
  font-weight: bold;
  letter-spacing: 4px;
  text-shadow: 3px 3px 0 #000, 6px 6px 0 rgba(0,0,0,0.4);
  margin-bottom: 8px;
}

.title.red { color: #fc3838; }
.title.yellow { color: #fcfc28; }

.subtitle {
  font-size: 20px;
  color: #fcfcfc;
  letter-spacing: 6px;
  margin-bottom: 24px;
  text-shadow: 2px 2px 0 #000;
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
}

.start-btn {
  background: linear-gradient(180deg, #fc6428, #c82828);
  color: #fcfcfc;
  border: 3px solid #fcfc28;
  padding: 12px 36px;
  font-size: 18px;
  font-weight: bold;
  letter-spacing: 2px;
  border-radius: 6px;
  box-shadow: 0 4px 0 #6c1818, 0 6px 12px rgba(0,0,0,0.5);
  transition: transform 0.05s, box-shadow 0.05s;
}
.start-btn:active {
  transform: translateY(3px);
  box-shadow: 0 1px 0 #6c1818, 0 2px 6px rgba(0,0,0,0.5);
}

.instructions {
  margin-top: 28px;
  text-align: left;
  display: inline-block;
  color: #c8c8c8;
  font-size: 13px;
  line-height: 1.9;
}
.ins-title {
  color: #fcfc28;
  font-weight: bold;
  margin-bottom: 6px;
  text-align: center;
}
.key {
  display: inline-block;
  background: rgba(252, 252, 252, 0.15);
  border: 1px solid rgba(252, 252, 252, 0.4);
  border-radius: 3px;
  padding: 0 6px;
  margin: 0 2px;
  color: #fcfcfc;
}
.tip {
  color: #28e8fc;
  margin-top: 8px;
  font-size: 12px;
}
.mobile-ins { color: #fc8c28; }
</style>
