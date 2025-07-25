export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  subscription?: any;
  createdAt: string;
}

export interface AuthUser extends User {
  loggedIn: boolean;
  token?: string;
}

class AuthClient {
  private static instance: AuthClient;
  private user: AuthUser | null = null;

  private constructor() {
    // Initialize user from localStorage if available
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("zenith_user");
      if (storedUser) {
        try {
          this.user = JSON.parse(storedUser);
        } catch (error) {
          console.error("Failed to parse stored user:", error);
          this.logout();
        }
      }
    }
  }

  static getInstance(): AuthClient {
    if (!AuthClient.instance) {
      AuthClient.instance = new AuthClient();
    }
    return AuthClient.instance;
  }

  async login(email: string, password: string): Promise<AuthUser> {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Login failed");
    }

    const authUser: AuthUser = {
      ...data.user,
      loggedIn: true,
      token: data.token,
    };

    this.user = authUser;
    localStorage.setItem("zenith_user", JSON.stringify(authUser));

    return authUser;
  }

  async register(
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ): Promise<AuthUser> {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, firstName, lastName }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Registration failed");
    }

    const authUser: AuthUser = {
      ...data.user,
      loggedIn: true,
      token: data.token,
    };

    this.user = authUser;
    localStorage.setItem("zenith_user", JSON.stringify(authUser));

    return authUser;
  }

  async logout(): Promise<void> {
    try {
      // Call logout API to clear server-side session
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.error("Logout API call failed:", error);
    }

    // Clear local storage and state
    this.user = null;
    localStorage.removeItem("zenith_user");
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    if (!this.user?.token) {
      return null;
    }

    try {
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${this.user.token}`,
        },
      });

      if (!response.ok) {
        // Token is invalid, logout user
        await this.logout();
        return null;
      }

      const data = await response.json();
      const updatedUser: AuthUser = {
        ...data.user,
        loggedIn: true,
        token: this.user.token,
      };

      this.user = updatedUser;
      localStorage.setItem("zenith_user", JSON.stringify(updatedUser));

      return updatedUser;
    } catch (error) {
      console.error("Failed to get current user:", error);
      await this.logout();
      return null;
    }
  }

  getUser(): AuthUser | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return !!this.user?.loggedIn && !!this.user?.token;
  }

  getToken(): string | null {
    return this.user?.token || null;
  }

  // Utility method for making authenticated API calls
  async authenticatedFetch(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const token = this.getToken();

    if (!token) {
      throw new Error("No authentication token available");
    }

    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Method to refresh subscription data
  async refreshSubscription(): Promise<AuthUser | null> {
    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await this.authenticatedFetch(
        "/api/auth/refresh-subscription",
        {
          method: "POST",
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error("Failed to refresh subscription");
      }

      const data = await response.json();
      const updatedUser: AuthUser = {
        ...data.user,
        loggedIn: true,
        token: this.user?.token,
      };

      this.user = updatedUser;
      localStorage.setItem("zenith_user", JSON.stringify(updatedUser));

      return updatedUser;
    } catch (error) {
      console.error("Failed to refresh subscription:", error);
      return null;
    }
  }
}

export const authClient = AuthClient.getInstance();
