/**
 * 像素精灵抠图+处理管线
 * 1. 从图像四角取样背景色
 * 2. BFS 洪水填充: 从边缘把与背景色相近的连通像素 alpha=0 (只去背景, 保留角色内深色)
 * 3. 自动去背景上的水印 (与背景连通)
 * 4. 裁剪到内容边界, 缩放, 居中输出到标准精灵画布
 * 用法: node process_sprite.mjs <input.png> <output.png> <canvasW> <canvasH> [targetH]
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const [,, input, output, cWStr, cHStr, tHStr] = process.argv;
if (!input || !output) {
  console.error('Usage: node process_sprite.mjs <input> <output> <canvasW> <canvasH> [targetH]');
  process.exit(1);
}
const CANVAS_W = parseInt(cWStr || '112', 10);
const CANVAS_H = parseInt(cHStr || '176', 10);
const TARGET_H = parseInt(tHStr || String(CANVAS_H), 10); // 内容缩放后的高度

const TOLERANCE = 42; // 背景色距离容差

async function main() {
  const img = sharp(input);
  const meta = await img.metadata();
  const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  console.log(`Input: ${W}x${H}`);

  // 1. 四角取样背景色 (取中位数更稳)
  const corners = [];
  const sample = (x, y) => {
    const i = (y * W + x) * 4;
    return [data[i], data[i + 1], data[i + 2]];
  };
  for (const [cx, cy] of [[2, 2], [W - 3, 2], [2, H - 3], [W - 3, H - 3], [Math.floor(W / 2), 2], [2, Math.floor(H / 2)]]) {
    corners.push(sample(cx, cy));
  }
  const bg = corners.reduce((a, c) => [a[0] + c[0] / corners.length, a[1] + c[1] / corners.length, a[2] + c[2] / corners.length], [0, 0, 0]);
  console.log('Background color:', bg.map(v => Math.round(v)));

  // 2. BFS 洪水填充 (从所有边缘像素出发)
  const visited = new Uint8Array(W * H);
  const queue = [];
  const isBgLike = (i) => {
    const r = data[i] - bg[0], g = data[i + 1] - bg[1], b = data[i + 2] - bg[2];
    return (r * r + g * g + b * b) < TOLERANCE * TOLERANCE * 3;
  };
  const push = (x, y) => {
    const idx = y * W + x;
    if (visited[idx]) return;
    const i = idx * 4;
    if (!isBgLike(i)) return;
    visited[idx] = 1;
    queue.push(idx);
  };
  for (let x = 0; x < W; x++) { push(x, 0); push(x, H - 1); }
  for (let y = 0; y < H; y++) { push(0, y); push(W - 1, y); }

  while (queue.length) {
    const idx = queue.pop();
    const x = idx % W, y = (idx / W) | 0;
    data[idx * 4 + 3] = 0; // 透明
    if (x > 0) push(x - 1, y);
    if (x < W - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y < H - 1) push(x, y + 1);
  }

  // 3. 内容边界
  let minX = W, minY = H, maxX = 0, maxY = 0, found = false;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (data[(y * W + x) * 4 + 3] > 0) {
        found = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (!found) { console.error('No content found!'); process.exit(1); }
  const pad = 2;
  minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
  maxX = Math.min(W - 1, maxX + pad); maxY = Math.min(H - 1, maxY + pad);
  const cw = maxX - minX + 1, ch = maxY - minY + 1;
  console.log(`Content: ${cw}x${ch} at (${minX},${minY})`);

  // 4. 裁剪 + 等比缩放 (高度优先, 宽度超画布时按宽度适配)
  const scale = Math.min(TARGET_H / ch, CANVAS_W / cw);
  const scaledW = Math.max(1, Math.round(cw * scale));
  const scaledH = Math.max(1, Math.round(ch * scale));
  const trimmed = await sharp(data, { raw: { width: W, height: H, channels: 4 } })
    .extract({ left: minX, top: minY, width: cw, height: ch })
    .resize(scaledW, scaledH, { fit: 'fill', kernel: 'lanczos3' })
    .png()
    .toBuffer();

  // 5. 居中放到标准画布 (底部对齐: 脚在画布底部)
  const left = Math.round((CANVAS_W - scaledW) / 2);
  const top = CANVAS_H - scaledH;
  await sharp({
    create: { width: CANVAS_W, height: CANVAS_H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  })
    .composite([{ input: trimmed, left, top }])
    .png()
    .toFile(output);

  console.log(`Saved: ${output} (${CANVAS_W}x${CANVAS_H}, content ${scaledW}x${scaledH} at ${left},${top})`);
}

main().catch(e => { console.error(e); process.exit(1); });
