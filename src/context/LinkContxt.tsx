import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { jwtDecode } from "jwt-decode";

import { API_BASE_URL } from "../services/api.js";

export interface ExperienceItem {
  role: string;
  period: string;
  desc: string;
  location?: string;
}

export interface EducationItem {
  school: string;
  degree: string;
  period: string;
  location?: string;
  desc?: string;
}

export type AuthUser = {
  id?: string;
  name?: string;
  email?: string;
  avatar?: string;
  avatarUrl?: string;
  phone?: string;
  role?: "user" | "company";
  companyId?: string | number;
  companyName?: string;
  location?: string;
  description?: string;
  notificationPreferences?: { applications: boolean; jobs: boolean; recs: boolean };
  bio?: string;
  skills?: string[];
  experiences?: ExperienceItem[];
  educations?: EducationItem[];
  portfolios?: string[];
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    website?: string;
    linkedin?: string;
  };
  dob?: string;
  gender?: string;
  languages?: string[];
  classification?: string;
  banner_url?: string;
  deletionRequestedAt?: string;
};

export type AuthContextType = {
  user: AuthUser | null;
  role: "user" | "company" | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
  googleClientId: string;
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
  updateUser: (newData: Partial<AuthUser>) => void;
  isBackendOffline: boolean;
  isInitialLoading: boolean;
  isMaintenanceMode: boolean;
  setIsMaintenanceMode: (value: boolean) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Threshold: refresh token if less than 1 day remains */
const REFRESH_THRESHOLD_MS = 24 * 60 * 60 * 1000;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<"user" | "company" | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [googleClientId, setGoogleClientId] = useState<string>("");
  const [isBackendOffline, setIsBackendOffline] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(true);
  const isRefreshing = useRef(false);
  const failCountRef = useRef(0);

  // Background Health Check (Ping)
  useEffect(() => {
    let checkCount = 0;
    const checkHealth = async () => {
      checkCount++;
      const start = Date.now();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const res = await fetch(`${API_BASE_URL}/api/`, {
          method: "GET",
          cache: "no-store",
          headers: {
            "ngrok-skip-browser-warning": "69420",
          },
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        const latency = Date.now() - start;

        const isOfflineResponse = false; // Ignore status codes, only care about network failure in catch
        if (latency > 15000) { // Relaxed to 15s for slower local DB startup

          failCountRef.current++;
        } else {
          failCountRef.current = 0;
          setIsBackendOffline(false);
        }

        // Only mark offline if it fails 5 times in a row (Softer threshold)
        if (failCountRef.current >= 5) {
          setIsBackendOffline(true);
        }

      } catch (err: unknown) {
        failCountRef.current++;
        if (failCountRef.current >= 10) { // Relaxed threshold

          setIsBackendOffline(true);
        }
      }
    };

    checkHealth(); // Immediate check
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 1. First, try to restore auth session
        await checkAuth();

        // 2. Then, fetch global config
        const res = await fetch(`${API_BASE_URL}/api/config`, {
          headers: {
            "ngrok-skip-browser-warning": "69420",
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.GOOGLE_CLIENT_ID) {
            setGoogleClientId(data.GOOGLE_CLIENT_ID);
          }
          if (data.MAINTENANCE_MODE !== undefined) {
            setIsMaintenanceMode(data.MAINTENANCE_MODE);
          }
        } else {
          // Failure here doesn't mean offline, but it's a sign
          console.warn("API returned error for config, investigating health...");
        }
      } catch (err) {
        console.warn("Failed to initialize app correctly, setting offline status", err);
        setIsBackendOffline(true);
      } finally {
        // Guarantee at least 3 seconds of splash screen for a smoother experience
        setTimeout(() => {
          setIsInitialLoading(false);
        }, 3000);
      }
    };
    initializeApp();
  }, []); // Run ONLY once on mount to avoid infinite loops

  const applyToken = useCallback((decoded: {
    sub: string;
    name: string;
    email: string;
    avatar: string;
    phone: string;
    role?: "user" | "company";
    companyId?: string | number;
    company_id?: string | number;
    companyName?: string;
    company_name?: string;
    location?: string;
    description?: string;
    notificationPreferences?: { applications: boolean; jobs: boolean; recs: boolean };
    notification_preferences?: { applications: boolean; jobs: boolean; recs: boolean };
    bio?: string;
    skills?: string[];
    experiences?: ExperienceItem[];
    educations?: EducationItem[];
    portfolios?: string[];
    socialLinks?: {
      instagram?: string;
      twitter?: string;
      website?: string;
      linkedin?: string;
    };
    languages?: string[];
    dob?: string;
    gender?: string;
    classification?: string;
    banner?: string;
    deletionRequestedAt?: string;
  }) => {
    setUser({
      id: decoded.sub || (decoded as any)["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"],
      name: decoded.name,
      email: decoded.email,
      avatar: decoded.avatar,
      avatarUrl: decoded.avatar,
      phone: decoded.phone,
      role: decoded.role,
      companyId: decoded.companyId || decoded.company_id,
      companyName: decoded.companyName || decoded.company_name,
      location: decoded.location,
      description: decoded.description,
      notificationPreferences: decoded.notificationPreferences || decoded.notification_preferences,
      bio: decoded.bio,
      skills: decoded.skills,
      experiences: decoded.experiences,
      educations: decoded.educations,
      portfolios: decoded.portfolios,
      socialLinks: decoded.socialLinks,
      languages: decoded.languages,
      dob: decoded.dob,
      gender: decoded.gender,
      classification: decoded.classification,
      banner_url: decoded.banner,
      deletionRequestedAt: decoded.deletionRequestedAt,
    });
    const rawRole = (decoded as any).role || (decoded as any)["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
    const finalRole = rawRole === "student" ? "user" : (rawRole || "user");
    setRole(finalRole as "user" | "company");
    setIsAuthenticated(true);
  }, []);

  const updateUser = useCallback((newData: Partial<AuthUser>) => {
    setUser((prev) => (prev ? { ...prev, ...newData } : null));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
    setRole(null);
    setIsAuthenticated(false);
    window.dispatchEvent(new Event("auth-changed"));
  }, []);

  const refreshToken = useCallback(async (currentToken: string): Promise<boolean> => {
    if (isRefreshing.current) return false;
    isRefreshing.current = true;
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/refresh-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
          "ngrok-skip-browser-warning": "69420",
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.access_token) {
          localStorage.setItem("token", data.access_token);
          const decoded = jwtDecode(data.access_token) as any;
          applyToken(decoded);
          console.log("🔄 Token refreshed successfully");
          return true;
        }
      }
      return false;
    } catch {
      return false;
    } finally {
      isRefreshing.current = false;
    }
  }, [applyToken]);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token) as {
          exp?: number;
          sub: string;
          name: string;
          email: string;
          avatar: string;
          phone: string;
          role?: "user" | "company";
        };

        // Check if token is expired
        if (decoded.exp) {
          const expiresAt = decoded.exp * 1000;
          const now = Date.now();

          if (expiresAt < now) {
            // Token is expired — try to refresh
            console.log("⏰ Token expired, attempting refresh...");
            const refreshed = await refreshToken(token);
            if (!refreshed) {
              console.log("❌ Could not refresh token, logging out");
              logout();
              return;
            }
            return; // applyToken was already called in refreshToken
          }

          // Token is valid but close to expiry — proactively refresh
          if (expiresAt - now < REFRESH_THRESHOLD_MS) {
            console.log("⚡ Token near expiry, refreshing proactively...");
            refreshToken(token); // fire-and-forget
          }
        }

        applyToken(decoded);
      } catch (error) {
        console.error("Failed to decode token", error);
        logout();
      }
    } else {
      setUser(null);
      setRole(null);
      setIsAuthenticated(false);
    }
  }, [logout, applyToken, refreshToken]);

  // Keep a ref to checkAuth so the event listener effect doesn't re-run
  const checkAuthRef = useRef(checkAuth);
  checkAuthRef.current = checkAuth;

  useEffect(() => {
    checkAuthRef.current();

    const handleAuthChange = () => checkAuthRef.current();
    window.addEventListener("auth-changed", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);

    return () => {
      window.removeEventListener("auth-changed", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, []); // Empty deps — runs once, uses ref for latest checkAuth

  const login = useCallback((token: string) => {
    localStorage.setItem("token", token);
    window.dispatchEvent(new Event("auth-changed"));
  }, []);

  const apiFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const token = localStorage.getItem("token");
      const headers = new Headers(options.headers);

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      } else {

      }

      console.log(`📡 [apiFetch] Requesting: ${url}`, {
        hasToken: !!token,
        method: options.method || 'GET'
      });

      try {
        headers.set("ngrok-skip-browser-warning", "69420");

        const response = await fetch(url, {
          ...options,
          headers,
          mode: 'cors',
        });

        console.log(`✅ [apiFetch] Response: ${response.status} ${response.statusText} for ${url}`);

        if (!response.ok) {
          const clonedRes = response.clone();
          try {
            const errorBody = await clonedRes.text();
            console.error(`❌ [apiFetch] Error Body for ${url}:`, errorBody);
          } catch (e) {
            console.error(`❌ [apiFetch] Could not read error body for ${url}`);
          }
        }

        if (response.status === 401) {
          console.warn("🔐 Auth failed (401). Logging out...");
          logout();
        }

        return response;
      } catch (error) {
        console.error(`❌ [apiFetch] Fetch FAILED for ${url}:`, error);
        throw error;
      }
    },
    [logout]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        login,
        logout,
        googleClientId,
        apiFetch,
        updateUser,
        isBackendOffline,
        isInitialLoading,
        isMaintenanceMode,
        setIsMaintenanceMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useJobitoAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useJobitoAuth must be used within an AuthProvider");
  }
  return context;
};
