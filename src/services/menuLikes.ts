/**
 * ♡ ハート API クライアント + localStorage 永続化。
 *
 * 設計:
 * - fingerprint: 初回アクセスで UUID 生成、localStorage 永続。device 単位の重複防止用。
 * - liked menu UIDs: localStorage に Set として保持。即時 UI 反映 + お気に入りタブ用。
 * - 楽観的更新: タップで即時 UI 反映、API 失敗時のみ revert。
 *
 * 端末横断のお気に入り同期はあえてやらない（プライバシー優先・ログイン不要）。
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://dev-backend.ngraph.jp/api';

const FINGERPRINT_KEY = 'omiseai_fp';
// 既存のローカル保存キー（NGraph 時代から）を踏襲してマイグレ不要にする
const LIKED_MENUS_KEY = 'ngraph_liked_menus';

/** localStorage から fingerprint を取得（無ければ生成して保存）。SSR 安全。 */
export function getFingerprint(): string {
  if (typeof window === 'undefined') return '';
  let fp = window.localStorage.getItem(FINGERPRINT_KEY);
  if (!fp) {
    fp = generateUuid();
    window.localStorage.setItem(FINGERPRINT_KEY, fp);
  }
  return fp;
}

/** crypto.randomUUID() フォールバック付き UUID 生成。 */
function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // RFC4122 v4 風 fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** localStorage の liked menu UID Set を取得（SSR 安全）。 */
export function getLikedMenuUids(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(LIKED_MENUS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed) : new Set();
  } catch {
    return new Set();
  }
}

/** localStorage の liked menu UID Set を上書き。 */
function persistLikedMenuUids(uids: Set<string>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LIKED_MENUS_KEY, JSON.stringify([...uids]));
  } catch {
    // quota 超過等は黙殺（UI は反映済）
  }
}

export interface LikeToggleResponse {
  liked: boolean;
  like_count: number;
}

export interface LikeStatusResponse {
  liked: boolean;
  like_count: number;
}

/**
 * ♡ トグル API。成功時 localStorage も同期。
 * Optimistic update は呼び出し側で実施（即時 UI 反映のため）。
 */
export async function toggleMenuLike(
  menuUid: string,
  options: { threadUid?: string | null } = {}
): Promise<LikeToggleResponse> {
  const fingerprint = getFingerprint();
  const res = await fetch(`${API_BASE}/menus/${menuUid}/like-toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fingerprint,
      thread_uid: options.threadUid ?? null,
    }),
  });
  if (!res.ok) {
    throw new Error(`like-toggle failed: ${res.status}`);
  }
  const data: LikeToggleResponse = await res.json();
  // localStorage 同期
  const liked = getLikedMenuUids();
  if (data.liked) {
    liked.add(menuUid);
  } else {
    liked.delete(menuUid);
  }
  persistLikedMenuUids(liked);
  return data;
}

/** 指定メニューの現在の liked + like_count を取得。 */
export async function getMenuLikeStatus(
  menuUid: string
): Promise<LikeStatusResponse> {
  const fingerprint = getFingerprint();
  const res = await fetch(
    `${API_BASE}/menus/${menuUid}/like-status?fingerprint=${encodeURIComponent(fingerprint)}`,
    { method: 'GET' }
  );
  if (!res.ok) {
    throw new Error(`like-status failed: ${res.status}`);
  }
  return res.json();
}

export interface PopularMenuItem {
  menu_uid: string;
  name_jp: string;
  name_en?: string | null;
  price: number;
  category?: string | null;
  image_url?: string | null;
  like_count: number;
  rank: number;
}

/** 店舗内 ♡ Top N。ハンバーガー「人気ランキング」タブで使う。 */
export async function getPopularMenus(
  restaurantSlug: string,
  limit = 10
): Promise<PopularMenuItem[]> {
  const res = await fetch(
    `${API_BASE}/menus/popular/${encodeURIComponent(restaurantSlug)}?limit=${limit}`
  );
  if (!res.ok) {
    throw new Error(`popular menus failed: ${res.status}`);
  }
  const data: { result: PopularMenuItem[] } = await res.json();
  return data.result;
}
