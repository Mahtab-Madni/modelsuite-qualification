import { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);

const getStoredUser = () => {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem("user"); 
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    if (!parsed?.token) {
      window.localStorage.removeItem("user");
      return null;
    }

    const payload = parsed.token.split(".")[1];
    if (!payload) {
      window.localStorage.removeItem("user");
      return null;
    }

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(window.atob(normalized));

    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      window.localStorage.removeItem("user");
      return null;
    }

    return parsed;
  } catch {
    window.localStorage.removeItem("user");
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  // Initialize the user state with the stored user data from localStorage
  const [user, setUser] = useState(() => getStoredUser());

  // The login function saves the user data to localStorage and updates the context state.
  const login = (userData) => {
    if (!userData?.token) {
      return;
    }
    window.localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  // The logout function clears the user data from localStorage and updates the context state.
  const logout = () => {
    window.localStorage.removeItem("user");
    window.sessionStorage.clear();
    setUser(null);
  };

  // We only want to update the context value when the user changes, not on every render.
  // This optimization prevents unnecessary re-renders of components that consume the AuthContext.
  const value = useMemo(() => ({ user, login, logout }), [user]);

  return <AuthContext.Provider value={value}>
    {children}
    </AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
