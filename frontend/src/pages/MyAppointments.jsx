import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  User,
  MapPin,
  MoreVertical,
  Edit2,
  XCircle,
  CheckCircle,
} from "lucide-react";
import api from "../utils/api";
import Loading from "../components/common/Loading";
import Modal from "../components/common/Modal";
import Button from "../components/common/Button";
import EmailVerificationBanner from "../components/common/EmailVerificationBanner";
import {
  formatDate,
  formatTime,
  getRelativeDate,
  isDatePast,
} from "../utils/dateHelpers";
import toast from "react-hot-toast";

const MyAppointments = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");

  const tabs = [
    { id: "upcoming", label: "Upcoming" },
    { id: "past", label: "Past" },
    { id: "cancelled", label: "Cancelled" },
  ];

  useEffect(() => {
    fetchAppointments();
  }, [activeTab]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const statusFilter = {
        upcoming: "scheduled",
        past: "completed",
        cancelled: "cancelled",
      }[activeTab];

      const response = await api.get(`/appointments?status=${statusFilter}`);
      const fetchedAppointments = response.data.appointments || [];

      // Filter by date for upcoming/past
      const filtered = fetchedAppointments.filter((apt) => {
        const isPast = isDatePast(apt.appointmentDate);
        if (activeTab === "upcoming") return !isPast;
        if (activeTab === "past") return isPast;
        return true;
      });

      // Sort: upcoming (earliest first), past (latest first)
      filtered.sort((a, b) => {
        const dateA = new Date(a.appointmentDate);
        const dateB = new Date(b.appointmentDate);
        return activeTab === "past" ? dateB - dateA : dateA - dateB;
      });

      setAppointments(filtered);
    } catch (error) {
      toast.error("Failed to load appointments");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!cancelModal) return;

    try {
      setCancelling(true);
      await api.post(`/appointments/${cancelModal._id}/cancel`, {
        cancellationReason,
      });

      toast.success("Appointment cancelled successfully");
      setCancelModal(null);
      setCancellationReason("");
      fetchAppointments();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to cancel appointment"
      );
    } finally {
      setCancelling(false);
    }
  };

  const handleReschedule = (appointment) => {
    navigate(`/appointments/${appointment._id}/reschedule`);
  };

  const getStatusBadge = (status) => {
    const badges = {
      scheduled: <span className="badge badge-info">Scheduled</span>,
      completed: <span className="badge badge-success">Completed</span>,
      cancelled: <span className="badge badge-danger">Cancelled</span>,
      "no-show": <span className="badge bg-gray-500 text-white">No Show</span>,
      rescheduled: <span className="badge badge-warning">Rescheduled</span>,
    };
    return badges[status] || <span className="badge">{status}</span>;
  };

  const canCancelOrReschedule = (appointment) => {
    if (appointment.status !== "scheduled") return false;
    return !isDatePast(appointment.appointmentDate);
  };

  return (
    <>
      <EmailVerificationBanner />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">My Appointments</h1>
          <p className="text-gray-600 mt-1">Manage your bookings</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Appointments List */}
        {loading ? (
          <Loading />
        ) : appointments.length === 0 ? (
          <div className="card text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-4">
              {activeTab === "upcoming" && "No upcoming appointments"}
              {activeTab === "past" && "No past appointments"}
              {activeTab === "cancelled" && "No cancelled appointments"}
            </p>
            {activeTab === "upcoming" && (
              <Button variant="primary" onClick={() => navigate("/")}>
                Book an Appointment
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div
                key={appointment._id}
                className="card hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Business Logo */}
                  <div className="flex-shrink-0">
                    {appointment.businessId.logo ? (
                      <img
                        src={appointment.businessId.logo}
                        alt={appointment.businessId.name}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-primary-100 flex items-center justify-center">
                        <span className="text-2xl font-bold text-primary-600">
                          {appointment.businessId.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Appointment Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {appointment.serviceId.name}
                        </h3>
                        <p className="text-gray-600">
                          {appointment.businessId.name}
                        </p>
                      </div>
                      {getStatusBadge(appointment.status)}
                    </div>

                    <div className="grid md:grid-cols-2 gap-3 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        <span>
                          {getRelativeDate(appointment.appointmentDate)} -{" "}
                          {formatDate(
                            appointment.appointmentDate,
                            "MMM d, yyyy"
                          )}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-gray-400" />
                        <span>
                          {formatTime(appointment.startTime)} -{" "}
                          {formatTime(appointment.endTime)}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2 text-gray-400" />
                        <span>{appointment.staffId.name}</span>
                      </div>
                      {appointment.businessId.address && (
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="truncate">
                            {appointment.businessId.address.city},{" "}
                            {appointment.businessId.address.state}
                          </span>
                        </div>
                      )}
                    </div>

                    {appointment.notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Note:</span>{" "}
                          {appointment.notes}
                        </p>
                      </div>
                    )}

                    {appointment.cancellationReason && (
                      <div className="mt-3 p-3 bg-red-50 rounded-lg">
                        <p className="text-sm text-red-700">
                          <span className="font-medium">
                            Cancellation reason:
                          </span>{" "}
                          {appointment.cancellationReason}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {canCancelOrReschedule(appointment) && (
                    <div className="flex md:flex-col gap-2">
                      <Button
                        variant="outline"
                        size="small"
                        onClick={() => handleReschedule(appointment)}
                        className="flex-1 md:flex-none"
                      >
                        <Edit2 className="w-4 h-4 md:mr-2" />
                        <span className="hidden md:inline">Reschedule</span>
                      </Button>
                      <Button
                        variant="danger"
                        size="small"
                        onClick={() => setCancelModal(appointment)}
                        className="flex-1 md:flex-none"
                      >
                        <XCircle className="w-4 h-4 md:mr-2" />
                        <span className="hidden md:inline">Cancel</span>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cancel Modal */}
        <Modal
          isOpen={!!cancelModal}
          onClose={() => setCancelModal(null)}
          title="Cancel Appointment"
          footer={
            <>
              <Button variant="secondary" onClick={() => setCancelModal(null)}>
                Keep Appointment
              </Button>
              <Button
                variant="danger"
                onClick={handleCancelAppointment}
                loading={cancelling}
                disabled={!cancellationReason.trim()}
              >
                Confirm Cancellation
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <p className="text-gray-700">
              Are you sure you want to cancel this appointment? This action
              cannot be undone.
            </p>

            {cancelModal && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900">
                  {cancelModal.serviceId.name}
                </p>
                <p className="text-sm text-gray-600">
                  {formatDate(cancelModal.appointmentDate, "MMM d, yyyy")} at{" "}
                  {formatTime(cancelModal.startTime)}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for cancellation <span className="text-red-500">*</span>
              </label>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows="3"
                className="input"
                placeholder="Please provide a reason..."
                required
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Cancellation policies may apply based on
                how close to the appointment date you are cancelling.
              </p>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
};

export default MyAppointments;
