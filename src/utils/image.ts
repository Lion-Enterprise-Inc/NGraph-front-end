// アップロード前のクライアント側画像縮小。
// スマホ原寸(数MB)を4G/LINE内ブラウザから投げると、アップロード+AI解析の合計が
// 内蔵ブラウザのfetch忍耐を超えて「接続エラー」になる(2026-06-11 acoya実機で発生)。
// 長辺1600px/JPEG品質0.85まで落とす(メニュー文字のOCRには十分、HP案件の配信ルールと同基準)。

const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.85;

export async function downscaleImage(file: File): Promise<File> {
  // 画像以外・小さいファイル(300KB未満)はそのまま
  if (!file.type.startsWith('image/') || file.size < 300 * 1024) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
    // 縮小不要でもJPEG再エンコードで重いPNG/HEIC由来を軽くする
    const w = Math.round(width * scale);
    const h = Math.round(height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
    );
    if (!blob || blob.size >= file.size) return file; // 縮小で逆に膨れたら原本
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    // createImageBitmap非対応・デコード失敗時は原本のまま(機能は落とさない)
    return file;
  }
}
