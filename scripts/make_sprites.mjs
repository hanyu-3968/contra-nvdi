/**
 * 将 nvdi.jpg 转换为游戏精灵图
 * 输出: src/assets/sprites/nvdi_standing.png, nvdi_run1.png, nvdi_run2.png, nvdi_jump.png, nvdi_crouch.png
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

const TARGET_W = 48;  // sprite width in pixels (game scale)
const TARGET_H = 72;  // sprite height in pixels

async function processImage() {
  console.log('Source:', srcImg);
  console.log('Target size:', TARGET_W, 'x', TARGET_H);

  // 1. Load and resize to target dimensions
  // The source is a full-body portrait, we want to crop to the character
  // Source is 1279x1706, character takes up most of the frame
  // We'll resize maintaining aspect ratio, then center-crop

  const meta = await sharp(srcImg).metadata();
  console.log('Source dimensions:', meta.width, 'x', meta.height);

  // Calculate crop to get character (center-ish, slightly upper)
  // Character occupies roughly center 70% width, full height
  const cropW = Math.floor(meta.width * 0.72);
  const cropH = Math.floor(meta.height * 0.88);
  const cropLeft = Math.floor((meta.width - cropW) / 2);
  const cropTop = Math.floor(meta.height * 0.04);

  console.log('Crop:', cropW, 'x', cropH, 'at', cropLeft, ',', cropTop);

  // 2. Create base sprite: crop -> resize -> pixelate
  const baseBuffer = await sharp(srcImg)
    .extract({ left: cropLeft, top: cropTop, width: cropW, height: cropH })
    .resize(TARGET_W, TARGET_H, { fit: 'fill' })
    .png()
    .toBuffer();

  // Save base standing sprite
  const standingPath = path.join(outDir, 'nvdi_standing.png');
  await sharp(baseBuffer).toFile(standingPath);
  console.log('Saved:', standingPath);

  // 3. Create run frame 1 (slight lean forward)
  const run1Buffer = await sharp(srcImg)
    .extract({ left: cropLeft - 10, top: cropTop, width: cropW, height: cropH })
    .resize(TARGET_W, TARGET_H, { fit: 'fill' })
    .rotate(2) // slight forward lean
    .png()
    .toBuffer();
  const run1Path = path.join(outDir, 'nvdi_run1.png');
  await sharp(run1Buffer).toFile(run1Path);
  console.log('Saved:', run1Path);

  // 4. Create run frame 2 (slight lean back)
  const run2Buffer = await sharp(srcImg)
    .extract({ left: cropLeft + 10, top: cropTop, width: cropW, height: cropH })
    .resize(TARGET_W, TARGET_H, { fit: 'fill' })
    .rotate(-2) // slight backward lean
    .png()
    .toBuffer();
  const run2Path = path.join(outDir, 'nvdi_run2.png');
  await sharp(run2Buffer).toFile(run2Path);
  console.log('Saved:', run2Path);

  // 5. Create jump frame (legs together, slightly compressed)
  const jumpBuffer = await sharp(srcImg)
    .extract({ left: cropLeft, top: cropTop + 20, width: cropW, height: cropH - 20 })
    .resize(TARGET_W, Math.floor(TARGET_H * 0.9), { fit: 'fill' })
    .rotate(-5) // slight upward tilt
    .png()
    .toBuffer();
  const jumpPath = path.join(outDir, 'nvdi_jump.png');
  await sharp(jumpBuffer).toFile(jumpPath);
  console.log('Saved:', jumpPath);

  // 6. Create crouch frame (squished)
  const crouchBuffer = await sharp(srcImg)
    .extract({ left: cropLeft, top: cropTop + 40, width: cropW, height: cropH - 40 })
    .resize(TARGET_W, Math.floor(TARGET_H * 0.6), { fit: 'fill' })
    .png()
    .toBuffer();
  const crouchPath = path.join(outDir, 'nvdi_crouch.png');
  await sharp(crouchBuffer).toFile(crouchPath);
  console.log('Saved:', crouchPath);

  // 7. Create die frame (lying down - rotate 90)
  const dieBuffer = await sharp(srcImg)
    .extract({ left: cropLeft, top: cropTop + 60, width: cropW, height: cropH - 60 })
    .resize(TARGET_W, TARGET_H, { fit: 'fill' })
    .rotate(90)
    .png()
    .toBuffer();
  const diePath = path.join(outDir, 'nvdi_die.png');
  await sharp(dieBuffer).toFile(diePath);
  console.log('Saved:', diePath);

  // 8. Create a larger menu portrait (bigger, more detailed)
  const portraitW = 120;
  const portraitH = 180;
  const portraitBuffer = await sharp(srcImg)
    .extract({ left: cropLeft, top: cropTop, width: cropW, height: cropH })
    .resize(portraitW, portraitH, { fit: 'fill' })
    .png()
    .toBuffer();
  const portraitPath = path.join(outDir, 'nvdi_portrait.png');
  await sharp(portraitBuffer).toFile(portraitPath);
  console.log('Saved:', portraitPath);

  console.log('\nAll sprites generated!');
  console.log('Output dir:', outDir);
}

processImage().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
