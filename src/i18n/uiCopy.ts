export type LanguageOption = {
  code: string;
  label: string;
};

export const languageOptions: LanguageOption[] = [
  { code: "en", label: "English" },
  { code: "zh-Hans", label: "简体中文" },
  { code: "zh-Hant", label: "繁體中文" },
  { code: "ko", label: "한국어" },
  { code: "ja", label: "日本語" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
  { code: "pt", label: "Português" },
  { code: "ru", label: "Русский" },
  { code: "th", label: "ไทย" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "id", label: "Bahasa Indonesia" },
  { code: "ms", label: "Bahasa Melayu" },
  { code: "ar", label: "العربية" },
  { code: "hi", label: "हिन्दी" },
  { code: "tr", label: "Türkçe" },
  { code: "bn", label: "বাংলা / Bengali" },
  { code: "my", label: "မြန်မာဘာသာ" },
  { code: "tl", label: "Filipino / Tagalog" },
  { code: "lo", label: "ລາວ" },
  { code: "km", label: "ភាសាខ្មែរ" },
  { code: "ne", label: "नेपाली" },
  { code: "mn", label: "Монгол" },
  { code: "fa", label: "فارسی" },
  { code: "uk", label: "Українська" },
  { code: "pl", label: "Polski" },
];

const languageLabelMap = new Map(
  languageOptions.map((option) => [option.code, option.label])
);

export type LanguageCode = (typeof languageOptions)[number]["code"];

type DeepStringify<T> = T extends string ? string : T extends object ? { [K in keyof T]: DeepStringify<T[K]> } : T;

const uiCopy = {
  en: {
    common: {
      back: "Back",
      reload: "Reload",
      translate: "Translate",
      openCamera: "Open camera",
      menu: "Menu",
      guide: "Guide",
    },
    language: {
      change: "Change language",
      select: "Select language",
      list: "Language list",
      modalTitle: "Language",
      fallback: "Language",
    },
    drawer: {
      historyLabel: "History drawer",
    },
    home: {
      bannerLabel: "Banner",
      bannerAlt: "Banner",
    },
    cta: {
      go: "Go",
      continue: "Continue",
    },
    captureHeader: {
      menu: "Menu",
      scan: "Scan",
    },
    cameraPrompt: {
      openCamera: "Open camera",
    },
    chat: {
      uploadPreview: "Upload preview",
      removeAttachment: "Remove attachment",
      tapToOpen: "Tap to open input",
      camera: "Chat camera",
      gallery: "Chat gallery",
      messageInput: "Message input",
      sendMessage: "Send message",
      send: "Send",
      sendDisabled: "Send disabled",
      attachmentGuide: "Your AI guide — Ask me anything.",
    },
    attachment: {
      cameraPhoto: "Camera photo",
      photoLibrary: "Photo library",
    },
    camera: {
      unavailable: "Camera unavailable",
      close: "Close",
      translate: "Translate",
      openGallery: "Open gallery",
      capturePhoto: "Capture photo",
      flipCamera: "Flip camera",
    },
    admin: {
      brand: "HashiGo Admin",
      back: "Back",
      closeMenu: "Close menu",
      toggleMenu: "Toggle menu",
      nav: {
        stores: "Stores",
        groups: "Groups",
        prompt: "Prompt",
        logout: "Logout",
      },
      title: {
        stores: "Stores",
      },
    },
    browser: {
      chromeMock: "Browser chrome mock",
    },
    history: {
      title: "History title...",
    },
    hero: {
      heading: "Snap & Translate",
      sub: "Tap the camera to start",
    },
    explore: {
      title: "Explore HashiGo",
      subtitle: "Explore with HashiGo",
      placeholder: "Ask about the area...",
    },
    suggestions: {
      guide: "Your AI guide — Ask me anything.",
      chips: ["How to use it?", "What can it do?", "Dining etiquette"],
    },
  },
  ja: {
    common: {
      back: "戻る",
      reload: "再読み込み",
      translate: "翻訳",
      openCamera: "カメラを開く",
      menu: "メニュー",
      guide: "ガイド",
    },
    language: {
      change: "言語を変更",
      select: "言語を選択",
      list: "言語一覧",
      modalTitle: "言語",
      fallback: "言語",
    },
    drawer: {
      historyLabel: "履歴ドロワー",
    },
    home: {
      bannerLabel: "バナー",
      bannerAlt: "バナー",
    },
    cta: {
      go: "進む",
      continue: "続ける",
    },
    captureHeader: {
      menu: "メニュー",
      scan: "翻訳",
    },
    cameraPrompt: {
      openCamera: "カメラを開く",
    },
    chat: {
      uploadPreview: "アップロードプレビュー",
      removeAttachment: "添付を削除",
      tapToOpen: "タップで入力を開く",
      camera: "チャットカメラ",
      gallery: "チャットギャラリー",
      messageInput: "メッセージ入力",
      sendMessage: "送信",
      send: "送信",
      sendDisabled: "送信（無効）",
      attachmentGuide: "AIガイドです。何でも聞いて下さい。",
    },
    attachment: {
      cameraPhoto: "カメラ写真",
      photoLibrary: "フォトライブラリ",
    },
    camera: {
      unavailable: "カメラを利用できません",
      close: "閉じる",
      translate: "翻訳",
      openGallery: "ギャラリーを開く",
      capturePhoto: "写真を撮影",
      flipCamera: "カメラ切替",
    },
    admin: {
      brand: "HashiGo Admin",
      back: "戻る",
      closeMenu: "メニューを閉じる",
      toggleMenu: "メニュー切替",
      nav: {
        stores: "店舗",
        groups: "グループ",
        prompt: "プロンプト",
        logout: "ログアウト",
      },
      title: {
        stores: "店舗",
      },
    },
    browser: {
      chromeMock: "ブラウザUIモック",
    },
    history: {
      title: "履歴タイトル・・・",
    },
    hero: {
      heading: "撮って翻訳",
      sub: "カメラタップでスタート",
    },
    explore: {
      title: "HashiGo を探索",
      subtitle: "HashiGo と一緒に探索",
      placeholder: "周辺について質問...",
    },
    suggestions: {
      guide: "AIガイドです。何でも聞いて下さい。",
      chips: ["どう使うの？", "何ができるの？", "和食のマナー"],
    },
  },
  ko: {
    common: {
      back: "뒤로",
      reload: "새로고침",
      translate: "번역",
      openCamera: "카메라 열기",
      menu: "메뉴",
      guide: "가이드",
    },
    language: {
      change: "언어 변경",
      select: "언어 선택",
      list: "언어 목록",
      modalTitle: "언어",
      fallback: "언어",
    },
    drawer: {
      historyLabel: "기록 서랍",
    },
    home: {
      bannerLabel: "배너",
      bannerAlt: "배너",
    },
    cta: {
      go: "이동",
      continue: "계속",
    },
    captureHeader: {
      menu: "메뉴",
      scan: "번역",
    },
    cameraPrompt: {
      openCamera: "카메라 열기",
    },
    chat: {
      uploadPreview: "업로드 미리보기",
      removeAttachment: "첨부 삭제",
      tapToOpen: "탭하여 입력 열기",
      camera: "채팅 카메라",
      gallery: "채팅 갤러리",
      messageInput: "메시지 입력",
      sendMessage: "메시지 전송",
      send: "전송",
      sendDisabled: "전송 비활성",
      attachmentGuide: "AI 가이드입니다. 무엇이든 물어보세요.",
    },
    attachment: {
      cameraPhoto: "카메라 사진",
      photoLibrary: "사진 라이브러리",
    },
    camera: {
      unavailable: "카메라를 사용할 수 없습니다",
      close: "닫기",
      translate: "번역",
      openGallery: "갤러리 열기",
      capturePhoto: "사진 촬영",
      flipCamera: "카메라 전환",
    },
    admin: {
      brand: "HashiGo Admin",
      back: "뒤로",
      closeMenu: "메뉴 닫기",
      toggleMenu: "메뉴 토글",
      nav: {
        stores: "매장",
        groups: "그룹",
        prompt: "프롬프트",
        logout: "로그아웃",
      },
      title: {
        stores: "매장",
      },
    },
    browser: {
      chromeMock: "브라우저 UI 모형",
    },
    history: {
      title: "기록 제목...",
    },
    hero: {
      heading: "찍고 번역",
      sub: "카메라를 눌러 시작",
    },
    explore: {
      title: "HashiGo 탐색",
      subtitle: "HashiGo와 함께 탐색",
      placeholder: "주변에 대해 물어보세요...",
    },
    suggestions: {
      guide: "AI 가이드입니다. 무엇이든 물어보세요.",
      chips: ["어떻게 써요?", "무엇이 가능해요?", "식사 예절"],
    },
  },
  "zh-Hans": {
    common: {
      back: "返回",
      reload: "刷新",
      translate: "翻译",
      openCamera: "打开相机",
      menu: "菜单",
      guide: "指南",
    },
    language: {
      change: "更改语言",
      select: "选择语言",
      list: "语言列表",
      modalTitle: "语言",
      fallback: "语言",
    },
    drawer: {
      historyLabel: "历史抽屉",
    },
    home: {
      bannerLabel: "横幅",
      bannerAlt: "横幅",
    },
    cta: {
      go: "去",
      continue: "继续",
    },
    captureHeader: {
      menu: "菜单",
      scan: "扫描",
    },
    cameraPrompt: {
      openCamera: "打开相机",
    },
    chat: {
      uploadPreview: "上传预览",
      removeAttachment: "移除附件",
      tapToOpen: "点击打开输入",
      camera: "聊天相机",
      gallery: "聊天相册",
      messageInput: "消息输入",
      sendMessage: "发送消息",
      send: "发送",
      sendDisabled: "发送不可用",
      attachmentGuide: "你的AI向导，随时提问。",
    },
    attachment: {
      cameraPhoto: "相机照片",
      photoLibrary: "相册",
    },
    camera: {
      unavailable: "相机不可用",
      close: "关闭",
      translate: "翻译",
      openGallery: "打开相册",
      capturePhoto: "拍照",
      flipCamera: "切换相机",
    },
    admin: {
      brand: "HashiGo Admin",
      back: "返回",
      closeMenu: "关闭菜单",
      toggleMenu: "切换菜单",
      nav: {
        stores: "门店",
        groups: "分组",
        prompt: "提示",
        logout: "退出登录",
      },
      title: {
        stores: "门店",
      },
    },
    browser: {
      chromeMock: "浏览器外观模拟",
    },
    history: {
      title: "历史标题...",
    },
    hero: {
      heading: "拍照翻译",
      sub: "点击相机开始",
    },
    explore: {
      title: "探索 HashiGo",
      subtitle: "与 HashiGo 一起探索",
      placeholder: "询问附近...",
    },
    suggestions: {
      guide: "你的AI向导，随时提问。",
      chips: ["如何使用？", "能做什么？", "用餐礼仪"],
    },
  },
  "zh-Hant": {
    common: {
      back: "返回",
      reload: "重新整理",
      translate: "翻譯",
      openCamera: "開啟相機",
      menu: "選單",
      guide: "指南",
    },
    language: {
      change: "更改語言",
      select: "選擇語言",
      list: "語言清單",
      modalTitle: "語言",
      fallback: "語言",
    },
    drawer: {
      historyLabel: "歷史抽屜",
    },
    home: {
      bannerLabel: "橫幅",
      bannerAlt: "橫幅",
    },
    cta: {
      go: "前往",
      continue: "繼續",
    },
    captureHeader: {
      menu: "選單",
      scan: "掃描",
    },
    cameraPrompt: {
      openCamera: "開啟相機",
    },
    chat: {
      uploadPreview: "上傳預覽",
      removeAttachment: "移除附件",
      tapToOpen: "點擊開啟輸入",
      camera: "聊天相機",
      gallery: "聊天相簿",
      messageInput: "訊息輸入",
      sendMessage: "發送訊息",
      send: "發送",
      sendDisabled: "發送已停用",
      attachmentGuide: "你的 AI 導覽，隨時提問。",
    },
    attachment: {
      cameraPhoto: "相機照片",
      photoLibrary: "相簿",
    },
    camera: {
      unavailable: "相機無法使用",
      close: "關閉",
      translate: "翻譯",
      openGallery: "開啟相簿",
      capturePhoto: "拍照",
      flipCamera: "切換相機",
    },
    admin: {
      brand: "HashiGo Admin",
      back: "返回",
      closeMenu: "關閉選單",
      toggleMenu: "切換選單",
      nav: {
        stores: "門市",
        groups: "群組",
        prompt: "提示",
        logout: "登出",
      },
      title: {
        stores: "門市",
      },
    },
    browser: {
      chromeMock: "瀏覽器介面模擬",
    },
    history: {
      title: "歷史標題...",
    },
    hero: {
      heading: "拍照翻譯",
      sub: "點擊相機開始",
    },
    explore: {
      title: "探索 HashiGo",
      subtitle: "與 HashiGo 一起探索",
      placeholder: "詢問附近...",
    },
    suggestions: {
      guide: "你的 AI 導覽，隨時提問。",
      chips: ["如何使用？", "能做什麼？", "用餐禮儀"],
    },
  },
  es: {
    common: {
      back: "Atrás",
      reload: "Recargar",
      translate: "Traducir",
      openCamera: "Abrir cámara",
      menu: "Menú",
      guide: "Guía",
    },
    language: {
      change: "Cambiar idioma",
      select: "Seleccionar idioma",
      list: "Lista de idiomas",
      modalTitle: "Idioma",
      fallback: "Idioma",
    },
    drawer: {
      historyLabel: "Cajón de historial",
    },
    home: {
      bannerLabel: "Banner",
      bannerAlt: "Banner",
    },
    cta: {
      go: "Ir",
      continue: "Continuar",
    },
    captureHeader: {
      menu: "Menú",
      scan: "Escanear",
    },
    cameraPrompt: {
      openCamera: "Abrir cámara",
    },
    chat: {
      uploadPreview: "Vista previa de carga",
      removeAttachment: "Quitar adjunto",
      tapToOpen: "Toca para abrir la entrada",
      camera: "Cámara de chat",
      gallery: "Galería de chat",
      messageInput: "Entrada de mensaje",
      sendMessage: "Enviar mensaje",
      send: "Enviar",
      sendDisabled: "Envío deshabilitado",
      attachmentGuide: "Tu guía de IA. Pregunta lo que quieras.",
    },
    attachment: {
      cameraPhoto: "Foto de cámara",
      photoLibrary: "Biblioteca de fotos",
    },
    camera: {
      unavailable: "Cámara no disponible",
      close: "Cerrar",
      translate: "Traducir",
      openGallery: "Abrir galería",
      capturePhoto: "Tomar foto",
      flipCamera: "Cambiar cámara",
    },
    admin: {
      brand: "HashiGo Admin",
      back: "Atrás",
      closeMenu: "Cerrar menú",
      toggleMenu: "Alternar menú",
      nav: {
        stores: "Tiendas",
        groups: "Grupos",
        prompt: "Prompt",
        logout: "Cerrar sesión",
      },
      title: {
        stores: "Tiendas",
      },
    },
    browser: {
      chromeMock: "Maqueta de navegador",
    },
    history: {
      title: "Título de historial...",
    },
    hero: {
      heading: "Foto y traduce",
      sub: "Toca la cámara para empezar",
    },
    explore: {
      title: "Explora HashiGo",
      subtitle: "Explora con HashiGo",
      placeholder: "Pregunta sobre la zona...",
    },
    suggestions: {
      guide: "Tu guía de IA. Pregunta lo que quieras.",
      chips: ["¿Cómo se usa?", "¿Qué puede hacer?", "Etiqueta en la mesa"],
    },
  },
  fr: {
    common: {
      back: "Retour",
      reload: "Recharger",
      translate: "Traduire",
      openCamera: "Ouvrir la caméra",
      menu: "Menu",
      guide: "Guide",
    },
    language: {
      change: "Changer de langue",
      select: "Sélectionner la langue",
      list: "Liste des langues",
      modalTitle: "Langue",
      fallback: "Langue",
    },
    drawer: {
      historyLabel: "Tiroir d'historique",
    },
    home: {
      bannerLabel: "Bannière",
      bannerAlt: "Bannière",
    },
    cta: {
      go: "Aller",
      continue: "Continuer",
    },
    captureHeader: {
      menu: "Menu",
      scan: "Scanner",
    },
    cameraPrompt: {
      openCamera: "Ouvrir la caméra",
    },
    chat: {
      uploadPreview: "Aperçu du téléversement",
      removeAttachment: "Retirer la pièce jointe",
      tapToOpen: "Touchez pour ouvrir la saisie",
      camera: "Caméra du chat",
      gallery: "Galerie du chat",
      messageInput: "Saisie de message",
      sendMessage: "Envoyer le message",
      send: "Envoyer",
      sendDisabled: "Envoi désactivé",
      attachmentGuide: "Votre guide IA. Demandez-moi n'importe quoi.",
    },
    attachment: {
      cameraPhoto: "Photo de la caméra",
      photoLibrary: "Photothèque",
    },
    camera: {
      unavailable: "Caméra indisponible",
      close: "Fermer",
      translate: "Traduire",
      openGallery: "Ouvrir la galerie",
      capturePhoto: "Prendre une photo",
      flipCamera: "Changer de caméra",
    },
    admin: {
      brand: "HashiGo Admin",
      back: "Retour",
      closeMenu: "Fermer le menu",
      toggleMenu: "Basculer le menu",
      nav: {
        stores: "Boutiques",
        groups: "Groupes",
        prompt: "Prompt",
        logout: "Déconnexion",
      },
      title: {
        stores: "Boutiques",
      },
    },
    browser: {
      chromeMock: "Maquette de navigateur",
    },
    history: {
      title: "Titre d'historique...",
    },
    hero: {
      heading: "Prenez et traduisez",
      sub: "Touchez la caméra pour commencer",
    },
    explore: {
      title: "Explorer HashiGo",
      subtitle: "Explorez avec HashiGo",
      placeholder: "Demandez à propos des environs...",
    },
    suggestions: {
      guide: "Votre guide IA. Demandez-moi n'importe quoi.",
      chips: ["Comment l'utiliser ?", "Que peut-il faire ?", "Étiquette à table"],
    },
  },
  de: {
    common: {
      back: "Zurück",
      reload: "Neu laden",
      translate: "Übersetzen",
      openCamera: "Kamera öffnen",
      menu: "Menü",
      guide: "Leitfaden",
    },
    language: {
      change: "Sprache ändern",
      select: "Sprache auswählen",
      list: "Sprachliste",
      modalTitle: "Sprache",
      fallback: "Sprache",
    },
    drawer: {
      historyLabel: "Verlaufsschublade",
    },
    home: {
      bannerLabel: "Banner",
      bannerAlt: "Banner",
    },
    cta: {
      go: "Los",
      continue: "Weiter",
    },
    captureHeader: {
      menu: "Menü",
      scan: "Scannen",
    },
    cameraPrompt: {
      openCamera: "Kamera öffnen",
    },
    chat: {
      uploadPreview: "Upload-Vorschau",
      removeAttachment: "Anhang entfernen",
      tapToOpen: "Tippen, um die Eingabe zu öffnen",
      camera: "Chat-Kamera",
      gallery: "Chat-Galerie",
      messageInput: "Nachrichteneingabe",
      sendMessage: "Nachricht senden",
      send: "Senden",
      sendDisabled: "Senden deaktiviert",
      attachmentGuide: "Dein KI-Guide. Frag mich alles.",
    },
    attachment: {
      cameraPhoto: "Kamerafoto",
      photoLibrary: "Fotomediathek",
    },
    camera: {
      unavailable: "Kamera nicht verfügbar",
      close: "Schließen",
      translate: "Übersetzen",
      openGallery: "Galerie öffnen",
      capturePhoto: "Foto aufnehmen",
      flipCamera: "Kamera wechseln",
    },
    admin: {
      brand: "HashiGo Admin",
      back: "Zurück",
      closeMenu: "Menü schließen",
      toggleMenu: "Menü umschalten",
      nav: {
        stores: "Filialen",
        groups: "Gruppen",
        prompt: "Prompt",
        logout: "Abmelden",
      },
      title: {
        stores: "Filialen",
      },
    },
    browser: {
      chromeMock: "Browser-UI-Mock",
    },
    history: {
      title: "Verlaufstitel...",
    },
    hero: {
      heading: "Knipsen & Übersetzen",
      sub: "Tippe auf die Kamera, um zu starten",
    },
    explore: {
      title: "HashiGo entdecken",
      subtitle: "Entdecke mit HashiGo",
      placeholder: "Frag nach der Umgebung...",
    },
    suggestions: {
      guide: "Dein KI-Guide. Frag mich alles.",
      chips: ["Wie nutzt man es?", "Was kann es?", "Tischmanieren"],
    },
  },
  it: {
    common: {
      back: "Indietro",
      reload: "Ricarica",
      translate: "Traduci",
      openCamera: "Apri fotocamera",
      menu: "Menu",
      guide: "Guida",
    },
    language: {
      change: "Cambia lingua",
      select: "Seleziona lingua",
      list: "Elenco lingue",
      modalTitle: "Lingua",
      fallback: "Lingua",
    },
    drawer: {
      historyLabel: "Cassetto cronologia",
    },
    home: {
      bannerLabel: "Banner",
      bannerAlt: "Banner",
    },
    cta: {
      go: "Vai",
      continue: "Continua",
    },
    captureHeader: {
      menu: "Menu",
      scan: "Scansiona",
    },
    cameraPrompt: {
      openCamera: "Apri fotocamera",
    },
    chat: {
      uploadPreview: "Anteprima caricamento",
      removeAttachment: "Rimuovi allegato",
      tapToOpen: "Tocca per aprire l'input",
      camera: "Fotocamera chat",
      gallery: "Galleria chat",
      messageInput: "Input messaggio",
      sendMessage: "Invia messaggio",
      send: "Invia",
      sendDisabled: "Invio disabilitato",
      attachmentGuide: "La tua guida AI. Chiedi qualsiasi cosa.",
    },
    attachment: {
      cameraPhoto: "Foto della fotocamera",
      photoLibrary: "Libreria foto",
    },
    camera: {
      unavailable: "Fotocamera non disponibile",
      close: "Chiudi",
      translate: "Traduci",
      openGallery: "Apri galleria",
      capturePhoto: "Scatta foto",
      flipCamera: "Cambia fotocamera",
    },
    admin: {
      brand: "HashiGo Admin",
      back: "Indietro",
      closeMenu: "Chiudi menu",
      toggleMenu: "Alterna menu",
      nav: {
        stores: "Negozi",
        groups: "Gruppi",
        prompt: "Prompt",
        logout: "Disconnetti",
      },
      title: {
        stores: "Negozi",
      },
    },
    browser: {
      chromeMock: "Mock browser",
    },
    history: {
      title: "Titolo cronologia...",
    },
    hero: {
      heading: "Scatta e traduci",
      sub: "Tocca la fotocamera per iniziare",
    },
    explore: {
      title: "Esplora HashiGo",
      subtitle: "Esplora con HashiGo",
      placeholder: "Chiedi della zona...",
    },
    suggestions: {
      guide: "La tua guida AI. Chiedi qualsiasi cosa.",
      chips: ["Come si usa?", "Cosa può fare?", "Galateo a tavola"],
    },
  },
  pt: {
    common: {
      back: "Voltar",
      reload: "Recarregar",
      translate: "Traduzir",
      openCamera: "Abrir câmera",
      menu: "Menu",
      guide: "Guia",
    },
    language: {
      change: "Mudar idioma",
      select: "Selecionar idioma",
      list: "Lista de idiomas",
      modalTitle: "Idioma",
      fallback: "Idioma",
    },
    drawer: {
      historyLabel: "Gaveta de histórico",
    },
    home: {
      bannerLabel: "Banner",
      bannerAlt: "Banner",
    },
    cta: {
      go: "Ir",
      continue: "Continuar",
    },
    captureHeader: {
      menu: "Menu",
      scan: "Escanear",
    },
    cameraPrompt: {
      openCamera: "Abrir câmera",
    },
    chat: {
      uploadPreview: "Prévia de envio",
      removeAttachment: "Remover anexo",
      tapToOpen: "Toque para abrir a entrada",
      camera: "Câmera do chat",
      gallery: "Galeria do chat",
      messageInput: "Entrada de mensagem",
      sendMessage: "Enviar mensagem",
      send: "Enviar",
      sendDisabled: "Envio desativado",
      attachmentGuide: "Seu guia de IA. Pergunte qualquer coisa.",
    },
    attachment: {
      cameraPhoto: "Foto da câmera",
      photoLibrary: "Biblioteca de fotos",
    },
    camera: {
      unavailable: "Câmera indisponível",
      close: "Fechar",
      translate: "Traduzir",
      openGallery: "Abrir galeria",
      capturePhoto: "Tirar foto",
      flipCamera: "Alternar câmera",
    },
    admin: {
      brand: "HashiGo Admin",
      back: "Voltar",
      closeMenu: "Fechar menu",
      toggleMenu: "Alternar menu",
      nav: {
        stores: "Lojas",
        groups: "Grupos",
        prompt: "Prompt",
        logout: "Sair",
      },
      title: {
        stores: "Lojas",
      },
    },
    browser: {
      chromeMock: "Mock do navegador",
    },
    history: {
      title: "Título do histórico...",
    },
    hero: {
      heading: "Fotografar e traduzir",
      sub: "Toque na câmera para começar",
    },
    explore: {
      title: "Explorar HashiGo",
      subtitle: "Explore com HashiGo",
      placeholder: "Pergunte sobre a área...",
    },
    suggestions: {
      guide: "Seu guia de IA. Pergunte qualquer coisa.",
      chips: ["Como usar?", "O que pode fazer?", "Etiqueta à mesa"],
    },
  },
  ru: {
    common: {
      back: "Назад",
      reload: "Обновить",
      translate: "Перевести",
      openCamera: "Открыть камеру",
      menu: "Меню",
      guide: "Руководство",
    },
    language: {
      change: "Изменить язык",
      select: "Выбрать язык",
      list: "Список языков",
      modalTitle: "Язык",
      fallback: "Язык",
    },
    drawer: {
      historyLabel: "Панель истории",
    },
    home: {
      bannerLabel: "Баннер",
      bannerAlt: "Баннер",
    },
    cta: {
      go: "Перейти",
      continue: "Продолжить",
    },
    captureHeader: {
      menu: "Меню",
      scan: "Сканировать",
    },
    cameraPrompt: {
      openCamera: "Открыть камеру",
    },
    chat: {
      uploadPreview: "Предпросмотр загрузки",
      removeAttachment: "Удалить вложение",
      tapToOpen: "Нажмите, чтобы открыть ввод",
      camera: "Камера чата",
      gallery: "Галерея чата",
      messageInput: "Поле сообщения",
      sendMessage: "Отправить сообщение",
      send: "Отправить",
      sendDisabled: "Отправка отключена",
      attachmentGuide: "Ваш ИИ‑гид. Спрашивайте что угодно.",
    },
    attachment: {
      cameraPhoto: "Фото с камеры",
      photoLibrary: "Фотобиблиотека",
    },
    camera: {
      unavailable: "Камера недоступна",
      close: "Закрыть",
      translate: "Перевести",
      openGallery: "Открыть галерею",
      capturePhoto: "Сделать фото",
      flipCamera: "Переключить камеру",
    },
    admin: {
      brand: "HashiGo Admin",
      back: "Назад",
      closeMenu: "Закрыть меню",
      toggleMenu: "Переключить меню",
      nav: {
        stores: "Магазины",
        groups: "Группы",
        prompt: "Промпт",
        logout: "Выйти",
      },
      title: {
        stores: "Магазины",
      },
    },
    browser: {
      chromeMock: "Макет интерфейса браузера",
    },
    history: {
      title: "Заголовок истории...",
    },
    hero: {
      heading: "Снимай и переводи",
      sub: "Нажмите на камеру, чтобы начать",
    },
    explore: {
      title: "Исследуйте HashiGo",
      subtitle: "Исследуйте с HashiGo",
      placeholder: "Спросите о месте...",
    },
    suggestions: {
      guide: "Ваш ИИ‑гид. Спрашивайте что угодно.",
      chips: ["Как пользоваться?", "Что умеет?", "Этикет за столом"],
    },
  },
  th: {
    common: {
      back: "กลับ",
      reload: "โหลดใหม่",
      translate: "แปล",
      openCamera: "เปิดกล้อง",
      menu: "เมนู",
      guide: "คู่มือ",
    },
    language: {
      change: "เปลี่ยนภาษา",
      select: "เลือกภาษา",
      list: "รายการภาษา",
      modalTitle: "ภาษา",
      fallback: "ภาษา",
    },
    drawer: {
      historyLabel: "ลิ้นชักประวัติ",
    },
    home: {
      bannerLabel: "แบนเนอร์",
      bannerAlt: "แบนเนอร์",
    },
    cta: {
      go: "ไป",
      continue: "ดำเนินต่อ",
    },
    captureHeader: {
      menu: "เมนู",
      scan: "สแกน",
    },
    cameraPrompt: {
      openCamera: "เปิดกล้อง",
    },
    chat: {
      uploadPreview: "ตัวอย่างอัปโหลด",
      removeAttachment: "ลบไฟล์แนบ",
      tapToOpen: "แตะเพื่อเปิดช่องพิมพ์",
      camera: "กล้องแชท",
      gallery: "แกลเลอรีแชท",
      messageInput: "ช่องพิมพ์ข้อความ",
      sendMessage: "ส่งข้อความ",
      send: "ส่ง",
      sendDisabled: "ส่งไม่ได้",
      attachmentGuide: "ผู้ช่วย AI ของคุณ ถามได้ทุกอย่าง",
    },
    attachment: {
      cameraPhoto: "ภาพจากกล้อง",
      photoLibrary: "คลังรูปภาพ",
    },
    camera: {
      unavailable: "ไม่สามารถใช้กล้องได้",
      close: "ปิด",
      translate: "แปล",
      openGallery: "เปิดแกลเลอรี",
      capturePhoto: "ถ่ายภาพ",
      flipCamera: "สลับกล้อง",
    },
    admin: {
      brand: "HashiGo Admin",
      back: "กลับ",
      closeMenu: "ปิดเมนู",
      toggleMenu: "สลับเมนู",
      nav: {
        stores: "ร้านค้า",
        groups: "กลุ่ม",
        prompt: "พรอมต์",
        logout: "ออกจากระบบ",
      },
      title: {
        stores: "ร้านค้า",
      },
    },
    browser: {
      chromeMock: "แบบจำลองเบราว์เซอร์",
    },
    history: {
      title: "ชื่อประวัติ...",
    },
    hero: {
      heading: "ถ่ายแล้วแปล",
      sub: "แตะกล้องเพื่อเริ่ม",
    },
    explore: {
      title: "สำรวจ HashiGo",
      subtitle: "สำรวจกับ HashiGo",
      placeholder: "ถามเกี่ยวกับบริเวณนี้...",
    },
    suggestions: {
      guide: "ผู้ช่วย AI ของคุณ ถามได้ทุกอย่าง",
      chips: ["ใช้อย่างไร?", "ทำอะไรได้บ้าง?", "มารยาทบนโต๊ะอาหาร"],
    },
  },
  vi: {
    common: {
      back: "Quay lại",
      reload: "Tải lại",
      translate: "Dịch",
      openCamera: "Mở camera",
      menu: "Menu",
      guide: "Hướng dẫn",
    },
    language: {
      change: "Đổi ngôn ngữ",
      select: "Chọn ngôn ngữ",
      list: "Danh sách ngôn ngữ",
      modalTitle: "Ngôn ngữ",
      fallback: "Ngôn ngữ",
    },
    drawer: {
      historyLabel: "Ngăn lịch sử",
    },
    home: {
      bannerLabel: "Biểu ngữ",
      bannerAlt: "Biểu ngữ",
    },
    cta: {
      go: "Đi",
      continue: "Tiếp tục",
    },
    captureHeader: {
      menu: "Menu",
      scan: "Quét",
    },
    cameraPrompt: {
      openCamera: "Mở camera",
    },
    chat: {
      uploadPreview: "Xem trước tải lên",
      removeAttachment: "Xóa tệp đính kèm",
      tapToOpen: "Chạm để mở nhập liệu",
      camera: "Camera chat",
      gallery: "Thư viện chat",
      messageInput: "Nhập tin nhắn",
      sendMessage: "Gửi tin nhắn",
      send: "Gửi",
      sendDisabled: "Gửi bị tắt",
      attachmentGuide: "Hướng dẫn AI của bạn. Hỏi bất cứ điều gì.",
    },
    attachment: {
      cameraPhoto: "Ảnh từ camera",
      photoLibrary: "Thư viện ảnh",
    },
    camera: {
      unavailable: "Không khả dụng camera",
      close: "Đóng",
      translate: "Dịch",
      openGallery: "Mở thư viện",
      capturePhoto: "Chụp ảnh",
      flipCamera: "Chuyển camera",
    },
    admin: {
      brand: "HashiGo Admin",
      back: "Quay lại",
      closeMenu: "Đóng menu",
      toggleMenu: "Chuyển menu",
      nav: {
        stores: "Cửa hàng",
        groups: "Nhóm",
        prompt: "Prompt",
        logout: "Đăng xuất",
      },
      title: {
        stores: "Cửa hàng",
      },
    },
    browser: {
      chromeMock: "Mô phỏng trình duyệt",
    },
    history: {
      title: "Tiêu đề lịch sử...",
    },
    hero: {
      heading: "Chụp và dịch",
      sub: "Chạm camera để bắt đầu",
    },
    explore: {
      title: "Khám phá HashiGo",
      subtitle: "Khám phá cùng HashiGo",
      placeholder: "Hỏi về khu vực...",
    },
    suggestions: {
      guide: "Hướng dẫn AI của bạn. Hỏi bất cứ điều gì.",
      chips: ["Dùng thế nào?", "Làm được gì?", "Quy tắc bàn ăn"],
    },
  },
  id: {
    common: {
      back: "Kembali",
      reload: "Muat ulang",
      translate: "Terjemahkan",
      openCamera: "Buka kamera",
      menu: "Menu",
      guide: "Panduan",
    },
    language: {
      change: "Ubah bahasa",
      select: "Pilih bahasa",
      list: "Daftar bahasa",
      modalTitle: "Bahasa",
      fallback: "Bahasa",
    },
    drawer: {
      historyLabel: "Laci riwayat",
    },
    home: {
      bannerLabel: "Banner",
      bannerAlt: "Banner",
    },
    cta: {
      go: "Pergi",
      continue: "Lanjut",
    },
    captureHeader: {
      menu: "Menu",
      scan: "Pindai",
    },
    cameraPrompt: {
      openCamera: "Buka kamera",
    },
    chat: {
      uploadPreview: "Pratinjau unggahan",
      removeAttachment: "Hapus lampiran",
      tapToOpen: "Ketuk untuk membuka input",
      camera: "Kamera chat",
      gallery: "Galeri chat",
      messageInput: "Input pesan",
      sendMessage: "Kirim pesan",
      send: "Kirim",
      sendDisabled: "Pengiriman dinonaktifkan",
      attachmentGuide: "Panduan AI Anda. Tanyakan apa saja.",
    },
    attachment: {
      cameraPhoto: "Foto kamera",
      photoLibrary: "Perpustakaan foto",
    },
    camera: {
      unavailable: "Kamera tidak tersedia",
      close: "Tutup",
      translate: "Terjemahkan",
      openGallery: "Buka galeri",
      capturePhoto: "Ambil foto",
      flipCamera: "Ganti kamera",
    },
    admin: {
      brand: "HashiGo Admin",
      back: "Kembali",
      closeMenu: "Tutup menu",
      toggleMenu: "Ganti menu",
      nav: {
        stores: "Toko",
        groups: "Grup",
        prompt: "Prompt",
        logout: "Keluar",
      },
      title: {
        stores: "Toko",
      },
    },
    browser: {
      chromeMock: "Mock browser",
    },
    history: {
      title: "Judul riwayat...",
    },
    hero: {
      heading: "Jepret & terjemahkan",
      sub: "Ketuk kamera untuk mulai",
    },
    explore: {
      title: "Jelajahi HashiGo",
      subtitle: "Jelajahi bersama HashiGo",
      placeholder: "Tanyakan tentang sekitar...",
    },
    suggestions: {
      guide: "Panduan AI Anda. Tanyakan apa saja.",
      chips: ["Cara pakai?", "Bisa apa?", "Etiket makan"],
    },
  },
  ms: {
    common: {
      back: "Kembali",
      reload: "Muat semula",
      translate: "Terjemah",
      openCamera: "Buka kamera",
      menu: "Menu",
      guide: "Panduan",
    },
    language: {
      change: "Tukar bahasa",
      select: "Pilih bahasa",
      list: "Senarai bahasa",
      modalTitle: "Bahasa",
      fallback: "Bahasa",
    },
    drawer: {
      historyLabel: "Laci sejarah",
    },
    home: {
      bannerLabel: "Banner",
      bannerAlt: "Banner",
    },
    cta: {
      go: "Pergi",
      continue: "Teruskan",
    },
    captureHeader: {
      menu: "Menu",
      scan: "Imbas",
    },
    cameraPrompt: {
      openCamera: "Buka kamera",
    },
    chat: {
      uploadPreview: "Pratonton muat naik",
      removeAttachment: "Buang lampiran",
      tapToOpen: "Ketik untuk buka input",
      camera: "Kamera sembang",
      gallery: "Galeri sembang",
      messageInput: "Input mesej",
      sendMessage: "Hantar mesej",
      send: "Hantar",
      sendDisabled: "Hantaran dinyahaktifkan",
      attachmentGuide: "Panduan AI anda. Tanya apa sahaja.",
    },
    attachment: {
      cameraPhoto: "Foto kamera",
      photoLibrary: "Perpustakaan foto",
    },
    camera: {
      unavailable: "Kamera tidak tersedia",
      close: "Tutup",
      translate: "Terjemah",
      openGallery: "Buka galeri",
      capturePhoto: "Ambil foto",
      flipCamera: "Tukar kamera",
    },
    admin: {
      brand: "HashiGo Admin",
      back: "Kembali",
      closeMenu: "Tutup menu",
      toggleMenu: "Tukar menu",
      nav: {
        stores: "Kedai",
        groups: "Kumpulan",
        prompt: "Prompt",
        logout: "Log keluar",
      },
      title: {
        stores: "Kedai",
      },
    },
    browser: {
      chromeMock: "Mock pelayar",
    },
    history: {
      title: "Tajuk sejarah...",
    },
    hero: {
      heading: "Ambil & terjemah",
      sub: "Ketik kamera untuk mula",
    },
    explore: {
      title: "Terokai HashiGo",
      subtitle: "Terokai bersama HashiGo",
      placeholder: "Tanya tentang kawasan...",
    },
    suggestions: {
      guide: "Panduan AI anda. Tanya apa sahaja.",
      chips: ["Cara guna?", "Apa boleh buat?", "Etiket makan"],
    },
  },
  ar: {
    common: {
      back: "رجوع",
      reload: "إعادة تحميل",
      translate: "ترجمة",
      openCamera: "فتح الكاميرا",
      menu: "قائمة",
      guide: "دليل",
    },
    language: {
      change: "تغيير اللغة",
      select: "اختيار اللغة",
      list: "قائمة اللغات",
      modalTitle: "اللغة",
      fallback: "اللغة",
    },
    drawer: {
      historyLabel: "درج السجل",
    },
    home: {
      bannerLabel: "لافتة",
      bannerAlt: "لافتة",
    },
    cta: {
      go: "اذهب",
      continue: "متابعة",
    },
    captureHeader: {
      menu: "قائمة",
      scan: "مسح",
    },
    cameraPrompt: {
      openCamera: "فتح الكاميرا",
    },
    chat: {
      uploadPreview: "معاينة الرفع",
      removeAttachment: "إزالة المرفق",
      tapToOpen: "اضغط لفتح الإدخال",
      camera: "كاميرا الدردشة",
      gallery: "معرض الدردشة",
      messageInput: "إدخال الرسالة",
      sendMessage: "إرسال الرسالة",
      send: "إرسال",
      sendDisabled: "الإرسال معطل",
      attachmentGuide: "دليلك الذكي. اسأل أي شيء.",
    },
    attachment: {
      cameraPhoto: "صورة الكاميرا",
      photoLibrary: "مكتبة الصور",
    },
    camera: {
      unavailable: "الكاميرا غير متاحة",
      close: "إغلاق",
      translate: "ترجمة",
      openGallery: "فتح المعرض",
      capturePhoto: "التقاط صورة",
      flipCamera: "تبديل الكاميرا",
    },
    admin: {
      brand: "HashiGo Admin",
      back: "رجوع",
      closeMenu: "إغلاق القائمة",
      toggleMenu: "تبديل القائمة",
      nav: {
        stores: "المتاجر",
        groups: "المجموعات",
        prompt: "Prompt",
        logout: "تسجيل الخروج",
      },
      title: {
        stores: "المتاجر",
      },
    },
    browser: {
      chromeMock: "نموذج واجهة المتصفح",
    },
    history: {
      title: "عنوان السجل...",
    },
    hero: {
      heading: "التقط وترجم",
      sub: "اضغط على الكاميرا للبدء",
    },
    explore: {
      title: "استكشف HashiGo",
      subtitle: "استكشف مع HashiGo",
      placeholder: "اسأل عن المنطقة...",
    },
    suggestions: {
      guide: "دليلك الذكي. اسأل أي شيء.",
      chips: ["كيف أستخدمه؟", "ماذا يمكنه أن يفعل؟", "آداب الطعام"],
    },
  },
  hi: {
    common: {
      back: "वापस",
      reload: "रीलोड",
      translate: "अनुवाद",
      openCamera: "कैमरा खोलें",
      menu: "मेनू",
      guide: "गाइड",
    },
    language: {
      change: "भाषा बदलें",
      select: "भाषा चुनें",
      list: "भाषा सूची",
      modalTitle: "भाषा",
      fallback: "भाषा",
    },
    drawer: {
      historyLabel: "इतिहास दराज",
    },
    home: {
      bannerLabel: "बैनर",
      bannerAlt: "बैनर",
    },
    cta: {
      go: "जाएं",
      continue: "जारी रखें",
    },
    captureHeader: {
      menu: "मेनू",
      scan: "स्कैन",
    },
    cameraPrompt: {
      openCamera: "कैमरा खोलें",
    },
    chat: {
      uploadPreview: "अपलोड पूर्वावलोकन",
      removeAttachment: "अटैचमेंट हटाएं",
      tapToOpen: "इनपुट खोलने के लिए टैप करें",
      camera: "चैट कैमरा",
      gallery: "चैट गैलरी",
      messageInput: "संदेश इनपुट",
      sendMessage: "संदेश भेजें",
      send: "भेजें",
      sendDisabled: "भेजना अक्षम",
      attachmentGuide: "आपका AI गाइड। कुछ भी पूछें।",
    },
    attachment: {
      cameraPhoto: "कैमरा फोटो",
      photoLibrary: "फोटो लाइब्रेरी",
    },
    camera: {
      unavailable: "कैमरा उपलब्ध नहीं",
      close: "बंद करें",
      translate: "अनुवाद",
      openGallery: "गैलरी खोलें",
      capturePhoto: "फोटो लें",
      flipCamera: "कैमरा बदलें",
    },
    admin: {
      brand: "HashiGo Admin",
      back: "वापस",
      closeMenu: "मेनू बंद करें",
      toggleMenu: "मेनू बदलें",
      nav: {
        stores: "स्टोर",
        groups: "समूह",
        prompt: "प्रॉम्प्ट",
        logout: "लॉगआउट",
      },
      title: {
        stores: "स्टोर",
      },
    },
    browser: {
      chromeMock: "ब्राउज़र UI मॉक",
    },
    history: {
      title: "इतिहास शीर्षक...",
    },
    hero: {
      heading: "फोटो लें और अनुवाद करें",
      sub: "शुरू करने के लिए कैमरा टैप करें",
    },
    explore: {
      title: "HashiGo खोजें",
      subtitle: "HashiGo के साथ खोजें",
      placeholder: "आसपास के बारे में पूछें...",
    },
    suggestions: {
      guide: "आपका AI गाइड। कुछ भी पूछें।",
      chips: ["कैसे उपयोग करें?", "क्या कर सकता है?", "भोजन शिष्टाचार"],
    },
  },
  tr: {
    common: {
      back: "Geri",
      reload: "Yenile",
      translate: "Çevir",
      openCamera: "Kamerayı aç",
      menu: "Menü",
      guide: "Rehber",
    },
    language: {
      change: "Dili değiştir",
      select: "Dil seç",
      list: "Dil listesi",
      modalTitle: "Dil",
      fallback: "Dil",
    },
    drawer: {
      historyLabel: "Geçmiş çekmecesi",
    },
    home: {
      bannerLabel: "Banner",
      bannerAlt: "Banner",
    },
    cta: {
      go: "Git",
      continue: "Devam",
    },
    captureHeader: {
      menu: "Menü",
      scan: "Tara",
    },
    cameraPrompt: {
      openCamera: "Kamerayı aç",
    },
    chat: {
      uploadPreview: "Yükleme önizlemesi",
      removeAttachment: "Eki kaldır",
      tapToOpen: "Girişi açmak için dokun",
      camera: "Sohbet kamerası",
      gallery: "Sohbet galerisi",
      messageInput: "Mesaj girişi",
      sendMessage: "Mesaj gönder",
      send: "Gönder",
      sendDisabled: "Gönderme devre dışı",
      attachmentGuide: "AI rehberiniz. Her şeyi sorabilirsiniz.",
    },
    attachment: {
      cameraPhoto: "Kamera fotoğrafı",
      photoLibrary: "Fotoğraf arşivi",
    },
    camera: {
      unavailable: "Kamera kullanılamıyor",
      close: "Kapat",
      translate: "Çevir",
      openGallery: "Galeriyi aç",
      capturePhoto: "Fotoğraf çek",
      flipCamera: "Kamerayı değiştir",
    },
    admin: {
      brand: "HashiGo Admin",
      back: "Geri",
      closeMenu: "Menüyü kapat",
      toggleMenu: "Menüyü değiştir",
      nav: {
        stores: "Mağazalar",
        groups: "Gruplar",
        prompt: "Prompt",
        logout: "Çıkış yap",
      },
      title: {
        stores: "Mağazalar",
      },
    },
    browser: {
      chromeMock: "Tarayıcı arayüzü maketi",
    },
    history: {
      title: "Geçmiş başlığı...",
    },
    hero: {
      heading: "Çek ve çevir",
      sub: "Başlamak için kameraya dokun",
    },
    explore: {
      title: "HashiGo'yu keşfet",
      subtitle: "HashiGo ile keşfet",
      placeholder: "Bölge hakkında sor...",
    },
    suggestions: {
      guide: "AI rehberiniz. Her şeyi sorabilirsiniz.",
      chips: ["Nasıl kullanılır?", "Ne yapabilir?", "Yemek adabı"],
    },
  },
  bn: {
    common: {
      back: "ফিরে",
      reload: "রিলোড",
      translate: "অনুবাদ",
      openCamera: "ক্যামেরা খুলুন",
      menu: "মেনু",
      guide: "গাইড",
    },
    language: {
      change: "ভাষা পরিবর্তন",
      select: "ভাষা নির্বাচন",
      list: "ভাষার তালিকা",
      modalTitle: "ভাষা",
      fallback: "ভাষা",
    },
    drawer: {
      historyLabel: "ইতিহাস ড্রয়ার",
    },
    home: {
      bannerLabel: "ব্যানার",
      bannerAlt: "ব্যানার",
    },
    cta: {
      go: "যান",
      continue: "চালিয়ে যান",
    },
    captureHeader: {
      menu: "মেনু",
      scan: "স্ক্যান",
    },
    cameraPrompt: {
      openCamera: "ক্যামেরা খুলুন",
    },
    chat: {
      uploadPreview: "আপলোড প্রিভিউ",
      removeAttachment: "সংযুক্তি মুছুন",
      tapToOpen: "ইনপুট খুলতে ট্যাপ করুন",
      camera: "চ্যাট ক্যামেরা",
      gallery: "চ্যাট গ্যালারি",
      messageInput: "বার্তা ইনপুট",
      sendMessage: "বার্তা পাঠান",
      send: "পাঠান",
      sendDisabled: "পাঠানো নিষ্ক্রিয়",
      attachmentGuide: "আপনার AI গাইড। যেকোনো কিছু জিজ্ঞেস করুন।",
    },
    attachment: {
      cameraPhoto: "ক্যামেরা ছবি",
      photoLibrary: "ফটো লাইব্রেরি",
    },
    camera: {
      unavailable: "ক্যামেরা পাওয়া যাচ্ছে না",
      close: "বন্ধ করুন",
      translate: "অনুবাদ",
      openGallery: "গ্যালারি খুলুন",
      capturePhoto: "ছবি তুলুন",
      flipCamera: "ক্যামেরা বদলান",
    },
    admin: {
      brand: "HashiGo Admin",
      back: "ফিরে",
      closeMenu: "মেনু বন্ধ করুন",
      toggleMenu: "মেনু বদলান",
      nav: {
        stores: "দোকান",
        groups: "গ্রুপ",
        prompt: "প্রম্পট",
        logout: "লগ আউট",
      },
      title: {
        stores: "দোকান",
      },
    },
    browser: {
      chromeMock: "ব্রাউজার UI মক",
    },
    history: {
      title: "ইতিহাস শিরোনাম...",
    },
    hero: {
      heading: "ছবি তুলে অনুবাদ",
      sub: "শুরু করতে ক্যামেরা ট্যাপ করুন",
    },
    explore: {
      title: "HashiGo অন্বেষণ করুন",
      subtitle: "HashiGo এর সাথে অন্বেষণ",
      placeholder: "আশেপাশে সম্পর্কে জিজ্ঞেস করুন...",
    },
    suggestions: {
      guide: "আপনার AI গাইড। যেকোনো কিছু জিজ্ঞেস করুন।",
      chips: ["কীভাবে ব্যবহার করব?", "কী করতে পারে?", "খাবার শিষ্টাচার"],
    },
  },
  my: {
    common: {
      back: "နောက်သို့",
      reload: "ပြန်လည်ဖွင့်",
      translate: "ဘာသာပြန်",
      openCamera: "ကင်မရာဖွင့်",
      menu: "မီနူး",
      guide: "လမ်းညွှန်",
    },
    language: {
      change: "ဘာသာစကားပြောင်း",
      select: "ဘာသာစကားရွေး",
      list: "ဘာသာစကားစာရင်း",
      modalTitle: "ဘာသာစကား",
      fallback: "ဘာသာစကား",
    },
    drawer: {
      historyLabel: "မှတ်တမ်းဘူး",
    },
    home: {
      bannerLabel: "ဘန်နာ",
      bannerAlt: "ဘန်နာ",
    },
    cta: {
      go: "သွား",
      continue: "ဆက်လုပ်",
    },
    captureHeader: {
      menu: "မီနူး",
      scan: "စကန်",
    },
    cameraPrompt: {
      openCamera: "ကင်မရာဖွင့်",
    },
    chat: {
      uploadPreview: "တင်သွင်းမှုကြိုကြည့်",
      removeAttachment: "တွဲဖက်ဖိုင်ဖယ်ရှား",
      tapToOpen: "ထည့်သွင်းရန်နှိပ်ပါ",
      camera: "ချတ်ကင်မရာ",
      gallery: "ချတ်ဂယ်လာရီ",
      messageInput: "စာတိုထည့်သွင်း",
      sendMessage: "စာတိုပို့",
      send: "ပို့",
      sendDisabled: "ပို့ခြင်းမရ",
      attachmentGuide: "သင့် AI လမ်းညွှန်။ မေးချင်သမျှမေးပါ။",
    },
    attachment: {
      cameraPhoto: "ကင်မရာဓာတ်ပုံ",
      photoLibrary: "ဓာတ်ပုံစာကြည့်တိုက်",
    },
    camera: {
      unavailable: "ကင်မရာမရရှိနိုင်",
      close: "ပိတ်",
      translate: "ဘာသာပြန်",
      openGallery: "ဂယ်လာရီဖွင့်",
      capturePhoto: "ဓာတ်ပုံရိုက်",
      flipCamera: "ကင်မရာပြောင်း",
    },
    admin: {
      brand: "HashiGo Admin",
      back: "နောက်သို့",
      closeMenu: "မီနူးပိတ်",
      toggleMenu: "မီနူးပြောင်း",
      nav: {
        stores: "စတိုးများ",
        groups: "အဖွဲ့များ",
        prompt: "Prompt",
        logout: "ထွက်ရန်",
      },
      title: {
        stores: "စတိုးများ",
      },
    },
    browser: {
      chromeMock: "ဘရောင်ဇာ UI မော့ခ်",
    },
    history: {
      title: "မှတ်တမ်းခေါင်းစဉ်...",
    },
    hero: {
      heading: "ရိုက်ပြီးဘာသာပြန်",
      sub: "ကင်မရာကိုနှိပ်၍စတင်",
    },
    explore: {
      title: "HashiGo ကိုလေ့လာ",
      subtitle: "HashiGo နဲ့လေ့လာ",
      placeholder: "ပတ်ဝန်းကျင်မေးပါ...",
    },
    suggestions: {
      guide: "သင့် AI လမ်းညွှန်။ မေးချင်သမျှမေးပါ။",
      chips: ["ဘယ်လိုသုံးမလဲ?", "ဘာလုပ်နိုင်လဲ?", "စားသောက်မှုယဉ်ကျေးမှု"],
    },
  },
  tl: {
    common: {
      back: "Bumalik",
      reload: "I-reload",
      translate: "Isalin",
      openCamera: "Buksan ang camera",
      menu: "Menu",
      guide: "Gabay",
    },
    language: {
      change: "Palitan ang wika",
      select: "Pumili ng wika",
      list: "Listahan ng wika",
      modalTitle: "Wika",
      fallback: "Wika",
    },
    drawer: {
      historyLabel: "Drawer ng kasaysayan",
    },
    home: {
      bannerLabel: "Banner",
      bannerAlt: "Banner",
    },
    cta: {
      go: "Pumunta",
      continue: "Magpatuloy",
    },
    captureHeader: {
      menu: "Menu",
      scan: "I-scan",
    },
    cameraPrompt: {
      openCamera: "Buksan ang camera",
    },
    chat: {
      uploadPreview: "Preview ng upload",
      removeAttachment: "Alisin ang attachment",
      tapToOpen: "I-tap para buksan ang input",
      camera: "Camera ng chat",
      gallery: "Gallery ng chat",
      messageInput: "Input ng mensahe",
      sendMessage: "Ipadala ang mensahe",
      send: "Ipadala",
      sendDisabled: "Naka-disable ang padala",
      attachmentGuide: "Ang iyong AI guide. Magtanong ng kahit ano.",
    },
    attachment: {
      cameraPhoto: "Larawan ng camera",
      photoLibrary: "Photo library",
    },
    camera: {
      unavailable: "Hindi available ang camera",
      close: "Isara",
      translate: "Isalin",
      openGallery: "Buksan ang gallery",
      capturePhoto: "Kumuha ng larawan",
      flipCamera: "Palitan ang camera",
    },
    admin: {
      brand: "HashiGo Admin",
      back: "Bumalik",
      closeMenu: "Isara ang menu",
      toggleMenu: "Palitan ang menu",
      nav: {
        stores: "Mga tindahan",
        groups: "Mga grupo",
        prompt: "Prompt",
        logout: "Mag-logout",
      },
      title: {
        stores: "Mga tindahan",
      },
    },
    browser: {
      chromeMock: "Mock ng browser",
    },
    history: {
      title: "Pamagat ng kasaysayan...",
    },
    hero: {
      heading: "Kunan at isalin",
      sub: "I-tap ang camera para magsimula",
    },
    explore: {
      title: "Tuklasin ang HashiGo",
      subtitle: "Tuklasin kasama ang HashiGo",
      placeholder: "Magtanong tungkol sa lugar...",
    },
    suggestions: {
      guide: "Ang iyong AI guide. Magtanong ng kahit ano.",
      chips: ["Paano gamitin?", "Ano ang kaya?", "Etiquette sa pagkain"],
    },
  },
  lo: {
    common: {
      back: "ກັບ",
      reload: "ໂຫລດໃໝ່",
      translate: "ແປ",
      openCamera: "ເປີດກ້ອງ",
      menu: "ເມນູ",
      guide: "ຄູ່ມື",
    },
    language: {
      change: "ປ່ຽນພາສາ",
      select: "ເລືອກພາສາ",
      list: "ລາຍຊື່ພາສາ",
      modalTitle: "ພາສາ",
      fallback: "ພາສາ",
    },
    drawer: {
      historyLabel: "ລິ້ນຊັກປະຫວັດ",
    },
    home: {
      bannerLabel: "ແບນເນີ",
      bannerAlt: "ແບນເນີ",
    },
    cta: {
      go: "ໄປ",
      continue: "ດຳເນີນຕໍ່",
    },
    captureHeader: {
      menu: "ເມນູ",
      scan: "ສະແກນ",
    },
    cameraPrompt: {
      openCamera: "ເປີດກ້ອງ",
    },
    chat: {
      uploadPreview: "ຕົວຢ່າງອັບໂຫລດ",
      removeAttachment: "ລຶບໄຟລ໌ແນບ",
      tapToOpen: "ແຕະເພື່ອເປີດການປ້ອນ",
      camera: "ກ້ອງແຊັດ",
      gallery: "ແກລເລີແຊັດ",
      messageInput: "ການປ້ອນຂໍ້ຄວາມ",
      sendMessage: "ສົ່ງຂໍ້ຄວາມ",
      send: "ສົ່ງ",
      sendDisabled: "ສົ່ງບໍ່ໄດ້",
      attachmentGuide: "ຜູ້ນໍາທາງ AI ຂອງທ່ານ. ຖາມໄດ້ທຸກຢ່າງ.",
    },
    attachment: {
      cameraPhoto: "ຮູບກ້ອງ",
      photoLibrary: "ຄັງຮູບ",
    },
    camera: {
      unavailable: "ກ້ອງບໍ່ພ້ອມໃຊ້",
      close: "ປິດ",
      translate: "ແປ",
      openGallery: "ເປີດແກລເລີ",
      capturePhoto: "ຖ່າຍຮູບ",
      flipCamera: "ສະຫຼັບກ້ອງ",
    },
    admin: {
      brand: "HashiGo Admin",
      back: "ກັບ",
      closeMenu: "ປິດເມນູ",
      toggleMenu: "ສະຫຼັບເມນູ",
      nav: {
        stores: "ຮ້ານ",
        groups: "ກຸ່ມ",
        prompt: "Prompt",
        logout: "ອອກຈາກລະບົບ",
      },
      title: {
        stores: "ຮ້ານ",
      },
    },
    browser: {
      chromeMock: "ຈຳລອງ UI ບຣາວເຊີ",
    },
    history: {
      title: "ຫົວຂໍ້ປະຫວັດ...",
    },
    hero: {
      heading: "ຖ່າຍແລະແປ",
      sub: "ແຕະກ້ອງເພື່ອເລີ່ມ",
    },
    explore: {
      title: "ສຳຫຼວດ HashiGo",
      subtitle: "ສຳຫຼວດກັບ HashiGo",
      placeholder: "ຖາມກ່ຽວກັບບໍລິເວນ...",
    },
    suggestions: {
      guide: "ຜູ້ນໍາທາງ AI ຂອງທ່ານ. ຖາມໄດ້ທຸກຢ່າງ.",
      chips: ["ໃຊ້ແນວໃດ?", "ທຳອະໄດ້ແນວໃດ?", "ມາລະຍາດທາງອາຫານ"],
    },
  },
  km: {
    common: {
      back: "ថយក្រោយ",
      reload: "ផ្ទុកឡើងវិញ",
      translate: "បកប្រែ",
      openCamera: "បើកកាមេរ៉ា",
      menu: "ម៉ឺនុយ",
      guide: "មគ្គុទេសក៍",
    },
    language: {
      change: "ប្តូរភាសា",
      select: "ជ្រើសភាសា",
      list: "បញ្ជីភាសា",
      modalTitle: "ភាសា",
      fallback: "ភាសា",
    },
    drawer: {
      historyLabel: "ថតប្រវត្តិ",
    },
    home: {
      bannerLabel: "បដា",
      bannerAlt: "បដា",
    },
    cta: {
      go: "ទៅ",
      continue: "បន្ត",
    },
    captureHeader: {
      menu: "ម៉ឺនុយ",
      scan: "ស្កេន",
    },
    cameraPrompt: {
      openCamera: "បើកកាមេរ៉ា",
    },
    chat: {
      uploadPreview: "មើលជាមុនការផ្ទុក",
      removeAttachment: "លុបឯកសារភ្ជាប់",
      tapToOpen: "ប៉ះដើម្បីបើកបញ្ចូល",
      camera: "កាមេរ៉ាជជែក",
      gallery: "កែឡារីជជែក",
      messageInput: "បញ្ចូលសារ",
      sendMessage: "ផ្ញើសារ",
      send: "ផ្ញើ",
      sendDisabled: "ផ្ញើមិនអាច",
      attachmentGuide: "មគ្គុទេសក៍ AI របស់អ្នក។ សួរអ្វីក៏បាន។",
    },
    attachment: {
      cameraPhoto: "រូបថតកាមេរ៉ា",
      photoLibrary: "បណ្ណាល័យរូបថត",
    },
    camera: {
      unavailable: "កាមេរ៉ាមិនមាន",
      close: "បិទ",
      translate: "បកប្រែ",
      openGallery: "បើកកែឡារី",
      capturePhoto: "ថតរូប",
      flipCamera: "ប្តូរកាមេរ៉ា",
    },
    admin: {
      brand: "HashiGo Admin",
      back: "ថយក្រោយ",
      closeMenu: "បិទម៉ឺនុយ",
      toggleMenu: "ប្តូរម៉ឺនុយ",
      nav: {
        stores: "ហាង",
        groups: "ក្រុម",
        prompt: "Prompt",
        logout: "ចាកចេញ",
      },
      title: {
        stores: "ហាង",
      },
    },
    browser: {
      chromeMock: "ម៉ុក UI កម្មវិធីរុករក",
    },
    history: {
      title: "ចំណងជើងប្រវត្តិ...",
    },
    hero: {
      heading: "ថតហើយបកប្រែ",
      sub: "ប៉ះកាមេរ៉ាដើម្បីចាប់ផ្តើម",
    },
    explore: {
      title: "ស្វែងយល់ HashiGo",
      subtitle: "ស្វែងយល់ជាមួយ HashiGo",
      placeholder: "សួរអំពីតំបន់...",
    },
    suggestions: {
      guide: "មគ្គុទេសក៍ AI របស់អ្នក។ សួរអ្វីក៏បាន។",
      chips: ["ប្រើយ៉ាងដូចម្តេច?", "អាចធ្វើអ្វីបាន?", "សីលធម៌ការញុំា"],
    },
  },
  ne: {
    common: {
      back: "पछाडि",
      reload: "पुनःलोड",
      translate: "अनुवाद",
      openCamera: "क्यामेरा खोल्नुहोस्",
      menu: "मेनु",
      guide: "मार्गदर्शक",
    },
    language: {
      change: "भाषा परिवर्तन",
      select: "भाषा चयन",
      list: "भाषा सूची",
      modalTitle: "भाषा",
      fallback: "भाषा",
    },
    drawer: {
      historyLabel: "इतिहास दराज",
    },
    home: {
      bannerLabel: "ब्यानर",
      bannerAlt: "ब्यानर",
    },
    cta: {
      go: "जानुहोस्",
      continue: "जारी राख्नुहोस्",
    },
    captureHeader: {
      menu: "मेनु",
      scan: "स्क्यान",
    },
    cameraPrompt: {
      openCamera: "क्यामेरा खोल्नुहोस्",
    },
    chat: {
      uploadPreview: "अपलोड पूर्वावलोकन",
      removeAttachment: "संलग्नक हटाउनुहोस्",
      tapToOpen: "इनपुट खोल्न ट्याप गर्नुहोस्",
      camera: "च्याट क्यामेरा",
      gallery: "च्याट ग्यालरी",
      messageInput: "सन्देश इनपुट",
      sendMessage: "सन्देश पठाउनुहोस्",
      send: "पठाउनुहोस्",
      sendDisabled: "पठाउन अक्षम",
      attachmentGuide: "तपाईंको AI मार्गदर्शक। जे पनि सोध्नुहोस्।",
    },
    attachment: {
      cameraPhoto: "क्यामेरा फोटो",
      photoLibrary: "फोटो लाइब्रेरी",
    },
    camera: {
      unavailable: "क्यामेरा उपलब्ध छैन",
      close: "बन्द गर्नुहोस्",
      translate: "अनुवाद",
      openGallery: "ग्यालरी खोल्नुहोस्",
      capturePhoto: "फोटो खिच्नुहोस्",
      flipCamera: "क्यामेरा परिवर्तन",
    },
    admin: {
      brand: "HashiGo Admin",
      back: "पछाडि",
      closeMenu: "मेनु बन्द गर्नुहोस्",
      toggleMenu: "मेनु परिवर्तन",
      nav: {
        stores: "पसलहरू",
        groups: "समूहहरू",
        prompt: "Prompt",
        logout: "लगआउट",
      },
      title: {
        stores: "पसलहरू",
      },
    },
    browser: {
      chromeMock: "ब्राउजर UI मोक",
    },
    history: {
      title: "इतिहास शीर्षक...",
    },
    hero: {
      heading: "खिच्नुहोस् र अनुवाद",
      sub: "सुरु गर्न क्यामेरा ट्याप गर्नुहोस्",
    },
    explore: {
      title: "HashiGo अन्वेषण",
      subtitle: "HashiGo सँग अन्वेषण",
      placeholder: "वरपरको बारे सोध्नुहोस्...",
    },
    suggestions: {
      guide: "तपाईंको AI मार्गदर्शक। जे पनि सोध्नुहोस्।",
      chips: ["कसरी प्रयोग गर्ने?", "के गर्न सक्छ?", "भोजन शिष्टाचार"],
    },
  },
  mn: {
    common: {
      back: "Буцах",
      reload: "Дахин ачаалах",
      translate: "Орчуулах",
      openCamera: "Камер нээх",
      menu: "Цэс",
      guide: "Заавар",
    },
    language: {
      change: "Хэл солих",
      select: "Хэл сонгох",
      list: "Хэлний жагсаалт",
      modalTitle: "Хэл",
      fallback: "Хэл",
    },
    drawer: {
      historyLabel: "Түүхийн шургуулга",
    },
    home: {
      bannerLabel: "Баннер",
      bannerAlt: "Баннер",
    },
    cta: {
      go: "Явах",
      continue: "Үргэлжлүүлэх",
    },
    captureHeader: {
      menu: "Цэс",
      scan: "Скан",
    },
    cameraPrompt: {
      openCamera: "Камер нээх",
    },
    chat: {
      uploadPreview: "Байршуулалтын урьдчилсан харах",
      removeAttachment: "Хавсралт устгах",
      tapToOpen: "Оруулахыг нээхээр товшино уу",
      camera: "Чатын камер",
      gallery: "Чатын галерей",
      messageInput: "Мессеж оруулах",
      sendMessage: "Мессеж илгээх",
      send: "Илгээх",
      sendDisabled: "Илгээх идэвхгүй",
      attachmentGuide: "Таны AI гарын авлага. Юу ч асуугаарай.",
    },
    attachment: {
      cameraPhoto: "Камерын зураг",
      photoLibrary: "Зургийн сан",
    },
    camera: {
      unavailable: "Камер ашиглах боломжгүй",
      close: "Хаах",
      translate: "Орчуулах",
      openGallery: "Галерей нээх",
      capturePhoto: "Зураг авах",
      flipCamera: "Камер солих",
    },
    admin: {
      brand: "HashiGo Admin",
      back: "Буцах",
      closeMenu: "Цэс хаах",
      toggleMenu: "Цэс солих",
      nav: {
        stores: "Дэлгүүрүүд",
        groups: "Бүлгүүд",
        prompt: "Prompt",
        logout: "Гарах",
      },
      title: {
        stores: "Дэлгүүрүүд",
      },
    },
    browser: {
      chromeMock: "Хөтөч UI загвар",
    },
    history: {
      title: "Түүхийн гарчиг...",
    },
    hero: {
      heading: "Зураг аваад орчуул",
      sub: "Эхлэхийн тулд камерыг товшино уу",
    },
    explore: {
      title: "HashiGo-г судлах",
      subtitle: "HashiGo-тай судлах",
      placeholder: "Ойр орчмын талаар асуугаарай...",
    },
    suggestions: {
      guide: "Таны AI гарын авлага. Юу ч асуугаарай.",
      chips: ["Яаж ашиглах вэ?", "Юу хийж чадах вэ?", "Хоолны ёс зүй"],
    },
  },
  fa: {
    common: {
      back: "بازگشت",
      reload: "تازه‌سازی",
      translate: "ترجمه",
      openCamera: "باز کردن دوربین",
      menu: "منو",
      guide: "راهنما",
    },
    language: {
      change: "تغییر زبان",
      select: "انتخاب زبان",
      list: "فهرست زبان‌ها",
      modalTitle: "زبان",
      fallback: "زبان",
    },
    drawer: {
      historyLabel: "کشوی تاریخچه",
    },
    home: {
      bannerLabel: "بنر",
      bannerAlt: "بنر",
    },
    cta: {
      go: "برو",
      continue: "ادامه",
    },
    captureHeader: {
      menu: "منو",
      scan: "اسکن",
    },
    cameraPrompt: {
      openCamera: "باز کردن دوربین",
    },
    chat: {
      uploadPreview: "پیش‌نمایش بارگذاری",
      removeAttachment: "حذف پیوست",
      tapToOpen: "برای باز کردن ورودی ضربه بزنید",
      camera: "دوربین گفتگو",
      gallery: "گالری گفتگو",
      messageInput: "ورودی پیام",
      sendMessage: "ارسال پیام",
      send: "ارسال",
      sendDisabled: "ارسال غیرفعال",
      attachmentGuide: "راهنمای هوش مصنوعی شما. هر چیزی بپرسید.",
    },
    attachment: {
      cameraPhoto: "عکس دوربین",
      photoLibrary: "کتابخانه عکس",
    },
    camera: {
      unavailable: "دوربین در دسترس نیست",
      close: "بستن",
      translate: "ترجمه",
      openGallery: "باز کردن گالری",
      capturePhoto: "گرفتن عکس",
      flipCamera: "تعویض دوربین",
    },
    admin: {
      brand: "HashiGo Admin",
      back: "بازگشت",
      closeMenu: "بستن منو",
      toggleMenu: "تعویض منو",
      nav: {
        stores: "فروشگاه‌ها",
        groups: "گروه‌ها",
        prompt: "Prompt",
        logout: "خروج",
      },
      title: {
        stores: "فروشگاه‌ها",
      },
    },
    browser: {
      chromeMock: "ماک رابط مرورگر",
    },
    history: {
      title: "عنوان تاریخچه...",
    },
    hero: {
      heading: "عکس بگیر و ترجمه کن",
      sub: "برای شروع روی دوربین ضربه بزنید",
    },
    explore: {
      title: "کاوش HashiGo",
      subtitle: "با HashiGo کاوش کنید",
      placeholder: "درباره اطراف بپرسید...",
    },
    suggestions: {
      guide: "راهنمای هوش مصنوعی شما. هر چیزی بپرسید.",
      chips: ["چطور استفاده کنم؟", "چه کارهایی می‌تواند انجام دهد؟", "آداب غذاخوری"],
    },
  },
  uk: {
    common: {
      back: "Назад",
      reload: "Оновити",
      translate: "Перекласти",
      openCamera: "Відкрити камеру",
      menu: "Меню",
      guide: "Гід",
    },
    language: {
      change: "Змінити мову",
      select: "Вибрати мову",
      list: "Список мов",
      modalTitle: "Мова",
      fallback: "Мова",
    },
    drawer: {
      historyLabel: "Панель історії",
    },
    home: {
      bannerLabel: "Банер",
      bannerAlt: "Банер",
    },
    cta: {
      go: "Перейти",
      continue: "Продовжити",
    },
    captureHeader: {
      menu: "Меню",
      scan: "Сканувати",
    },
    cameraPrompt: {
      openCamera: "Відкрити камеру",
    },
    chat: {
      uploadPreview: "Попередній перегляд завантаження",
      removeAttachment: "Видалити вкладення",
      tapToOpen: "Натисніть, щоб відкрити введення",
      camera: "Камера чату",
      gallery: "Галерея чату",
      messageInput: "Поле повідомлення",
      sendMessage: "Надіслати повідомлення",
      send: "Надіслати",
      sendDisabled: "Надсилання вимкнено",
      attachmentGuide: "Ваш AI-гід. Питайте будь-що.",
    },
    attachment: {
      cameraPhoto: "Фото з камери",
      photoLibrary: "Фотобібліотека",
    },
    camera: {
      unavailable: "Камера недоступна",
      close: "Закрити",
      translate: "Перекласти",
      openGallery: "Відкрити галерею",
      capturePhoto: "Зробити фото",
      flipCamera: "Перемкнути камеру",
    },
    admin: {
      brand: "HashiGo Admin",
      back: "Назад",
      closeMenu: "Закрити меню",
      toggleMenu: "Перемкнути меню",
      nav: {
        stores: "Магазини",
        groups: "Групи",
        prompt: "Prompt",
        logout: "Вийти",
      },
      title: {
        stores: "Магазини",
      },
    },
    browser: {
      chromeMock: "Макет інтерфейсу браузера",
    },
    history: {
      title: "Заголовок історії...",
    },
    hero: {
      heading: "Знімай і перекладай",
      sub: "Натисніть камеру, щоб почати",
    },
    explore: {
      title: "Досліджуйте HashiGo",
      subtitle: "Досліджуйте з HashiGo",
      placeholder: "Питайте про місцевість...",
    },
    suggestions: {
      guide: "Ваш AI-гід. Питайте будь-що.",
      chips: ["Як користуватися?", "Що вміє?", "Етикет за столом"],
    },
  },
  pl: {
    common: {
      back: "Wstecz",
      reload: "Odśwież",
      translate: "Tłumacz",
      openCamera: "Otwórz aparat",
      menu: "Menu",
      guide: "Przewodnik",
    },
    language: {
      change: "Zmień język",
      select: "Wybierz język",
      list: "Lista języków",
      modalTitle: "Język",
      fallback: "Język",
    },
    drawer: {
      historyLabel: "Szuflada historii",
    },
    home: {
      bannerLabel: "Baner",
      bannerAlt: "Baner",
    },
    cta: {
      go: "Idź",
      continue: "Kontynuuj",
    },
    captureHeader: {
      menu: "Menu",
      scan: "Skanuj",
    },
    cameraPrompt: {
      openCamera: "Otwórz aparat",
    },
    chat: {
      uploadPreview: "Podgląd przesyłania",
      removeAttachment: "Usuń załącznik",
      tapToOpen: "Dotknij, aby otworzyć wpisywanie",
      camera: "Kamera czatu",
      gallery: "Galeria czatu",
      messageInput: "Pole wiadomości",
      sendMessage: "Wyślij wiadomość",
      send: "Wyślij",
      sendDisabled: "Wysyłanie wyłączone",
      attachmentGuide: "Twój przewodnik AI. Pytaj o wszystko.",
    },
    attachment: {
      cameraPhoto: "Zdjęcie z aparatu",
      photoLibrary: "Biblioteka zdjęć",
    },
    camera: {
      unavailable: "Aparat niedostępny",
      close: "Zamknij",
      translate: "Tłumacz",
      openGallery: "Otwórz galerię",
      capturePhoto: "Zrób zdjęcie",
      flipCamera: "Przełącz aparat",
    },
    admin: {
      brand: "HashiGo Admin",
      back: "Wstecz",
      closeMenu: "Zamknij menu",
      toggleMenu: "Przełącz menu",
      nav: {
        stores: "Sklepy",
        groups: "Grupy",
        prompt: "Prompt",
        logout: "Wyloguj",
      },
      title: {
        stores: "Sklepy",
      },
    },
    browser: {
      chromeMock: "Makieta przeglądarki",
    },
    history: {
      title: "Tytuł historii...",
    },
    hero: {
      heading: "Zrób zdjęcie i tłumacz",
      sub: "Dotknij aparatu, aby zacząć",
    },
    explore: {
      title: "Odkrywaj HashiGo",
      subtitle: "Odkrywaj z HashiGo",
      placeholder: "Zapytaj o okolicę...",
    },
    suggestions: {
      guide: "Twój przewodnik AI. Pytaj o wszystko.",
      chips: ["Jak używać?", "Co potrafi?", "Etykieta przy stole"],
    },
  },
} as const;

export type UiCopy = DeepStringify<(typeof uiCopy)["en"]>;

const normalizeLanguage = (code?: string) => {
  if (!code) return "en";
  if (code in uiCopy) return code as keyof typeof uiCopy;
  const lower = code.toLowerCase();
  const base = lower.split("-")[0];
  if (base in uiCopy) return base as keyof typeof uiCopy;
  return "en";
};

export const getUiCopy = (language?: string): UiCopy => {
  const normalized = normalizeLanguage(language);
  return uiCopy[normalized];
};

export const getLanguageLabel = (code?: string) => {
  if (!code) return undefined;
  return languageLabelMap.get(code) ?? code;
};
