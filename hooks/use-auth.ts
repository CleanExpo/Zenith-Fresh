import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authClient, type AuthUser } from "@/lib/auth-client";

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const currentUser = authClient.getUser();
        if (currentUser) {
          // Verify token is still valid
          const verifiedUser = await authClient.getCurrentUser();
          setUser(verifiedUser);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const user = await authClient.login(email, password);
      setUser(user);
      return user;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(
    async (
      email: string,
      password: string,
      firstName?: string,
      lastName?: string
    ) => {
      setLoading(true);
      try {
        const user = await authClient.register(
          email,
          password,
          firstName,
          lastName
        );
        setUser(user);
        return user;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await authClient.logout();
      setUser(null);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await authClient.getCurrentUser();
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      console.error("Failed to refresh user:", error);
      setUser(null);
      return null;
    }
  }, []);

  const refreshSubscription = useCallback(async () => {
    try {
      const updatedUser = await authClient.refreshSubscription();
      if (updatedUser) {
        setUser(updatedUser);
        return updatedUser;
      }
      return null;
    } catch (error) {
      console.error("Failed to refresh subscription:", error);
      return null;
    }
  }, []);

  return {
    user,
    loading,
    isAuthenticated: !!user?.loggedIn,
    login,
    register,
    logout,
    refreshUser,
    refreshSubscription,
  };
}
