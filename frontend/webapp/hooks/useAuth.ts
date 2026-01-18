import { useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../lib/auth';
import { tokenManager } from '../lib/client';
import { ViewState } from '../types';

/**
 * Main authentication hook that provides user state and auth methods.
 * Initializes auth state on mount by checking for existing tokens.
 */
export function useAuth() {
  const { user, isAuthenticated, isLoading, setUser, setIsLoading, login, logout, updateUser } =
    useAuthStore();

  useEffect(() => {
    const initAuth = async () => {
      const tokens = tokenManager.getTokens();
      if (tokens.accessToken) {
        try {
          const currentUser = await authApi.getCurrentUser();
          setUser(currentUser);
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [setUser, setIsLoading, logout]);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateUser,
    isPro: user?.plan === 'pro',
    isAdmin: user?.role === 'admin',
  };
}

/**
 * Hook that checks authentication status and returns redirect information.
 * Unlike React Router version, this returns shouldRedirect and targetView
 * for the parent component to handle navigation via ViewState.
 */
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuthStore();

  return {
    isLoading,
    isAuthenticated,
    shouldRedirect: !isLoading && !isAuthenticated,
    targetView: ViewState.LOGIN,
  };
}

/**
 * Hook that checks Pro plan status and returns redirect information.
 * Returns shouldRedirect and targetView for parent component navigation.
 */
export function useRequirePro() {
  const { user, isLoading } = useAuthStore();
  const isPro = user?.plan === 'pro';

  return {
    isLoading,
    isPro,
    shouldRedirect: !isLoading && user && !isPro,
    targetView: ViewState.UPGRADE,
  };
}

/**
 * Hook that provides a navigation callback for use with ViewState.
 * This enables components to use a similar pattern to useNavigate.
 * @param setView - The state setter function for ViewState
 */
export function useNavigation(setView: (view: ViewState) => void) {
  const navigate = useCallback(
    (view: ViewState) => {
      setView(view);
    },
    [setView]
  );

  return { navigate };
}
