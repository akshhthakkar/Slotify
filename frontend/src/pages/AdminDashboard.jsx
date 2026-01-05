import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import VerificationReminder from "../components/merchant/VerificationReminder";
import CancelAppointmentModal from "../components/admin/CancelAppointmentModal";
import WalkInModal from "../components/admin/WalkInModal";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import Loading from "../components/common/Loading";
import Button from "../components/common/Button";
import { formatDate, formatTime } from "../utils/dateHelpers";
import toast from "react-hot-toast";
import {
  Calendar,
  Clock,
  Users,
  Briefcase,
  TrendingUp,
  Settings,
  Plus,
  ChevronRight,
  CheckCircle,
  XCircle,
  BarChart3,
  IndianRupee,
  UserCheck,
  History,
  AlertCircle,
  Zap,
  Info,
  Edit2,
} from "lucide-react";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [business, setBusiness] = useState(null);

  // Stats
  const [stats, setStats] = useState({
    todayAppointments: 0,
    totalServices: 0,
    totalStaff: 0,
    monthlyAppointments: 0,
  });

  // Resources
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);

  // Appointments
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [pastAppointments, setPastAppointments] = useState([]);
  const [appointmentTab, setAppointmentTab] = useState("upcoming");

  // Analytics
  const [analyticsStats, setAnalyticsStats] = useState(null);
  const [servicePerformance, setServicePerformance] = useState([]);
  const [dateRange, setDateRange] = useState("30"); // days

  // Modal
  const [cancelModal, setCancelModal] = useState({
    open: false,
    appointment: null,
  });
  const [walkInModalOpen, setWalkInModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === "analytics" && business) {
      fetchAnalytics();
    }
  }, [activeTab, dateRange, business]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      let businessId = user?.businessId;
      if (typeof businessId === "object") businessId = businessId._id;
      if (!businessId) {
        setBusiness(null);
        setLoading(false);
        return;
      }

      const businessRes = await api.get(`/business/${businessId}`);
      setBusiness(businessRes.data.business);

      const [servicesRes, staffRes, appointmentsRes] = await Promise.all([
        api.get(`/services?businessId=${businessId}`),
        api.get(`/staff?businessId=${businessId}`),
        api.get(`/appointments?businessId=${businessId}`),
      ]);

      const appointments = appointmentsRes.data.appointments || [];
      const now = new Date();

      // Upcoming: scheduled and in the future
      const upcoming = appointments
        .filter((apt) => {
          if (apt.status !== "scheduled") return false;
          const aptDate = new Date(apt.appointmentDate);
          const [h, m] = (apt.startTime || "00:00").split(":").map(Number);
          aptDate.setHours(h, m, 0, 0);
          return aptDate >= now;
        })
        .sort(
          (a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate)
        );

      // Past: completed, cancelled, no-show, or in the past
      const past = appointments
        .filter((apt) => {
          if (["completed", "cancelled", "no-show"].includes(apt.status))
            return true;
          const aptDate = new Date(apt.appointmentDate);
          const [h, m] = (apt.endTime || "23:59").split(":").map(Number);
          aptDate.setHours(h, m, 0, 0);
          return aptDate < now;
        })
        .sort(
          (a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate)
        );

      setUpcomingAppointments(upcoming);
      setPastAppointments(past);

      // Store resources for modals
      setServices(servicesRes.data.services || []);
      setStaff(staffRes.data.staff || []);

      const today = new Date().toISOString().split("T")[0];
      const todayApts = upcoming.filter(
        (apt) => apt.appointmentDate.split("T")[0] === today
      );
      const thisMonth = now.getMonth();
      const monthlyApts = appointments.filter(
        (apt) =>
          new Date(apt.appointmentDate).getMonth() === thisMonth &&
          apt.status === "completed"
      );

      setStats({
        todayAppointments: todayApts.length,
        totalServices: servicesRes.data.services?.length || 0,
        totalStaff: staffRes.data.staff?.length || 0,
        monthlyAppointments: monthlyApts.length,
      });
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      if (error.response?.status === 404 || error.response?.status === 403) {
        setBusiness(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      console.log("Fetching analytics...", {
        activeTab,
        business: !!business,
        dateRange,
      });
      // Set endDate to tomorrow to include all of today's appointments
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 1);
      endDate.setHours(0, 0, 0, 0);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));
      startDate.setHours(0, 0, 0, 0);

      const [overviewRes, servicesRes] = await Promise.all([
        api.get(
          `/analytics/overview?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
        ),
        api.get(
          `/analytics/services?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
        ),
      ]);

      console.log("Analytics response:", overviewRes.data, servicesRes.data);
      setAnalyticsStats(overviewRes.data.stats);
      setServicePerformance(servicesRes.data.services || []);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Failed to load analytics data");
    }
  };

  const handleCancelAppointment = async (appointmentId, reason) => {
    try {
      await api.post(`/appointments/${appointmentId}/cancel`, {
        cancellationReason: reason,
      });
      toast.success("Appointment cancelled. Customer notified.");
      setCancelModal({ open: false, appointment: null });
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to cancel");
    }
  };

  const handleCompleteAppointment = async (appointmentId) => {
    try {
      await api.post(`/appointments/${appointmentId}/complete`);
      toast.success("Appointment marked as completed");
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to complete");
    }
  };

  const handleMarkNoShow = async (appointmentId) => {
    try {
      await api.post(`/appointments/${appointmentId}/no-show`);
      toast.success("Appointment marked as no-show");
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to mark no-show");
    }
  };

  const handleReschedule = (appointment) => {
    navigate(`/appointments/${appointment._id}/reschedule`);
  };

  // Check if appointment can be rescheduled
  const canReschedule = (apt) => {
    if (apt.status !== "scheduled") return false;
    if (apt.isWalkIn) return false;
    return true;
  };

  if (authLoading || loading)
    return <Loading fullscreen text="Loading dashboard..." />;

  if (!business) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Briefcase className="w-20 h-20 text-gray-400 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Set Up Your Business
        </h1>
        <p className="text-gray-600 mb-8">
          Complete the onboarding process to get started.
        </p>
        <Link to="/business-onboarding">
          <Button variant="primary" size="large">
            Start Business Setup
          </Button>
        </Link>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const styles = {
      scheduled: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      "no-show": "bg-yellow-100 text-yellow-800",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          styles[status] || "bg-gray-100 text-gray-800"
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">{business.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              business?.verification?.status === "verified"
                ? "bg-green-100 text-green-800"
                : business?.verification?.status === "pending"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {business?.verification?.status === "verified"
              ? "Verified"
              : business?.verification?.status === "pending"
              ? "Pending"
              : "Not Verified"}
          </span>
        </div>
      </div>

      <VerificationReminder business={business} />

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm border border-gray-200 mb-8 w-fit">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "overview"
              ? "bg-primary-50 text-primary-700"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <TrendingUp className="w-4 h-4 inline mr-2" />
          Overview
        </button>
        <button
          onClick={() => setActiveTab("appointments")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "appointments"
              ? "bg-primary-50 text-primary-700"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Calendar className="w-4 h-4 inline mr-2" />
          Appointments
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "analytics"
              ? "bg-primary-50 text-primary-700"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <BarChart3 className="w-4 h-4 inline mr-2" />
          Analytics
        </button>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <>
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    Today's Appointments
                  </p>
                  <p className="text-3xl font-bold text-primary-600">
                    {stats.todayAppointments}
                  </p>
                </div>
                <Calendar className="w-12 h-12 text-primary-200" />
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Services</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.totalServices}
                  </p>
                </div>
                <Briefcase className="w-12 h-12 text-gray-200" />
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Staff Members</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.totalStaff}
                  </p>
                </div>
                <Users className="w-12 h-12 text-gray-200" />
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">This Month</p>
                  <p className="text-3xl font-bold text-green-600">
                    {stats.monthlyAppointments}
                  </p>
                </div>
                <TrendingUp className="w-12 h-12 text-green-200" />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Link
              to="/admin/services"
              className="card hover:shadow-lg transition-shadow group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mr-4">
                    <Plus className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Manage Services</h3>
                    <p className="text-sm text-gray-600">
                      Add or edit services
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600" />
              </div>
            </Link>
            <Link
              to="/admin/staff"
              className="card hover:shadow-lg transition-shadow group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Manage Staff</h3>
                    <p className="text-sm text-gray-600">Add or edit staff</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600" />
              </div>
            </Link>
            <Link
              to="/admin/settings"
              className="card hover:shadow-lg transition-shadow group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                    <Settings className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Business Settings</h3>
                    <p className="text-sm text-gray-600">Hours, policies</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600" />
              </div>
            </Link>
          </div>
        </>
      )}

      {/* APPOINTMENTS TAB */}
      {activeTab === "appointments" && (
        <div className="card">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setAppointmentTab("upcoming")}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                appointmentTab === "upcoming"
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Upcoming ({upcomingAppointments.length})
            </button>
            <button
              onClick={() => setAppointmentTab("past")}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                appointmentTab === "past"
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <History className="w-4 h-4 inline mr-1" /> Past (
              {pastAppointments.length})
            </button>
            <div className="ml-auto">
              <Button
                variant="primary"
                size="small"
                onClick={() => setWalkInModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Walk-In
              </Button>
            </div>
          </div>

          {appointmentTab === "upcoming" &&
            (upcomingAppointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No upcoming appointments</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map((apt) => (
                  <div
                    key={apt._id}
                    className="p-4 border rounded-lg flex items-center justify-between hover:bg-gray-50"
                  >
                    <div>
                      <h3 className="font-semibold">{apt.serviceId?.name}</h3>
                      <p className="text-sm text-gray-600">
                        {apt.customerId?.name} •{" "}
                        {apt.staffId?.name || "No staff"}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span>
                          <Calendar className="w-4 h-4 inline mr-1" />
                          {formatDate(apt.appointmentDate)}
                        </span>
                        <span>
                          <Clock className="w-4 h-4 inline mr-1" />
                          {formatTime(apt.startTime)} -{" "}
                          {formatTime(apt.endTime)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        ID: {apt._id.slice(-8)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(apt.status)}
                      {canReschedule(apt) && (
                        <Button
                          variant="outline"
                          size="small"
                          onClick={() => handleReschedule(apt)}
                        >
                          <Edit2 className="w-4 h-4 mr-1" />
                          Reschedule
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="small"
                        onClick={() => handleCompleteAppointment(apt._id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Complete
                      </Button>
                      <Button
                        variant="ghost"
                        size="small"
                        onClick={() =>
                          setCancelModal({ open: true, appointment: apt })
                        }
                      >
                        <XCircle className="w-4 h-4 mr-1 text-red-500" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ))}

          {appointmentTab === "past" &&
            (pastAppointments.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No past appointments</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pastAppointments.slice(0, 20).map((apt) => (
                  <div
                    key={apt._id}
                    className="p-4 border rounded-lg flex items-center justify-between"
                  >
                    <div>
                      <h3 className="font-semibold">{apt.serviceId?.name}</h3>
                      <p className="text-sm text-gray-600">
                        {apt.isWalkIn ? (
                          <span className="font-medium text-purple-700">
                            Walk-In Customer
                          </span>
                        ) : (
                          apt.customerId?.name
                        )}{" "}
                        • {apt.staffId?.name || "No staff"}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span>
                          <Calendar className="w-4 h-4 inline mr-1" />
                          {formatDate(apt.appointmentDate)}
                        </span>
                        <span>
                          <Clock className="w-4 h-4 inline mr-1" />
                          {formatTime(apt.startTime)}
                        </span>
                      </div>
                      {apt.cancellationReason && (
                        <p className="text-xs text-red-500 mt-1">
                          Reason: {apt.cancellationReason}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(apt.status)}
                      {apt.status === "completed" &&
                        apt.completedAt &&
                        !apt.isWalkIn &&
                        (() => {
                          const completedAt = new Date(apt.completedAt);
                          const aptDate = new Date(apt.appointmentDate);
                          const [h, m] = (apt.endTime || "23:59")
                            .split(":")
                            .map(Number);
                          aptDate.setHours(h, m, 0, 0);
                          return completedAt < aptDate ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                              <Zap className="w-3 h-3 mr-1" />
                              Completed Early
                            </span>
                          ) : null;
                        })()}
                      {apt.isWalkIn && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                          Walk-In
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
        </div>
      )}

      {/* ANALYTICS TAB */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Business Analytics</h2>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>

          {analyticsStats ? (
            <>
              <div className="grid md:grid-cols-5 gap-4">
                <div className="card text-center">
                  <p className="text-sm text-gray-600">Total Appointments</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analyticsStats.totalAppointments}
                  </p>
                </div>
                <div className="card text-center">
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {analyticsStats.completedAppointments}
                  </p>
                </div>
                <div className="card text-center">
                  <p className="text-sm text-gray-600">Cancelled</p>
                  <p className="text-2xl font-bold text-red-600">
                    {analyticsStats.cancelledAppointments}
                  </p>
                </div>
                <div className="card text-center">
                  <p className="text-sm text-gray-600">No-Shows</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {analyticsStats.noShowAppointments}
                  </p>
                </div>
                <div className="card text-center bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                  <p className="text-sm text-green-700">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-700 flex items-center justify-center">
                    <IndianRupee className="w-5 h-5" />
                    {analyticsStats.totalRevenue?.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              {/* Revenue Disclaimer */}
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>
                  Revenue shown is calculated using service prices and does not
                  represent actual payment transactions.
                </p>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold mb-4">
                  Service Performance
                </h3>
                {servicePerformance.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No data for selected period
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left p-3">Service</th>
                          <th className="text-center p-3">Bookings</th>
                          <th className="text-center p-3">Completed</th>
                          <th className="text-center p-3">Cancelled</th>
                          <th className="text-right p-3">Revenue (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {servicePerformance.map((svc) => (
                          <tr key={svc._id} className="border-t">
                            <td className="p-3 font-medium">
                              {svc.serviceName}
                            </td>
                            <td className="p-3 text-center">
                              {svc.totalBookings}
                            </td>
                            <td className="p-3 text-center text-green-600">
                              {svc.completedBookings}
                            </td>
                            <td className="p-3 text-center text-red-600">
                              {svc.cancelledBookings}
                            </td>
                            <td className="p-3 text-right font-medium">
                              ₹{svc.revenue?.toLocaleString("en-IN")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Loading text="Loading analytics..." />
          )}
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModal.open && (
        <CancelAppointmentModal
          appointment={cancelModal.appointment}
          onCancel={handleCancelAppointment}
          onClose={() => setCancelModal({ open: false, appointment: null })}
        />
      )}

      <WalkInModal
        isOpen={walkInModalOpen}
        onClose={() => setWalkInModalOpen(false)}
        onSuccess={fetchDashboardData}
        services={services}
        staff={staff}
      />
    </div>
  );
};

export default AdminDashboard;
