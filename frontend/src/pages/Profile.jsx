import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import Button from "../components/common/Button";
import {
  User,
  Mail,
  Phone,
  Bell,
  Shield,
  RefreshCw,
  CheckCircle,
  Camera,
} from "lucide-react";
import toast from "react-hot-toast";

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [sendingResetEmail, setSendingResetEmail] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    countryCode: "+91",
  });
  const [notificationPreferences, setNotificationPreferences] = useState({
    email: user?.notificationPreferences?.email ?? true,
    inApp: user?.notificationPreferences?.inApp ?? true,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await api.put("/users/profile", formData);
      updateUser(response.data.user);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    try {
      setUploadingPhoto(true);

      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const response = await api.post("/users/profile/photo", {
            image: reader.result,
          });
          updateUser(response.data.user);
          toast.success("Profile picture updated successfully");
        } catch (error) {
          toast.error(
            error.response?.data?.message || "Failed to upload photo"
          );
        } finally {
          setUploadingPhoto(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Failed to process image");
      setUploadingPhoto(false);
    }
  };

  const handlePasswordReset = async () => {
    try {
      setSendingResetEmail(true);
      await api.post("/auth/forgot-password", { email: user.email });
      toast.success(
        "Password reset link sent to your email! Link expires in 30 minutes."
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to send reset email"
      );
    } finally {
      setSendingResetEmail(false);
    }
  };

  const handleNotificationUpdate = async (type) => {
    try {
      const newPrefs = {
        ...notificationPreferences,
        [type]: !notificationPreferences[type],
      };
      setNotificationPreferences(newPrefs);

      await api.put("/users/settings", {
        notificationPreferences: newPrefs,
      });
      toast.success("Notification preferences updated");
    } catch (error) {
      toast.error("Failed to update preferences");
      setNotificationPreferences(notificationPreferences);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Picture */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <User className="w-5 h-5 mr-2" />
            Profile Picture
          </h2>
          <div className="flex items-center gap-6">
            <div className="relative">
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.name}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-3xl font-bold text-primary-600">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              {uploadingPhoto && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Upload a new profile picture (max 5MB)
              </p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoChange}
                accept="image/*"
                className="hidden"
              />
              <Button
                variant="outline"
                size="small"
                onClick={() => fileInputRef.current?.click()}
                loading={uploadingPhoto}
              >
                <Camera className="w-4 h-4 mr-1" />
                Change Photo
              </Button>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Mail className="w-5 h-5 mr-2" />
            Personal Information
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={user?.email}
                disabled
                className="input bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Email cannot be changed
              </p>
            </div>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Country Code
                </label>
                <input
                  type="text"
                  value="+91"
                  disabled
                  className="input bg-gray-100 cursor-not-allowed"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="input"
                  placeholder="Phone number"
                />
              </div>
            </div>
            <Button type="submit" variant="primary" loading={loading}>
              Save Changes
            </Button>
          </form>
        </div>

        {/* Notification Preferences */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Notification Preferences
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-gray-600">
                  Receive appointment reminders via email
                </p>
              </div>
              <button
                onClick={() => handleNotificationUpdate("email")}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notificationPreferences.email
                    ? "bg-primary-600"
                    : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notificationPreferences.email
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">In-App Notifications</p>
                <p className="text-sm text-gray-600">
                  Receive notifications within the app
                </p>
              </div>
              <button
                onClick={() => handleNotificationUpdate("inApp")}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notificationPreferences.inApp
                    ? "bg-primary-600"
                    : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notificationPreferences.inApp
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Account Security */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Account Security
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="font-medium">Password</p>
                <p className="text-sm text-gray-600">
                  {user?.authProvider === "google"
                    ? "You signed up with Google"
                    : "Reset your password via email"}
                </p>
              </div>
              {user?.authProvider !== "google" && (
                <Button
                  variant="outline"
                  size="small"
                  onClick={handlePasswordReset}
                  loading={sendingResetEmail}
                >
                  <Mail className="w-4 h-4 mr-1" />
                  Send Reset Link
                </Button>
              )}
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">Email Verification</p>
                <p className="text-sm text-gray-600">
                  {user?.emailVerified
                    ? "Your email is verified - you can book appointments"
                    : "Please verify your email to book appointments"}
                </p>
              </div>
              {user?.emailVerified ? (
                <span className="flex items-center text-green-600 text-sm font-medium">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Verified
                </span>
              ) : (
                <Button
                  variant="outline"
                  size="small"
                  loading={resendingVerification}
                  onClick={async () => {
                    try {
                      setResendingVerification(true);
                      await api.post("/auth/resend-verification", {
                        email: user.email,
                      });
                      toast.success(
                        "Verification email sent! Check your inbox."
                      );
                    } catch (error) {
                      toast.error(
                        error.response?.data?.message || "Failed to send email"
                      );
                    } finally {
                      setResendingVerification(false);
                    }
                  }}
                >
                  <RefreshCw
                    className={`w-4 h-4 mr-1 ${
                      resendingVerification ? "animate-spin" : ""
                    }`}
                  />
                  Resend Email
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
