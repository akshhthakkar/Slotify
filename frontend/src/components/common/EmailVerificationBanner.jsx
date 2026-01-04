import { useAuth } from "../../context/AuthContext";
import { Mail, X, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

const EmailVerificationBanner = () => {
  const { user, isAuthenticated, isEmailVerified, resendVerificationEmail } =
    useAuth();
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Check localStorage for cooldown on mount
  useEffect(() => {
    const lastSent = localStorage.getItem("lastVerificationEmailSent");
    if (lastSent) {
      const elapsed = Math.floor((Date.now() - parseInt(lastSent)) / 1000);
      const remaining = Math.max(0, 60 - elapsed);
      if (remaining > 0) {
        setCooldown(remaining);
      }
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const { pathname } = useLocation();

  // Public/marketing pages where banner shouldn't appear
  const isPublicPage = [
    "/",
    "/about",
    "/contact",
    "/features",
    "/how-it-works",
    "/privacy",
    "/terms",
    "/cookies",
    "/support",
  ].includes(pathname);

  // Don't show if:
  // 1. Not authenticated
  // 2. Already verified
  // 3. Temporarily dismissed
  // 4. On a public marketing page
  if (!isAuthenticated || isEmailVerified || dismissed || isPublicPage) {
    return null;
  }

  const handleResend = async () => {
    if (cooldown > 0) return;

    try {
      setLoading(true);
      const result = await resendVerificationEmail();
      if (result.success) {
        localStorage.setItem(
          "lastVerificationEmailSent",
          Date.now().toString()
        );
        setCooldown(60);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-yellow-50 border-b border-yellow-200">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              <span className="font-medium">
                Please verify your email to book appointments.
              </span>{" "}
              Check your inbox for the verification link.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResend}
              disabled={loading || cooldown > 0}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-yellow-800 bg-yellow-100 hover:bg-yellow-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-1" />
              )}
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Email"}
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="p-1 text-yellow-600 hover:text-yellow-800"
              title="Dismiss temporarily"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
