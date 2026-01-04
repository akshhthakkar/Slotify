import { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";
import toast from "react-hot-toast";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("accessToken");
      const savedUser = localStorage.getItem("user");

      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          setIsAuthenticated(true);

          // Verify token is still valid
          const response = await api.get("/auth/me");
          setUser(response.data.user);
          localStorage.setItem("user", JSON.stringify(response.data.user));
        } catch (error) {
          // Token invalid, clear auth
          logout();
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  // Register
  const register = async (userData) => {
    try {
      const response = await api.post("/auth/register", userData);
      const { accessToken, user: registeredUser } = response.data;

      // Auto-login if accessToken is provided
      if (accessToken && registeredUser) {
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("user", JSON.stringify(registeredUser));
        setUser(registeredUser);
        setIsAuthenticated(true);
      }

      toast.success(response.data.message || "Registration successful!");
      return { success: true, user: registeredUser, data: response.data };
    } catch (error) {
      const message = error.response?.data?.message || "Registration failed";
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Login
  const login = async (email, password) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      const { accessToken, user: userData } = response.data;

      // Save to localStorage
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("user", JSON.stringify(userData));

      // Update state
      setUser(userData);
      setIsAuthenticated(true);

      toast.success("Login successful!");
      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.message || "Login failed";
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Google Login
  const googleLogin = () => {
    window.location.href = `${
      import.meta.env.VITE_API_URL || "http://localhost:5000/api"
    }/auth/google`;
  };

  // Logout
  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      setUser(null);
      setIsAuthenticated(false);
      toast.success("Logged out successfully");
    }
  };

  // Update user (also sets authenticated state for OAuth flows)
  const updateUser = (userData) => {
    setUser(userData);
    if (userData) {
      setIsAuthenticated(true);
      localStorage.setItem("user", JSON.stringify(userData));
    }
  };

  // Check if user has role
  const hasRole = (role) => {
    return user?.role === role;
  };

  // Check if user has any of the roles
  const hasAnyRole = (...roles) => {
    return roles.includes(user?.role);
  };

  // Check if email is verified
  const isEmailVerified = user?.emailVerified === true;

  // Resend verification email
  const resendVerificationEmail = async () => {
    try {
      await api.post("/auth/resend-verification", { email: user?.email });
      toast.success("Verification email sent! Check your inbox.");
      return { success: true };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to send verification email";
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    isEmailVerified,
    register,
    login,
    googleLogin,
    logout,
    updateUser,
    hasRole,
    hasAnyRole,
    resendVerificationEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
