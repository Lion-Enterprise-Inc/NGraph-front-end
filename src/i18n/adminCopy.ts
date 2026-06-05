export type AdminLang = 'ja' | 'en'

export const adminLangOptions: { code: AdminLang; label: string }[] = [
  { code: 'ja', label: '日本語' },
  { code: 'en', label: 'English' },
]

export type AdminCopy = {
  common: {
    retry: string
    backToAdminTop: string
    prev: string
    next: string
    delete: string
    approve: string
    reject: string
    allStatuses: string
    allRestaurants: string
    ellipsis: string
  }
  error: {
    pageCrashed: string
    pleaseRetry: string
    unknown: string
  }
  searchLogs: {
    title: string
    description: (n: number) => string
    empty: string
    colTime: string
    colText: string
    colFilters: string
    colResultCount: string
  }
  photoReview: {
    title: string
    empty: string
    confirmDelete: string
    altSubmitted: string
    altCurrent: string
  }
  menuList: {
    noMenuDetected: string
    fileAnalysisFailed: (msg: string) => string
    enterText: string
    noMenuDetectedText: string
    textAnalysisFailed: (msg: string) => string
    uncategorized: string
    addedItem: (name: string) => string
    duplicateItem: (name: string) => string
    saveFailed: string
    processedDone: string
    addedCount: (n: number) => string
    skippedCount: (n: number) => string
    failedCount: (n: number) => string
    sep: string
    fetchRestaurantFailed: string
    requiredFields: string
    restaurantNotFound: string
    imageUploadFailed: string
    addedSuccess: string
    addFailed: (msg: string) => string
    sourceUrlMissing: string
    scrapeStartFailed: string
    scrapeFailed: string
    taskStatusCheckFailed: string
    approveFailed: string
    allApprovedSuccess: string
    updatedSuccess: string
    updateFailed: (msg: string) => string
    approvalFailed: string
    ownerVerifyFailed: string
    statusChangeFailed: string
    noPendingApproval: string
    bulkApproveFailed: string
    confirmDeleteMenu: string
    deletedMenu: string
    deleteMenuFailed: (msg: string) => string
    rankMustVerify: string
    rankNeedReview: string
    rankReviewRecommended: string
    rankVerified: string
    ownerVerifiedItem: (name: string) => string
    confirmBulkApprove: (n: number) => string
    bulkApproved: (n: number) => string
    storeLabel: string
    verifyPriorityTitle: string
    cardTitle: string
    tableSearchPlaceholder: string
    tableFilterAll: (n: number) => string
    tableFilterVerified: (n: number) => string
    tableFilterWarning: (n: number) => string
    tableSortDefault: string
    tableSortByName: string
    tableSortByPrice: string
    tableSortByRank: string
    tableSortAsc: string
    tableSortDesc: string
    perPage: (n: number) => string
    pagePrev: string
    pageNext: string
    pageInfo: (cur: number, total: number) => string
    addNewBtn: string
    fetchFromSourceBtn: string
    bulkApproveBtn: string
    colName: string
    colCategory: string
    colPrice: string
    colStatus: string
    colRank: string
    colActions: string
    rowActive: string
    rowInactive: string
    rowEdit: string
    rowPreview: string
    rowDelete: string
    rowApprove: string
    rowVerifyAsOwner: string
    rowToggleStatus: string
    rowVerified: string
    rowDescription: string
    rowIngredients: string
    rowAllergens: string
    rowCooking: string
    rowRestrictions: string
    formTabBasic: string
    formTabDetail: string
    formTabNarrative: string
    formTabImage: string
    formTabAdvanced: string
    formAddTitle: string
    formEditTitle: string
    formName: string
    formNameEn: string
    formCategory: string
    formCategorySelect: string
    formPrice: string
    formDescription: string
    formDescriptionEn: string
    formIngredients: string
    formIngredientsHint: string
    formAllergens: string
    formAllergensMandatory: string
    formAllergensRecommended: string
    formCookingMethods: string
    formRestrictions: string
    formImage: string
    formImagePick: string
    formImageReplace: string
    formImageRemove: string
    formStory: string
    formChefNote: string
    formTastingNote: string
    formPairingSuggestion: string
    formSeasonalNote: string
    formServingSize: string
    formAvailability: string
    formTaxIncluded: string
    formTaxRate: string
    formCurrency: string
    formCancel: string
    formSave: string
    formSaving: string
    uploadTitle: string
    uploadDescription: string
    uploadFromFile: string
    uploadFromCamera: string
    uploadFromText: string
    uploadAnalyzing: string
    pasteTextTitle: string
    pasteTextPlaceholder: string
    pasteTextAnalyze: string
    pasteTextCancel: string
    visionApprovalTitle: (n: number) => string
    visionApproveItem: string
    visionApproving: string
    visionRemove: string
    visionApproveAll: string
    visionApprovingAll: string
    visionClose: string
    visionEmpty: string
    fetchApprovalTitle: string
    fetchApproveItem: string
    fetchDenyItem: string
    fetchApproveAll: string
    fetchDenyAll: string
    fetchClose: string
    fetchSourceUrl: (url: string) => string
    previewTitle: string
    previewEdit: string
    previewApprove: string
    previewClose: string
    previewIngredients: string
    previewAllergens: string
    previewCooking: string
    previewRestrictions: string
    previewTaste: string
    previewVerification: string
    previewDataSource: string
    previewConfidence: (n: number) => string
    previewNoImage: string
    tableTitle: string
    tableTotalCount: (n: number) => string
    tableFetchFromSourceBtn: string
    tableSearchBoxPlaceholder: string
    tableSortLabel: string
    tableShowLabel: string
    tableLoading: string
    tableReload: string
    tableBulkApproveCount: (n: number) => string
    tableColNo: string
    tableColDetail: string
    tableEmpty: string
    tableNoIngredients: string
    tableStatusPublic: string
    tableStatusPrivate: string
    tableStatusVerified: string
    tableStatusPending: string
    tableApproveSymbol: string
    tablePreviewBtn: string
    tableEditBtn: string
    tableDeleteBtn: string
    tablePagePage: string
    tableShowingItems: (total: number, start: number, end: number) => string
    tableManualAdd: string
    tableSortOptDefault: string
    tableSortOptRank: string
    tableSortOptCreated: string
    tableSortOptPrice: string
    tableSortOptName: string
    tableSortAscWithArrow: string
    tableSortDescWithArrow: string
    tablePerPageOpt: (n: number) => string
    tableLoadingItems: string
    pvNarrativeStory: string
    pvNarrativeChefNote: string
    pvNarrativeTastingNote: string
    pvNarrativePairing: string
    pvNarrativeSeasonal: string
    pvServingSize: string
    pvServingAvailability: string
    pvServingStyle: string
    pvServingTemperature: string
    pvNotSet: string
    pvRankS: string
    pvRankA: string
    pvRankB: string
    pvRankC: string
    pvRankUnknown: string
    pvDataCompleteness: string
    pvCompletenessHint: string
    pvApprovedAt: string
    pvDataSourceOwner: string
    pvDataSourceOfficial: string
    pvDataSourceAi: string
    pvDataSourceUncat: string
    pvPublished: string
    pvOpenProductPage: string
    pvSectionDescription: string
    pvSectionIngredients: string
    pvSectionAllergens: string
    pvSectionCooking: string
    pvSectionRestrictions: string
    pvNone: string
    pvSectionNarrative: string
    pvSectionServing: string
    pvSectionFeaturedTags: string
    pvMissingFields: (n: number) => string
    pvEditBtn: string
    pvVerifyOwnerBtn: string
    pvVerifyOwnerConfirm: (name: string) => string
    pvVerifyOwnerTitle: string
    pvCloseBtn: string
    upCardTitle: string
    upCardDesc: string
    upCamera: string
    upFile: string
    upFileFormats: string
    upPaste: string
    upGoogleDrive: string
    upComingSoon: string
    upPasteModalTitle: string
    upPasteDesc: string
    upPastePlaceholder: string
    upPasteCancel: string
    upPasteAnalyze: string
    upAnalyzingTitle: string
    upAnalyzingDesc: string
    upFetchingTitle: string
    upFetchingDesc: string
    upVisionTitle: string
    upVisionDetectedSummary: (total: number) => string
    upVisionRegisteredHint: (n: number) => string
    upVisionReviewHint: string
    upVisionApprovingAll: string
    upVisionApproveAll: (n: number) => string
    upVisionDiscardAll: string
    upVisionRegistered: string
    upVisionUncategorized: string
    upVisionApproveItem: string
    upVisionItemApproving: string
    upVisionItemRegistered: string
    upVisionItemRemove: string
    upVisionEmpty: string
    upFetchApprovalTitle: string
    upFetchSourceLabel: string
    upFetchNew: (n: number) => string
    upFetchDuplicate: (n: number) => string
    upFetchApproveAll: string
    upFetchDenyAll: string
    upFetchMergeDup: string
    upFetchNewHeading: (n: number) => string
    upFetchConfidence: (n: number) => string
    upFetchApprove: string
    upFetchDeny: string
    upFetchEmpty: string
    mfValidateImageType: string
    mfValidateImageSize: string
    mfUploadFailed: string
    mfTitle: string
    mfTabBasic: string
    mfTabMaterials: string
    mfTabAllergens: string
    mfTabNfg: string
    mfFieldNameJp: string
    mfFieldNameEn: string
    mfBtnAiTranslate: string
    mfFieldPrice: string
    mfFieldCategory: string
    mfSelect: string
    mfFieldDescJp: string
    mfBtnAiGenerate: string
    mfFieldDescEn: string
    mfFieldImage: string
    mfUploading: string
    mfImageDropHint: string
    mfImageFormats: string
    mfImageSelected: (name: string) => string
    mfImageAltPreview: string
    mfImageUrlLabel: string
    mfFieldProductUrl: string
    mfProductUrlHint: string
    mfBtnNextMaterials: string
    mfConfidenceHint: string
    mfFieldIngredients: string
    mfBtnAiSuggest: string
    mfIngredientsPlaceholder: string
    mfIngredientsHint: string
    mfFieldCookingMethods: string
    mfNoCookingMethods: string
    mfBtnNextAllergens: string
    mfFieldAllergenInfo: string
    mfAllergenMandatory: string
    mfAllergenRecommended: string
    mfAllergenLoadFailed: string
    mfFieldRestrictions: string
    mfNoRestrictions: string
    mfBtnNextNfg: string
    mfSectionNarrative: string
    mfNarrativeStory: string
    mfNarrativeStoryPh: string
    mfNarrativeChef: string
    mfNarrativeChefPh: string
    mfNarrativeTasting: string
    mfNarrativeTastingPh: string
    mfNarrativePairing: string
    mfNarrativePairingPh: string
    mfNarrativeSeasonal: string
    mfNarrativeSeasonalPh: string
    mfSectionServing: string
    mfServingSize: string
    mfServingNotSet: string
    mfServingSmall: string
    mfServingRegular: string
    mfServingLarge: string
    mfServingFamily: string
    mfServingPeriod: string
    mfServingAlways: string
    mfServingSeasonal: string
    mfServingLimited: string
    mfServingSpecial: string
    mfSectionTags: string
    mfTagsPlaceholder: string
    mfTagsHint: string
    mfSectionPrice: string
    mfCurrency: string
    mfTaxRate: string
    mfTaxIncluded: string
    mfStatusLabel: string
    mfStatusVerified: string
    mfStatusPending: string
    mfStatusHint: string
    mfCancel: string
    mfSave: string
    hintIngredients: string
    hintAllergens: string
    hintDescription: string
    hintNameEn: string
    hintCooking: string
    hintNarrative: string
    hintServing: string
  }
  stores: {
    title: string
    loadingDetail: string
    headerTitle: string
    newStore: string
    countSuffix: string
    searchPlaceholder: string
    all: string
    onboarded: string
    free: string
    empty: string
    notSet: string
    todayLabel: string
    oneDayAgo: string
    daysAgoLabel: (n: number) => string
    nowLabel: string
    badgePlanFree: string
    badgePlanOnboarded: string
    updateLabel: string
    metricMenu: string
    metricVerified: string
    metricScan: string
    btnManage: string
    btnMenu: string
    btnDelete: string
    titleManage: string
    titleMenu: string
    titleDelete: string
    modalTitle: string
    fieldName: string
    fieldNamePlaceholder: string
    searchByName: string
    searching: string
    searchHint: string
    fieldOwner: string
    chooseOwner: string
    noOwnersAvailable: string
    fieldType: string
    pleaseSelect: string
    fieldAddress: string
    addressPlaceholder: string
    fieldPhone: string
    phonePlaceholder: string
    detailSection: string
    introduction: string
    introductionPlaceholder: string
    businessHours: string
    holidays: string
    seats: string
    budget: string
    parking: string
    payment: string
    access: string
    features: string
    register: string
    registering: string
    cancel: string
    validateNameOwner: string
    validatePhone: string
    validateAddress: string
    validateStoreName: string
    createdMsg: (name: string, uid: string) => string
    createFailed: (msg: string) => string
    searchSuccess: string
    searchNotFound: string
    searchFailed: (msg: string) => string
    confirmDelete: (name: string) => string
    deletedMsg: (name: string) => string
    deleteFailed: (msg: string) => string
  }
  allergens: {
    title: string
    description: string
    noAccess: string
    noAccessDetail: string
    addBtn: string
    searchPlaceholder: string
    all: string
    mandatory: string
    recommended: string
    fetchFailed: string
    loadingDetail: string
    createdAt: string
    edit: string
    delete: string
    emptyFiltered: string
    empty: string
    pagePrev: string
    pageNext: string
    pageInfo: (cur: number, total: number) => string
    pageRangeInfo: (totalItems: number, start: number, end: number) => string
    createTitle: string
    editTitle: string
    labelJp: string
    labelEn: string
    labelType: string
    typeMandatoryOption: string
    typeRecommendedOption: string
    placeholderJp: string
    placeholderEn: string
    validateJpRequired: string
    validateEnRequired: string
    cancel: string
    adding: string
    add: string
    updating: string
    update: string
    confirmDelete: (jp: string, en: string) => string
    createdMsg: string
    createFailed: (msg: string) => string
    updatedMsg: string
    updateFailed: (msg: string) => string
    deletedMsg: string
    deleteFailed: (msg: string) => string
  }
  account: {
    titleAccount: string
    titlePlanMgmt: string
    accountInfoHeading: string
    email: string
    passwordChange: string
    save: string
    changePassword: string
    currentPasswordPlaceholder: string
    newPasswordPlaceholder: string
    savedEmail: string
    savedPassword: string
    pleaseEnterPassword: string
    qrTitle: string
    qrDesc: string
    qrOpenBasicInfo: string
    breadcrumbAccount: string
    breadcrumbPlan: string
    pageDesc: string
    currentPlan: string
    monthly: string
    contractStart: string
    nextRenewal: string
    statusLabel: string
    statusInUse: string
    planFree: string
    planLight: string
    planBusiness: string
    planPro: string
    recommendTag: string
    comingTag: string
    proPlanComing: string
    alreadyOnPlan: string
    confirmChangePlan: (name: string) => string
    changedToPlan: (name: string) => string
    currentPlanLabel: string
    selectThisPlan: string
    pending: string
    featuresLabel: string
    freeDesc: string
    freeFeature: string
    lightDesc: string
    lightFeatures: string[]
    businessDesc: string
    businessFeatures: string[]
    proDesc: string
    proFeatures: string[]
  }
  storeKnowledge: {
    title: string
    notFound: string
    headerTitle: string
    notAnswered: string
    progressLabel: (answered: number, total: number) => string
    phase1Title: string
    phase1Hint: string
    phase1NoQuestions: string
    phase2Title: string
    phase2Hint: string
    phase2NoQuestions: string
    saveLabel: (n: number) => string
    saving: string
    phase2FloatingSave: (n: number) => string
    affectedSuffix: (n: number) => string
    propagating: string
    answerInputPlaceholder: string
    maxSelectHint: (max: number, selected: number) => string
    uploadLinkBtn: string
    surveyBtn: string
    surveyModalTitle: string
    surveyModalDesc: (slug: string) => string
    fieldQuestionLimit: string
    fieldExpiresDays: string
    create: string
    creating: string
    cancel: string
    close: string
    urlLabel: string
    passcodeLabel: string
    copyBtn: string
    copied: string
    lineCopyBtn: string
    lineMsgSurvey: (url: string, passcode: string) => string
    lineMsgUpload: (url: string, passcode: string) => string
    uploadModalTitle: string
    uploadModalDesc: (slug: string) => string
    propagatedAllergens: (affected: number, added: number, removed: number) => string
    savedAffected: (affected: number) => string
    propagatedAffected: (affected: number) => string
    saveFailed: string
    loadFailed: string
    surveyCreated: string
    surveyFailed: string
    uploadCreated: string
    uploadFailed: string
    savedCount: (n: number) => string
    fieldAllergens: string
    fieldIngredients: string
    fieldCookingMethods: string
    fieldRestrictions: string
    fieldDefault: string
  }
  menuAnalytics: {
    title: string
    storeLabel: string
    noData: string
    fetchFailed: string
    summaryTotal: string
    summaryActive: string
    summaryAvgPrice: string
    summaryConfidence: string
    storeCharacter: string
    categoryComposition: string
    foodComposition: string
    drinkBreakdown: string
    proteinDistribution: string
    topIngredients: (n: number) => string
    cookingMethods: string
    calorieDistribution: string
    tasteProfile: string
    rankPriority: string
    allergenInfo: string
    priceRange: string
    priceRangeBy: (label: string) => string
    centerItems: string
    centerFood: string
    centerAll: string
    other: string
    units: string
    itemsSuffix: (n: number) => string
    yenSuffix: (range: string) => string
    registered: string
    rankS: string
    rankA: string
    rankB: string
    rankC: string
    rankHintS: string
    rankHintA: string
    rankHintB: string
    rankHintC: string
    charProteinSuffix: (names: string) => string
    charDrinkSuffix: (label: string) => string
    charTasteSuffix: (tastes: string) => string
    charFoodCenterSuffix: (cats: string) => string
    charPriceLow: string
    charPriceMid: string
    charPriceHigh: string
    charPriceVeryHigh: string
  }
  login: {
    loading: string
    visualTitle: string
    visualLead: string
    visualBullet1: string
    visualBullet2: string
    visualBullet3: string
    tabLogin: string
    tabRegister: string
    email: string
    password: string
    passwordPlaceholder: string
    restaurantName: string
    restaurantNamePlaceholder: string
    submitLogin: string
    submittingLogin: string
    submitRegister: string
    submittingRegister: string
    forgotPassword: string
    contactSupport: string
    agreeToTerms: string
    termsLinkText: string
    validateEmailRequired: string
    validateEmailFormat: string
    validatePasswordRequired: string
    validatePasswordLength: string
    validateRestaurantNameRequired: string
    validateTermsRequired: string
    loginFailed: string
    invalidCredentials: string
    accountNotFound: string
    networkError: string
    registerSuccess: string
    registerFailed: string
    emailAlreadyRegistered: string
  }
  users: {
    title: string
    titleHeader: string
    subtitle: string
    create: string
    loading: string
    loadingDetail: string
    error: string
    reload: string
    fetchFailed: string
    authRequired: string
    statTotal: string
    statPlatformOwner: string
    statRestaurantOwner: string
    statConsumer: string
    statSuperadmin: string
    statActive: string
    statusActive: string
    statusInactive: string
    rolePlatformOwner: string
    roleRestaurantOwner: string
    roleSuperadmin: string
    roleConsumer: string
    roleUnknown: string
    filterAllRoles: string
    filterAllStatuses: string
    searchPlaceholder: string
    colUserInfo: string
    colRole: string
    colStatus: string
    colCreatedAt: string
    colLastUpdated: string
    colActions: string
    emptyFiltered: string
    actionDisable: string
    actionEnable: string
    actionResetPassword: string
    actionDelete: string
    pending: string
    createModalTitle: string
    fieldEmail: string
    fieldPassword: string
    fieldRole: string
    passwordPlaceholder: string
    cancel: string
    creating: string
    create2: string
    validateEmailRequired: string
    validateEmailFormat: string
    validatePasswordRequired: string
    validatePasswordLength: string
    createSuccess: (msg: string, email: string, role: string) => string
    createFailed: (msg: string) => string
  }
  setup: {
    stepUpload: string
    stepConfirm: string
    stepQr: string
    uploadTitle: string
    uploadSubtitle: string
    analyzing: string
    analyzingNote: string
    dropZoneTitle: string
    dropZoneOr: string
    dropZoneFormats: string
    cameraBtn: string
    proceedToConfirm: (n: number) => string
    confirmTitle: string
    confirmSubtitle: string
    countLabel: (n: number) => string
    publishAll: string
    addAnother: string
    publishFailed: string
    creditExhausted: string
    uploadFailed: string
    qrReadyTitle: string
    qrReadySubtitle: string
    downloadQr: string
    goToAdmin: string
    qrInfoBox: string
    qrTipBox: string
    categoryMain: string
    categoryAppetizer: string
    categoryRice: string
    categorySashimi: string
    categorySushi: string
    categoryDrink: string
    categoryDessert: string
    categorySide: string
    categorySoup: string
    categorySalad: string
    categoryOther: string
  }
  conversations: {
    titleList: string
    titleDetail: string
    backToList: string
    prev: string
    next: string
    totalCount: (n: number) => string
    empty: string
    failedList: string
    failedDetail: string
    allStores: string
    colStore: string
    colSummary: string
    colTopic: string
    colLang: string
    colCount: string
    colActions: string
    colDate: string
    noSummary: string
    noMessages: string
    detailStore: string
    detailSummary: string
    detailRallies: string
    detailStart: string
    detailDevice: string
    summaryNone: string
  }
  basicInfo: {
    title: string
    loading: string
    loadingDetail: string
    error: string
    reload: string
    errorRestaurantFetch: string
    errorRestaurantNotLoaded: string
    errorUserNotFound: string
    sectionAiSearch: string
    sectionDetail: string
    sectionExternalLinks: string
    aiSearchDesc: string
    searchByName: string
    searchByNameAndMenu: string
    searching: string
    restaurantName: string
    officialWebsite: string
    phone: string
    address: string
    businessType: string
    pleaseSelect: string
    companyName: string
    companyNamePlaceholder: string
    representativeName: string
    representativeNamePlaceholder: string
    introduction: string
    introductionPlaceholder: string
    businessHours: string
    holidays: string
    seats: string
    seatsPlaceholder: string
    budget: string
    budgetPlaceholder: string
    parking: string
    parkingPlaceholder: string
    payment: string
    paymentPlaceholder: string
    accessInfo: string
    accessInfoPlaceholder: string
    reservationUrl: string
    featuresLabel: string
    featuresPlaceholder: string
    googleMaps: string
    tabelog: string
    gurunavi: string
    instagram: string
    saveAll: string
    saved: string
    saveFailed: (msg: string) => string
    searchSuccess: (extra: string) => string
    menuCountSuffix: (n: number) => string
    searchFailed: (msg: string) => string
  }
  prompts: {
    title: string
    breadcrumb: string
    save: string
    saving: string
    saved: string
    saveFailed: string
    selectRestaurant: string
    pleaseSelect: string
    aiInstructionsFor: (name: string) => string
    intro: string
    aiTone: string
    additionalInstructions: string
    promptPlaceholder: string
    charCount: (n: number) => string
    advanced: string
    advancedDesc: string
    enableManualRecommended: string
    enableManualPopular: string
    noMenus: string
    basePrompt: string
    basePromptContent: string
    googleReview: string
    googleReviewDesc: string
    enable: string
    noGmbNotice: string
    toneStandard: string
    toneFormal: string
    toneCasual: string
    toneProfessional: string
  }
  dailySpecials: {
    title: string
    headerDesc: string
    section1: string
    section2: (n: number) => string
    sectionActive: string
    sectionStock: string
    activeDesc: string
    stockDesc: string
    notRegistered: string
    noStock: string
    takePhoto: string
    textPlaceholder: string
    extractFromText: string
    extracting: string
    aiReading: string
    confirmBtn: string
    confirming: string
    replaceWarning: (n: number) => string
    namePlaceholder: string
    pricePlaceholder: string
    categoryPlaceholder: string
    ingredientsPlaceholder: string
    allergensPlaceholder: string
    reuseToToday: (n: number) => string
    reusing: string
    lastShown: (date: string) => string
    toastLoadFailed: string
    toastNoMenuDetected: string
    toastExtracted: (n: number) => string
    toastExtractFailed: string
    toastEnterText: string
    toastNameEmpty: string
    toastConfirmed: (n: number) => string
    toastConfirmFailed: string
    toastReused: (n: number) => string
    toastReuseFailed: string
    warnPriceMissing: string
    warnIngredientsMissing: string
  }
  layout: {
    loading: string
    logout: string
    account: string
    loggedInAs: string
    restaurantOwner: string
    platformOwner: string
    restaurantView: string
    platformView: string
    restaurantSystemTitle: string
    platformSystemTitle: string
    more: string
    planLockedToast: string
    langToggleAria: string
  }
  nav: {
    menuList: string
    dailySpecials: string
    qrManagement: string
    basicInfo: string
    dashboard: string
    menuAnalytics: string
    storeKnowledge: string
    photoReview: string
    conversations: string
    prompts: string
    users: string
    restaurantList: string
    searchLogs: string
  }
  dashboard: {
    restaurantTitle: string
    platformTitle: string
    loadingStats: string
    error: string
    errorStats: string
    errorUserNotFound: string
    errorRestaurantNotFound: string
    errorRestaurantFetch: string
    langDistribution: string
    restaurantInfo: string
    restaurantName: string
    registeredMenus: string
    phoneNumber: string
    address: string
    status: string
    statusActive: string
    statusInactive: string
    notSet: string
    eventLogStats: string
    eventLogStatsAll: string
    chatStatsLabel: (n: number) => string
    chatStatsAllLabel: (n: number) => string
    sessionStats: string
    sessionCount: string
    avgStay: string
    totalSessions: string
    avgStayDuration: string
    minute: string
    second: string
    serviceOverview: string
    totalRestaurants: string
    totalMenus: string
    totalVerifiedMenus: string
    totalUsers: string
    totalQrScans: string
    usersByRole: string
    roleSuperadmin: string
    rolePlatformOwner: string
    roleRestaurantOwner: string
    roleConsumer: string
    topicDistribution: string
    referrer: string
    screenSize: string
    langUsageDistribution: string
    deviceDistribution: string
  }
  topic: Record<string, string>
}

const adminCopy: Record<AdminLang, AdminCopy> = {
  ja: {
    common: {
      retry: '再試行',
      backToAdminTop: '管理トップへ戻る',
      prev: '前へ',
      next: '次へ',
      delete: '削除',
      approve: '承認',
      reject: '却下',
      allStatuses: '全ステータス',
      allRestaurants: '全レストラン',
      ellipsis: '...',
    },
    error: {
      pageCrashed: '画面の表示でエラーが発生しました',
      pleaseRetry: 'お手数ですが、もう一度お試しください。繰り返し発生する場合は、下のエラー内容をお知らせください。',
      unknown: '不明なエラー',
    },
    searchLogs: {
      title: '検索ログ',
      description: (n) => `トップページの検索で入力されたテキストとフィルタの履歴（${n}件）`,
      empty: 'まだ検索ログがありません',
      colTime: '日時',
      colText: 'テキスト',
      colFilters: 'フィルタ',
      colResultCount: '結果件数',
    },
    photoReview: {
      title: '写真レビュー',
      empty: '投稿写真なし',
      confirmDelete: 'この写真を完全に削除しますか？',
      altSubmitted: '投稿写真',
      altCurrent: '現在の画像',
    },
    menuList: {
      noMenuDetected: 'メニューを検出できませんでした。別のファイルを試してください。',
      fileAnalysisFailed: (msg) => `ファイル解析に失敗しました: ${msg}`,
      enterText: 'テキストを入力してください',
      noMenuDetectedText: 'メニューを検出できませんでした。別のテキストを試してください。',
      textAnalysisFailed: (msg) => `テキスト解析に失敗しました: ${msg}`,
      uncategorized: '未分類',
      addedItem: (name) => `「${name}」を追加しました`,
      duplicateItem: (name) => `「${name}」は既に登録済みです`,
      saveFailed: 'メニューの保存に失敗しました',
      processedDone: '処理完了',
      addedCount: (n) => `${n}件追加`,
      skippedCount: (n) => `${n}件は登録済みでスキップ`,
      failedCount: (n) => `${n}件失敗`,
      sep: '、',
      fetchRestaurantFailed: 'レストラン情報の取得に失敗しました。',
      requiredFields: '料理名、価格、カテゴリーは必須です',
      restaurantNotFound: 'レストラン情報が見つかりません',
      imageUploadFailed: 'メニューは追加しましたが、画像のアップロードに失敗しました',
      addedSuccess: 'メニューを追加しました！',
      addFailed: (msg) => `メニューの追加に失敗しました: ${msg}`,
      sourceUrlMissing: 'メニュー情報ソースURLが設定されていません。基本情報→情報ソースタブでURLを設定してください。',
      scrapeStartFailed: 'スクレイピングの開始に失敗しました',
      scrapeFailed: 'スクレイピングに失敗しました',
      taskStatusCheckFailed: 'タスクステータスの確認に失敗しました。再度お試しください。',
      approveFailed: 'メニューの承認に失敗しました',
      allApprovedSuccess: 'すべてのメニューを承認しました！',
      updatedSuccess: 'メニューを更新しました！',
      updateFailed: (msg) => `メニューの更新に失敗しました: ${msg}`,
      approvalFailed: '承認に失敗しました',
      ownerVerifyFailed: '店主確認の登録に失敗しました',
      statusChangeFailed: 'ステータス変更に失敗しました',
      noPendingApproval: '承認待ちのメニューはありません',
      bulkApproveFailed: '一括承認に失敗しました',
      confirmDeleteMenu: 'このメニューを削除しますか？',
      deletedMenu: 'メニューを削除しました',
      deleteMenuFailed: (msg) => `メニューの削除に失敗しました: ${msg}`,
      rankMustVerify: '必ず確認',
      rankNeedReview: '要確認',
      rankReviewRecommended: '確認推奨',
      rankVerified: '確認不要',
      ownerVerifiedItem: (name) => `「${name}」を店主確認済みにしました`,
      confirmBulkApprove: (n) => `${n}件の未承認メニューをすべて承認しますか？`,
      bulkApproved: (n) => `${n}件を承認しました`,
      storeLabel: '店舗',
      verifyPriorityTitle: '確認優先度',
      cardTitle: '📋 メニュー・商品管理',
      tableSearchPlaceholder: '料理名・材料・タグで検索…',
      tableFilterAll: (n) => `すべて (${n})`,
      tableFilterVerified: (n) => `承認済 (${n})`,
      tableFilterWarning: (n) => `要確認 (${n})`,
      tableSortDefault: '並び順：標準',
      tableSortByName: '料理名',
      tableSortByPrice: '価格',
      tableSortByRank: '確認優先度',
      tableSortAsc: '昇順',
      tableSortDesc: '降順',
      perPage: (n) => `${n}件/ページ`,
      pagePrev: '前へ',
      pageNext: '次へ',
      pageInfo: (cur, total) => `${cur} / ${total}`,
      addNewBtn: '＋ 新規追加',
      fetchFromSourceBtn: '情報ソースから取込',
      bulkApproveBtn: '一括承認',
      colName: '料理名',
      colCategory: 'カテゴリー',
      colPrice: '価格',
      colStatus: '状態',
      colRank: '優先度',
      colActions: '操作',
      rowActive: '提供中',
      rowInactive: '停止中',
      rowEdit: '編集',
      rowPreview: 'プレビュー',
      rowDelete: '削除',
      rowApprove: '承認',
      rowVerifyAsOwner: '店主確認',
      rowToggleStatus: '提供切替',
      rowVerified: '確認済',
      rowDescription: '説明',
      rowIngredients: '材料',
      rowAllergens: 'アレルゲン',
      rowCooking: '調理法',
      rowRestrictions: '対応',
      formTabBasic: '基本',
      formTabDetail: '詳細',
      formTabNarrative: 'ストーリー',
      formTabImage: '画像',
      formTabAdvanced: '応用',
      formAddTitle: 'メニューを追加',
      formEditTitle: 'メニューを編集',
      formName: '料理名（日本語）',
      formNameEn: '料理名（英語）',
      formCategory: 'カテゴリー',
      formCategorySelect: 'カテゴリーを選択',
      formPrice: '価格',
      formDescription: '説明（日本語）',
      formDescriptionEn: '説明（英語）',
      formIngredients: '材料',
      formIngredientsHint: 'カンマ区切りで入力',
      formAllergens: 'アレルゲン',
      formAllergensMandatory: '表示義務',
      formAllergensRecommended: '推奨表示',
      formCookingMethods: '調理法',
      formRestrictions: '対応',
      formImage: '画像',
      formImagePick: '画像を選ぶ',
      formImageReplace: '画像を差し替え',
      formImageRemove: '画像を削除',
      formStory: 'ストーリー',
      formChefNote: 'シェフの一言',
      formTastingNote: '味のメモ',
      formPairingSuggestion: 'ペアリング',
      formSeasonalNote: '季節のメモ',
      formServingSize: '提供サイズ',
      formAvailability: '提供時期',
      formTaxIncluded: '税込',
      formTaxRate: '税率（%）',
      formCurrency: '通貨',
      formCancel: 'キャンセル',
      formSave: '保存',
      formSaving: '保存中…',
      uploadTitle: 'AIで一括登録',
      uploadDescription: 'メニュー画像 / 写真 / テキストから自動でメニューを抽出します',
      uploadFromFile: 'ファイルを選ぶ',
      uploadFromCamera: 'カメラで撮影',
      uploadFromText: 'テキストを貼り付け',
      uploadAnalyzing: 'AIが解析中…',
      pasteTextTitle: 'メニューのテキストを貼り付け',
      pasteTextPlaceholder: '例: 唐揚げ定食 980円\n生ビール 600円',
      pasteTextAnalyze: '解析',
      pasteTextCancel: 'キャンセル',
      visionApprovalTitle: (n) => `${n}件のメニュー候補を確認`,
      visionApproveItem: '登録',
      visionApproving: '登録中…',
      visionRemove: '除外',
      visionApproveAll: 'すべて登録',
      visionApprovingAll: '登録中…',
      visionClose: '閉じる',
      visionEmpty: 'メニュー候補がありません',
      fetchApprovalTitle: '取り込み候補を確認',
      fetchApproveItem: '採用',
      fetchDenyItem: '却下',
      fetchApproveAll: 'すべて採用',
      fetchDenyAll: 'すべて却下',
      fetchClose: '閉じる',
      fetchSourceUrl: (url) => `情報ソース: ${url}`,
      previewTitle: 'メニュープレビュー',
      previewEdit: '編集',
      previewApprove: '店主確認済みにする',
      previewClose: '閉じる',
      previewIngredients: '材料',
      previewAllergens: 'アレルゲン',
      previewCooking: '調理法',
      previewRestrictions: '対応',
      previewTaste: '味プロファイル',
      previewVerification: '確認状態',
      previewDataSource: 'データソース',
      previewConfidence: (n) => `信頼度: ${n}%`,
      previewNoImage: '画像なし',
      tableTitle: 'メニュー一覧',
      tableTotalCount: (n) => `登録数: ${n}件`,
      tableFetchFromSourceBtn: '🤖 基本情報のソースからメニューを取得',
      tableSearchBoxPlaceholder: '🔍 メニュー名、カテゴリ、原材料で検索...',
      tableSortLabel: '並び替え:',
      tableShowLabel: '表示件数:',
      tableLoading: '📋 メニューを読み込み中...',
      tableReload: '再読み込み',
      tableBulkApproveCount: (n) => `一括承認 (${n}件)`,
      tableColNo: 'No.',
      tableColDetail: 'メニュー詳細',
      tableEmpty: 'メニューがありません。「手動で新規追加」ボタンからメニューを追加してください。',
      tableNoIngredients: '原材料なし',
      tableStatusPublic: '公開',
      tableStatusPrivate: '非公開',
      tableStatusVerified: '承認済み',
      tableStatusPending: '未承認',
      tableApproveSymbol: '✓ 承認',
      tablePreviewBtn: '👁️ プレビュー',
      tableEditBtn: '✏️ 編集',
      tableDeleteBtn: '🗑️ 削除',
      tablePagePage: 'ページ',
      tableShowingItems: (total, start, end) => `全${total}件中 ${start}-${end}件を表示`,
      tableManualAdd: '➕ 手動で新規追加',
      tableSortOptDefault: 'デフォルト',
      tableSortOptRank: '確認優先度',
      tableSortOptCreated: '登録日',
      tableSortOptPrice: '価格',
      tableSortOptName: '名前',
      tableSortAscWithArrow: '↑ 昇順',
      tableSortDescWithArrow: '↓ 降順',
      tablePerPageOpt: (n) => `${n}件`,
      tableLoadingItems: 'メニュー読み込み中...',
      pvNarrativeStory: '料理のストーリー',
      pvNarrativeChefNote: 'シェフのこだわり',
      pvNarrativeTastingNote: '味わいの特徴',
      pvNarrativePairing: 'おすすめの組み合わせ',
      pvNarrativeSeasonal: '季節のポイント',
      pvServingSize: '量・サイズ',
      pvServingAvailability: '提供条件',
      pvServingStyle: '提供スタイル',
      pvServingTemperature: '提供温度',
      pvNotSet: '未設定',
      pvRankS: '店主確認済',
      pvRankA: '一次ソース',
      pvRankB: '確認推奨',
      pvRankC: 'AI推定',
      pvRankUnknown: '未判定',
      pvDataCompleteness: 'データ完成度',
      pvCompletenessHint: 'フィールド数の埋まり具合。信頼度(S/A/B/C)とは別軸。',
      pvApprovedAt: '承認',
      pvDataSourceOwner: '店主確認済み',
      pvDataSourceOfficial: '公式一次ソース',
      pvDataSourceAi: 'AI推定',
      pvDataSourceUncat: '未分類',
      pvPublished: '公開中',
      pvOpenProductPage: '商品ページを開く →',
      pvSectionDescription: '説明文',
      pvSectionIngredients: '原材料',
      pvSectionAllergens: 'アレルゲン',
      pvSectionCooking: '調理法',
      pvSectionRestrictions: '食事制限',
      pvNone: 'なし',
      pvSectionNarrative: 'ナラティブ（NFG）',
      pvSectionServing: '提供情報',
      pvSectionFeaturedTags: '特集タグ',
      pvMissingFields: (n) => `未設定の項目 (${n})`,
      pvEditBtn: '✏️ 編集する',
      pvVerifyOwnerBtn: '✅ 店主確認済みにする',
      pvVerifyOwnerConfirm: (name) => `「${name}」を店主確認済みとして承認しますか？`,
      pvVerifyOwnerTitle: 'このデータを店主が確認したものとして verification_rank=S に昇格',
      pvCloseBtn: '閉じる',
      upCardTitle: '📤 メニュー・商品をアップロード',
      upCardDesc: 'メニュー情報をアップロードすると、AIが自動で構造化します',
      upCamera: 'カメラで撮影',
      upFile: 'ファイル選択',
      upFileFormats: '画像/PDF/Excel/CSV',
      upPaste: 'テキスト貼り付け',
      upGoogleDrive: 'Googleドライブ',
      upComingSoon: '準備中',
      upPasteModalTitle: '📝 メニューテキストを貼り付け',
      upPasteDesc: 'メニューの情報をテキストで貼り付けてください。料理名・価格・説明などが含まれていればAIが自動で構造化します。',
      upPastePlaceholder: '例:\n唐揚げ定食 850円\n鶏もも肉のから揚げ5個、ご飯、味噌汁付き\n\n刺身盛り合わせ 1,500円\nマグロ、サーモン、ブリ、甘エビの4点盛り',
      upPasteCancel: 'キャンセル',
      upPasteAnalyze: '🤖 AI解析する',
      upAnalyzingTitle: '🤖 AIがメニューを解析中...',
      upAnalyzingDesc: 'メニューデータを抽出しています',
      upFetchingTitle: '🤖 AIが解析中...',
      upFetchingDesc: '基本情報のソースからメニューを取得しています...',
      upVisionTitle: '🤖 AI解析結果の確認',
      upVisionDetectedSummary: (total) => `📸 画像から ${total}件 のメニューを検出しました。`,
      upVisionRegisteredHint: (n) => `うち ${n}件 は登録済み（自動でスキップされます）。`,
      upVisionReviewHint: '内容を確認して承認してください。',
      upVisionApprovingAll: '⏳ 登録中…',
      upVisionApproveAll: (n) => `✅ すべて承認 (${n}件)`,
      upVisionDiscardAll: '❌ すべて破棄',
      upVisionRegistered: '登録済み',
      upVisionUncategorized: '未分類',
      upVisionApproveItem: '✅ 承認',
      upVisionItemApproving: '⏳ 登録中…',
      upVisionItemRegistered: '登録済み',
      upVisionItemRemove: '❌',
      upVisionEmpty: 'すべてのメニューが処理されました',
      upFetchApprovalTitle: '🤖 AI取得メニューの承認',
      upFetchSourceLabel: 'ソース',
      upFetchNew: (n) => `🆕 新規メニュー: ${n}`,
      upFetchDuplicate: (n) => `🔄 重複メニュー: ${n}`,
      upFetchApproveAll: '✅ すべて承認',
      upFetchDenyAll: '❌ すべて拒否',
      upFetchMergeDup: '🔄 重複をすべてマージ',
      upFetchNewHeading: (n) => `🆕 新規メニュー (${n}件)`,
      upFetchConfidence: (n) => `信頼度: ${n}%`,
      upFetchApprove: '✅ 承認',
      upFetchDeny: '❌ 拒否',
      upFetchEmpty: 'すべてのメニューが処理されました',
      mfValidateImageType: 'jpg, png, webp のみ対応',
      mfValidateImageSize: 'ファイルサイズは5MB以下',
      mfUploadFailed: 'アップロードに失敗しました',
      mfTitle: '📝 メニュー編集',
      mfTabBasic: '📝 基本情報',
      mfTabMaterials: '🥕 原材料',
      mfTabAllergens: '⚠️ アレルギー',
      mfTabNfg: '📊 NFG詳細',
      mfFieldNameJp: '料理名（日本語）*',
      mfFieldNameEn: '料理名（英語）',
      mfBtnAiTranslate: '🤖 AI自動翻訳',
      mfFieldPrice: '価格 *',
      mfFieldCategory: 'カテゴリー *',
      mfSelect: '選択してください',
      mfFieldDescJp: '料理の説明（日本語）',
      mfBtnAiGenerate: '🤖 AI生成',
      mfFieldDescEn: '料理の説明（英語）',
      mfFieldImage: '商品画像',
      mfUploading: 'アップロード中...',
      mfImageDropHint: '画像をドロップまたはクリックして選択',
      mfImageFormats: 'jpg / png / webp、最大5MB',
      mfImageSelected: (name) => `選択済み: ${name}（保存後にアップロードされます）`,
      mfImageAltPreview: '商品画像プレビュー',
      mfImageUrlLabel: 'または画像URLを直接入力',
      mfFieldProductUrl: '商品ページURL',
      mfProductUrlHint: 'メーカーページ等のリンク（ドリンク商品向け）',
      mfBtnNextMaterials: '次へ: 原材料設定 →',
      mfConfidenceHint: '現在の信頼度: 65% → 完了後: 95%',
      mfFieldIngredients: '原材料（カンマ区切りで入力）',
      mfBtnAiSuggest: '🤖 AI推察',
      mfIngredientsPlaceholder: '例: 鶏肉, 玉ねぎ, にんじん, 醤油, みりん',
      mfIngredientsHint: '※ 複数の原材料はカンマ（,）で区切って入力してください',
      mfFieldCookingMethods: '調理法',
      mfNoCookingMethods: '調理法マスタデータなし',
      mfBtnNextAllergens: '次へ: アレルギー設定 →',
      mfFieldAllergenInfo: '⚠️ アレルゲン情報',
      mfAllergenMandatory: '特定原材料（表示義務）:',
      mfAllergenRecommended: '推奨表示アレルゲン:',
      mfAllergenLoadFailed: 'アレルゲン情報が読み込めませんでした。後で再試行してください。',
      mfFieldRestrictions: '食事制約',
      mfNoRestrictions: '制約マスタデータなし',
      mfBtnNextNfg: '次へ: NFG詳細 →',
      mfSectionNarrative: '📖 ナラティブ（料理の物語）',
      mfNarrativeStory: '料理のストーリー',
      mfNarrativeStoryPh: 'この料理が生まれた背景やこだわり',
      mfNarrativeChef: 'シェフのコメント',
      mfNarrativeChefPh: '料理人のおすすめポイント',
      mfNarrativeTasting: 'テイスティングノート',
      mfNarrativeTastingPh: '味わいの特徴',
      mfNarrativePairing: 'ペアリング提案',
      mfNarrativePairingPh: 'おすすめのお酒や組み合わせ',
      mfNarrativeSeasonal: '季節のメモ',
      mfNarrativeSeasonalPh: '旬の情報など',
      mfSectionServing: '🍽️ 提供情報',
      mfServingSize: 'サイズ',
      mfServingNotSet: '未設定',
      mfServingSmall: '小盛り',
      mfServingRegular: '普通',
      mfServingLarge: '大盛り',
      mfServingFamily: 'ファミリー',
      mfServingPeriod: '提供期間',
      mfServingAlways: '通年',
      mfServingSeasonal: '季節限定',
      mfServingLimited: '数量限定',
      mfServingSpecial: 'イベント限定',
      mfSectionTags: '🏷️ 特集タグ',
      mfTagsPlaceholder: '人気, 店長おすすめ, 季節限定（カンマ区切り）',
      mfTagsHint: 'カンマ区切りで入力。チャットAIが「おすすめは？」に活用します',
      mfSectionPrice: '💰 価格詳細',
      mfCurrency: '通貨',
      mfTaxRate: '税率(%)',
      mfTaxIncluded: '税込価格',
      mfStatusLabel: '📋 確認ステータス',
      mfStatusVerified: '✓ 承認済み',
      mfStatusPending: '⚠️ 未承認',
      mfStatusHint: '※ 「承認済み」に設定すると、メニューが検証済みとしてマークされます',
      mfCancel: 'キャンセル',
      mfSave: '💾 保存',
      hintIngredients: '原材料',
      hintAllergens: 'アレルゲン',
      hintDescription: '説明文',
      hintNameEn: '英語名',
      hintCooking: '調理法',
      hintNarrative: 'ナラティブ',
      hintServing: '提供情報',
    },
    stores: {
      title: '掲載レストラン一覧',
      loadingDetail: 'レストランを読み込み中...',
      headerTitle: '掲載レストラン一覧',
      newStore: '新規レストランを登録',
      countSuffix: 'レストラン',
      searchPlaceholder: '店名・住所・コードで検索...',
      all: 'すべて',
      onboarded: '正規導入',
      free: 'フリー',
      empty: 'レストランが見つかりません',
      notSet: '未設定',
      todayLabel: '今日',
      oneDayAgo: '1日前',
      daysAgoLabel: (n) => `${n}日前`,
      nowLabel: '今',
      badgePlanFree: 'フリー',
      badgePlanOnboarded: '正規導入',
      updateLabel: '更新',
      metricMenu: 'メニュー',
      metricVerified: '承認済',
      metricScan: 'QRスキャン',
      btnManage: '管理',
      btnMenu: 'メニュー',
      btnDelete: '削除',
      titleManage: '基本情報を管理',
      titleMenu: 'メニュー一覧を表示',
      titleDelete: 'レストランを削除',
      modalTitle: '新規レストランを登録',
      fieldName: 'レストラン名 *',
      fieldNamePlaceholder: '例: 蟹と海鮮ぼんた くるふ福井駅店',
      searchByName: '店名で情報を検索',
      searching: '検索中...',
      searchHint: '店名を入力して検索すると、食べログ・Googleマップ等から情報を自動取得します',
      fieldOwner: 'レストランオーナー *',
      chooseOwner: 'オーナーを選択してください',
      noOwnersAvailable: '利用可能なレストランオーナーがいません',
      fieldType: '業種',
      pleaseSelect: '選択してください',
      fieldAddress: '住所 *',
      addressPlaceholder: '例: 福井県福井市中央1-1-25',
      fieldPhone: '電話番号 *',
      phonePlaceholder: '例: 0776-22-2235',
      detailSection: '詳細情報（検索で自動入力されます）',
      introduction: 'レストラン紹介',
      introductionPlaceholder: 'レストランの特徴や魅力',
      businessHours: '営業時間',
      holidays: '定休日',
      seats: '座席数',
      budget: '予算',
      parking: '駐車場',
      payment: '支払い方法',
      access: 'アクセス',
      features: '特徴・こだわり',
      register: '登録する',
      registering: '登録中...',
      cancel: 'キャンセル',
      validateNameOwner: 'レストラン名とレストランオーナーは必須です',
      validatePhone: '電話番号は必須です',
      validateAddress: '住所は必須です',
      validateStoreName: '店名を入力してください',
      createdMsg: (name, uid) => `レストラン "${name}" を登録しました（UID: ${uid}）`,
      createFailed: (msg) => `レストラン作成に失敗しました: ${msg}`,
      searchSuccess: '情報を取得しました。内容を確認して登録してください。',
      searchNotFound: '情報が見つかりませんでした',
      searchFailed: (msg) => `情報の検索に失敗しました: ${msg}`,
      confirmDelete: (name) => `レストラン "${name}" を削除しますか？\n\nこの操作は元に戻すことができません。`,
      deletedMsg: (name) => `レストラン "${name}" を削除しました`,
      deleteFailed: (msg) => `レストランの削除に失敗しました: ${msg}`,
    },
    allergens: {
      title: 'アレルゲン管理',
      description: 'システム全体のアレルゲン情報を管理します',
      noAccess: 'アクセス権限がありません',
      noAccessDetail: 'このページはプラットフォームオーナーのみがアクセスできます。',
      addBtn: '+ アレルゲン追加',
      searchPlaceholder: 'アレルゲン名で検索...',
      all: 'すべて',
      mandatory: '表示義務',
      recommended: '推奨表示',
      fetchFailed: 'アレルゲン情報の取得に失敗しました',
      loadingDetail: 'アレルゲン情報を読み込み中...',
      createdAt: '作成日',
      edit: '編集',
      delete: '削除',
      emptyFiltered: '条件に一致するアレルゲンがありません',
      empty: 'アレルゲンが登録されていません',
      pagePrev: '‹ 前へ',
      pageNext: '次へ ›',
      pageInfo: (cur, total) => `${cur} / ${total} ページ`,
      pageRangeInfo: (totalItems, start, end) => `(${totalItems} 件中 ${start} - ${end} 件)`,
      createTitle: 'アレルゲン追加',
      editTitle: 'アレルゲン編集',
      labelJp: '日本語名 *',
      labelEn: '英語名 *',
      labelType: '表示タイプ *',
      typeMandatoryOption: '表示義務 (7品目)',
      typeRecommendedOption: '推奨表示',
      placeholderJp: '例: えび',
      placeholderEn: '例: Shrimp',
      validateJpRequired: '日本語名は必須です',
      validateEnRequired: '英語名は必須です',
      cancel: 'キャンセル',
      adding: '追加中...',
      add: '追加',
      updating: '更新中...',
      update: '更新',
      confirmDelete: (jp, en) => `「${jp} (${en})」を削除しますか？\n\n注意: このアレルゲンが使用されているメニューがある場合、影響が出る可能性があります。`,
      createdMsg: 'アレルゲンを追加しました',
      createFailed: (msg) => `アレルゲンの追加に失敗しました: ${msg}`,
      updatedMsg: 'アレルゲンを更新しました',
      updateFailed: (msg) => `アレルゲンの更新に失敗しました: ${msg}`,
      deletedMsg: 'アレルゲンを削除しました',
      deleteFailed: (msg) => `アレルゲンの削除に失敗しました: ${msg}`,
    },
    account: {
      titleAccount: 'アカウント情報',
      titlePlanMgmt: 'プラン・契約管理',
      accountInfoHeading: 'アカウント情報',
      email: 'メールアドレス',
      passwordChange: 'パスワード変更',
      save: '保存',
      changePassword: 'パスワードを変更',
      currentPasswordPlaceholder: '現在のパスワード',
      newPasswordPlaceholder: '新しいパスワード',
      savedEmail: 'メールアドレスを保存しました',
      savedPassword: 'パスワードを変更しました',
      pleaseEnterPassword: 'パスワードを入力してください',
      qrTitle: 'QRコード管理',
      qrDesc: 'QRコードの生成・ダウンロードは基本情報ページから行えます。店頭掲示用のPDFも準備できます。',
      qrOpenBasicInfo: '基本情報を開く',
      breadcrumbAccount: '👤 アカウント情報',
      breadcrumbPlan: '💳 プラン・契約管理',
      pageDesc: 'プランを選択・変更できます',
      currentPlan: '現在のプラン',
      monthly: '月額',
      contractStart: '契約開始日',
      nextRenewal: '次回更新日',
      statusLabel: 'ステータス',
      statusInUse: '利用中',
      planFree: 'フリープラン',
      planLight: 'ライトプラン',
      planBusiness: 'ビジネスプラン',
      planPro: 'プロプラン',
      recommendTag: 'おススメ',
      comingTag: '準備中 🔜',
      proPlanComing: 'Proプランは準備中です',
      alreadyOnPlan: '現在ご利用中のプランです',
      confirmChangePlan: (name) => `${name}に変更しますか？`,
      changedToPlan: (name) => `${name}に変更しました`,
      currentPlanLabel: '現在のプラン',
      selectThisPlan: 'このプランを選択',
      pending: '準備中',
      featuresLabel: '機能：',
      freeDesc: '一般ユーザー向け機能。セッションが切れてもOMISEAIの撮って解説機能は使用可能。',
      freeFeature: '履歴保存期間3ヶ月',
      lightDesc: 'スマホで撮るだけ。AIが商品名はもちろん背景や原材料など深い情報を多言語で即解説。',
      lightFeatures: ['QRポップ送付', 'AI多言語ガイド', 'お店基礎情報登録', 'Googleクチコミ連携'],
      businessDesc: 'おススメや人気商品など学習データから設定、編集可能。AIがデータに基づき売上アップや業務改善に直接貢献。',
      businessFeatures: ['店舗ロゴ入りQRポップ', '店舗専用AIガイド', '店舗情報学習', 'AIおすすめ/人気ランキング', '編集機能管理画面', 'データ管理、分析'],
      proDesc: '店舗支援機能までてっついたフルスペック',
      proFeatures: ['店舗AIの全機能+', 'SNSエージェント機能', 'スタッフ教育モード', '予約管理/需要予測'],
    },
    storeKnowledge: {
      title: '店舗知識',
      notFound: 'レストランが見つかりません',
      headerTitle: '店舗知識 (v2.1)',
      notAnswered: '未回答',
      progressLabel: (answered, total) => `${answered}問回答済み / 全${total}問`,
      phase1Title: 'Phase 1: 厨房プロファイル',
      phase1Hint: '回答すると即座にメニューのアレルゲンに波及',
      phase1NoQuestions: '厨房プロファイル質問なし（揚げ物・炒め物・だし系メニューなし）',
      phase2Title: 'AIが見つけた要確認ポイント',
      phase2Hint: '答えると料理データが「確認済み」になり精度が上がります',
      phase2NoQuestions: '料理ヒアリング質問がありません',
      saveLabel: (n) => `保存 (${n}件)`,
      saving: '保存中...',
      phase2FloatingSave: (n) => `Phase 2 保存 (${n}件)`,
      affectedSuffix: (n) => `${n}品対象`,
      propagating: '波及処理中...',
      answerInputPlaceholder: '回答を入力',
      maxSelectHint: (max, selected) => `最大${max}品選択（${selected}品選択中）`,
      uploadLinkBtn: 'メニュー収集リンク',
      surveyBtn: 'オーナーサーベイ作成',
      surveyModalTitle: 'オーナーサーベイ作成',
      surveyModalDesc: (slug) => `${slug} のメニュー確認URLを発行します`,
      fieldQuestionLimit: '質問数',
      fieldExpiresDays: '有効期限（日数）',
      create: '作成',
      creating: '作成中...',
      cancel: 'キャンセル',
      close: '閉じる',
      urlLabel: 'URL',
      passcodeLabel: 'パスコード',
      copyBtn: 'コピー',
      copied: 'コピーしました',
      lineCopyBtn: 'LINE送信用テキストをコピー',
      lineMsgSurvey: (url, passcode) => `メニュー確認のお願い\n\nURL: ${url}\nパスコード: ${passcode}\n\n上のURLを開いてパスコードを入力すると、メニューの確認ができます。`,
      lineMsgUpload: (url, passcode) => `メニュー登録のお願い\n\nURL: ${url}\nパスコード: ${passcode}\n\n上のURLを開いてパスコードを入力し、メニュー表の写真を撮影してください。AIが自動でメニューを読み取ります。`,
      uploadModalTitle: 'メニュー収集リンク作成',
      uploadModalDesc: (slug) => `${slug} のメニュー収集URLを発行します。店主がスマホで写真を撮ってメニューを登録できます。`,
      propagatedAllergens: (affected, added, removed) => `${affected}品に波及 (+${added} -${removed})`,
      savedAffected: (affected) => `保存完了 (${affected}品対象)`,
      propagatedAffected: (affected) => `${affected}品に波及`,
      saveFailed: '保存失敗',
      loadFailed: '質問の読み込みに失敗',
      surveyCreated: 'サーベイを作成しました',
      surveyFailed: 'サーベイ作成に失敗しました',
      uploadCreated: 'メニュー収集リンクを作成しました',
      uploadFailed: 'リンク作成に失敗しました',
      savedCount: (n) => `${n}件保存`,
      fieldAllergens: 'アレルゲン',
      fieldIngredients: '食材',
      fieldCookingMethods: '調理法',
      fieldRestrictions: '対応',
      fieldDefault: '確認',
    },
    menuAnalytics: {
      title: 'メニュー分析',
      storeLabel: '店舗:',
      noData: 'データなし',
      fetchFailed: 'データの取得に失敗しました',
      summaryTotal: '総メニュー数',
      summaryActive: '提供中',
      summaryAvgPrice: '平均価格',
      summaryConfidence: '平均完成度',
      storeCharacter: 'この店舗の特徴',
      categoryComposition: 'カテゴリ構成',
      foodComposition: 'フード構成',
      drinkBreakdown: 'ドリンク内訳',
      proteinDistribution: '素材別分布',
      topIngredients: (n) => `食材 TOP${n}`,
      cookingMethods: '調理法分布',
      calorieDistribution: 'カロリー帯分布',
      tasteProfile: '味覚プロファイル',
      rankPriority: '確認優先度',
      allergenInfo: 'アレルゲン情報',
      priceRange: '価格帯分布（全体）',
      priceRangeBy: (label) => `価格帯：${label}`,
      centerItems: '品目',
      centerFood: 'フード',
      centerAll: '全品目',
      other: 'その他',
      units: '品',
      itemsSuffix: (n) => `${n}品`,
      yenSuffix: (range) => `${range}円`,
      registered: '登録済み',
      rankS: '必ず確認',
      rankA: '要確認',
      rankB: '確認推奨',
      rankC: '確認不要',
      rankHintS: 'アレルゲン未確認・原材料不明 → 店主確認で降格',
      rankHintA: 'AI推定のみ・一部未確認 → 原材料確認で降格',
      rankHintB: '大部分確認済み → 提供情報追加でCへ',
      rankHintC: '全データ確認済み',
      charProteinSuffix: (names) => `${names}を中心とした品揃え`,
      charDrinkSuffix: (label) => `${label}の品揃えが充実`,
      charTasteSuffix: (tastes) => `味の傾向: ${tastes}`,
      charFoodCenterSuffix: (cats) => `フードの中心: ${cats}`,
      charPriceLow: '手頃な価格帯 — 普段使いやファミリーに最適',
      charPriceMid: '中価格帯 — 旅行者や郷土料理を楽しむ層に最適',
      charPriceHigh: 'やや高価格帯 — 記念日や接待利用にも',
      charPriceVeryHigh: '高価格帯 — 本格的な食体験を求める層向け',
    },
    login: {
      loading: '読み込み中...',
      visualTitle: 'AIスタッフで店舗の魅力を24時間案内',
      visualLead: 'メニュー更新から多言語対応まで、AIスタッフが対応します。まずは無料プランでQRポップをお試しください。',
      visualBullet1: 'QRポップを自動生成してその場でダウンロード',
      visualBullet2: 'Stripe決済でプランをそのままアップグレード',
      visualBullet3: 'AIエディタ、メニュー管理、分析ダッシュボード完備',
      tabLogin: 'ログイン',
      tabRegister: '新規登録',
      email: 'メールアドレス',
      password: 'パスワード',
      passwordPlaceholder: '8文字以上',
      restaurantName: 'レストラン名',
      restaurantNamePlaceholder: '例: ぼんた本店',
      submitLogin: 'ログイン',
      submittingLogin: 'ログイン中...',
      submitRegister: '登録してメニューを作る',
      submittingRegister: '登録中...',
      forgotPassword: 'パスワードをお忘れですか？',
      contactSupport: 'サポートに連絡',
      agreeToTerms: 'に同意',
      termsLinkText: '利用規約',
      validateEmailRequired: 'メールアドレスを入力してください',
      validateEmailFormat: '有効なメールアドレスを入力してください',
      validatePasswordRequired: 'パスワードを入力してください',
      validatePasswordLength: 'パスワードは8文字以上で入力してください',
      validateRestaurantNameRequired: 'レストラン名を入力してください',
      validateTermsRequired: '利用規約に同意してください',
      loginFailed: 'ログインに失敗しました',
      invalidCredentials: 'メールアドレスまたはパスワードが正しくありません',
      accountNotFound: 'アカウントが見つかりません',
      networkError: 'ネットワークエラーが発生しました。接続を確認してください',
      registerSuccess: '登録が完了しました。ログインしてください。',
      registerFailed: '登録に失敗しました',
      emailAlreadyRegistered: 'このメールアドレスは既に登録されています',
    },
    users: {
      title: 'ユーザー管理',
      titleHeader: '👥 ユーザー管理',
      subtitle: 'プラットフォームの全ユーザーを管理します',
      create: '➕ 新規ユーザー作成',
      loading: '🔄 読み込み中...',
      loadingDetail: 'ユーザー情報を取得しています',
      error: '❌ エラー',
      reload: '再読み込み',
      fetchFailed: 'ユーザーの取得に失敗しました',
      authRequired: '認証が必要です',
      statTotal: '総ユーザー数',
      statPlatformOwner: 'プラットフォームオーナー',
      statRestaurantOwner: 'レストランオーナー',
      statConsumer: 'コンシューマー',
      statSuperadmin: 'スーパー管理者',
      statActive: '有効',
      statusActive: '✅ 有効',
      statusInactive: '⛔ 無効',
      rolePlatformOwner: '👑 プラットフォームオーナー',
      roleRestaurantOwner: '🍽️ レストランオーナー',
      roleSuperadmin: '👑 スーパー管理者',
      roleConsumer: '👤 コンシューマー',
      roleUnknown: '❓ 不明',
      filterAllRoles: '全ての役割',
      filterAllStatuses: '全てのステータス',
      searchPlaceholder: '🔍 メールアドレスで検索...',
      colUserInfo: 'ユーザー情報',
      colRole: '役割',
      colStatus: 'ステータス',
      colCreatedAt: '作成日',
      colLastUpdated: '最終更新',
      colActions: '操作',
      emptyFiltered: '該当するユーザーが見つかりません',
      actionDisable: '無効化（準備中）',
      actionEnable: '有効化（準備中）',
      actionResetPassword: 'パスワードリセット（準備中）',
      actionDelete: '削除（準備中）',
      pending: '(準備中)',
      createModalTitle: '➕ 新規ユーザー作成',
      fieldEmail: 'メールアドレス *',
      fieldPassword: 'パスワード *',
      fieldRole: '役割 *',
      passwordPlaceholder: '8文字以上のパスワード',
      cancel: 'キャンセル',
      creating: '⏳ 作成中...',
      create2: '✅ 作成する',
      validateEmailRequired: 'メールアドレスを入力してください',
      validateEmailFormat: '有効なメールアドレスを入力してください',
      validatePasswordRequired: 'パスワードを入力してください',
      validatePasswordLength: 'パスワードは8文字以上で入力してください',
      createSuccess: (msg, email, role) => `${msg} ユーザー: ${email} 役割: ${role}`,
      createFailed: (msg) => `ユーザー作成に失敗しました: ${msg}`,
    },
    setup: {
      stepUpload: 'アップロード',
      stepConfirm: '確認',
      stepQr: 'QR',
      uploadTitle: 'メニュー写真をアップロード',
      uploadSubtitle: '写真を撮るかファイルを選ぶだけ。AIが自動でメニューを読み取ります。',
      analyzing: 'AIがメニューを読み取っています...',
      analyzingNote: '通常30秒程度かかります',
      dropZoneTitle: 'メニュー写真をドラッグ＆ドロップ',
      dropZoneOr: 'またはクリックしてファイルを選択',
      dropZoneFormats: 'JPEG, PNG, PDF対応',
      cameraBtn: 'スマホで写真を撮る',
      proceedToConfirm: (n) => `確認へ進む (${n}品)`,
      confirmTitle: 'メニューが見つかりました',
      confirmSubtitle: '不要なものは削除してください。追加の写真も撮れます。',
      countLabel: (n) => `${n}品`,
      publishAll: '全て公開する',
      addAnother: 'もう1枚追加する',
      publishFailed: '公開に失敗しました',
      creditExhausted: 'クレジットが不足しています。管理画面からクレジットを購入してください。',
      uploadFailed: 'アップロードに失敗しました',
      qrReadyTitle: '準備完了!',
      qrReadySubtitle: 'QRコードを印刷してお店のテーブルに設置してください。\n外国人のお客様がスマホでスキャンするだけでメニューが読めます。',
      downloadQr: 'QRコードをダウンロード',
      goToAdmin: '管理画面へ',
      qrInfoBox: 'AIが裏側でメニューの詳細データ(栄養情報・アレルゲン・翻訳)を生成中です。数分後に自動で反映されます。',
      qrTipBox: '基本情報（営業時間・住所など）は管理画面からいつでも設定できます',
      categoryMain: 'メイン',
      categoryAppetizer: '前菜',
      categoryRice: 'ご飯',
      categorySashimi: '刺身',
      categorySushi: '寿司',
      categoryDrink: 'ドリンク',
      categoryDessert: 'デザート',
      categorySide: '一品',
      categorySoup: '汁物',
      categorySalad: 'サラダ',
      categoryOther: 'その他',
    },
    conversations: {
      titleList: '会話ログ',
      titleDetail: '会話ログ詳細',
      backToList: '← 一覧に戻る',
      prev: '← 前へ',
      next: '次へ →',
      totalCount: (n) => `${n}件の会話`,
      empty: '会話ログがありません',
      failedList: '会話ログの取得に失敗しました',
      failedDetail: '会話詳細の取得に失敗しました',
      allStores: '全店舗',
      colStore: '店舗',
      colSummary: '要約',
      colTopic: 'トピック',
      colLang: '言語',
      colCount: '件数',
      colActions: 'アクション',
      colDate: '日時',
      noSummary: '(要約なし)',
      noMessages: 'メッセージがありません',
      detailStore: '店舗',
      detailSummary: '要約',
      detailRallies: 'ラリー数',
      detailStart: '開始',
      detailDevice: '端末',
      summaryNone: '(なし)',
    },
    basicInfo: {
      title: '基本情報',
      loading: '読み込み中...',
      loadingDetail: 'レストラン情報を読み込み中...',
      error: 'エラー',
      reload: '再読み込み',
      errorRestaurantFetch: 'レストラン情報の取得に失敗しました',
      errorRestaurantNotLoaded: 'レストラン情報が読み込まれていません',
      errorUserNotFound: 'ユーザーデータが見つかりません',
      sectionAiSearch: 'AI情報取得',
      sectionDetail: '詳細情報',
      sectionExternalLinks: '外部リンク',
      aiSearchDesc: '店名で検索すると、食べログ・Googleマップ・公式HPなどから情報を自動取得します',
      searchByName: '店名で情報を検索',
      searchByNameAndMenu: 'メニューも一緒に検索',
      searching: '検索中...',
      restaurantName: 'レストラン名',
      officialWebsite: '公式HP',
      phone: '電話番号',
      address: '住所',
      businessType: '業種',
      pleaseSelect: '選択してください',
      companyName: '運営事業者(会社名)',
      companyNamePlaceholder: '例: アイダプランニング株式会社',
      representativeName: '代表者名',
      representativeNamePlaceholder: '例: 林真史',
      introduction: 'レストラン紹介',
      introductionPlaceholder: 'レストランの特徴や魅力を入力してください',
      businessHours: '営業時間',
      holidays: '定休日',
      seats: '座席数',
      seatsPlaceholder: '例: 50席',
      budget: '予算',
      budgetPlaceholder: '例: ¥3,000〜¥4,000',
      parking: '駐車場',
      parkingPlaceholder: '例: 有（10台）',
      payment: '支払い方法',
      paymentPlaceholder: '例: カード可、電子マネー可',
      accessInfo: '最寄り駅・アクセス',
      accessInfoPlaceholder: '例: JR福井駅 徒歩5分',
      reservationUrl: '予約URL',
      featuresLabel: '特徴・注意事項（AIが客に答える素材）',
      featuresPlaceholder: '例: 子ども連れOK / 個室あり / 多目的トイレあり / Wi-Fi利用可 / 車椅子対応 / 完全予約制（モーニング）/ テーブルチャージ¥1,500 等',
      googleMaps: 'Googleマップ',
      tabelog: '食べログ',
      gurunavi: 'ぐるなび',
      instagram: 'Instagram',
      saveAll: 'すべての変更を保存',
      saved: 'レストラン情報を保存しました',
      saveFailed: (msg) => `保存に失敗しました: ${msg}`,
      searchSuccess: (extra) => `Web検索で情報を取得しました。内容を確認して保存してください。${extra}`,
      menuCountSuffix: (n) => ` メニュー: ${n}件登録`,
      searchFailed: (msg) => `情報の検索に失敗しました: ${msg}`,
    },
    prompts: {
      title: 'AI設定',
      breadcrumb: 'AI設定',
      save: '保存',
      saving: '保存中...',
      saved: '保存しました',
      saveFailed: '保存に失敗しました',
      selectRestaurant: 'レストランを選択',
      pleaseSelect: '選択してください',
      aiInstructionsFor: (name) => `AIへの指示 — ${name}`,
      intro: '基本ルール（メニュー案内・多言語対応など）は全店共通で自動適用されます。ここでは応答のトーンと、店ならではの追加指示だけ設定すればOKです。',
      aiTone: 'AIトーン',
      additionalInstructions: '追加の指示（任意）',
      promptPlaceholder: '例：季節のおすすめメニューを積極的に案内してください。地元食材の魅力も伝えてください。',
      charCount: (n) => `文字数: ${n}`,
      advanced: '詳細設定（任意）',
      advancedDesc: '通常は触る必要はありません。特定のメニューを「おすすめ／人気」として固定したい場合だけ設定してください。',
      enableManualRecommended: '「おすすめ」を手動で指定する',
      enableManualPopular: '「人気メニュー」を手動で指定する',
      noMenus: 'メニューが登録されていません',
      basePrompt: '基礎プロンプト（編集不可・全店共通）',
      basePromptContent: `【基本ルール（編集不可）】
1. レストランの情報・メニュー・おすすめについてお客様をサポート
2. ツールを使って正確な情報を提供（メニュー一覧、詳細、アレルギー検索）
3. メニューや材料を勝手に作り上げない
4. お客様の言語を検出し、同じ言語で応答（日本語・英語・中国語・韓国語等）
5. そのレストランの話題のみに応答を限定`,
      googleReview: 'Googleレビュー誘導',
      googleReviewDesc: '会話の終盤でGoogleクチコミへの投稿を促します。',
      enable: '有効にする',
      noGmbNotice: 'Googleビジネスプロフィールが基本情報に未設定です。先に基本情報ページでGMB URLを設定してください。',
      toneStandard: 'スタンダード（標準）',
      toneFormal: 'フォーマル（丁寧）',
      toneCasual: 'カジュアル（親しみやすい）',
      toneProfessional: 'プロフェッショナル（専門的）',
    },
    dailySpecials: {
      title: '本日の献立',
      headerDesc: '日替わり・本日のおすすめを登録します。撮る/貼ると AI が読み取り、確認・修正して確定。確定すると今日の献立としてお客様に表示され、AI が正しく答えられます。差し替えると前の品はストックに残り、翌週そのまま流用できます。',
      section1: '1. 撮る / 貼る',
      section2: (n) => `2. 確認・修正 (${n}品)`,
      sectionActive: '今出している本日の献立',
      sectionStock: 'ストックから流用',
      activeDesc: 'お客様に表示中。差し替えるには上で新しく確定してください。',
      stockDesc: '過去に出した日替わり品。選んで「今日に出す」で再利用（「昨日と同じ」もここから）。',
      notRegistered: 'まだ登録されていません',
      noStock: '流用できるストックがありません',
      takePhoto: '📷 写真を撮る / 選ぶ',
      textPlaceholder: 'または、本日の献立をテキストで貼り付け（例: 五目焼き 800円 / とば酢の五目 700円 ...）',
      extractFromText: 'テキストから読み取る',
      extracting: '読み取り中...',
      aiReading: 'AI が読み取っています...',
      confirmBtn: 'この内容で確定',
      confirming: '確定中...',
      replaceWarning: (n) => `⚠ 確定すると、今表示中の本日の献立（${n}品）はすべてこの内容に差し替わります。前の品はストックに残るので、あとで流用できます。`,
      namePlaceholder: '料理名',
      pricePlaceholder: '価格',
      categoryPlaceholder: 'カテゴリ',
      ingredientsPlaceholder: '材料（、区切り）',
      allergensPlaceholder: 'アレルゲン（、区切り）',
      reuseToToday: (n) => `${n}品を今日に出す`,
      reusing: '流用中...',
      lastShown: (date) => `(前回 ${date})`,
      toastLoadFailed: '本日の献立の読み込みに失敗しました',
      toastNoMenuDetected: 'メニューが検出されませんでした',
      toastExtracted: (n) => `${n}品を抽出しました。確認して確定してください`,
      toastExtractFailed: '抽出に失敗しました',
      toastEnterText: 'テキストを入力してください',
      toastNameEmpty: '料理名が空の品があります',
      toastConfirmed: (n) => `本日の献立 ${n}品を確定しました`,
      toastConfirmFailed: '確定に失敗しました',
      toastReused: (n) => `${n}品を本日の献立に流用しました`,
      toastReuseFailed: '流用に失敗しました',
      warnPriceMissing: '価格が未入力です',
      warnIngredientsMissing: '材料が未入力です（多言語説明・アレルゲン精度に影響）',
    },
    layout: {
      loading: '読み込み中...',
      logout: 'ログアウト',
      account: 'アカウント情報',
      loggedInAs: 'ログイン中',
      restaurantOwner: 'レストランオーナー',
      platformOwner: 'プラットフォームオーナー',
      restaurantView: 'レストランビュー',
      platformView: 'プラットフォームビュー',
      restaurantSystemTitle: 'レストラン管理システム',
      platformSystemTitle: 'プラットフォーム管理システム',
      more: 'その他',
      planLockedToast: 'この機能はビジネスプラン以上で利用可能です',
      langToggleAria: '言語を切り替え',
    },
    nav: {
      menuList: 'メニュー管理',
      dailySpecials: '本日の献立',
      qrManagement: 'QRコード',
      basicInfo: '基本情報',
      dashboard: 'ダッシュボード',
      menuAnalytics: 'メニュー分析',
      storeKnowledge: '店舗知識',
      photoReview: '写真レビュー',
      conversations: '会話ログ',
      prompts: 'AI設定',
      users: 'ユーザー管理',
      restaurantList: '掲載レストラン',
      searchLogs: '検索ログ',
    },
    dashboard: {
      restaurantTitle: 'レストランダッシュボード',
      platformTitle: 'プラットフォーム統計',
      loadingStats: '統計情報を読み込み中...',
      error: 'エラー',
      errorStats: '統計情報の取得に失敗しました',
      errorUserNotFound: 'ユーザーデータが見つかりません',
      errorRestaurantNotFound: 'レストラン情報が見つかりません',
      errorRestaurantFetch: 'レストラン情報の取得に失敗しました',
      langDistribution: '言語分布',
      restaurantInfo: 'レストラン情報',
      restaurantName: 'レストラン名',
      registeredMenus: '登録メニュー数',
      phoneNumber: '電話番号',
      address: '住所',
      status: 'ステータス',
      statusActive: '有効',
      statusInactive: '無効',
      notSet: '未設定',
      eventLogStats: 'イベントログ統計',
      eventLogStatsAll: 'イベントログ統計（全店舗合計）',
      chatStatsLabel: (n: number) => `チャット利用統計（${n}メッセージ）`,
      chatStatsAllLabel: (n: number) => `チャット利用統計（全${n}メッセージ）`,
      sessionStats: 'セッション統計',
      sessionCount: 'セッション数',
      avgStay: '平均滞在',
      totalSessions: '総セッション数',
      avgStayDuration: '平均滞在時間',
      minute: '分',
      second: '秒',
      serviceOverview: 'サービス概要',
      totalRestaurants: '導入レストラン数',
      totalMenus: '登録メニュー数',
      totalVerifiedMenus: '承認済メニュー数',
      totalUsers: 'ユーザー数',
      totalQrScans: '総QRスキャン数',
      usersByRole: 'ロール別ユーザー数',
      roleSuperadmin: 'Superadmin',
      rolePlatformOwner: 'Platform Owner',
      roleRestaurantOwner: 'Restaurant Owner',
      roleConsumer: 'Consumer',
      topicDistribution: 'トピック分布',
      referrer: '流入元',
      screenSize: '画面サイズ',
      langUsageDistribution: '使用言語分布',
      deviceDistribution: 'デバイス分布',
    },
    topic: {
      'メニュー・料理': 'メニュー・料理',
      'アレルゲン': 'アレルゲン',
      '店舗情報': '店舗情報',
      'ドリンク': 'ドリンク',
      'おすすめ': 'おすすめ',
      'その他': 'その他',
    },
  },
  en: {
    common: {
      retry: 'Retry',
      backToAdminTop: 'Back to admin home',
      prev: 'Prev',
      next: 'Next',
      delete: 'Delete',
      approve: 'Approve',
      reject: 'Reject',
      allStatuses: 'All statuses',
      allRestaurants: 'All restaurants',
      ellipsis: '...',
    },
    error: {
      pageCrashed: 'Something went wrong rendering this page',
      pleaseRetry: 'Please try again. If it keeps happening, share the error details below.',
      unknown: 'Unknown error',
    },
    searchLogs: {
      title: 'Search logs',
      description: (n) => `History of text and filters submitted from the home search (${n} entries)`,
      empty: 'No search logs yet',
      colTime: 'Time',
      colText: 'Text',
      colFilters: 'Filters',
      colResultCount: 'Results',
    },
    photoReview: {
      title: 'Photo review',
      empty: 'No submitted photos',
      confirmDelete: 'Permanently delete this photo?',
      altSubmitted: 'Submitted photo',
      altCurrent: 'Current image',
    },
    menuList: {
      noMenuDetected: 'No menus detected. Please try a different file.',
      fileAnalysisFailed: (msg) => `File analysis failed: ${msg}`,
      enterText: 'Please enter text',
      noMenuDetectedText: 'No menus detected. Please try different text.',
      textAnalysisFailed: (msg) => `Text analysis failed: ${msg}`,
      uncategorized: 'Uncategorized',
      addedItem: (name) => `Added "${name}"`,
      duplicateItem: (name) => `"${name}" is already registered`,
      saveFailed: 'Failed to save menu',
      processedDone: 'Done',
      addedCount: (n) => `${n} added`,
      skippedCount: (n) => `${n} skipped as duplicate`,
      failedCount: (n) => `${n} failed`,
      sep: ', ',
      fetchRestaurantFailed: 'Failed to load restaurant info.',
      requiredFields: 'Dish name, price, and category are required',
      restaurantNotFound: 'Restaurant info not found',
      imageUploadFailed: 'Menu was added, but image upload failed',
      addedSuccess: 'Menu added!',
      addFailed: (msg) => `Failed to add menu: ${msg}`,
      sourceUrlMissing: 'No menu source URL is configured. Set the URL on Basic info → Sources tab first.',
      scrapeStartFailed: 'Failed to start scraping',
      scrapeFailed: 'Scraping failed',
      taskStatusCheckFailed: 'Failed to check task status. Please retry.',
      approveFailed: 'Failed to approve menu',
      allApprovedSuccess: 'All menus approved!',
      updatedSuccess: 'Menu updated!',
      updateFailed: (msg) => `Failed to update menu: ${msg}`,
      approvalFailed: 'Approval failed',
      ownerVerifyFailed: 'Failed to record owner verification',
      statusChangeFailed: 'Failed to change status',
      noPendingApproval: 'No menus pending approval',
      bulkApproveFailed: 'Bulk approval failed',
      confirmDeleteMenu: 'Delete this menu?',
      deletedMenu: 'Menu deleted',
      deleteMenuFailed: (msg) => `Failed to delete menu: ${msg}`,
      rankMustVerify: 'Must verify',
      rankNeedReview: 'Needs review',
      rankReviewRecommended: 'Review recommended',
      rankVerified: 'Verified',
      ownerVerifiedItem: (name) => `"${name}" marked as owner-verified`,
      confirmBulkApprove: (n) => `Approve all ${n} unverified menus?`,
      bulkApproved: (n) => `Approved ${n} items`,
      storeLabel: 'Store',
      verifyPriorityTitle: 'Verification priority',
      cardTitle: '📋 Menu & item management',
      tableSearchPlaceholder: 'Search by name, ingredient, tag…',
      tableFilterAll: (n) => `All (${n})`,
      tableFilterVerified: (n) => `Verified (${n})`,
      tableFilterWarning: (n) => `Needs review (${n})`,
      tableSortDefault: 'Sort: default',
      tableSortByName: 'Name',
      tableSortByPrice: 'Price',
      tableSortByRank: 'Priority',
      tableSortAsc: 'Asc',
      tableSortDesc: 'Desc',
      perPage: (n) => `${n} / page`,
      pagePrev: 'Prev',
      pageNext: 'Next',
      pageInfo: (cur, total) => `${cur} / ${total}`,
      addNewBtn: '+ Add new',
      fetchFromSourceBtn: 'Fetch from source',
      bulkApproveBtn: 'Bulk approve',
      colName: 'Name',
      colCategory: 'Category',
      colPrice: 'Price',
      colStatus: 'Status',
      colRank: 'Priority',
      colActions: 'Actions',
      rowActive: 'Active',
      rowInactive: 'Inactive',
      rowEdit: 'Edit',
      rowPreview: 'Preview',
      rowDelete: 'Delete',
      rowApprove: 'Approve',
      rowVerifyAsOwner: 'Owner verify',
      rowToggleStatus: 'Toggle',
      rowVerified: 'Verified',
      rowDescription: 'Description',
      rowIngredients: 'Ingredients',
      rowAllergens: 'Allergens',
      rowCooking: 'Cooking',
      rowRestrictions: 'Restrictions',
      formTabBasic: 'Basic',
      formTabDetail: 'Detail',
      formTabNarrative: 'Story',
      formTabImage: 'Image',
      formTabAdvanced: 'Advanced',
      formAddTitle: 'Add menu',
      formEditTitle: 'Edit menu',
      formName: 'Name (Japanese)',
      formNameEn: 'Name (English)',
      formCategory: 'Category',
      formCategorySelect: 'Select category',
      formPrice: 'Price',
      formDescription: 'Description (Japanese)',
      formDescriptionEn: 'Description (English)',
      formIngredients: 'Ingredients',
      formIngredientsHint: 'Comma-separated',
      formAllergens: 'Allergens',
      formAllergensMandatory: 'Mandatory',
      formAllergensRecommended: 'Recommended',
      formCookingMethods: 'Cooking methods',
      formRestrictions: 'Restrictions',
      formImage: 'Image',
      formImagePick: 'Pick image',
      formImageReplace: 'Replace image',
      formImageRemove: 'Remove image',
      formStory: 'Story',
      formChefNote: "Chef's note",
      formTastingNote: 'Tasting note',
      formPairingSuggestion: 'Pairing',
      formSeasonalNote: 'Seasonal note',
      formServingSize: 'Serving size',
      formAvailability: 'Availability',
      formTaxIncluded: 'Tax included',
      formTaxRate: 'Tax rate (%)',
      formCurrency: 'Currency',
      formCancel: 'Cancel',
      formSave: 'Save',
      formSaving: 'Saving…',
      uploadTitle: 'Bulk-register with AI',
      uploadDescription: 'Auto-extract menus from images, photos, or pasted text',
      uploadFromFile: 'Choose file',
      uploadFromCamera: 'Camera',
      uploadFromText: 'Paste text',
      uploadAnalyzing: 'AI is analyzing…',
      pasteTextTitle: 'Paste menu text',
      pasteTextPlaceholder: 'e.g. Karaage set 980 yen\nDraft beer 600 yen',
      pasteTextAnalyze: 'Analyze',
      pasteTextCancel: 'Cancel',
      visionApprovalTitle: (n) => `Review ${n} menu candidates`,
      visionApproveItem: 'Add',
      visionApproving: 'Adding…',
      visionRemove: 'Remove',
      visionApproveAll: 'Add all',
      visionApprovingAll: 'Adding…',
      visionClose: 'Close',
      visionEmpty: 'No menu candidates',
      fetchApprovalTitle: 'Review fetch candidates',
      fetchApproveItem: 'Accept',
      fetchDenyItem: 'Reject',
      fetchApproveAll: 'Accept all',
      fetchDenyAll: 'Reject all',
      fetchClose: 'Close',
      fetchSourceUrl: (url) => `Source: ${url}`,
      previewTitle: 'Menu preview',
      previewEdit: 'Edit',
      previewApprove: 'Mark as owner-verified',
      previewClose: 'Close',
      previewIngredients: 'Ingredients',
      previewAllergens: 'Allergens',
      previewCooking: 'Cooking methods',
      previewRestrictions: 'Restrictions',
      previewTaste: 'Taste profile',
      previewVerification: 'Verification',
      previewDataSource: 'Data source',
      previewConfidence: (n) => `Confidence: ${n}%`,
      previewNoImage: 'No image',
      tableTitle: 'Menus',
      tableTotalCount: (n) => `Total: ${n}`,
      tableFetchFromSourceBtn: '🤖 Fetch menus from source',
      tableSearchBoxPlaceholder: '🔍 Search by name, category, ingredient...',
      tableSortLabel: 'Sort:',
      tableShowLabel: 'Show:',
      tableLoading: '📋 Loading menus...',
      tableReload: 'Reload',
      tableBulkApproveCount: (n) => `Bulk approve (${n})`,
      tableColNo: '#',
      tableColDetail: 'Menu detail',
      tableEmpty: 'No menus yet. Click "Add manually" to add one.',
      tableNoIngredients: 'No ingredients',
      tableStatusPublic: 'Public',
      tableStatusPrivate: 'Hidden',
      tableStatusVerified: 'Verified',
      tableStatusPending: 'Pending',
      tableApproveSymbol: '✓ Approve',
      tablePreviewBtn: '👁️ Preview',
      tableEditBtn: '✏️ Edit',
      tableDeleteBtn: '🗑️ Delete',
      tablePagePage: 'Page',
      tableShowingItems: (total, start, end) => `Showing ${start}-${end} of ${total}`,
      tableManualAdd: '➕ Add manually',
      tableSortOptDefault: 'Default',
      tableSortOptRank: 'Priority',
      tableSortOptCreated: 'Created',
      tableSortOptPrice: 'Price',
      tableSortOptName: 'Name',
      tableSortAscWithArrow: '↑ Asc',
      tableSortDescWithArrow: '↓ Desc',
      tablePerPageOpt: (n) => `${n}`,
      tableLoadingItems: 'Loading menus...',
      pvNarrativeStory: 'Dish story',
      pvNarrativeChefNote: "Chef's note",
      pvNarrativeTastingNote: 'Tasting note',
      pvNarrativePairing: 'Pairing suggestion',
      pvNarrativeSeasonal: 'Seasonal note',
      pvServingSize: 'Size',
      pvServingAvailability: 'Availability',
      pvServingStyle: 'Style',
      pvServingTemperature: 'Temperature',
      pvNotSet: 'Not set',
      pvRankS: 'Owner verified',
      pvRankA: 'Primary source',
      pvRankB: 'Review recommended',
      pvRankC: 'AI inferred',
      pvRankUnknown: 'Unrated',
      pvDataCompleteness: 'Data completeness',
      pvCompletenessHint: 'How many fields are filled. Different from confidence rank (S/A/B/C).',
      pvApprovedAt: 'approved',
      pvDataSourceOwner: 'Owner verified',
      pvDataSourceOfficial: 'Official source',
      pvDataSourceAi: 'AI inferred',
      pvDataSourceUncat: 'Uncategorized',
      pvPublished: 'Live',
      pvOpenProductPage: 'Open product page →',
      pvSectionDescription: 'Description',
      pvSectionIngredients: 'Ingredients',
      pvSectionAllergens: 'Allergens',
      pvSectionCooking: 'Cooking methods',
      pvSectionRestrictions: 'Dietary restrictions',
      pvNone: 'None',
      pvSectionNarrative: 'Narrative (NFG)',
      pvSectionServing: 'Serving info',
      pvSectionFeaturedTags: 'Featured tags',
      pvMissingFields: (n) => `Missing fields (${n})`,
      pvEditBtn: '✏️ Edit',
      pvVerifyOwnerBtn: '✅ Mark as owner verified',
      pvVerifyOwnerConfirm: (name) => `Mark "${name}" as owner verified?`,
      pvVerifyOwnerTitle: 'Promote to verification_rank=S as owner-verified data',
      pvCloseBtn: 'Close',
      upCardTitle: '📤 Upload menu / items',
      upCardDesc: 'AI structures the menu automatically when you upload',
      upCamera: 'Camera',
      upFile: 'Pick file',
      upFileFormats: 'Image / PDF / Excel / CSV',
      upPaste: 'Paste text',
      upGoogleDrive: 'Google Drive',
      upComingSoon: 'Coming soon',
      upPasteModalTitle: '📝 Paste menu text',
      upPasteDesc: 'Paste menu info as text. AI will structure it as long as names, prices, and descriptions are included.',
      upPastePlaceholder: 'e.g.\nKaraage set 850 yen\nFried chicken thigh x5 with rice and miso soup\n\nSashimi platter 1,500 yen\nTuna, salmon, yellowtail, sweet shrimp',
      upPasteCancel: 'Cancel',
      upPasteAnalyze: '🤖 Analyze with AI',
      upAnalyzingTitle: '🤖 AI is analyzing your menu...',
      upAnalyzingDesc: 'Extracting menu data',
      upFetchingTitle: '🤖 AI is analyzing...',
      upFetchingDesc: 'Fetching menus from the basic info source...',
      upVisionTitle: '🤖 Review AI analysis',
      upVisionDetectedSummary: (total) => `📸 Detected ${total} menu items from the image.`,
      upVisionRegisteredHint: (n) => `${n} are already registered (auto-skipped).`,
      upVisionReviewHint: 'Please review and approve.',
      upVisionApprovingAll: '⏳ Adding…',
      upVisionApproveAll: (n) => `✅ Approve all (${n})`,
      upVisionDiscardAll: '❌ Discard all',
      upVisionRegistered: 'Registered',
      upVisionUncategorized: 'Uncategorized',
      upVisionApproveItem: '✅ Approve',
      upVisionItemApproving: '⏳ Adding…',
      upVisionItemRegistered: 'Registered',
      upVisionItemRemove: '❌',
      upVisionEmpty: 'All menus have been processed',
      upFetchApprovalTitle: '🤖 Approve AI-fetched menus',
      upFetchSourceLabel: 'Source',
      upFetchNew: (n) => `🆕 New menus: ${n}`,
      upFetchDuplicate: (n) => `🔄 Duplicates: ${n}`,
      upFetchApproveAll: '✅ Approve all',
      upFetchDenyAll: '❌ Reject all',
      upFetchMergeDup: '🔄 Merge all duplicates',
      upFetchNewHeading: (n) => `🆕 New menus (${n})`,
      upFetchConfidence: (n) => `Confidence: ${n}%`,
      upFetchApprove: '✅ Approve',
      upFetchDeny: '❌ Reject',
      upFetchEmpty: 'All menus have been processed',
      mfValidateImageType: 'Only jpg, png, webp are supported',
      mfValidateImageSize: 'File size must be 5MB or less',
      mfUploadFailed: 'Upload failed',
      mfTitle: '📝 Edit menu',
      mfTabBasic: '📝 Basic',
      mfTabMaterials: '🥕 Ingredients',
      mfTabAllergens: '⚠️ Allergens',
      mfTabNfg: '📊 NFG details',
      mfFieldNameJp: 'Name (Japanese) *',
      mfFieldNameEn: 'Name (English)',
      mfBtnAiTranslate: '🤖 AI auto-translate',
      mfFieldPrice: 'Price *',
      mfFieldCategory: 'Category *',
      mfSelect: 'Please select',
      mfFieldDescJp: 'Description (Japanese)',
      mfBtnAiGenerate: '🤖 AI generate',
      mfFieldDescEn: 'Description (English)',
      mfFieldImage: 'Product image',
      mfUploading: 'Uploading...',
      mfImageDropHint: 'Drop an image or click to select',
      mfImageFormats: 'jpg / png / webp, up to 5MB',
      mfImageSelected: (name) => `Selected: ${name} (uploads after save)`,
      mfImageAltPreview: 'Product image preview',
      mfImageUrlLabel: 'Or enter image URL directly',
      mfFieldProductUrl: 'Product page URL',
      mfProductUrlHint: 'Maker page link, etc. (for drink products)',
      mfBtnNextMaterials: 'Next: ingredients →',
      mfConfidenceHint: 'Current confidence: 65% → after completion: 95%',
      mfFieldIngredients: 'Ingredients (comma-separated)',
      mfBtnAiSuggest: '🤖 AI suggest',
      mfIngredientsPlaceholder: 'e.g. chicken, onion, carrot, soy sauce, mirin',
      mfIngredientsHint: '※ Separate multiple ingredients with commas',
      mfFieldCookingMethods: 'Cooking methods',
      mfNoCookingMethods: 'No cooking method master data',
      mfBtnNextAllergens: 'Next: allergens →',
      mfFieldAllergenInfo: '⚠️ Allergen info',
      mfAllergenMandatory: 'Specified ingredients (mandatory):',
      mfAllergenRecommended: 'Recommended allergens:',
      mfAllergenLoadFailed: 'Failed to load allergen info. Please retry later.',
      mfFieldRestrictions: 'Dietary restrictions',
      mfNoRestrictions: 'No restriction master data',
      mfBtnNextNfg: 'Next: NFG details →',
      mfSectionNarrative: '📖 Narrative (dish story)',
      mfNarrativeStory: 'Dish story',
      mfNarrativeStoryPh: 'Background and craft behind this dish',
      mfNarrativeChef: "Chef's note",
      mfNarrativeChefPh: 'Highlights from the chef',
      mfNarrativeTasting: 'Tasting note',
      mfNarrativeTastingPh: 'Flavor characteristics',
      mfNarrativePairing: 'Pairing suggestion',
      mfNarrativePairingPh: 'Recommended drinks or combinations',
      mfNarrativeSeasonal: 'Seasonal note',
      mfNarrativeSeasonalPh: 'Seasonal info, etc.',
      mfSectionServing: '🍽️ Serving info',
      mfServingSize: 'Size',
      mfServingNotSet: 'Not set',
      mfServingSmall: 'Small',
      mfServingRegular: 'Regular',
      mfServingLarge: 'Large',
      mfServingFamily: 'Family',
      mfServingPeriod: 'Availability',
      mfServingAlways: 'Year-round',
      mfServingSeasonal: 'Seasonal',
      mfServingLimited: 'Limited quantity',
      mfServingSpecial: 'Special event',
      mfSectionTags: '🏷️ Featured tags',
      mfTagsPlaceholder: 'Popular, Manager pick, Seasonal (comma-separated)',
      mfTagsHint: 'Comma-separated. Chat AI uses this for "what do you recommend?"',
      mfSectionPrice: '💰 Price details',
      mfCurrency: 'Currency',
      mfTaxRate: 'Tax rate (%)',
      mfTaxIncluded: 'Tax included',
      mfStatusLabel: '📋 Verification status',
      mfStatusVerified: '✓ Verified',
      mfStatusPending: '⚠️ Pending',
      mfStatusHint: '※ Setting "Verified" marks the menu as reviewed',
      mfCancel: 'Cancel',
      mfSave: '💾 Save',
      hintIngredients: 'Ingredients',
      hintAllergens: 'Allergens',
      hintDescription: 'Description',
      hintNameEn: 'English name',
      hintCooking: 'Cooking',
      hintNarrative: 'Narrative',
      hintServing: 'Serving',
    },
    stores: {
      title: 'Restaurants',
      loadingDetail: 'Loading restaurants...',
      headerTitle: 'Restaurants',
      newStore: 'Add new restaurant',
      countSuffix: 'restaurants',
      searchPlaceholder: 'Search by name, address or code...',
      all: 'All',
      onboarded: 'Onboarded',
      free: 'Free',
      empty: 'No restaurants found',
      notSet: 'Not set',
      todayLabel: 'today',
      oneDayAgo: '1 day ago',
      daysAgoLabel: (n) => `${n} days ago`,
      nowLabel: 'now',
      badgePlanFree: 'Free',
      badgePlanOnboarded: 'Onboarded',
      updateLabel: 'Updated',
      metricMenu: 'Menus',
      metricVerified: 'Verified',
      metricScan: 'QR scans',
      btnManage: 'Manage',
      btnMenu: 'Menus',
      btnDelete: 'Delete',
      titleManage: 'Manage basic info',
      titleMenu: 'View menus',
      titleDelete: 'Delete restaurant',
      modalTitle: 'Add new restaurant',
      fieldName: 'Restaurant name *',
      fieldNamePlaceholder: 'e.g. Bonta Crab & Seafood Kurufu Fukui Station',
      searchByName: 'Search info by name',
      searching: 'Searching...',
      searchHint: 'Search by name to auto-fetch info from Tabelog, Google Maps, etc.',
      fieldOwner: 'Restaurant owner *',
      chooseOwner: 'Choose an owner',
      noOwnersAvailable: 'No restaurant owners available',
      fieldType: 'Business type',
      pleaseSelect: 'Please select',
      fieldAddress: 'Address *',
      addressPlaceholder: 'e.g. 1-1-25 Chuo, Fukui City, Fukui',
      fieldPhone: 'Phone *',
      phonePlaceholder: 'e.g. 0776-22-2235',
      detailSection: 'Detail info (auto-filled by search)',
      introduction: 'Restaurant introduction',
      introductionPlaceholder: 'Highlight the restaurant features',
      businessHours: 'Business hours',
      holidays: 'Holidays',
      seats: 'Seats',
      budget: 'Budget',
      parking: 'Parking',
      payment: 'Payment',
      access: 'Access',
      features: 'Features',
      register: 'Register',
      registering: 'Registering...',
      cancel: 'Cancel',
      validateNameOwner: 'Name and owner are required',
      validatePhone: 'Phone is required',
      validateAddress: 'Address is required',
      validateStoreName: 'Please enter a store name',
      createdMsg: (name, uid) => `Registered "${name}" (UID: ${uid})`,
      createFailed: (msg) => `Failed to create restaurant: ${msg}`,
      searchSuccess: 'Info fetched. Please review and register.',
      searchNotFound: 'No info found',
      searchFailed: (msg) => `Failed to search info: ${msg}`,
      confirmDelete: (name) => `Delete "${name}"?\n\nThis cannot be undone.`,
      deletedMsg: (name) => `Deleted "${name}"`,
      deleteFailed: (msg) => `Failed to delete restaurant: ${msg}`,
    },
    allergens: {
      title: 'Allergens',
      description: 'Manage allergen data across the platform',
      noAccess: 'Access denied',
      noAccessDetail: 'This page is only accessible to platform owners.',
      addBtn: '+ Add allergen',
      searchPlaceholder: 'Search allergen name...',
      all: 'All',
      mandatory: 'Mandatory',
      recommended: 'Recommended',
      fetchFailed: 'Failed to load allergens',
      loadingDetail: 'Loading allergens...',
      createdAt: 'Created',
      edit: 'Edit',
      delete: 'Delete',
      emptyFiltered: 'No allergens match the filter',
      empty: 'No allergens registered',
      pagePrev: '‹ Prev',
      pageNext: 'Next ›',
      pageInfo: (cur, total) => `${cur} / ${total} pages`,
      pageRangeInfo: (totalItems, start, end) => `(${start} – ${end} of ${totalItems})`,
      createTitle: 'Add allergen',
      editTitle: 'Edit allergen',
      labelJp: 'Japanese name *',
      labelEn: 'English name *',
      labelType: 'Display type *',
      typeMandatoryOption: 'Mandatory (7 items)',
      typeRecommendedOption: 'Recommended',
      placeholderJp: 'e.g. えび',
      placeholderEn: 'e.g. Shrimp',
      validateJpRequired: 'Japanese name is required',
      validateEnRequired: 'English name is required',
      cancel: 'Cancel',
      adding: 'Adding...',
      add: 'Add',
      updating: 'Updating...',
      update: 'Update',
      confirmDelete: (jp, en) => `Delete "${jp} (${en})"?\n\nNote: If this allergen is used by menus, they may be affected.`,
      createdMsg: 'Allergen added',
      createFailed: (msg) => `Failed to add allergen: ${msg}`,
      updatedMsg: 'Allergen updated',
      updateFailed: (msg) => `Failed to update allergen: ${msg}`,
      deletedMsg: 'Allergen deleted',
      deleteFailed: (msg) => `Failed to delete allergen: ${msg}`,
    },
    account: {
      titleAccount: 'Account',
      titlePlanMgmt: 'Plans & billing',
      accountInfoHeading: 'Account info',
      email: 'Email',
      passwordChange: 'Change password',
      save: 'Save',
      changePassword: 'Update password',
      currentPasswordPlaceholder: 'Current password',
      newPasswordPlaceholder: 'New password',
      savedEmail: 'Email saved',
      savedPassword: 'Password updated',
      pleaseEnterPassword: 'Please enter a password',
      qrTitle: 'QR code management',
      qrDesc: 'QR codes can be generated and downloaded from the basic info page. A printable PDF is also available.',
      qrOpenBasicInfo: 'Open basic info',
      breadcrumbAccount: '👤 Account',
      breadcrumbPlan: '💳 Plans & billing',
      pageDesc: 'Choose or change your plan',
      currentPlan: 'Current plan',
      monthly: 'monthly',
      contractStart: 'Contract started',
      nextRenewal: 'Next renewal',
      statusLabel: 'Status',
      statusInUse: 'Active',
      planFree: 'Free',
      planLight: 'Light',
      planBusiness: 'Business',
      planPro: 'Pro',
      recommendTag: 'Recommended',
      comingTag: 'Coming soon 🔜',
      proPlanComing: 'Pro plan is coming soon',
      alreadyOnPlan: 'You are already on this plan',
      confirmChangePlan: (name) => `Change to ${name}?`,
      changedToPlan: (name) => `Changed to ${name}`,
      currentPlanLabel: 'Current plan',
      selectThisPlan: 'Select this plan',
      pending: 'Coming soon',
      featuresLabel: 'Features:',
      freeDesc: 'Consumer-focused features. OMISEAI capture & explain works even after the session expires.',
      freeFeature: '3-month history retention',
      lightDesc: 'Just snap with your phone. AI instantly explains the product, background and ingredients in multiple languages.',
      lightFeatures: ['QR pops delivered', 'AI multilingual guide', 'Store basic info registration', 'Google review integration'],
      businessDesc: 'Pick and edit recommendations and popular items from learned data. AI directly drives sales and operations.',
      businessFeatures: ['Branded QR pops', 'Store-dedicated AI guide', 'Store info learning', 'AI recommendations / popular ranking', 'Edit admin', 'Data management & analytics'],
      proDesc: 'Full spec including store-support features',
      proFeatures: ['All store-AI features +', 'Social media agent', 'Staff training mode', 'Reservation / demand forecasting'],
    },
    storeKnowledge: {
      title: 'Store knowledge',
      notFound: 'Restaurant not found',
      headerTitle: 'Store knowledge (v2.1)',
      notAnswered: 'No answers yet',
      progressLabel: (answered, total) => `${answered} answered / ${total} total`,
      phase1Title: 'Phase 1: Kitchen profile',
      phase1Hint: 'Answers immediately propagate to menu allergens',
      phase1NoQuestions: 'No kitchen profile questions (no fried / stir-fried / dashi-based menus)',
      phase2Title: 'AI-flagged items to verify',
      phase2Hint: 'Answering marks dish data as "verified" and boosts accuracy',
      phase2NoQuestions: 'No dish questions',
      saveLabel: (n) => `Save (${n})`,
      saving: 'Saving...',
      phase2FloatingSave: (n) => `Save Phase 2 (${n})`,
      affectedSuffix: (n) => `${n} items`,
      propagating: 'Propagating...',
      answerInputPlaceholder: 'Enter answer',
      maxSelectHint: (max, selected) => `Pick up to ${max} (${selected} selected)`,
      uploadLinkBtn: 'Menu collection link',
      surveyBtn: 'Create owner survey',
      surveyModalTitle: 'Create owner survey',
      surveyModalDesc: (slug) => `Issue a menu verification URL for ${slug}`,
      fieldQuestionLimit: 'Question limit',
      fieldExpiresDays: 'Expires in (days)',
      create: 'Create',
      creating: 'Creating...',
      cancel: 'Cancel',
      close: 'Close',
      urlLabel: 'URL',
      passcodeLabel: 'Passcode',
      copyBtn: 'Copy',
      copied: 'Copied',
      lineCopyBtn: 'Copy text for LINE',
      lineMsgSurvey: (url, passcode) => `Menu verification request\n\nURL: ${url}\nPasscode: ${passcode}\n\nOpen the URL and enter the passcode to verify the menus.`,
      lineMsgUpload: (url, passcode) => `Menu upload request\n\nURL: ${url}\nPasscode: ${passcode}\n\nOpen the URL, enter the passcode, and take photos of your menu sheets. AI will read them automatically.`,
      uploadModalTitle: 'Create menu collection link',
      uploadModalDesc: (slug) => `Issue a menu collection URL for ${slug}. The owner can take phone photos to register menus.`,
      propagatedAllergens: (affected, added, removed) => `Propagated to ${affected} items (+${added} -${removed})`,
      savedAffected: (affected) => `Saved (${affected} items affected)`,
      propagatedAffected: (affected) => `Propagated to ${affected} items`,
      saveFailed: 'Save failed',
      loadFailed: 'Failed to load questions',
      surveyCreated: 'Survey created',
      surveyFailed: 'Failed to create survey',
      uploadCreated: 'Menu collection link created',
      uploadFailed: 'Failed to create link',
      savedCount: (n) => `Saved ${n}`,
      fieldAllergens: 'Allergens',
      fieldIngredients: 'Ingredients',
      fieldCookingMethods: 'Cooking methods',
      fieldRestrictions: 'Restrictions',
      fieldDefault: 'Verify',
    },
    menuAnalytics: {
      title: 'Menu analytics',
      storeLabel: 'Store:',
      noData: 'No data',
      fetchFailed: 'Failed to load data',
      summaryTotal: 'Total menus',
      summaryActive: 'Active',
      summaryAvgPrice: 'Avg. price',
      summaryConfidence: 'Avg. completeness',
      storeCharacter: 'About this store',
      categoryComposition: 'Category composition',
      foodComposition: 'Food composition',
      drinkBreakdown: 'Drink breakdown',
      proteinDistribution: 'Protein distribution',
      topIngredients: (n) => `Top ${n} ingredients`,
      cookingMethods: 'Cooking methods',
      calorieDistribution: 'Calorie distribution',
      tasteProfile: 'Taste profile',
      rankPriority: 'Verification priority',
      allergenInfo: 'Allergen info',
      priceRange: 'Price range (all)',
      priceRangeBy: (label) => `Price range: ${label}`,
      centerItems: 'items',
      centerFood: 'Food',
      centerAll: 'All items',
      other: 'Other',
      units: 'items',
      itemsSuffix: (n) => `${n} items`,
      yenSuffix: (range) => `${range} yen`,
      registered: 'Registered',
      rankS: 'Must verify',
      rankA: 'Needs review',
      rankB: 'Review recommended',
      rankC: 'Verified',
      rankHintS: 'Allergens unverified, ingredients unknown → owner verification downgrades',
      rankHintA: 'AI estimate only, partly unverified → ingredient verification downgrades',
      rankHintB: 'Mostly verified → adding more info moves to C',
      rankHintC: 'All data verified',
      charProteinSuffix: (names) => `Lineup centered on ${names}`,
      charDrinkSuffix: (label) => `Strong selection of ${label}`,
      charTasteSuffix: (tastes) => `Taste tendency: ${tastes}`,
      charFoodCenterSuffix: (cats) => `Food focus: ${cats}`,
      charPriceLow: 'Affordable — great for everyday and families',
      charPriceMid: 'Mid-range — great for travelers and regional cuisine fans',
      charPriceHigh: 'Slightly higher range — also suits anniversaries and business entertainment',
      charPriceVeryHigh: 'High range — for those seeking a full dining experience',
    },
    login: {
      loading: 'Loading...',
      visualTitle: '24/7 AI staff that highlights your restaurant',
      visualLead: 'From menu updates to multilingual support, your AI staff handles it. Try the free plan first with a QR pop.',
      visualBullet1: 'Auto-generate QR pops and download instantly',
      visualBullet2: 'Upgrade plans seamlessly via Stripe',
      visualBullet3: 'AI editor, menu management, analytics dashboard included',
      tabLogin: 'Sign in',
      tabRegister: 'Sign up',
      email: 'Email',
      password: 'Password',
      passwordPlaceholder: '8+ characters',
      restaurantName: 'Restaurant name',
      restaurantNamePlaceholder: 'e.g. Bonta Main',
      submitLogin: 'Sign in',
      submittingLogin: 'Signing in...',
      submitRegister: 'Sign up and start',
      submittingRegister: 'Signing up...',
      forgotPassword: 'Forgot password?',
      contactSupport: 'Contact support',
      agreeToTerms: 'I agree to ',
      termsLinkText: 'the Terms',
      validateEmailRequired: 'Please enter an email',
      validateEmailFormat: 'Please enter a valid email',
      validatePasswordRequired: 'Please enter a password',
      validatePasswordLength: 'Password must be at least 8 characters',
      validateRestaurantNameRequired: 'Please enter a restaurant name',
      validateTermsRequired: 'Please agree to the Terms',
      loginFailed: 'Failed to sign in',
      invalidCredentials: 'Incorrect email or password',
      accountNotFound: 'Account not found',
      networkError: 'A network error occurred. Please check your connection.',
      registerSuccess: 'Registration complete. Please sign in.',
      registerFailed: 'Failed to register',
      emailAlreadyRegistered: 'This email is already registered',
    },
    users: {
      title: 'Users',
      titleHeader: '👥 Users',
      subtitle: 'Manage all users of the platform',
      create: '➕ New user',
      loading: '🔄 Loading...',
      loadingDetail: 'Fetching user info',
      error: '❌ Error',
      reload: 'Reload',
      fetchFailed: 'Failed to load users',
      authRequired: 'Authentication required',
      statTotal: 'Total users',
      statPlatformOwner: 'Platform owner',
      statRestaurantOwner: 'Restaurant owner',
      statConsumer: 'Consumer',
      statSuperadmin: 'Superadmin',
      statActive: 'Active',
      statusActive: '✅ Active',
      statusInactive: '⛔ Inactive',
      rolePlatformOwner: '👑 Platform owner',
      roleRestaurantOwner: '🍽️ Restaurant owner',
      roleSuperadmin: '👑 Superadmin',
      roleConsumer: '👤 Consumer',
      roleUnknown: '❓ Unknown',
      filterAllRoles: 'All roles',
      filterAllStatuses: 'All statuses',
      searchPlaceholder: '🔍 Search by email...',
      colUserInfo: 'User info',
      colRole: 'Role',
      colStatus: 'Status',
      colCreatedAt: 'Created',
      colLastUpdated: 'Last updated',
      colActions: 'Actions',
      emptyFiltered: 'No matching users found',
      actionDisable: 'Disable (coming soon)',
      actionEnable: 'Enable (coming soon)',
      actionResetPassword: 'Reset password (coming soon)',
      actionDelete: 'Delete (coming soon)',
      pending: '(coming soon)',
      createModalTitle: '➕ New user',
      fieldEmail: 'Email *',
      fieldPassword: 'Password *',
      fieldRole: 'Role *',
      passwordPlaceholder: 'Password (8+ characters)',
      cancel: 'Cancel',
      creating: '⏳ Creating...',
      create2: '✅ Create',
      validateEmailRequired: 'Please enter an email',
      validateEmailFormat: 'Please enter a valid email',
      validatePasswordRequired: 'Please enter a password',
      validatePasswordLength: 'Password must be at least 8 characters',
      createSuccess: (msg, email, role) => `${msg} User: ${email} Role: ${role}`,
      createFailed: (msg) => `Failed to create user: ${msg}`,
    },
    setup: {
      stepUpload: 'Upload',
      stepConfirm: 'Confirm',
      stepQr: 'QR',
      uploadTitle: 'Upload a menu photo',
      uploadSubtitle: 'Just snap a photo or pick a file. AI reads the menu automatically.',
      analyzing: 'AI is reading your menu...',
      analyzingNote: 'Usually takes about 30 seconds',
      dropZoneTitle: 'Drag & drop your menu photo',
      dropZoneOr: 'or click to select a file',
      dropZoneFormats: 'JPEG, PNG, PDF supported',
      cameraBtn: 'Take a photo on phone',
      proceedToConfirm: (n) => `Continue to review (${n} items)`,
      confirmTitle: 'Menus found',
      confirmSubtitle: 'Delete any you do not need. You can add more photos too.',
      countLabel: (n) => `${n} items`,
      publishAll: 'Publish all',
      addAnother: 'Add another photo',
      publishFailed: 'Failed to publish',
      creditExhausted: 'You are out of credits. Please buy more from the admin.',
      uploadFailed: 'Upload failed',
      qrReadyTitle: 'All set!',
      qrReadySubtitle: 'Print the QR code and place it on your tables.\nForeign customers can scan it on their phone to read the menu.',
      downloadQr: 'Download QR code',
      goToAdmin: 'Go to admin',
      qrInfoBox: 'AI is generating menu details (nutrition, allergens, translations) in the background. They will appear in a few minutes.',
      qrTipBox: 'Basic info (hours, address, etc.) can be set anytime from the admin',
      categoryMain: 'Main',
      categoryAppetizer: 'Appetizer',
      categoryRice: 'Rice',
      categorySashimi: 'Sashimi',
      categorySushi: 'Sushi',
      categoryDrink: 'Drink',
      categoryDessert: 'Dessert',
      categorySide: 'Side',
      categorySoup: 'Soup',
      categorySalad: 'Salad',
      categoryOther: 'Other',
    },
    conversations: {
      titleList: 'Conversations',
      titleDetail: 'Conversation detail',
      backToList: '← Back to list',
      prev: '← Prev',
      next: 'Next →',
      totalCount: (n) => `${n} conversations`,
      empty: 'No conversations yet',
      failedList: 'Failed to load conversations',
      failedDetail: 'Failed to load conversation detail',
      allStores: 'All stores',
      colStore: 'Store',
      colSummary: 'Summary',
      colTopic: 'Topic',
      colLang: 'Language',
      colCount: 'Count',
      colActions: 'Actions',
      colDate: 'Date',
      noSummary: '(no summary)',
      noMessages: 'No messages',
      detailStore: 'Store',
      detailSummary: 'Summary',
      detailRallies: 'Rallies',
      detailStart: 'Started',
      detailDevice: 'Device',
      summaryNone: '(none)',
    },
    basicInfo: {
      title: 'Basic info',
      loading: 'Loading...',
      loadingDetail: 'Loading restaurant info...',
      error: 'Error',
      reload: 'Reload',
      errorRestaurantFetch: 'Failed to load restaurant info',
      errorRestaurantNotLoaded: 'Restaurant info is not loaded',
      errorUserNotFound: 'User data not found',
      sectionAiSearch: 'AI info fetch',
      sectionDetail: 'Detailed info',
      sectionExternalLinks: 'External links',
      aiSearchDesc: 'Searching by store name fetches info automatically from Tabelog, Google Maps, official site, etc.',
      searchByName: 'Search info by name',
      searchByNameAndMenu: 'Search menus too',
      searching: 'Searching...',
      restaurantName: 'Restaurant name',
      officialWebsite: 'Official website',
      phone: 'Phone',
      address: 'Address',
      businessType: 'Business type',
      pleaseSelect: 'Please select',
      companyName: 'Operating company',
      companyNamePlaceholder: 'e.g. Aida Planning Co., Ltd.',
      representativeName: 'Representative',
      representativeNamePlaceholder: 'e.g. Masashi Hayashi',
      introduction: 'Restaurant introduction',
      introductionPlaceholder: 'Describe what makes the restaurant special',
      businessHours: 'Business hours',
      holidays: 'Holidays',
      seats: 'Seats',
      seatsPlaceholder: 'e.g. 50 seats',
      budget: 'Budget',
      budgetPlaceholder: 'e.g. ¥3,000–¥4,000',
      parking: 'Parking',
      parkingPlaceholder: 'e.g. Yes (10 cars)',
      payment: 'Payment methods',
      paymentPlaceholder: 'e.g. Credit card OK, e-money OK',
      accessInfo: 'Nearest station / access',
      accessInfoPlaceholder: 'e.g. 5 min walk from JR Fukui Station',
      reservationUrl: 'Reservation URL',
      featuresLabel: 'Features / notes (material for AI answers)',
      featuresPlaceholder: 'e.g. Kid-friendly / private rooms / accessible toilet / Wi-Fi / wheelchair / morning reservation-only / table charge ¥1,500',
      googleMaps: 'Google Maps',
      tabelog: 'Tabelog',
      gurunavi: 'Gurunavi',
      instagram: 'Instagram',
      saveAll: 'Save all changes',
      saved: 'Restaurant info saved',
      saveFailed: (msg) => `Failed to save: ${msg}`,
      searchSuccess: (extra) => `Fetched info via web search. Please review and save.${extra}`,
      menuCountSuffix: (n) => ` Menus: ${n} saved`,
      searchFailed: (msg) => `Failed to search info: ${msg}`,
    },
    prompts: {
      title: 'AI settings',
      breadcrumb: 'AI settings',
      save: 'Save',
      saving: 'Saving...',
      saved: 'Saved',
      saveFailed: 'Failed to save',
      selectRestaurant: 'Select restaurant',
      pleaseSelect: 'Please select',
      aiInstructionsFor: (name) => `AI instructions — ${name}`,
      intro: 'Base rules (menu guidance, multilingual support, etc.) are applied automatically across all stores. Here you only need to set the reply tone and store-specific extra instructions.',
      aiTone: 'AI tone',
      additionalInstructions: 'Additional instructions (optional)',
      promptPlaceholder: 'e.g. Actively suggest seasonal specials. Also convey the appeal of local ingredients.',
      charCount: (n) => `Chars: ${n}`,
      advanced: 'Advanced settings (optional)',
      advancedDesc: 'You usually do not need to touch this. Only set when you want to pin specific menus as "recommended / popular".',
      enableManualRecommended: 'Pick "recommended" manually',
      enableManualPopular: 'Pick "popular menus" manually',
      noMenus: 'No menus registered',
      basePrompt: 'Base prompt (read-only, shared across all stores)',
      basePromptContent: `[Base rules (read-only)]
1. Support customers about the restaurant's info, menus and recommendations
2. Use tools to provide accurate info (menu list, details, allergen search)
3. Do not make up menus or ingredients
4. Detect the customer's language and reply in the same language (Japanese, English, Chinese, Korean, etc.)
5. Limit replies to topics about this restaurant only`,
      googleReview: 'Google review prompt',
      googleReviewDesc: 'Encourage posting a Google review near the end of the conversation.',
      enable: 'Enable',
      noGmbNotice: 'Google Business Profile is not set in basic info. Please set the GMB URL on the basic info page first.',
      toneStandard: 'Standard (default)',
      toneFormal: 'Formal (polite)',
      toneCasual: 'Casual (friendly)',
      toneProfessional: 'Professional (expert)',
    },
    dailySpecials: {
      title: "Today's specials",
      headerDesc: "Register daily specials and chef's picks. Snap or paste and AI reads them — review, fix, and confirm. Once confirmed, customers see them and AI answers correctly. When you replace them, previous items stay in stock and can be reused next week.",
      section1: '1. Snap / paste',
      section2: (n) => `2. Review and fix (${n} items)`,
      sectionActive: "Today's specials currently live",
      sectionStock: 'Reuse from stock',
      activeDesc: 'Currently shown to customers. To replace, confirm new ones above.',
      stockDesc: 'Past daily items. Pick and "Show today" to reuse ("Same as yesterday" lives here too).',
      notRegistered: 'Nothing registered yet',
      noStock: 'No stock available to reuse',
      takePhoto: '📷 Take / pick a photo',
      textPlaceholder: "Or paste today's specials as text (e.g. Gomoku-yaki 800 yen / Toba-su gomoku 700 yen ...)",
      extractFromText: 'Extract from text',
      extracting: 'Reading...',
      aiReading: 'AI is reading...',
      confirmBtn: 'Confirm with these contents',
      confirming: 'Confirming...',
      replaceWarning: (n) => `⚠ Once confirmed, the ${n} items currently shown as today's specials are all replaced. Previous items stay in stock and can be reused later.`,
      namePlaceholder: 'Dish name',
      pricePlaceholder: 'Price',
      categoryPlaceholder: 'Category',
      ingredientsPlaceholder: 'Ingredients (comma-separated)',
      allergensPlaceholder: 'Allergens (comma-separated)',
      reuseToToday: (n) => `Show ${n} items today`,
      reusing: 'Reusing...',
      lastShown: (date) => `(last shown ${date})`,
      toastLoadFailed: "Failed to load today's specials",
      toastNoMenuDetected: 'No menu items detected',
      toastExtracted: (n) => `Extracted ${n} items. Review and confirm.`,
      toastExtractFailed: 'Extraction failed',
      toastEnterText: 'Please enter text',
      toastNameEmpty: 'Some items have an empty dish name',
      toastConfirmed: (n) => `Confirmed ${n} items as today's specials`,
      toastConfirmFailed: 'Failed to confirm',
      toastReused: (n) => `Reused ${n} items as today's specials`,
      toastReuseFailed: 'Failed to reuse',
      warnPriceMissing: 'Price is missing',
      warnIngredientsMissing: 'Ingredients are missing (affects multilingual descriptions and allergen accuracy)',
    },
    layout: {
      loading: 'Loading...',
      logout: 'Sign out',
      account: 'Account',
      loggedInAs: 'Signed in as',
      restaurantOwner: 'Restaurant owner',
      platformOwner: 'Platform owner',
      restaurantView: 'Restaurant view',
      platformView: 'Platform view',
      restaurantSystemTitle: 'Restaurant admin',
      platformSystemTitle: 'Platform admin',
      more: 'More',
      planLockedToast: 'This feature requires the Business plan or higher',
      langToggleAria: 'Toggle language',
    },
    nav: {
      menuList: 'Menus',
      dailySpecials: "Today's specials",
      qrManagement: 'QR codes',
      basicInfo: 'Basic info',
      dashboard: 'Dashboard',
      menuAnalytics: 'Menu analytics',
      storeKnowledge: 'Store knowledge',
      photoReview: 'Photo review',
      conversations: 'Conversations',
      prompts: 'AI settings',
      users: 'Users',
      restaurantList: 'Restaurants',
      searchLogs: 'Search logs',
    },
    dashboard: {
      restaurantTitle: 'Restaurant dashboard',
      platformTitle: 'Platform stats',
      loadingStats: 'Loading stats...',
      error: 'Error',
      errorStats: 'Failed to load stats',
      errorUserNotFound: 'User data not found',
      errorRestaurantNotFound: 'Restaurant not found',
      errorRestaurantFetch: 'Failed to load restaurant',
      langDistribution: 'Language distribution',
      restaurantInfo: 'Restaurant info',
      restaurantName: 'Name',
      registeredMenus: 'Menus',
      phoneNumber: 'Phone',
      address: 'Address',
      status: 'Status',
      statusActive: 'Active',
      statusInactive: 'Inactive',
      notSet: 'Not set',
      eventLogStats: 'Event log stats',
      eventLogStatsAll: 'Event log stats (all stores)',
      chatStatsLabel: (n: number) => `Chat stats (${n} messages)`,
      chatStatsAllLabel: (n: number) => `Chat stats (${n} messages total)`,
      sessionStats: 'Session stats',
      sessionCount: 'Sessions',
      avgStay: 'Avg. duration',
      totalSessions: 'Total sessions',
      avgStayDuration: 'Avg. session duration',
      minute: 'min',
      second: 'sec',
      serviceOverview: 'Service overview',
      totalRestaurants: 'Restaurants',
      totalMenus: 'Total menus',
      totalVerifiedMenus: 'Verified menus',
      totalUsers: 'Users',
      totalQrScans: 'Total QR scans',
      usersByRole: 'Users by role',
      roleSuperadmin: 'Superadmin',
      rolePlatformOwner: 'Platform owner',
      roleRestaurantOwner: 'Restaurant owner',
      roleConsumer: 'Consumer',
      topicDistribution: 'Topic distribution',
      referrer: 'Referrer',
      screenSize: 'Screen size',
      langUsageDistribution: 'Language usage',
      deviceDistribution: 'Device distribution',
    },
    topic: {
      'メニュー・料理': 'Menu / dishes',
      'アレルゲン': 'Allergens',
      '店舗情報': 'Store info',
      'ドリンク': 'Drinks',
      'おすすめ': 'Recommendations',
      'その他': 'Other',
    },
  },
}

export function getAdminCopy(lang: AdminLang): AdminCopy {
  return adminCopy[lang] ?? adminCopy.ja
}

export function getTopicLabel(lang: AdminLang, key: string): string {
  const dict = adminCopy[lang]?.topic
  return dict?.[key] ?? key
}
