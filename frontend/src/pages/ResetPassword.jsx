import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import Button from "../components/common/Button";
import Loading from "../components/common/Loading";
import { Lock, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import { getPasswordStrength } from "../utils/validators";
import toast from "react-hot-toast";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { logout, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const passwordStrength = formData.password
    ? getPasswordStrength(formData.password)
    : null;

  useEffect(() => {
    // Token validation could be done here if API supports it
    // For now, we'll validate when submitting
    setValidating(false);
    setTokenValid(true);
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    try {
      setLoading(true);
      await api.post(`/auth/reset-password/${token}`, {
        password: formData.password,
      });

      // Log out the user if they are currently logged in
      if (isAuthenticated) {
        // Clear local storage directly to avoid redirect issues
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
      }

      setSuccess(true);
      toast.success(
        "Password reset successfully! Please log in with your new password."
      );
    } catch (error) {
      if (error.response?.status === 400) {
        setTokenValid(false);
      }
      toast.error(error.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return <Loading fullscreen text="Validating reset link..." />;
  }

  if (!tokenValid) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="max-w-md w-full card text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Invalid or Expired Link</h2>
          <p className="text-gray-600 mb-6">
            This password reset link is invalid or has expired. Please request a
            new one.
          </p>
          <Link to="/forgot-password">
            <Button variant="primary" className="w-full">
              Request New Link
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="max-w-md w-full card text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Password Reset!</h2>
          <p className="text-gray-600 mb-6">
            Your password has been successfully reset. You can now log in with
            your new password.
          </p>
          <Link to="/login">
            <Button variant="primary" className="w-full">
              Go to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Set New Password</h2>
          <p className="text-gray-600 mt-2">
            Create a strong password for your account
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="input pl-10 pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Password strength indicator */}
              {passwordStrength && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">
                      Password strength:
                    </span>
                    <span
                      className={`text-xs font-medium text-${passwordStrength.color}-600`}
                    >
                      {passwordStrength.text}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-${passwordStrength.color}-500 transition-all duration-300`}
                      style={{
                        width: `${
                          passwordStrength.level === "weak"
                            ? 33
                            : passwordStrength.level === "medium"
                            ? 66
                            : 100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="input pl-10"
                  placeholder="••••••••"
                  required
                />
              </div>
              {formData.confirmPassword &&
                formData.password !== formData.confirmPassword && (
                  <p className="text-sm text-red-600 mt-1">
                    Passwords do not match
                  </p>
                )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="large"
              loading={loading}
              className="w-full"
              disabled={formData.password !== formData.confirmPassword}
            >
              Reset Password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
