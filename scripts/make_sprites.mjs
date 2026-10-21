/**
 * 将 nvdi.jpg 转换为游戏精灵图 (高分辨率版)
 * 输出: src/assets/sprites/nvdi_*.png
 * 4倍分辨率 + 饱和度增强 + 锐化, 保证缩小显示后清晰
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcImg = path.join(__dirname, '../../hy_game/assets/nvdi.jpg');
const outDir = path.join(__dirname, '../src/assets/sprites');

// Ensure output dir exists
fs.mkdirSync(outDir, { recursive: true });

// 4x 分辨率: 游戏逻辑尺寸14x22, 视觉2倍渲染=28x44, 精灵再留2x细节余量
const TARGET_W = 112;  // 28 * 4
const TARGET_H = 176;  // 44 * 4

// 图像增强管线: 饱和+锐化, 让小尺寸下五官/服装更清晰
function enhance(buf) {
  return sharp(buf)
    .modulate({ saturation: 1.2, lightness: 1.04 })
    .sharpen({ sigma: 1.2, m1: 0.5, m2: 1.5 })
    .png()
    .toBuffer();
}

async function makeSprite(srcImg, cropOpts, resizeW, resizeH, rotate, outName) {
  // 钳制裁剪区域, 防止越界
  const meta = await sharp(srcImg).metadata();
  const safe = {
    left: Math.max(0, Math.min(cropOpts.left, meta.width - 1)),
    top: Math.max(0, Math.min(cropOpts.top, meta.height - 1)),
    width: Math.min(cropOpts.width, meta.width - Math.max(0, Math.min(cropOpts.left, meta.width - 1))),
    height: Math.min(cropOpts.height, meta.height - Math.max(0, Math.min(cropOpts.top, meta.height - 1)))
  };
  // 先裁剪保存, 再旋转 (sharp中extract+rotate同链会冲突)
  const extracted = await sharp(srcImg).extract(safe).png().toBuffer();
  let pipeline = sharp(extracted);
  if (rotate) pipeline = pipeline.rotate(rotate);
  const buf = await pipeline
    .resize(resizeW, resizeH, { fit: 'fill', kernel: 'lanczos3' })
    .png()
    .toBuffer();
  const enhanced = await enhance(buf);
  const outPath = path.join(outDir, outName);
  await sharp(enhanced).toFile(outPath);
  console.log('Saved:', outName, `(${resizeW}x${resizeH})`);
}

async function processImage() {
  console.log('Source:', srcImg);
  console.log('Target size:', TARGET_W, 'x', TARGET_H, '(4x)');

  const meta = await sharp(srcImg).metadata();
  console.log('Source dimensions:', meta.width, 'x', meta.height);

  // 裁剪区域: 人物居中偏上
  const cropW = Math.floor(meta.width * 0.72);
  const cropH = Math.floor(meta.height * 0.88);
  const cropLeft = Math.floor((meta.width - cropW) / 2);
  const cropTop = Math.floor(meta.height * 0.04);
  const crop = { left: cropLeft, top: cropTop, width: cropW, height: cropH };

  // 站立
  await makeSprite(srcImg, crop, TARGET_W, TARGET_H, 0, 'nvdi_standing.png');
  // 跑步帧1: 前倾
  await makeSprite(srcImg, { ...crop, left: Math.max(0, cropLeft - 14) }, TARGET_W, TARGET_H, 2, 'nvdi_run1.png');
  // 跑步帧2: 后倾
  await makeSprite(srcImg, { ...crop, left: Math.min(meta.width - cropW, cropLeft + 14) }, TARGET_W, TARGET_H, -2, 'nvdi_run2.png');
  // 跳跃: 压缩+上倾
  await makeSprite(srcImg, { left: cropLeft, top: cropTop + 28, width: cropW, height: cropH - 28 }, TARGET_W, Math.floor(TARGET_H * 0.9), -5, 'nvdi_jump.png');
  // 趴下: 压扁
  await makeSprite(srcImg, { left: cropLeft, top: cropTop + 56, width: cropW, height: cropH - 56 }, TARGET_W, Math.floor(TARGET_H * 0.6), 0, 'nvdi_crouch.png');
  // 死亡: 旋转90度
  await makeSprite(srcImg, { left: cropLeft, top: cropTop + 84, width: cropW, height: cropH - 84 }, TARGET_W, TARGET_H, 90, 'nvdi_die.png');

  // 菜单头像: 4x (240x360)
  await makeSprite(srcImg, crop, 240, 360, 0, 'nvdi_portrait.png');

  console.log('\nAll sprites generated (4x enhanced)!');
}

processImage().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
