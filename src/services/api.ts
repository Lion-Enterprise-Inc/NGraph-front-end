const API_BASE_URL = 'https://15.207.22.103:8000/api';

// Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface User {
  email: string;
  role: 'platform_owner' | 'restaurant_owner';
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

    return response.json();
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
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
  }
};

// Restaurant API
export const RestaurantApi = {
  create: async (data: CreateRestaurantRequest): Promise<CreateRestaurantResponse> => {
    return apiClient.post<CreateRestaurantResponse>('/restaurants/', data);
  },

  getAll: async (page: number = 1, size: number = 50): Promise<RestaurantListResponse> => {
    return apiClient.get<RestaurantListResponse>(`/restaurants/?page=${page}&size=${size}`);
  },

  getById: async (uid: string): Promise<{ result: Restaurant; message: string; status_code: number }> => {
    return apiClient.get(`/restaurants/${uid}`);
  }
};

// Auth API
export interface RegisterUserRequest {
  email: string;
  password: string;
  role: 'consumer' | 'restaurant_owner' | 'platform_owner' | 'superadmin';
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

export default apiClient;