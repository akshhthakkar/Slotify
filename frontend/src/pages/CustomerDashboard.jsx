import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { formatDate, formatTime } from "../utils/dateHelpers";
import Loading from "../components/common/Loading";
import Button from "../components/common/Button";
import EmailVerificationBanner from "../components/common/EmailVerificationBanner";
import SearchDropdown from "../components/customer/SearchDropdown";
import {
  BusinessCard,
  ServiceCard,
} from "../components/customer/DiscoveryComponents";
import { getRecentlyViewed } from "../utils/recentlyViewed";
import {
  Calendar,
  Clock,
  Plus,
  CheckCircle,
  XCircle,
  ArrowRight,
  Building,
  Search,
  Grid,
  Store,
  History,
  ShieldAlert,
} from "lucide-react";

const CustomerDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [appointmentFilter, setAppointmentFilter] = useState("upcoming"); // upcoming, completed, cancelled

  // Data States
  const [allAppointments, setAllAppointments] = useState([]);
  const [stats, setStats] = useState({
    upcoming: 0,
    completed: 0,
    cancelled: 0,
  });
  const [dashboardLoading, setDashboardLoading] = useState(false);

  // Discovery States
  const [businesses, setBusinesses] = useState([]);
  const [services, setServices] = useState([]);
  const [discoveryLoading, setDiscoveryLoading] = useState(false);

  // Recently Viewed
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  // Business ownership state
  const [userBusiness, setUserBusiness] = useState(null);

  // Initial Data Load
  useEffect(() => {
    if (user) {
      fetchDashboardData();
      setRecentlyViewed(getRecentlyViewed());
      fetchUserBusiness();
    }
  }, [user]);

  // Tab Switching Logic
  useEffect(() => {
    if (activeTab === "businesses") {
      fetchBusinesses();
    } else if (activeTab === "services") {
      fetchServices();
    }
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      setDashboardLoading(true);
      const allApptsRes = await api.get("/appointments");
      const appointments = allApptsRes.data.appointments || [];
      const now = new Date();

      const isUpcoming = (apt) => {
        const aptDate = new Date(apt.appointmentDate);
        const [hours, minutes] = (apt.startTime || "00:00")
          .split(":")
          .map(Number);
        aptDate.setHours(hours, minutes, 0, 0);
        return aptDate >= now;
      };

      const upcoming = appointments.filter(
        (a) => a.status === "scheduled" && isUpcoming(a)
      );
      const completed = appointments.filter((a) => a.status === "completed");
      const cancelled = appointments.filter((a) => a.status === "cancelled");

      setAllAppointments(appointments);
      setStats({
        upcoming: upcoming.length,
        completed: completed.length,
        cancelled: cancelled.length,
      });
    } catch (error) {
      console.error("Error fetching dashboard:", error);
    } finally {
      setDashboardLoading(false);
    }
  };

  const fetchUserBusiness = async () => {
    try {
      if (user?.businessId) {
        const businessId =
          typeof user.businessId === "object"
            ? user.businessId._id
            : user.businessId;
        const res = await api.get(`/business/${businessId}`);
        setUserBusiness(res.data.business);
      }
    } catch (error) {
      setUserBusiness(null);
    }
  };

  const fetchBusinesses = async () => {
    try {
      setDiscoveryLoading(true);
      const res = await api.get("/business");
      setBusinesses(res.data.businesses || []);
    } catch (error) {
      console.error("Error fetching businesses:", error);
    } finally {
      setDiscoveryLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      setDiscoveryLoading(true);
      const res = await api.get("/services?isActive=true");
      setServices(res.data.services || []);
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setDiscoveryLoading(false);
    }
  };

  // Filter appointments based on selected stat card
  const getFilteredAppointments = () => {
    const now = new Date();
    const isUpcoming = (apt) => {
      const aptDate = new Date(apt.appointmentDate);
      const [hours, minutes] = (apt.startTime || "00:00")
        .split(":")
        .map(Number);
      aptDate.setHours(hours, minutes, 0, 0);
      return aptDate >= now;
    };

    switch (appointmentFilter) {
      case "upcoming":
        return allAppointments
          .filter((a) => a.status === "scheduled" && isUpcoming(a))
          .slice(0, 5);
      case "completed":
        return allAppointments
          .filter((a) => a.status === "completed")
          .slice(0, 5);
      case "cancelled":
        return allAppointments
          .filter((a) => a.status === "cancelled")
          .slice(0, 5);
      default:
        return [];
    }
  };

  // Smart Book New CTA handler
  const handleBookNewClick = () => {
    setActiveTab("services");
  };

  if (authLoading) return <Loading fullscreen text="Loading..." />;

  const filteredAppointments = getFilteredAppointments();

  // Stat Card Component (Interactive)
  const StatCard = ({ label, count, icon: Icon, color, filterKey }) => {
    const isActive = appointmentFilter === filterKey;
    const colorClasses = {
      primary: {
        bg: "bg-primary-100",
        text: "text-primary-600",
        ring: "ring-primary-500",
      },
      green: {
        bg: "bg-green-100",
        text: "text-green-600",
        ring: "ring-green-500",
      },
      red: { bg: "bg-red-100", text: "text-red-600", ring: "ring-red-500" },
    };
    const c = colorClasses[color];

    return (
      <button
        onClick={() => setAppointmentFilter(filterKey)}
        className={`bg-white rounded-2xl p-6 shadow-card border transition-all text-left w-full ${
          isActive
            ? `ring-2 ${c.ring} border-transparent`
            : "border-secondary-200 hover:shadow-card-hover"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-dark-500 mb-1">{label}</p>
            <p className={`text-3xl font-bold ${c.text}`}>{count}</p>
          </div>
          <div
            className={`w-14 h-14 ${c.bg} rounded-xl flex items-center justify-center`}
          >
            <Icon className={`w-7 h-7 ${c.text}`} />
          </div>
        </div>
      </button>
    );
  };

  const renderStats = () => (
    <div className="grid md:grid-cols-4 gap-6 mb-8">
      <StatCard
        label="Upcoming"
        count={stats.upcoming}
        icon={Calendar}
        color="primary"
        filterKey="upcoming"
      />
      <StatCard
        label="Completed"
        count={stats.completed}
        icon={CheckCircle}
        color="green"
        filterKey="completed"
      />
      <StatCard
        label="Cancelled"
        count={stats.cancelled}
        icon={XCircle}
        color="red"
        filterKey="cancelled"
      />
      <button
        onClick={handleBookNewClick}
        className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all group text-left w-full"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-primary-100 mb-1">Book New</p>
            <p className="text-lg font-semibold text-white">Find Services</p>
          </div>
          <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
            <Search className="w-7 h-7 text-white" />
          </div>
        </div>
      </button>
    </div>
  );

  // Recently Viewed Section
  const renderRecentlyViewed = () => {
    if (recentlyViewed.length === 0) return null;

    return (
      <div className="bg-white rounded-2xl shadow-card border border-secondary-200 p-6 mb-8">
        <h2 className="text-lg font-bold text-dark-900 mb-4 flex items-center gap-2">
          <History className="w-5 h-5 text-gray-400" />
          Recently Viewed
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {recentlyViewed.map((item) => (
            <Link
              key={`${item.type}-${item.id}`}
              to={
                item.type === "business"
                  ? `/business/${item.slug || item.id}`
                  : `/book/${item.businessSlug || item.slug}?serviceId=${
                      item.id
                    }`
              }
              className="flex-shrink-0 flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors min-w-[200px]"
            >
              {item.logo ? (
                <img
                  src={item.logo}
                  alt=""
                  className="w-10 h-10 rounded-lg object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <span className="text-primary-600 font-bold">
                    {item.name?.[0]}
                  </span>
                </div>
              )}
              <div className="min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {item.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {item.type === "service" ? item.businessName : "Business"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  };

  // Context-Aware Business Banner
  const renderBusinessBanner = () => {
    // User has verified business - hide banner
    if (userBusiness?.verification?.status === "verified") {
      return null;
    }

    // User has business but not verified
    if (userBusiness && userBusiness.verification?.status !== "verified") {
      return (
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-2xl p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-yellow-800">
                Verify your business
              </h3>
              <p className="text-yellow-700">
                Build customer trust by verifying your business details.
              </p>
            </div>
          </div>
          <Link to="/admin/settings">
            <Button
              variant="outline"
              className="border-yellow-400 text-yellow-700 hover:bg-yellow-100"
            >
              Verify Now <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      );
    }

    // User doesn't have a business
    if (!userBusiness) {
      return (
        <div className="mt-8 bg-dark-900 rounded-2xl p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
              <Building className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Do you have a business?
              </h3>
              <p className="text-dark-300">
                Set up your business and start accepting bookings
              </p>
            </div>
          </div>
          <Link to="/business-onboarding">
            <Button variant="primary">
              Set Up Business <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <EmailVerificationBanner />
      <div className="bg-secondary-100 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header & Search */}
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-dark-900">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-dark-500 mt-1">
                Find and book your next appointment
              </p>
            </div>

            {/* Unified Search Dropdown */}
            <SearchDropdown />
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm border border-secondary-200 mb-8 w-fit overflow-x-auto">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === "overview"
                  ? "bg-primary-50 text-primary-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Grid className="w-4 h-4" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab("businesses")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === "businesses"
                  ? "bg-primary-50 text-primary-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Building className="w-4 h-4" />
              Businesses
            </button>
            <button
              onClick={() => setActiveTab("services")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === "services"
                  ? "bg-primary-50 text-primary-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Store className="w-4 h-4" />
              Services
            </button>
          </div>

          {/* Content Area */}
          <div className="min-h-[400px]">
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <>
                {renderStats()}
                {renderRecentlyViewed()}

                {/* Appointments List */}
                <div className="bg-white rounded-2xl shadow-card border border-secondary-200 overflow-hidden mb-8">
                  <div className="flex items-center justify-between p-6 border-b border-secondary-200">
                    <h2 className="text-xl font-bold text-dark-900">
                      {appointmentFilter === "upcoming" &&
                        "Upcoming Appointments"}
                      {appointmentFilter === "completed" &&
                        "Completed Appointments"}
                      {appointmentFilter === "cancelled" &&
                        "Cancelled Appointments"}
                    </h2>
                    <Link to="/my-appointments">
                      <Button variant="ghost" size="small">
                        View All
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>

                  {dashboardLoading ? (
                    <Loading text="Loading appointments..." />
                  ) : filteredAppointments.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 bg-secondary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-8 h-8 text-dark-400" />
                      </div>
                      {appointmentFilter === "upcoming" ? (
                        <>
                          <p className="text-dark-700 font-medium mb-2">
                            You don't have any upcoming appointments yet.
                          </p>
                          <p className="text-dark-500 mb-4">
                            Explore services and book your first appointment.
                          </p>
                          <button
                            onClick={() => setActiveTab("services")}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Book Now
                          </button>
                        </>
                      ) : (
                        <p className="text-dark-500">
                          No {appointmentFilter} appointments found.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="divide-y divide-secondary-100">
                      {filteredAppointments.map((appointment) => (
                        <div
                          key={appointment._id}
                          className="p-6 hover:bg-secondary-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              {appointment.businessId?.logo ? (
                                <img
                                  src={appointment.businessId.logo}
                                  alt=""
                                  className="w-14 h-14 rounded-xl object-cover"
                                />
                              ) : (
                                <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center">
                                  <span className="text-primary-600 font-bold text-xl">
                                    {appointment.businessId?.name?.[0]}
                                  </span>
                                </div>
                              )}
                              <div>
                                <h3 className="font-semibold text-dark-900">
                                  {appointment.serviceId?.name}
                                </h3>
                                <p className="text-sm text-dark-500">
                                  {appointment.businessId?.name}
                                </p>
                                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                  <span className="flex items-center">
                                    <Calendar className="w-4 h-4 mr-1" />
                                    {formatDate(appointment.appointmentDate)}
                                  </span>
                                  <span className="flex items-center">
                                    <Clock className="w-4 h-4 mr-1" />
                                    {formatTime(appointment.startTime)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  appointment.status === "scheduled"
                                    ? "bg-blue-100 text-blue-700"
                                    : appointment.status === "completed"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {appointment.status === "scheduled"
                                  ? "Scheduled"
                                  : appointment.status === "completed"
                                  ? "Completed"
                                  : "Cancelled"}
                              </span>
                              <Link to="/my-appointments">
                                <Button variant="outline" size="small">
                                  Details
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {renderBusinessBanner()}
              </>
            )}

            {/* BUSINESSES TAB */}
            {activeTab === "businesses" && (
              <div className="animate-in fade-in duration-500">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    Browse Businesses
                  </h2>
                </div>
                {discoveryLoading ? (
                  <div className="py-20">
                    <Loading text="Finding businesses..." />
                  </div>
                ) : businesses.length === 0 ? (
                  <div className="text-center py-20 text-gray-500">
                    No businesses found.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {businesses.map((biz) => (
                      <BusinessCard key={biz._id} business={biz} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SERVICES TAB */}
            {activeTab === "services" && (
              <div className="animate-in fade-in duration-500">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    Browse Services
                  </h2>
                </div>
                {discoveryLoading ? (
                  <div className="py-20">
                    <Loading text="Finding services..." />
                  </div>
                ) : services.length === 0 ? (
                  <div className="text-center py-20 text-gray-500">
                    No services found.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {services.map((svc) => (
                      <ServiceCard key={svc._id} service={svc} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CustomerDashboard;
