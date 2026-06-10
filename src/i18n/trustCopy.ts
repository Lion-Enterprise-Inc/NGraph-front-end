// 信頼の見せ方copy: アレルゲン信頼度連動表示 + 店主のひとこと
// NFGCard / MenuListDrawer で共有。対応言語は RESTRICTION_MATCH_NOTICE と同じセット。

// 「店主のひとこと」引用ブロックのラベル
const OWNER_COMMENT_LABEL: Record<string, string> = {
  ja: '店主のひとこと',
  en: 'From the owner',
  ko: '사장님 한마디',
  'zh-Hans': '店主寄语',
  'zh-Hant': '店主的話',
  es: 'Del dueño',
  fr: 'Le mot du patron',
  de: 'Vom Inhaber',
  it: 'Dal proprietario',
  pt: 'Do proprietário',
  ru: 'От владельца',
  th: 'จากเจ้าของร้าน',
  vi: 'Lời chủ quán',
  id: 'Dari pemilik',
  ms: 'Daripada pemilik',
  ar: 'من صاحب المطعم',
  hi: 'मालिक की ओर से',
  tr: 'İşletme sahibinden',
  bn: 'মালিকের পক্ষ থেকে',
  my: 'ဆိုင်ပိုင်ရှင်ထံမှ',
  tl: 'Mula sa may-ari',
  lo: 'ຈາກເຈົ້າຂອງຮ້ານ',
  km: 'ពីម្ចាស់ហាង',
  ne: 'मालिकबाट',
  mn: 'Эзэмшигчээс',
  fa: 'از طرف صاحب رستوران',
  uk: 'Від власника',
  pl: 'Od właściciela',
};

// アレルゲンが店主確認済み(rank S/A or 店主直接修正)の時のライン
const ALLERGEN_VERIFIED_NOTE: Record<string, string> = {
  ja: '店主確認済み',
  en: 'Owner-verified',
  ko: '사장님 확인 완료',
  'zh-Hans': '店主已确认',
  'zh-Hant': '店主已確認',
  es: 'Verificado por el dueño',
  fr: 'Vérifié par le patron',
  de: 'Vom Inhaber bestätigt',
  it: 'Verificato dal proprietario',
  pt: 'Verificado pelo proprietário',
  ru: 'Подтверждено владельцем',
  th: 'เจ้าของร้านยืนยันแล้ว',
  vi: 'Chủ quán đã xác nhận',
  id: 'Diverifikasi pemilik',
  ms: 'Disahkan pemilik',
  ar: 'تم التحقق من قبل المالك',
  hi: 'मालिक द्वारा सत्यापित',
  tr: 'İşletme sahibi onaylı',
  bn: 'মালিক দ্বারা যাচাইকৃত',
  my: 'ပိုင်ရှင် အတည်ပြုပြီး',
  tl: 'Beripikado ng may-ari',
  lo: 'ເຈົ້າຂອງຮ້ານຢືນຢັນແລ້ວ',
  km: 'ម្ចាស់ហាងបានបញ្ជាក់',
  ne: 'मालिकद्वारा प्रमाणित',
  mn: 'Эзэмшигч баталгаажуулсан',
  fa: 'تأیید شده توسط مالک',
  uk: 'Підтверджено власником',
  pl: 'Potwierdzone przez właściciela',
};

// AI推定のままの時のライン(安全に関わるので必ず「スタッフへ」を添える)
const ALLERGEN_AI_NOTE: Record<string, string> = {
  ja: 'AI推定 — 心配な場合はスタッフへ',
  en: 'AI estimate — check with staff if concerned',
  ko: 'AI 추정 — 걱정되시면 직원에게 확인해 주세요',
  'zh-Hans': 'AI推测 — 如有疑虑请咨询工作人员',
  'zh-Hant': 'AI推測 — 如有疑慮請洽詢工作人員',
  es: 'Estimación de IA — consulte al personal si tiene dudas',
  fr: 'Estimation IA — en cas de doute, demandez au personnel',
  de: 'KI-Schätzung — im Zweifel beim Personal nachfragen',
  it: 'Stima IA — in caso di dubbi chiedere al personale',
  pt: 'Estimativa de IA — em caso de dúvida, consulte a equipe',
  ru: 'Оценка ИИ — при сомнениях уточните у персонала',
  th: 'AI ประเมิน — หากกังวลกรุณาสอบถามพนักงาน',
  vi: 'AI ước tính — nếu lo ngại, hãy hỏi nhân viên',
  id: 'Perkiraan AI — jika ragu, tanyakan kepada staf',
  ms: 'Anggaran AI — jika ragu, tanya kakitangan',
  ar: 'تقدير بالذكاء الاصطناعي — يرجى سؤال الموظفين عند القلق',
  hi: 'AI अनुमान — चिंता होने पर स्टाफ से पूछें',
  tr: 'Yapay zekâ tahmini — endişeniz varsa personele sorun',
  bn: 'AI অনুমান — উদ্বেগ থাকলে কর্মীদের জিজ্ঞাসা করুন',
  my: 'AI ခန့်မှန်းချက် — စိုးရိမ်ပါက ဝန်ထမ်းကို မေးပါ',
  tl: 'Tantiya ng AI — itanong sa staff kung nag-aalala',
  lo: 'AI ປະເມີນ — ຖ້າກັງວົນ ກະລຸນາຖາມພະນັກງານ',
  km: 'ការប៉ាន់ស្មានដោយ AI — បើព្រួយបារម្ភ សូមសួរបុគ្គលិក',
  ne: 'AI अनुमान — चिन्ता भएमा स्टाफलाई सोध्नुहोस्',
  mn: 'AI таамаглал — санаа зовж байвал ажилтнаас асууна уу',
  fa: 'تخمین هوش مصنوعی — در صورت نگرانی از کارکنان بپرسید',
  uk: 'Оцінка ШІ — якщо є сумніви, запитайте персонал',
  pl: 'Szacunek AI — w razie wątpliwości zapytaj obsługę',
};

export const getOwnerCommentLabel = (lang: string): string =>
  OWNER_COMMENT_LABEL[lang] || OWNER_COMMENT_LABEL.en;

export const getAllergenTrustNote = (lang: string, verified: boolean): string =>
  verified
    ? (ALLERGEN_VERIFIED_NOTE[lang] || ALLERGEN_VERIFIED_NOTE.en)
    : (ALLERGEN_AI_NOTE[lang] || ALLERGEN_AI_NOTE.en);

// アレルゲンを店主確認済みとして出してよいか。
// BEの allergens_verified が正、未配信(旧キャッシュ等)の間は rank S/A でフォールバック。
export const isAllergensVerified = (item: {
  allergens_verified?: boolean;
  verification_rank?: string | null;
}): boolean =>
  item.allergens_verified ?? ['S', 'A'].includes((item.verification_rank || '').toUpperCase());
