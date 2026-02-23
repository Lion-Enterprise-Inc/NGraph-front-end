const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://dev-backend.ngraph.jp/api';

// Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface User {
  email: string;
  role: 'platform_owner' | 'restaurant_owner' | 'consumer' | 'superadmin';
  uid: string;
  restaurant_slug?: string;
  restaurant_short_code?: string;
}

export interface LoginResponse {
  result: {
    user: User;
    access_token: string;
  };
  message: string;
  status_code: number;
}

export interface ApiError {
  detail: string;
  status_code: number;
}

// Menu Scraping types
export interface MenuScrapingRequest {
  url: string;
}

export interface MenuScrapingResponse {
  result: {
    task_id: string;
  };
  message: string;
  status_code: number;
}

export interface ScrapingTaskStatus {
  task_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: {
    menus: Array<{
      name: string;
      price: number;
      category: string;
      description?: string;
      confidence: number;
    }>;
  };
  error?: string;
}

export interface TaskStatusResponse {
  result: ScrapingTaskStatus;
  message: string;
  status_code: number;
}

// Restaurant types
export interface CreateRestaurantRequest {
  name: string;
  description?: string;
  is_active?: boolean;
  user_uid: string; // Restaurant owner UID
  phone_number?: string;
  official_website?: string;
  google_business_profile?: string;
  address?: string;
  logo_url?: string;
  other_sources?: string;
  store_introduction?: string;
  opening_hours?: string;
  budget?: string;
  parking_slot?: string;
  attention_in_detail?: string;
  business_type?: string;
}

export interface Restaurant {
  uid: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  user_uid: string;
  phone_number: string | null;
  official_website: string | null;
  google_business_profile: string | null;
  address: string | null;
  logo_url: string | null;
  other_sources: string | null;
  store_introduction: string | null;
  opening_hours: string | null;
  budget: string | null;
  parking_slot: string | null;
  attention_in_detail: string | null;
  business_type: string | null;
  custom_prompt: string | null;
  ai_tone: string | null;
  recommended_menus: { auto: boolean; menu_uids: string[] } | null;
  popular_menus: { auto: boolean; menu_uids: string[] } | null;
  recommend_texts: string[] | null;
  google_review_enabled: boolean | null;
  city: string | null;
  menu_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateRestaurantResponse {
  result: Restaurant;
  message: string;
  status_code: number;
}

export interface UserListItem {
  uid: string;
  email: string;
  role: 'platform_owner' | 'restaurant_owner' | 'consumer' | 'superadmin';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserListResponse {
  result: UserListItem[];
  message: string;
  status_code: number;
}

// Paginated response for restaurants
export interface PaginatedResult<T> {
  total: number;
  page: number;
  size: number;
  pages: number;
  next: string | null;
  previous: string | null;
  items: T[];
  rank_summary?: { S: number; A: number; B: number; C: number };
}

export interface RestaurantListResponse {
  result: PaginatedResult<Restaurant>;
  message: string;
  status_code: number;
}

// Token management — sessionStorage so each tab has its own session
export const TokenService = {
  getAccessToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('access_token');
  },

  setAccessToken: (token: string): void => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('access_token', token);
  },

  removeAccessToken: (): void => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem('access_token');
  },

  getUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    const userStr = sessionStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  setUser: (user: User): void => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('user', JSON.stringify(user));
  },

  removeUser: (): void => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem('user');
  },

  clearAll: (): void => {
    TokenService.removeAccessToken();
    TokenService.removeUser();
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('admin_logged_in');
      sessionStorage.removeItem('admin_user_type');
      sessionStorage.removeItem('admin_user_email');
    }
  },

  isAuthenticated: (): boolean => {
    return !!TokenService.getAccessToken() && !!TokenService.getUser();
  }
};

// API client with interceptors
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    };

    // Add auth token if available
    const token = TokenService.getAccessToken();
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    console.log('=== API Request ===');
    console.log('URL:', url);
    console.log('Method:', options.method);
    console.log('Headers:', headers);
    console.log('Body:', options.body);
    console.log('==================');

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle non-OK responses
    if (!response.ok) {
      let errorMessage = 'An error occurred';
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        errorMessage = response.statusText;
      }

      // If unauthorized, clear tokens
      if (response.status === 401) {
        TokenService.clearAll();
      }

      throw new Error(errorMessage);
    }

    // Handle 204 No Content responses (successful deletion)
    if (response.status === 204) {
      return { message: 'Success', status_code: 204 } as T;
    }

    return response.json();
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    console.log('POST request to:', endpoint);
    console.log('POST body:', JSON.stringify(data, null, 2));
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

// User API
export const UserApi = {
  getUsers: async (role: string = 'all'): Promise<UserListItem[]> => {
    return apiClient.get<UserListItem[]>(`/auth/userlist?role=${role}`);
  },

  getRestaurantOwners: async (): Promise<UserListItem[]> => {
    return apiClient.get<UserListItem[]>('/auth/userlist?role=restaurant_owner');
  },

  getUnassociatedRestaurantOwners: async (): Promise<UserListItem[]> => {
    return apiClient.get<UserListItem[]>('/auth/unassociated_res_owners-list');
  }
};

// Restaurant API
export const RestaurantApi = {
  create: async (data: CreateRestaurantRequest): Promise<CreateRestaurantResponse> => {
    // API requires multipart/form-data
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('user_uid', data.user_uid);
    if (data.phone_number) formData.append('phone_number', data.phone_number);
    if (data.address) formData.append('address', data.address);
    if (data.is_active !== undefined) formData.append('is_active', String(data.is_active));
    if (data.description) formData.append('description', data.description);
    if (data.official_website) formData.append('official_website', data.official_website);
    if (data.google_business_profile) formData.append('google_business_profile', data.google_business_profile);
    if (data.logo_url) formData.append('logo', data.logo_url);
    if (data.other_sources) formData.append('other_sources', data.other_sources);
    if (data.store_introduction) formData.append('store_introduction', data.store_introduction);
    if (data.opening_hours) formData.append('opening_hours', data.opening_hours);
    if (data.budget) formData.append('budget', data.budget);
    if (data.parking_slot) formData.append('parking_slot', data.parking_slot);
    if (data.attention_in_detail) formData.append('attention_in_detail', data.attention_in_detail);
    if (data.business_type) formData.append('business_type', data.business_type);

    const token = TokenService.getAccessToken();
    const response = await fetch(`${API_BASE_URL}/restaurants/`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create restaurant');
    }

    return response.json();
  },

  getAll: async (page: number = 1, size: number = 50): Promise<RestaurantListResponse> => {
    return apiClient.get<RestaurantListResponse>(`/restaurants/?page=${page}&size=${size}`);
  },

  getById: async (uid: string): Promise<{ result: Restaurant; message: string; status_code: number }> => {
    return apiClient.get(`/restaurants/${uid}`);
  },

  getBySlug: async (slug: string): Promise<{ result: Restaurant; message: string; status_code: number }> => {
    return apiClient.get(`/restaurants/by-slug/${slug}`);
  },

  delete: async (uid: string): Promise<{ message: string; status_code: number }> => {
    return apiClient.delete(`/restaurants/${uid}`);
  }
};

// Ingredient type (returned from API)
export interface Ingredient {
  uid: string;
  name: string;
  slug: string;
}

// Allergen types
export type AllergenType = 'mandatory' | 'recommended';

export interface Allergen {
  uid: string;
  name_en: string;
  name_jp: string;
  allergen_type: AllergenType;
  created_at: string;
  updated_at: string;
}

export interface AllergenCreate {
  name_en: string;
  name_jp: string;
  allergen_type: AllergenType;
}

export interface AllergenUpdate {
  name_en?: string | null;
  name_jp?: string | null;
  allergen_type?: AllergenType | null;
}

export interface AllergenListResponse {
  result: Array<{
    mandatory?: Allergen[];
    recommended?: Allergen[];
  }>;
  message: string;
  status_code: number;
}

export interface AllergenResponse {
  result: Allergen;
  message: string;
  status_code: number;
}

// Business types (業種カテゴリ)
export const BUSINESS_TYPES: Record<string, string> = {
  izakaya: '居酒屋',
  japanese: '和食・日本料理',
  sushi: '寿司',
  ramen: 'ラーメン',
  soba_udon: 'そば・うどん',
  yakitori: '焼き鳥・串揚げ',
  yakiniku: '焼肉',
  chinese: '中華',
  italian: 'イタリアン',
  french: 'フレンチ',
  western: '洋食',
  curry: 'カレー',
  korean: '韓国料理',
  ethnic: 'エスニック・各国料理',
  cafe: 'カフェ・喫茶',
  bar: 'バー・ダイニングバー',
  sweets: 'スイーツ・パティスリー',
  bakery: 'ベーカリー・パン',
  takeout_stand: 'テイクアウト・スタンド',
  shokudo: '食堂・定食',
  fast_food: 'ファストフード',
  restaurant_other: '飲食店 - その他',
  retail_apparel: '小売店 - アパレル',
  retail_goods: '小売店 - 雑貨',
  retail_food: '小売店 - 食品',
  antenna_shop: 'アンテナショップ',
  hotel: '宿泊施設',
}

// Dish categories (NFG v0.2 English enum → Japanese label)
export const DISH_CATEGORIES: Record<string, string> = {
  main: 'メイン',
  appetizer: '前菜',
  rice: 'ご飯もの',
  sashimi: '刺身',
  sushi: '寿司',
  nabe: '鍋物',
  ramen: 'ラーメン',
  soba: 'そば・うどん',
  tempura: '天ぷら',
  yakitori: '焼き鳥',
  steamed: '蒸し物',
  vinegared: '酢の物',
  chinmi: '珍味',
  salad: 'サラダ',
  soup: 'スープ',
  side: '一品料理',
  drink: 'ドリンク',
  dessert: 'デザート',
  course: 'コース',
  bento: '弁当',
  bread: 'パン',
  other: 'その他',
}

// Menu types
export interface Menu {
  uid: string;
  name_en: string | null;
  name_jp: string;
  description: string | null;
  description_en: string | null;
  category: string;
  status: boolean;
  price: number;
  restaurant_uid: string;
  ingredients: Ingredient[] | null;
  allergens: Allergen[] | null;
  cooking_methods: CookingMethod[] | null;
  restrictions: Restriction[] | null;
  taste_profiles: TasteProfile[] | null;
  calorie_range: CalorieRange | null;
  verified: boolean;
  verified_by: string | null;
  image_url: string | null;
  product_url: string | null;
  data_source: string | null;
  confidence_score: number;
  verification_rank: string | null;
  field_confidence: Record<string, number> | null;
  nfg_version: string | null;
  valid_from: string | null;
  valid_until: string | null;
  narrative: Record<string, any> | null;
  serving: Record<string, any> | null;
  price_detail: Record<string, any> | null;
  featured_tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface MenuCreate {
  name_en?: string | null;
  name_jp: string;
  description?: string | null;
  description_en?: string | null;
  category: string;
  status?: boolean;
  price: number;
  restaurant_uid: string;
  ingredients?: string[] | null;
  allergen_uids?: string[] | null;
  cooking_method_uids?: string[] | null;
  restriction_uids?: string[] | null;
  taste_profile_uids?: string[] | null;
  calorie_range_uid?: string | null;
  image_url?: string | null;
  product_url?: string | null;
  data_source?: string;
  narrative?: Record<string, any> | null;
  serving?: Record<string, any> | null;
  price_detail?: Record<string, any> | null;
  featured_tags?: string[] | null;
}

export interface MenuUpdate {
  name_en?: string | null;
  name_jp?: string | null;
  description?: string | null;
  description_en?: string | null;
  category?: string | null;
  status?: boolean | null;
  price?: number | null;
  ingredients?: string[] | null;
  allergen_uids?: string[] | null;
  cooking_method_uids?: string[] | null;
  restriction_uids?: string[] | null;
  taste_profile_uids?: string[] | null;
  calorie_range_uid?: string | null;
  image_url?: string | null;
  product_url?: string | null;
  data_source?: string;
  narrative?: Record<string, any> | null;
  serving?: Record<string, any> | null;
  price_detail?: Record<string, any> | null;
  featured_tags?: string[] | null;
}

export interface MenuListResponse {
  result: PaginatedResult<Menu>;
  message: string;
  status_code: number;
}

export interface MenuResponse {
  result: Menu;
  message: string;
  status_code: number;
}

// Menu API
export const MenuApi = {
  create: async (data: MenuCreate): Promise<MenuResponse> => {
    return apiClient.post<MenuResponse>('/menus/', data);
  },

  getAll: async (restaurantUid?: string, page: number = 1, size: number = 100, sort?: string, order?: string): Promise<MenuListResponse> => {
    const params = new URLSearchParams();
    if (restaurantUid) params.append('restaurant_uid', restaurantUid);
    params.append('page', page.toString());
    params.append('size', size.toString());
    if (sort) params.append('sort', sort);
    if (order) params.append('order', order);
    return apiClient.get<MenuListResponse>(`/menus/?${params.toString()}`);
  },

  getById: async (menuUid: string): Promise<MenuResponse> => {
    return apiClient.get<MenuResponse>(`/menus/${menuUid}`);
  },

  update: async (menuUid: string, data: MenuUpdate): Promise<MenuResponse> => {
    return apiClient.put<MenuResponse>(`/menus/${menuUid}`, data);
  },

  delete: async (menuUid: string): Promise<{ message: string; status_code: number }> => {
    return apiClient.delete(`/menus/${menuUid}`);
  },

  uploadImage: async (menuUid: string, file: File): Promise<{ image_url: string }> => {
    const formData = new FormData();
    formData.append('image', file);

    const token = TokenService.getAccessToken();
    const response = await fetch(`${API_BASE_URL}/menus/${menuUid}/upload-image`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = 'Failed to upload image';
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch {}
      throw new Error(errorMessage);
    }

    return response.json();
  }
};

// Allergen API
export const AllergenApi = {
  getAll: async (): Promise<AllergenListResponse> => {
    return apiClient.get<AllergenListResponse>('/allergens/');
  },

  getById: async (uid: string): Promise<AllergenResponse> => {
    return apiClient.get<AllergenResponse>(`/allergens/${uid}`);
  },

  create: async (data: AllergenCreate): Promise<AllergenResponse> => {
    return apiClient.post<AllergenResponse>('/allergens/', data);
  },

  update: async (uid: string, data: AllergenUpdate): Promise<AllergenResponse> => {
    return apiClient.put<AllergenResponse>(`/allergens/${uid}`, data);
  },

  delete: async (uid: string): Promise<{ message: string; status_code: number }> => {
    return apiClient.delete(`/allergens/${uid}`);
  }
};

// Scraping API
export const ScrapingApi = {
  scrapeMenu: async (restaurantSlug: string, data: MenuScrapingRequest): Promise<MenuScrapingResponse> => {
    return apiClient.post<MenuScrapingResponse>(`/menus/${restaurantSlug}/scrape`, data);
  },

  getTaskStatus: async (taskId: string): Promise<TaskStatusResponse> => {
    return apiClient.get<TaskStatusResponse>(`/tasks/${taskId}`);
  }
};

// Vision Analysis types
export interface VisionMenuItem {
  name_jp: string;
  name_en: string;
  name_reading?: string;
  name_romaji?: string;
  price: number;
  description: string;
  category: string;
  ingredients: string[];
  allergens: string[];
  restrictions?: string[];
  flavor_profile?: string;
  estimated_calories?: string;
  tax_note?: string;
  image_url?: string;
  source?: "db" | "ai";
  confidence?: number;
  taste_values?: Record<string, number>;
  narrative?: Record<string, any>;
  serving?: Record<string, any>;
  featured_tags?: string[];
  verification_rank?: string;
}

export interface VisionAnalysisResult {
  items: VisionMenuItem[];
  items_count: number;
  saved_count?: number;
}

export interface VisionAnalysisResponse {
  result: VisionAnalysisResult;
  message: string;
  status_code: number;
}

// Vision API
export const VisionApi = {
  analyzeImage: async (
    image: File,
    restaurantSlug?: string,
    save: boolean = false
  ): Promise<VisionAnalysisResponse> => {
    const formData = new FormData();
    formData.append('image', image);
    if (restaurantSlug) formData.append('restaurant_slug', restaurantSlug);
    if (save) formData.append('save', 'true');

    const token = TokenService.getAccessToken();
    const url = `${API_BASE_URL}/menus/analyze-image`;
    console.log('VisionApi upload:', { url, fileName: image.name, fileType: image.type, fileSize: image.size });
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      const responseText = await response.text();
      console.error('Upload failed:', response.status, responseText);
      let errorMessage = `Server error ${response.status}`;
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.detail || errorData.message || errorMessage;
        if (Array.isArray(errorMessage)) errorMessage = JSON.stringify(errorMessage);
      } catch {}
      throw new Error(errorMessage);
    }

    return response.json();
  },

  analyzeText: async (text: string): Promise<VisionAnalysisResponse> => {
    const formData = new FormData();
    formData.append('text', text);

    const token = TokenService.getAccessToken();
    const response = await fetch(`${API_BASE_URL}/menus/analyze-text`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = 'Failed to analyze text';
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch {}
      throw new Error(errorMessage);
    }

    return response.json();
  }
};

// Auth API
export interface RegisterUserRequest {
  email: string;
  password: string;
  role: 'consumer' | 'restaurant_owner' | 'platform_owner' | 'superadmin';
  restaurant_name?: string;
}

export interface RegisterUserResponse {
  result: {
    email: string;
    role: string;
    is_validated: boolean;
  };
  message: string;
  status_code: number;
}

// Auth API
export const AuthApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);

    // Store tokens and user data on successful login
    if (response.result) {
      TokenService.setAccessToken(response.result.access_token);
      TokenService.setUser(response.result.user);

      // Also set legacy keys
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('admin_logged_in', 'true');
        sessionStorage.setItem('admin_user_email', response.result.user.email);
        const userType = (response.result.user.role === 'platform_owner' || response.result.user.role === 'superadmin') ? 'admin' : 'store';
        sessionStorage.setItem('admin_user_type', userType);
      }
    }

    return response;
  },

  register: async (userData: RegisterUserRequest): Promise<RegisterUserResponse> => {
    return apiClient.post<RegisterUserResponse>('/auth/register', userData);
  },

  logout: (): void => {
    TokenService.clearAll();
  },

  getCurrentUser: (): User | null => {
    return TokenService.getUser();
  },

  isAuthenticated: (): boolean => {
    return TokenService.isAuthenticated();
  }
};

// Master data types
export interface CookingMethod {
  uid: string;
  name_jp: string;
  name_en: string | null;
  method_category: string | null;
  slug: string;
}

export interface Restriction {
  uid: string;
  name_jp: string;
  name_en: string | null;
  restriction_category: string | null;
  description: string | null;
  slug: string;
}

export interface TasteProfile {
  uid: string;
  name_jp: string;
  name_en: string | null;
  taste_category: string | null;
  description_jp: string | null;
  description_en: string | null;
  slug: string;
}

export interface CalorieRange {
  uid: string;
  name_jp: string;
  name_en: string | null;
  min_kcal: number | null;
  max_kcal: number | null;
  description_jp: string | null;
  description_en: string | null;
  slug: string;
}

// Master data API
export const CookingMethodApi = {
  getAll: async (): Promise<{ result: CookingMethod[]; message: string }> => {
    return apiClient.get('/cooking-methods/');
  }
};

export const RestrictionApi = {
  getAll: async (): Promise<{ result: Restriction[]; message: string }> => {
    return apiClient.get('/restrictions/');
  }
};

export const TasteProfileApi = {
  getAll: async (): Promise<{ result: TasteProfile[]; message: string }> => {
    return apiClient.get('/taste-profiles/');
  }
};

export const CalorieRangeApi = {
  getAll: async (): Promise<{ result: CalorieRange[]; message: string }> => {
    return apiClient.get('/calorie-ranges/');
  }
};

// Conversation types
export interface ConversationListItem {
  thread_uid: string;
  restaurant_name: string;
  restaurant_uid: string;
  summary: string | null;
  message_count: number;
  good_count: number;
  bad_count: number;
  created_at: string;
  updated_at: string;
  topic?: string;
  events?: { copy: number; share: number; review: number };
  langs?: Record<string, number>;
}

export interface ConversationMessage {
  uid: string;
  user_message: string;
  ai_response: string | null;
  images: string[] | null;
  feedback: 'good' | 'bad' | null;
  lang?: string | null;
  created_at: string;
}

export interface ConversationDetail {
  thread_uid: string;
  restaurant_name: string | null;
  restaurant_uid: string | null;
  summary: string | null;
  created_at: string;
  updated_at: string;
  user_agent?: string | null;
  messages: ConversationMessage[];
}

export interface ConversationListResponse {
  result: {
    total: number;
    page: number;
    size: number;
    pages: number;
    items: ConversationListItem[];
  };
  message: string;
  status_code: number;
}

export interface ConversationDetailResponse {
  result: ConversationDetail;
  message: string;
  status_code: number;
}

// Conversation API
export const ConversationApi = {
  getAll: async (page: number = 1, size: number = 20, restaurantUid?: string): Promise<ConversationListResponse> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    if (restaurantUid) params.append('restaurant_uid', restaurantUid);
    return apiClient.get<ConversationListResponse>(`/admin/conversations?${params.toString()}`);
  },

  getDetail: async (threadUid: string): Promise<ConversationDetailResponse> => {
    return apiClient.get<ConversationDetailResponse>(`/admin/conversations/${threadUid}`);
  },
};

// Feedback API (public, no auth)
export const FeedbackApi = {
  submit: async (messageUid: string, rating: 'good' | 'bad'): Promise<{ message: string; status_code: number }> => {
    return apiClient.post('/public-chat/feedback', { message_uid: messageUid, rating });
  },
};

// Event tracking API (public, no auth, fire-and-forget)
export const EventApi = {
  log: (params: { restaurant_slug: string; event: string; message_uid?: string | null; thread_uid?: string | null; lang?: string; meta?: Record<string, any> }) => {
    fetch(`${API_BASE_URL}/public-chat/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurant_slug: params.restaurant_slug,
        event: params.event,
        message_uid: params.message_uid || undefined,
        thread_uid: params.thread_uid || undefined,
        lang: params.lang,
        meta: params.meta,
      }),
    }).catch(() => {});
  },
  beacon: (params: { restaurant_slug: string; event: string; meta?: Record<string, any>; lang?: string }) => {
    const data = JSON.stringify({
      restaurant_slug: params.restaurant_slug,
      event: params.event,
      lang: params.lang,
      meta: params.meta,
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(`${API_BASE_URL}/public-chat/events`, new Blob([data], { type: 'application/json' }));
    } else {
      fetch(`${API_BASE_URL}/public-chat/events`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: data, keepalive: true,
      }).catch(() => {});
    }
  },
};

// Verification API (Phase 1 ゲーミフィケーション)
export interface VerificationQuestion {
  menu_uid: string;
  menu_name: string;
  field: string;
  question: string;
  current_value: any;
  priority: number;
}

export interface VerifyRequest {
  menu_uid: string;
  field: string;
  action: 'confirm' | 'correct';
  corrected_value?: any;
}

export const VerificationApi = {
  getQueue: async (restaurantUid?: string): Promise<{ result: VerificationQuestion[]; message: string; status_code: number }> => {
    const params = restaurantUid ? `?restaurant_uid=${restaurantUid}` : '';
    return apiClient.get(`/admin/verification-queue${params}`);
  },
  verify: async (data: VerifyRequest): Promise<{ result: any; message: string; status_code: number }> => {
    return apiClient.post('/admin/verify', data);
  },
};

export const MenuAnalyticsApi = {
  get: async (restaurantUid?: string): Promise<{ result: MenuAnalyticsData; message: string; status_code: number }> => {
    const params = restaurantUid ? `?restaurant_uid=${restaurantUid}` : '';
    return apiClient.get(`/admin/menu-analytics${params}`);
  },
};

export interface MenuAnalyticsData {
  total_menus: number;
  active_menus: number;
  avg_price: number;
  avg_confidence: number;
  category_distribution: Array<{ category: string; label: string; count: number; avg_price: number }>;
  price_ranges: Array<{ range: string; count: number }>;
  top_ingredients: Array<{ name: string; count: number }>;
  cooking_method_distribution: Array<{ name_jp: string; count: number }>;
  taste_profile_distribution: Array<{ name_jp: string; count: number }>;
  allergen_coverage: {
    with_allergens: number;
    without_allergens: number;
    top_allergens: Array<{ name_jp: string; count: number }>;
  };
  calorie_distribution: Array<{ name_jp: string; count: number }>;
  rank_distribution: Record<string, number>;
  protein_distribution: Array<{ label: string; count: number }>;
  menu_composition: Array<{ label: string; count: number }>;
  drink_breakdown: Array<{ label: string; count: number }>;
  category_price_ranges: Array<{ category: string; label: string; ranges: Array<{ range: string; count: number }> }>;
}

// Nearby restaurants API (public, no auth)
export interface NearbyRestaurant {
  uid: string;
  name: string;
  slug: string;
  logo_url: string | null;
  distance_m: number;
  address: string | null;
}

export const NearbyApi = {
  search: async (lat: number, lng: number, radius: number = 500): Promise<{ result: NearbyRestaurant[] }> => {
    const params = new URLSearchParams({ lat: String(lat), lng: String(lng), radius: String(radius) });
    const resp = await fetch(`${API_BASE_URL}/restaurants/nearby?${params}`);
    if (!resp.ok) throw new Error('Nearby search failed');
    return resp.json();
  },
};

// Explore / public search API (no auth)
export interface SearchRestaurant {
  uid: string;
  name: string;
  slug: string;
  logo_url: string | null;
  address: string | null;
  city: string | null;
  menu_count: number;
}

export interface CityCount {
  city: string;
  count: number;
}

export interface PlatformStats {
  total_restaurants: number;
  total_menus: number;
  enriched_menus: number;
  cities: number;
  translated_menus: number;
}

export interface NfgSearchRestaurant {
  uid: string;
  name: string;
  slug: string;
  address: string | null;
  city: string | null;
  menu_count: number;
  score: number;
  match_reasons: string[];
}

export interface NfgQueryIntent {
  address_patterns: string[];
  ingredient_targets: string[];
  category_targets: string[];
  regional_patterns: string[];
  price_min: number | null;
  price_max: number | null;
  featured: boolean;
  raw_query: string;
}

export const ExploreApi = {
  stats: async (): Promise<{ result: PlatformStats }> => {
    const resp = await fetch(`${API_BASE_URL}/restaurants/stats`);
    if (!resp.ok) throw new Error('Stats failed');
    return resp.json();
  },
  search: async (q: string = '', city: string = '', page: number = 1, size: number = 20): Promise<{
    result: { total: number; page: number; size: number; pages: number; items: SearchRestaurant[] };
  }> => {
    const params = new URLSearchParams();
    if (q) params.append('q', q);
    if (city) params.append('city', city);
    params.append('page', String(page));
    params.append('size', String(size));
    const resp = await fetch(`${API_BASE_URL}/restaurants/search?${params}`);
    if (!resp.ok) throw new Error('Search failed');
    return resp.json();
  },
  cities: async (): Promise<{ result: CityCount[] }> => {
    const resp = await fetch(`${API_BASE_URL}/restaurants/cities`);
    if (!resp.ok) throw new Error('Cities failed');
    return resp.json();
  },
  nearby: async (lat: number, lng: number, radius: number = 500): Promise<{ result: NearbyRestaurant[] }> => {
    const params = new URLSearchParams({ lat: String(lat), lng: String(lng), radius: String(radius) });
    const resp = await fetch(`${API_BASE_URL}/restaurants/nearby?${params}`);
    if (!resp.ok) throw new Error('Nearby search failed');
    return resp.json();
  },
  nfgSearch: async (q: string, city: string = '', page: number = 1, size: number = 20): Promise<{
    result: { total: number; page: number; size: number; pages: number; items: NfgSearchRestaurant[]; query_intent: NfgQueryIntent };
  }> => {
    const params = new URLSearchParams();
    if (q) params.append('q', q);
    if (city) params.append('city', city);
    params.append('page', String(page));
    params.append('size', String(size));
    const resp = await fetch(`${API_BASE_URL}/restaurants/nfg-search?${params}`);
    if (!resp.ok) throw new Error('NFG search failed');
    return resp.json();
  },
};

export interface SemanticSearchRestaurant {
  uid: string;
  name: string;
  slug: string;
  city: string | null;
  menu_count: number;
  score: number;
  match_reasons: string[];
  safe_menu_count: number;
}

export const SemanticSearchApi = {
  count: async (params: {
    diet?: string; no?: string; scene?: string;
    mood?: string; area?: string; q?: string;
  }): Promise<{ result: { count: number } }> => {
    const sp = new URLSearchParams();
    if (params.diet) sp.append('diet', params.diet);
    if (params.no) sp.append('no', params.no);
    if (params.scene) sp.append('scene', params.scene);
    if (params.mood) sp.append('mood', params.mood);
    if (params.area) sp.append('area', params.area);
    if (params.q) sp.append('q', params.q);
    const resp = await fetch(`${API_BASE_URL}/restaurants/search/count?${sp}`);
    if (!resp.ok) throw new Error('Count failed');
    return resp.json();
  },
  search: async (params: {
    diet?: string; no?: string; scene?: string;
    mood?: string; area?: string; q?: string;
    page?: number; size?: number;
  }): Promise<{
    result: { count: number; restaurants: SemanticSearchRestaurant[]; page: number; size: number; pages: number };
  }> => {
    const sp = new URLSearchParams();
    if (params.diet) sp.append('diet', params.diet);
    if (params.no) sp.append('no', params.no);
    if (params.scene) sp.append('scene', params.scene);
    if (params.mood) sp.append('mood', params.mood);
    if (params.area) sp.append('area', params.area);
    if (params.q) sp.append('q', params.q);
    sp.append('page', String(params.page || 1));
    sp.append('size', String(params.size || 30));
    const resp = await fetch(`${API_BASE_URL}/restaurants/search/semantic?${sp}`);
    if (!resp.ok) throw new Error('Semantic search failed');
    return resp.json();
  },
};

// Menu search types
export interface MenuSearchItem {
  uid: string;
  name_jp: string;
  name_en: string | null;
  price: number;
  category: string;
  category_label: string;
  description: string | null;
  narrative_snippet: string | null;
  featured_tags: string[];
  restaurant_uid: string;
  restaurant_name: string;
  restaurant_slug: string;
  restaurant_city: string | null;
}

export const MenuSearchApi = {
  count: async (params: {
    category?: string; q?: string; diet?: string; no?: string;
    mood?: string; area?: string;
  }): Promise<{ result: { count: number } }> => {
    const sp = new URLSearchParams();
    if (params.category) sp.append('category', params.category);
    if (params.q) sp.append('q', params.q);
    if (params.diet) sp.append('diet', params.diet);
    if (params.no) sp.append('no', params.no);
    if (params.mood) sp.append('mood', params.mood);
    if (params.area) sp.append('area', params.area);
    const resp = await fetch(`${API_BASE_URL}/restaurants/search/menus/count?${sp}`);
    if (!resp.ok) throw new Error('Menu count failed');
    return resp.json();
  },
  search: async (params: {
    category?: string; q?: string; diet?: string; no?: string;
    mood?: string; area?: string; page?: number; size?: number;
  }): Promise<{
    result: { count: number; menus: MenuSearchItem[]; page: number; size: number; pages: number };
  }> => {
    const sp = new URLSearchParams();
    if (params.category) sp.append('category', params.category);
    if (params.q) sp.append('q', params.q);
    if (params.diet) sp.append('diet', params.diet);
    if (params.no) sp.append('no', params.no);
    if (params.mood) sp.append('mood', params.mood);
    if (params.area) sp.append('area', params.area);
    sp.append('page', String(params.page || 1));
    sp.append('size', String(params.size || 20));
    const resp = await fetch(`${API_BASE_URL}/restaurants/search/menus?${sp}`);
    if (!resp.ok) throw new Error('Menu search failed');
    return resp.json();
  },
};

// Top menus API (public, no auth)
export const TopMenusApi = {
  fetch: async (slug: string, limit = 5, lang = 'ja'): Promise<{ result: { menus: VisionMenuItem[]; total: number } }> => {
    const params = new URLSearchParams({ limit: String(limit), lang });
    const resp = await fetch(`${API_BASE_URL}/restaurants/public/${encodeURIComponent(slug)}/top-menus?${params}`);
    if (!resp.ok) throw new Error('Top menus failed');
    return resp.json();
  },
};

// Contribution/Suggestion API (public, no auth)
export interface SuggestionRequest {
  menu_uid: string;
  restaurant_uid: string;
  field: string;
  suggested_value: string;
  reason?: string;
  session_id: string;
}

export const ContributionApi = {
  suggest: async (data: SuggestionRequest): Promise<{ result: any; message: string }> => {
    const resp = await fetch(`${API_BASE_URL}/contributions/suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!resp.ok) throw new Error('Suggestion failed');
    return resp.json();
  },
};

export default apiClient;