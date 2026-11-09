/**
 * Generates all PWA/favicon PNGs from assets/icon-source.png.
 * Run with: npm run icons
 */
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const SOURCE = join(root, 'assets', 'icon-source.png')
const ICONS_DIR = join(root, 'public', 'icons')

await mkdir(ICONS_DIR, { recursive: true })

const jobs = [
  { file: join(ICONS_DIR, 'icon-512.png'), size: 512, maskable: false },
  { file: join(ICONS_DIR, 'icon-192.png'), size: 192, maskable: false },
  { file: join(ICONS_DIR, 'icon-384.png'), size: 384, maskable: false },
  { file: join(root, 'public', 'apple-touch-icon.png'), size: 180, maskable: false },
  { file: join(ICONS_DIR, 'maskable-512.png'), size: 512, maskable: true },
]

for (const { file, size, maskable } of jobs) {
  if (maskable) {
    // Maskable: full-bleed brand background with the shield fitted inside the
    // 80% safe zone.
    const inner = Math.round(size * 0.8)
    const fg = await sharp(SOURCE).resize(inner, inner, { fit: 'cover' }).png().toBuffer()
    await sharp({
      create: { width: size, height: size, channels: 4, background: '#070b1a' },
    })
      .composite([{ input: fg, gravity: 'center' }])
      .png()
      .toFile(file)
  } else {
    await sharp(SOURCE).resize(size, size, { fit: 'cover' }).png().toFile(file)
  }
  console.log('wrote', file)
}

// Favicon PNG fallback (32px) for very old browsers.
await sharp(SOURCE)
  .resize(32, 32, { fit: 'cover' })
  .png()
  .toFile(join(root, 'public', 'favicon-32.png'))
console.log('wrote public/favicon-32.png')
