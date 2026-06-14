// OMISEAI ブランドQR(角丸ドット+中央「お」マーク)の生成。
// 管理画面のQR発行とスタッフモードのリンク共有で共用する。

const MODULE_DARK = '#000000'
const OMISEAI_MARK_SRC = '/omiseai-mark.png'

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// 角丸ドット + 黒のファインダー + 中央ロゴ の OMISEAI 専用QRを描画し dataURL を返す
export async function renderStyledQR(text: string): Promise<string> {
  // qrcode は描画時のみ動的 import(SSR回避・バンドル最適化)
  const QRCode = (await import('qrcode')).default
  const qr = QRCode.create(text, { errorCorrectionLevel: 'H' })
  const count = qr.modules.size
  const data = qr.modules.data
  const moduleSize = 16
  const margin = 4
  const off = margin * moduleSize
  const px = (count + margin * 2) * moduleSize

  const canvas = document.createElement('canvas')
  canvas.width = px
  canvas.height = px
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas context unavailable')

  ctx.fillStyle = '#ffffff'
  roundRect(ctx, 0, 0, px, px, moduleSize * 3)
  ctx.fill()

  const isDark = (r: number, c: number): boolean =>
    r >= 0 && c >= 0 && r < count && c < count && !!data[r * count + c]

  const inFinder = (r: number, c: number): boolean => {
    const inTL = r < 7 && c < 7
    const inTR = r < 7 && c >= count - 7
    const inBL = r >= count - 7 && c < 7
    return inTL || inTR || inBL
  }

  ctx.fillStyle = MODULE_DARK
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (!isDark(r, c) || inFinder(r, c)) continue
      const x = off + c * moduleSize
      const y = off + r * moduleSize
      roundRect(ctx, x, y, moduleSize, moduleSize, moduleSize * 0.12)
      ctx.fill()
    }
  }

  const drawEye = (rowStart: number, colStart: number): void => {
    const x = off + colStart * moduleSize
    const y = off + rowStart * moduleSize
    const s = 7 * moduleSize
    ctx.fillStyle = MODULE_DARK
    roundRect(ctx, x, y, s, s, moduleSize * 2)
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    roundRect(ctx, x + moduleSize, y + moduleSize, s - 2 * moduleSize, s - 2 * moduleSize, moduleSize * 1.4)
    ctx.fill()
    ctx.fillStyle = MODULE_DARK
    roundRect(ctx, x + moduleSize * 2, y + moduleSize * 2, moduleSize * 3, moduleSize * 3, moduleSize * 0.9)
    ctx.fill()
  }
  drawEye(0, 0)
  drawEye(0, count - 7)
  drawEye(count - 7, 0)

  try {
    const logo = await loadImage(OMISEAI_MARK_SRC)
    const logoSize = px * 0.20
    const cx = px / 2
    const cy = px / 2
    const radius = logoSize / 2 + moduleSize * 0.7
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.drawImage(logo, cx - logoSize / 2, cy - logoSize / 2, logoSize, logoSize)
  } catch {
    // マーク読み込み失敗時はロゴ無しQRをそのまま使う
  }

  return canvas.toDataURL('image/png')
}
