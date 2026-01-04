import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import Loading from "../components/common/Loading";
import Button from "../components/common/Button";
import {
  Settings,
  Clock,
  Calendar,
  Image,
  Store,
  Save,
  ShieldCheck,
  UploadCloud,
  FileText,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";

const BusinessSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [business, setBusiness] = useState(null);
  const [activeTab, setActiveTab] = useState("general");

  const [formData, setFormData] = useState({
    name: "",
    tagline: "",
    description: "",
    contactEmail: "",
    contactPhone: "",
    website: "",
  });

  const [bookingSettings, setBookingSettings] = useState({
    minAdvanceTime: 1,
    maxAdvanceTime: 90,
    cancellationWindow: 24,
    rescheduleWindow: 24,
    maxReschedulesPerAppointment: 2,
    allowWalkIns: true,
  });

  const [verificationFile, setVerificationFile] = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const [workingHours, setWorkingHours] = useState({
    monday: { isOpen: true, slots: [{ start: "09:00", end: "17:00" }] },
    tuesday: { isOpen: true, slots: [{ start: "09:00", end: "17:00" }] },
    wednesday: { isOpen: true, slots: [{ start: "09:00", end: "17:00" }] },
    thursday: { isOpen: true, slots: [{ start: "09:00", end: "17:00" }] },
    friday: { isOpen: true, slots: [{ start: "09:00", end: "17:00" }] },
    saturday: { isOpen: false, slots: [] },
    sunday: { isOpen: false, slots: [] },
  });

  const toggleDayOpen = (day) => {
    setWorkingHours((prev) => {
      const isOpen = !prev[day].isOpen;
      return {
        ...prev,
        [day]: {
          ...prev[day],
          isOpen,
          slots:
            isOpen && prev[day].slots.length === 0
              ? [{ start: "09:00", end: "17:00" }]
              : prev[day].slots,
        },
      };
    });
  };

  const updateSlot = (day, index, field, value) => {
    setWorkingHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.map((slot, i) =>
          i === index ? { ...slot, [field]: value } : slot
        ),
      },
    }));
  };

  const tabs = [
    { id: "general", label: "General", icon: Store },
    { id: "booking", label: "Booking Policies", icon: Calendar },
    { id: "hours", label: "Working Hours", icon: Clock },
    { id: "verification", label: "Verification", icon: ShieldCheck },
  ];

  useEffect(() => {
    fetchBusiness();
  }, []);

  const fetchBusiness = async () => {
    try {
      setLoading(true);

      // Get businessId from user context or localStorage
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;

      if (!user?.businessId) {
        setBusiness(null);
        setLoading(false);
        return;
      }

      // Handle both string and populated object
      const businessId = user.businessId._id || user.businessId;

      const response = await api.get(`/business/${businessId}`);
      const businessData = response.data.business;
      setBusiness(businessData);

      if (businessData) {
        setFormData({
          name: businessData.name || "",
          tagline: businessData.tagline || "",
          description: businessData.description || "",
          contactEmail: businessData.contactEmail || "",
          contactPhone: businessData.contactPhone || "",
          website: businessData.website || "",
        });
        setBookingSettings(businessData.bookingSettings || bookingSettings);
        if (businessData.workingHours) {
          setWorkingHours(businessData.workingHours);
        }
      }
    } catch (error) {
      console.error("Error loading business:", error);
      if (
        error.response &&
        (error.response.status === 404 || error.response.status === 403)
      ) {
        setBusiness(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGeneralSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.put(`/business/${business._id}`, formData);
      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.put(`/business/${business._id}/settings`, { bookingSettings });
      toast.success("Booking policies saved");
    } catch (error) {
      toast.error("Failed to save booking policies");
    } finally {
      setSaving(false);
    }
  };

  const handleHoursSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.put(`/business/${business._id}/hours`, { workingHours });
      toast.success("Working hours updated successfully");
      await fetchBusiness();
    } catch (error) {
      console.error("Error saving hours:", error);
      toast.error("Failed to update working hours");
    } finally {
      setSaving(false);
    }
  };

  const handleVerificationUpload = async (file, docType) => {
    try {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size should be less than 5MB");
        return;
      }

      setUploadingDoc(true);

      // Convert to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onloadend = async () => {
        try {
          const response = await api.post(`/business/${business._id}/images`, {
            image: reader.result,
            type: `document_${docType}`,
          });

          if (response.data.success) {
            toast.success(
              "Document uploaded successfully! Status is now pending review."
            );
            // Refresh business data to show updated status
            await fetchBusiness();
            setVerificationFile(null);
          }
        } catch (error) {
          console.error("Upload error:", error);
          toast.error(
            error.response?.data?.message || "Failed to upload document"
          );
        } finally {
          setUploadingDoc(false);
        }
      };
    } catch (error) {
      console.error("Error preparing upload:", error);
      toast.error("Failed to prepare upload");
      setUploadingDoc(false);
    }
  };

  if (loading) return <Loading fullscreen text="Loading settings..." />;

  if (!business) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Store className="w-20 h-20 text-gray-400 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          No Business Found
        </h1>
        <p className="text-gray-600 mb-8">
          You need to set up your business first.
        </p>
        <Link to="/business-onboarding">
          <Button variant="primary" size="large">
            Start Business Setup
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Business Settings</h1>
        <p className="text-gray-600 mt-1">Manage your business configuration</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="card p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary-50 text-primary-600"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* General Settings */}
          {activeTab === "general" && (
            <div className="card">
              <h2 className="text-xl font-bold mb-6">General Information</h2>
              <form onSubmit={handleGeneralSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Business Name
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Tagline
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.tagline}
                    onChange={(e) =>
                      setFormData({ ...formData, tagline: e.target.value })
                    }
                    placeholder="Short description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Description
                  </label>
                  <textarea
                    className="input"
                    rows="4"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      className="input"
                      value={formData.contactEmail}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contactEmail: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Contact Phone
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-600 text-sm">
                        +91
                      </span>
                      <input
                        type="tel"
                        className="input rounded-l-none"
                        value={formData.contactPhone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contactPhone: e.target.value,
                          })
                        }
                        placeholder="9876543210"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    className="input"
                    value={formData.website}
                    onChange={(e) =>
                      setFormData({ ...formData, website: e.target.value })
                    }
                    placeholder="https://your-website.com"
                  />
                </div>
                <Button type="submit" variant="primary" loading={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </form>
            </div>
          )}

          {/* Booking Policies */}
          {activeTab === "booking" && (
            <div className="card">
              <h2 className="text-xl font-bold mb-6">Booking Policies</h2>
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Min Advance Booking (hours)
                    </label>
                    <input
                      type="number"
                      className="input"
                      value={bookingSettings.minAdvanceTime}
                      onChange={(e) =>
                        setBookingSettings({
                          ...bookingSettings,
                          minAdvanceTime: parseInt(e.target.value),
                        })
                      }
                      min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      How far in advance must bookings be made
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Max Advance Booking (days)
                    </label>
                    <input
                      type="number"
                      className="input"
                      value={bookingSettings.maxAdvanceTime}
                      onChange={(e) =>
                        setBookingSettings({
                          ...bookingSettings,
                          maxAdvanceTime: parseInt(e.target.value),
                        })
                      }
                      min="1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      How far ahead can bookings be made
                    </p>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Cancellation Window (hours)
                    </label>
                    <input
                      type="number"
                      className="input"
                      value={bookingSettings.cancellationWindow}
                      onChange={(e) =>
                        setBookingSettings({
                          ...bookingSettings,
                          cancellationWindow: parseInt(e.target.value),
                        })
                      }
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Reschedule Window (hours)
                    </label>
                    <input
                      type="number"
                      className="input"
                      value={bookingSettings.rescheduleWindow}
                      onChange={(e) =>
                        setBookingSettings({
                          ...bookingSettings,
                          rescheduleWindow: parseInt(e.target.value),
                        })
                      }
                      min="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Max Reschedules Per Appointment
                  </label>
                  <input
                    type="number"
                    className="input"
                    value={bookingSettings.maxReschedulesPerAppointment}
                    onChange={(e) =>
                      setBookingSettings({
                        ...bookingSettings,
                        maxReschedulesPerAppointment: parseInt(e.target.value),
                      })
                    }
                    min="0"
                    max="10"
                  />
                </div>
                <div className="flex items-center gap-3 py-3">
                  <button
                    type="button"
                    onClick={() =>
                      setBookingSettings({
                        ...bookingSettings,
                        allowWalkIns: !bookingSettings.allowWalkIns,
                      })
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      bookingSettings.allowWalkIns
                        ? "bg-primary-600"
                        : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        bookingSettings.allowWalkIns
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                  <span className="text-sm font-medium">Allow Walk-ins</span>
                </div>
                <Button type="submit" variant="primary" loading={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Policies
                </Button>
              </form>
            </div>
          )}

          {/* Working Hours */}
          {activeTab === "hours" && (
            <div className="card">
              <h2 className="text-xl font-bold mb-6">Working Hours</h2>
              <form onSubmit={handleHoursSubmit} className="space-y-4">
                {Object.entries(workingHours).map(([day, hours]) => (
                  <div key={day} className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium capitalize text-gray-900">
                        {day}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleDayOpen(day)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          hours.isOpen ? "bg-primary-600" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            hours.isOpen ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                    {hours.isOpen ? (
                      <div className="grid md:grid-cols-2 gap-3">
                        {hours.slots.map((slot, idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <div className="flex-1">
                              <label className="text-xs text-gray-500 mb-1 block">
                                Start
                              </label>
                              <input
                                type="time"
                                className="input py-1 text-sm"
                                value={slot.start}
                                onChange={(e) =>
                                  updateSlot(day, idx, "start", e.target.value)
                                }
                                required
                              />
                            </div>
                            <div className="flex-1">
                              <label className="text-xs text-gray-500 mb-1 block">
                                End
                              </label>
                              <input
                                type="time"
                                className="input py-1 text-sm"
                                value={slot.end}
                                onChange={(e) =>
                                  updateSlot(day, idx, "end", e.target.value)
                                }
                                required
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">Closed</p>
                    )}
                  </div>
                ))}

                <div className="pt-4 border-t flex justify-end">
                  <Button type="submit" variant="primary" loading={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Working Hours
                  </Button>
                </div>
              </form>
            </div>
          )}
          {/* Verification Settings */}
          {activeTab === "verification" && (
            <div className="card max-w-3xl mx-auto">
              {/* Status Header */}
              <div className="text-center mb-10">
                <div
                  className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
                    business?.verification?.status === "verified"
                      ? "bg-green-100 text-green-600"
                      : "bg-orange-100 text-orange-600"
                  }`}
                >
                  {business?.verification?.status === "verified" ? (
                    <ShieldCheck className="w-10 h-10" />
                  ) : (
                    <AlertTriangle className="w-10 h-10" />
                  )}
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {business?.verification?.status === "verified"
                    ? "Business Verified"
                    : "Verification Required"}
                </h2>
                <p className="text-gray-500 mt-2 max-w-md mx-auto">
                  {business?.verification?.status === "verified"
                    ? "Your business is fully verified and trusted by customers."
                    : "Upload an official document to verify your business and build trust with customers."}
                </p>
              </div>

              {/* Current Document Card */}
              {business?.verification?.document?.fileUrl && (
                <div className="bg-white border rounded-xl p-6 mb-8 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary-600" />
                    Current Document
                  </h3>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg border flex items-center justify-center text-gray-400">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 capitalize">
                          {business.verification.document.type} Document
                        </p>
                        <p className="text-xs text-gray-500">
                          Uploaded on{" "}
                          {new Date(
                            business.verification.document.uploadedAt
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <a
                      href={business.verification.document.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center gap-1 hover:underline"
                    >
                      View <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="mt-4 flex gap-3 text-sm text-orange-700 bg-orange-50 p-3 rounded-lg border border-orange-100/50">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p>
                      Uploading a new document below will{" "}
                      <strong>replace</strong> the existing one and re-verify
                      your status.
                    </p>
                  </div>
                </div>
              )}

              {/* Upload Section */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  {business?.verification?.document?.fileUrl
                    ? "Update Document"
                    : "Upload Document"}
                </h3>

                <div className="grid md:grid-cols-3 gap-6">
                  {/* Document Type Selection */}
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Document Type
                    </label>
                    <select
                      id="settingsDocType"
                      className="input w-full bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                    >
                      <option value="aadhaar">Aadhaar Card</option>
                      <option value="pan">PAN Card</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-2">
                      Select the type of official document you are uploading.
                    </p>
                  </div>

                  {/* Upload Area */}
                  <div className="md:col-span-2">
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleVerificationUpload(
                              e.target.files[0],
                              document.getElementById("settingsDocType").value
                            );
                          }
                        }}
                        disabled={uploadingDoc}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                      />
                      <div
                        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                          uploadingDoc
                            ? "border-primary-300 bg-primary-50"
                            : "border-gray-300 hover:border-primary-400 hover:bg-gray-50"
                        }`}
                      >
                        {uploadingDoc ? (
                          <div className="flex flex-col items-center py-2">
                            <Loading size="small" />
                            <p className="mt-3 text-primary-700 font-medium">
                              Uploading & Verifying...
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mb-3">
                              <UploadCloud className="w-6 h-6" />
                            </div>
                            <p className="text-gray-900 font-medium">
                              Click to upload or drag and drop
                            </p>
                            <p className="text-gray-500 text-sm mt-1">
                              PDF, JPG or PNG (max. 5MB)
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessSettings;
