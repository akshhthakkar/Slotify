import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loading from "../components/common/Loading";
import toast from "react-hot-toast";
import api from "../utils/api";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { updateUser } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get("token");
      const error = searchParams.get("error");

      if (error) {
        toast.error("Google authentication failed. Please try again.");
        navigate("/login");
        return;
      }

      if (token) {
        try {
          // Save token to localStorage
          localStorage.setItem("accessToken", token);

          // Fetch user data with the new token
          const response = await api.get("/auth/me");
          const userData = response.data.user;

          // Save user to localStorage and update context
          localStorage.setItem("user", JSON.stringify(userData));
          updateUser(userData);

          toast.success("Login successful!");

          // Redirect based on role
          if (userData.role === "admin") {
            navigate("/admin/dashboard");
          } else {
            navigate("/dashboard");
          }
        } catch (err) {
          console.error("Auth callback error:", err);
          toast.error("Failed to complete authentication");
          localStorage.removeItem("accessToken");
          navigate("/login");
        }
      } else {
        navigate("/login");
      }
    };

    handleCallback();
  }, [searchParams, navigate, updateUser]);

  return <Loading fullscreen text="Completing sign in..." />;
};

export default AuthCallback;
