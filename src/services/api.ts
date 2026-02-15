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
}

export interface RestaurantListResponse {
  result: PaginatedResult<Restaurant>;
  message: string;
  status_code: number;
}

// Token management
export const TokenService = {
  getAccessToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
  },

  setAccessToken: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('access_token', token);
  },

  removeAccessToken: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('access_token');
  },

  getUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  setUser: (user: User): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('user', JSON.stringify(user));
  },

  removeUser: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('user');
  },

  clearAll: (): void => {
    TokenService.removeAccessToken();
    TokenService.removeUser();
    // Also clear legacy keys
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_logged_in');
      localStorage.removeItem('admin_user_type');
      localStorage.removeItem('admin_user_email');
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
  data_source: string | null;
  confidence_score: number;
  field_confidence: Record<string, number> | null;
  nfg_version: string | null;
  valid_from: string | null;
  valid_until: string | null;
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
  data_source?: string;
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
  data_source?: string;
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

  getAll: async (restaurantUid?: string, page: number = 1, size: number = 100): Promise<MenuListResponse> => {
    const params = new URLSearchParams();
    if (restaurantUid) params.append('restaurant_uid', restaurantUid);
    params.append('page', page.toString());
    params.append('size', size.toString());
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
  price: number;
  description: string;
  category: string;
  ingredients: string[];
  allergens: string[];
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

      // Also set legacy keys for backward compatibility
      if (typeof window !== 'undefined') {
        localStorage.setItem('admin_logged_in', 'true');
        localStorage.setItem('admin_user_email', response.result.user.email);
        // Map role to legacy user type
        const userType = response.result.user.role === 'platform_owner' ? 'admin' : 'store';
        localStorage.setItem('admin_user_type', userType);
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

export default apiClient;