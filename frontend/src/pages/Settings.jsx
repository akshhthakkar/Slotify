import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import toast from "react-hot-toast";
import EmailVerificationBanner from "../components/common/EmailVerificationBanner";
import Button from "../components/common/Button";
import {
  User,
  Mail,
  Shield,
  Bell,
  Calendar,
  Lock,
  FileText,
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Settings as SettingsIcon,
  Building,
  Headphones,
  ArrowRight,
} from "lucide-react";

const Settings = () => {
  const { user, isEmailVerified, resendVerificationEmail, updateUser } =
    useAuth();
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [notifications, setNotifications] = useState({
    emailBookingConfirmation: true,
    email24hReminder: true,
    email2hReminder: true,
    emailCancellation: true,
    inAppRealtime: true,
    inAppReminders: true,
  });
  const [defaultBookingNotes, setDefaultBookingNotes] = useState(
    user?.defaultBookingNotes || ""
  );

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

  const handleResendVerification = async () => {
    if (cooldown > 0) return;

    try {
      setResendLoading(true);
      const result = await resendVerificationEmail();
      if (result.success) {
        localStorage.setItem(
          "lastVerificationEmailSent",
          Date.now().toString()
        );
        setCooldown(60);
      }
    } finally {
      setResendLoading(false);
    }
  };

  const handleNotificationChange = async (key) => {
    const newValue = !notifications[key];
    setNotifications((prev) => ({ ...prev, [key]: newValue }));

    // Save to backend
    try {
      await api.put("/users/settings", {
        notificationPreferences: {
          ...notifications,
          [key]: newValue,
        },
      });
      toast.success("Preferences updated");
    } catch (error) {
      // Revert on error
      setNotifications((prev) => ({ ...prev, [key]: !newValue }));
      toast.error("Failed to update preferences");
    }
  };

  const saveBookingPreferences = async () => {
    try {
      setLoading(true);
      await api.put("/users/settings", {
        defaultBookingNotes,
      });
      toast.success("Preferences saved");
    } catch (error) {
      toast.error("Failed to save preferences");
    } finally {
      setLoading(false);
    }
  };

  const formatMemberSince = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  return (
    <>
      <EmailVerificationBanner />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <SettingsIcon className="w-8 h-8" />
            Settings
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your account, notifications, and preferences
          </p>
        </div>

        <div className="space-y-6">
          {/* Account & Access Section */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold">Account & Access</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{user?.email}</span>
                  {isEmailVerified ? (
                    <span className="badge badge-success flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Verified
                    </span>
                  ) : (
                    <span className="badge badge-danger flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> Not Verified
                    </span>
                  )}
                </div>
                {!isEmailVerified && (
                  <button
                    onClick={handleResendVerification}
                    disabled={resendLoading || cooldown > 0}
                    className="mt-2 text-sm text-primary-600 hover:text-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    {resendLoading ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3" />
                    )}
                    {cooldown > 0
                      ? `Resend in ${cooldown}s`
                      : "Resend verification email"}
                  </button>
                )}
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900 capitalize">
                    {user?.role || "Customer"}
                  </span>
                </div>
              </div>

              {/* Member Since */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Member Since
                </label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">
                    {formatMemberSince(user?.createdAt)}
                  </span>
                </div>
              </div>

              {/* Account Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Status
                </label>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-gray-400" />
                  <span className="badge badge-success">Active</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <Link to="/profile">
                <Button variant="outline">
                  <User className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </Link>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Bell className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold">Notification Settings</h2>
            </div>

            <div className="space-y-6">
              {/* Email Notifications */}
              <div>
                <h3 className="font-medium text-gray-900 mb-4">
                  Email Notifications
                </h3>
                <div className="space-y-3">
                  {[
                    {
                      key: "emailBookingConfirmation",
                      label: "Booking confirmations",
                    },
                    { key: "email24hReminder", label: "24-hour reminders" },
                    { key: "email2hReminder", label: "2-hour reminders" },
                    { key: "emailCancellation", label: "Cancellation notices" },
                  ].map(({ key, label }) => (
                    <label
                      key={key}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <span className="text-gray-700">{label}</span>
                      <button
                        onClick={() => handleNotificationChange(key)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          notifications[key] ? "bg-primary-600" : "bg-gray-200"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            notifications[key]
                              ? "translate-x-6"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                    </label>
                  ))}
                </div>
              </div>

              {/* In-App Notifications */}
              <div>
                <h3 className="font-medium text-gray-900 mb-4">
                  In-App Notifications
                </h3>
                <div className="space-y-3">
                  {[
                    { key: "inAppRealtime", label: "Real-time updates" },
                    { key: "inAppReminders", label: "Appointment reminders" },
                  ].map(({ key, label }) => (
                    <label
                      key={key}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <span className="text-gray-700">{label}</span>
                      <button
                        onClick={() => handleNotificationChange(key)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          notifications[key] ? "bg-primary-600" : "bg-gray-200"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            notifications[key]
                              ? "translate-x-6"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Booking Preferences - Only for Customers */}
          {user?.role === "customer" && (
            <div className="card">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold">Booking Preferences</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Booking Notes
                  </label>
                  <p className="text-sm text-gray-500 mb-2">
                    These notes will be pre-filled when you book appointments.
                  </p>
                  <textarea
                    value={defaultBookingNotes}
                    onChange={(e) => setDefaultBookingNotes(e.target.value)}
                    placeholder="E.g., I prefer a quiet environment, I have allergies to..."
                    rows="3"
                    maxLength={500}
                    className="input w-full"
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">
                    {defaultBookingNotes.length}/500 characters
                  </p>
                </div>

                <div className="pt-2">
                  <Button
                    variant="primary"
                    onClick={saveBookingPreferences}
                    loading={loading}
                  >
                    Save Preferences
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Privacy & Data */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Lock className="w-5 h-5 text-orange-600" />
              </div>
              <h2 className="text-xl font-semibold">Privacy & Data</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">Privacy Policy</span>
                </div>
                <Link
                  to="/privacy"
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  View
                </Link>
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">Terms of Service</span>
                </div>
                <Link
                  to="/terms"
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  View
                </Link>
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-3">
                  <Download className="w-5 h-5 text-gray-400" />
                  <div>
                    <span className="text-gray-700">Download My Data</span>
                    <p className="text-sm text-gray-500">
                      Get a copy of all your data
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="small" disabled>
                  Coming Soon
                </Button>
              </div>

              {/* Danger Zone */}
              <div className="mt-6 pt-6 border-t border-red-200 bg-red-50 -mx-6 -mb-6 px-6 py-6 rounded-b-lg">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <h3 className="font-semibold text-red-900">Danger Zone</h3>
                </div>
                <p className="text-sm text-red-700 mb-4">
                  Once you deactivate your account, there is no going back.
                  Please be certain.
                </p>
                <Button variant="danger" size="small" disabled>
                  Deactivate Account
                </Button>
              </div>
            </div>
          </div>
          {/* Setup Business - Only show for customers without a business */}
          {user?.role === "customer" && !user?.business && (
            <div className="card bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary-600 rounded-lg">
                  <Building className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-dark-900">
                  Setup Your Business
                </h2>
              </div>
              <p className="text-dark-600 mb-4">
                Have a service-based business? Set up your business profile on
                Slotify to start accepting bookings from customers.
              </p>
              <Link to="/business-onboarding">
                <Button variant="primary">
                  <Building className="w-4 h-4 mr-2" />
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          )}

          {/* Support Section */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-teal-100 rounded-lg">
                <Headphones className="w-5 h-5 text-teal-600" />
              </div>
              <h2 className="text-xl font-semibold">Help & Support</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-3">
                  <Headphones className="w-5 h-5 text-gray-400" />
                  <div>
                    <span className="text-gray-700">Contact Support</span>
                    <p className="text-sm text-gray-500">
                      Get help with your account or bookings
                    </p>
                  </div>
                </div>
                <Link
                  to="/support"
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  Get Help
                </Link>
              </div>

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <span className="text-gray-700">Email Us</span>
                    <p className="text-sm text-gray-500">
                      slotifyappointments@gmail.com
                    </p>
                  </div>
                </div>
                <a
                  href="mailto:slotifyappointments@gmail.com"
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  Send Email
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Settings;
