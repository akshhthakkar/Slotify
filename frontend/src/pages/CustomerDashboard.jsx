import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { formatDate, formatTime } from "../utils/dateHelpers";
import Loading from "../components/common/Loading";
import Button from "../components/common/Button";
import EmailVerificationBanner from "../components/common/EmailVerificationBanner";
import {
  Calendar,
  Clock,
  Plus,
  CheckCircle,
  XCircle,
  ArrowRight,
  Building,
  Search,
} from "lucide-react";

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({
    upcoming: 0,
    completed: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get("/appointments?status=scheduled");
      const scheduledAppointments = response.data.appointments || [];

      const upcoming = scheduledAppointments
        .filter((apt) => new Date(apt.appointmentDate) >= new Date())
        .sort(
          (a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate)
        )
        .slice(0, 5);

      setAppointments(upcoming);

      const allAppointmentsRes = await api.get("/appointments");
      const allAppointments = allAppointmentsRes.data.appointments || [];

      setStats({
        upcoming: upcoming.length,
        completed: allAppointments.filter((a) => a.status === "completed")
          .length,
        cancelled: allAppointments.filter((a) => a.status === "cancelled")
          .length,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading fullscreen text="Loading dashboard..." />;

  return (
    <>
      <EmailVerificationBanner />
      <div className="bg-secondary-100 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-dark-900">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-dark-500 mt-1">
              Here's what's happening with your appointments
            </p>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-card border border-secondary-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-dark-500 mb-1">Upcoming</p>
                  <p className="text-3xl font-bold text-primary-600">
                    {stats.upcoming}
                  </p>
                </div>
                <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-7 h-7 text-primary-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-card border border-secondary-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-dark-500 mb-1">Completed</p>
                  <p className="text-3xl font-bold text-green-600">
                    {stats.completed}
                  </p>
                </div>
                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-card border border-secondary-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-dark-500 mb-1">Cancelled</p>
                  <p className="text-3xl font-bold text-red-600">
                    {stats.cancelled}
                  </p>
                </div>
                <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center">
                  <XCircle className="w-7 h-7 text-red-600" />
                </div>
              </div>
            </div>

            <Link
              to="/"
              className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-primary-100 mb-1">Book New</p>
                  <p className="text-lg font-semibold text-white">
                    Find Services
                  </p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
                  <Search className="w-7 h-7 text-white" />
                </div>
              </div>
            </Link>
          </div>

          {/* Quick Actions */}
          {!user?.business && (
            <div className="bg-dark-900 rounded-2xl p-6 mb-8 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
                  <Building className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Have a business?
                  </h3>
                  <p className="text-dark-300">
                    Set up your business and start accepting bookings
                  </p>
                </div>
              </div>
              <Link to="/business-onboarding">
                <Button variant="primary" size="medium">
                  Set Up Business
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          )}

          {/* Browse Services & Businesses */}
          <div className="bg-white rounded-2xl shadow-card border border-secondary-200 mb-8">
            <div className="p-6 border-b border-secondary-200">
              <h2 className="text-xl font-bold text-dark-900">
                Browse Services & Businesses
              </h2>
              <p className="text-dark-500 mt-1">
                Discover and book appointments with local businesses
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4 p-6">
              <Link
                to="/"
                className="flex items-center gap-4 p-4 bg-secondary-50 rounded-xl hover:bg-secondary-100 transition-colors group"
              >
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                  <Search className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-dark-900">
                    Search Services
                  </h3>
                  <p className="text-dark-500 text-sm">
                    Find services by name or category
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-dark-400 ml-auto" />
              </Link>
              <Link
                to="/"
                className="flex items-center gap-4 p-4 bg-secondary-50 rounded-xl hover:bg-secondary-100 transition-colors group"
              >
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <Building className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-dark-900">
                    All Businesses
                  </h3>
                  <p className="text-dark-500 text-sm">
                    Browse all available businesses
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-dark-400 ml-auto" />
              </Link>
            </div>
          </div>

          {/* Upcoming Appointments */}
          <div className="bg-white rounded-2xl shadow-card border border-secondary-200 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-secondary-200">
              <h2 className="text-xl font-bold text-dark-900">
                Upcoming Appointments
              </h2>
              <Link to="/my-appointments">
                <Button variant="ghost" size="small">
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            {appointments.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-secondary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-dark-400" />
                </div>
                <p className="text-dark-500 mb-4">No upcoming appointments</p>
                <Link to="/">
                  <Button variant="primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Book Now
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-secondary-100">
                {appointments.map((appointment) => (
                  <div
                    key={appointment._id}
                    className="p-6 hover:bg-secondary-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {appointment.businessId?.logo ? (
                          <img
                            src={appointment.businessId.logo}
                            alt={appointment.businessId.name}
                            className="w-14 h-14 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center">
                            <span className="text-primary-600 font-bold text-xl">
                              {appointment.businessId?.name?.charAt(0)}
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
                          <div className="flex items-center gap-4 mt-2">
                            <span className="flex items-center text-sm text-dark-500">
                              <Calendar className="w-4 h-4 mr-1.5 text-primary-500" />
                              {formatDate(
                                appointment.appointmentDate,
                                "MMM d, yyyy"
                              )}
                            </span>
                            <span className="flex items-center text-sm text-dark-500">
                              <Clock className="w-4 h-4 mr-1.5 text-primary-500" />
                              {formatTime(appointment.startTime)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Link to="/my-appointments">
                        <Button variant="outline" size="small">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CustomerDashboard;
