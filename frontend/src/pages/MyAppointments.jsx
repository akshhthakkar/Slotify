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
  AlertCircle,
  IndianRupee,
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

      // Fetch all appointments for the user
      const response = await api.get("/appointments");
      const allAppointments = response.data.appointments || [];

      const now = new Date();

      // Helper to check if appointment datetime has passed
      const isAppointmentPast = (apt) => {
        const aptDate = new Date(apt.appointmentDate);
        const [hours, minutes] = (apt.startTime || "00:00")
          .split(":")
          .map(Number);
        aptDate.setHours(hours, minutes, 0, 0);
        return aptDate < now;
      };

      let filtered = [];

      if (activeTab === "upcoming") {
        // Upcoming: scheduled appointments that haven't happened yet
        filtered = allAppointments.filter(
          (apt) => apt.status === "scheduled" && !isAppointmentPast(apt)
        );
      } else if (activeTab === "past") {
        // Past: completed appointments OR scheduled appointments that have passed
        filtered = allAppointments.filter(
          (apt) =>
            apt.status === "completed" ||
            (apt.status === "scheduled" && isAppointmentPast(apt))
        );
      } else if (activeTab === "cancelled") {
        // Cancelled: cancelled appointments
        filtered = allAppointments.filter((apt) => apt.status === "cancelled");
      }

      // Sort: upcoming (earliest first), past/cancelled (latest first)
      filtered.sort((a, b) => {
        const dateA = new Date(a.appointmentDate);
        const dateB = new Date(b.appointmentDate);
        return activeTab === "upcoming" ? dateA - dateB : dateB - dateA;
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

  // Get appropriate status badge based on tab context
  const getStatusBadge = (appointment) => {
    // For past tab, show "Completed" for passed appointments regardless of backend status
    if (activeTab === "past") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Completed
        </span>
      );
    }

    // For upcoming tab, show "Scheduled"
    if (activeTab === "upcoming") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700 border border-primary-200">
          <Clock className="w-3 h-3 mr-1" />
          Scheduled
        </span>
      );
    }

    // For cancelled tab, show based on actual status
    const badges = {
      cancelled: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
          <XCircle className="w-3 h-3 mr-1" />
          Cancelled
        </span>
      ),
      "no-show": (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
          <AlertCircle className="w-3 h-3 mr-1" />
          No Show
        </span>
      ),
      rescheduled: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
          <Clock className="w-3 h-3 mr-1" />
          Rescheduled
        </span>
      ),
    };

    return (
      badges[appointment.status] || (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
          <XCircle className="w-3 h-3 mr-1" />
          Cancelled
        </span>
      )
    );
  };

  // Check if appointment can be cancelled
  const canCancel = (appointment) => {
    if (appointment.status !== "scheduled") return false;
    if (isDatePast(appointment.appointmentDate)) return false;
    return true;
  };

  // Check if appointment can be rescheduled (more restrictive)
  const canReschedule = (appointment) => {
    if (appointment.status !== "scheduled") return false;
    if (isDatePast(appointment.appointmentDate)) return false;
    if (appointment.isWalkIn) return false;

    // Check reschedule limit
    const maxReschedules =
      appointment.businessId?.bookingSettings?.maxReschedulesPerAppointment ||
      2;
    if ((appointment.rescheduleCount || 0) >= maxReschedules) return false;

    return true;
  };

  // Legacy function for backward compatibility
  const canCancelOrReschedule = (appointment) => {
    return canCancel(appointment);
  };

  return (
    <>
      <EmailVerificationBanner />
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-brand font-bold text-gray-900">
              My Appointments
            </h1>
            <p className="text-gray-600 mt-1">
              View and manage your upcoming and past bookings.
            </p>
          </div>
          {activeTab === "upcoming" && (
            <div className="mt-4 md:mt-0">
              {/* Optional: Add a 'Book New' button here if desired */}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white p-1 rounded-xl shadow-sm border border-secondary-200 inline-flex mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-primary-600 text-white shadow-md relative z-10"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Appointments List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loading />
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-300">
            <div className="w-20 h-20 bg-primary-50 text-primary-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {activeTab === "upcoming" && "No upcoming appointments"}
              {activeTab === "past" && "No past appointments"}
              {activeTab === "cancelled" && "No cancelled appointments"}
            </h3>
            <p className="text-gray-500 max-w-sm mx-auto mb-8">
              {activeTab === "upcoming"
                ? "You don't have any appointments scheduled at the moment. Browse services to book your first appointment."
                : "Your appointment history will appear here once you have completed bookings."}
            </p>
            {activeTab === "upcoming" && (
              <Button variant="primary" onClick={() => navigate("/")}>
                Book an Appointment
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {appointments.map((appointment) => (
              <div
                key={appointment._id}
                className="group bg-white rounded-2xl p-6 border border-secondary-200 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Date Badge & Logo */}
                  <div className="flex  gap-4 md:block md:w-auto shrink-0">
                    <div className="hidden md:flex flex-col items-center justify-center w-24 h-24 bg-primary-50 rounded-xl border border-primary-100 mb-3 text-center shrink-0 overflow-hidden">
                      {appointment.businessId.logo ? (
                        <img
                          src={appointment.businessId.logo}
                          alt={appointment.businessId.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <>
                          <span className="text-primary-700 font-bold text-xl block">
                            {formatDate(appointment.appointmentDate, "d")}
                          </span>
                          <span className="text-primary-500 text-xs font-medium uppercase mt-1">
                            {formatDate(appointment.appointmentDate, "MMM")}
                          </span>
                        </>
                      )}
                    </div>
                    {/* Mobile Logo/Date Alternative */}
                    <div className="md:hidden w-16 h-16 rounded-xl bg-primary-50 flex items-center justify-center border border-primary-100 shrink-0 overflow-hidden">
                      {appointment.businessId.logo ? (
                        <img
                          src={appointment.businessId.logo}
                          alt={appointment.businessId.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-primary-600">
                          {appointment.businessId.name.charAt(0)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-y-2 mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary-700 transition-colors">
                          {appointment.serviceId.name}
                        </h3>
                        <p className="text-gray-600 font-medium flex items-center mt-1">
                          {appointment.businessId.name}
                        </p>
                      </div>
                      {getStatusBadge(appointment)}
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center p-2 rounded-lg bg-gray-50">
                        <Calendar className="w-4 h-4 mr-2.5 text-primary-500" />
                        <span className="font-medium">
                          {formatDate(
                            appointment.appointmentDate,
                            "EEEE, MMMM d, yyyy"
                          )}
                        </span>
                      </div>
                      <div className="flex items-center p-2 rounded-lg bg-gray-50">
                        <Clock className="w-4 h-4 mr-2.5 text-primary-500" />
                        <span className="font-medium">
                          {formatTime(appointment.startTime)} -{" "}
                          {formatTime(appointment.endTime)}
                        </span>
                      </div>
                      <div className="flex items-center p-2 rounded-lg bg-gray-50">
                        <User className="w-4 h-4 mr-2.5 text-primary-500" />
                        <span>With {appointment.staffId.name}</span>
                      </div>
                      <div className="flex items-center p-2 rounded-lg bg-gray-50">
                        <IndianRupee className="w-4 h-4 mr-2.5 text-primary-500" />
                        <span className="font-medium">
                          {appointment.serviceId.price}
                        </span>
                      </div>
                      {appointment.businessId.address && (
                        <div className="flex items-center p-2 rounded-lg bg-gray-50">
                          <MapPin className="w-4 h-4 mr-2.5 text-primary-500" />
                          <span className="truncate">
                            {appointment.businessId.address.street},{" "}
                            {appointment.businessId.address.city}
                          </span>
                        </div>
                      )}
                    </div>

                    {appointment.notes && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          <span className="font-medium">Your Note:</span>{" "}
                          {appointment.notes}
                        </p>
                      </div>
                    )}

                    {appointment.cancellationReason && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                        <p className="text-sm text-red-800">
                          <span className="font-medium">
                            Cancellation Reason:
                          </span>{" "}
                          {appointment.cancellationReason}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Footer */}
                {(canCancel(appointment) ||
                  canReschedule(appointment) ||
                  (appointment.status === "scheduled" &&
                    !isDatePast(appointment.appointmentDate) &&
                    !appointment.isWalkIn)) && (
                  <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-3">
                    {/* Reschedule Button or Limit Reached Badge */}
                    {canReschedule(appointment) ? (
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => handleReschedule(appointment)}
                        className="w-full sm:w-auto"
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Reschedule
                      </Button>
                    ) : (
                      // Show specific feedback if reschedule disabled due to limit (but otherwise valid)
                      (appointment.rescheduleCount || 0) >=
                        (appointment.businessId?.bookingSettings
                          ?.maxReschedulesPerAppointment || 2) &&
                      appointment.status === "scheduled" &&
                      !isDatePast(appointment.appointmentDate) &&
                      !appointment.isWalkIn && (
                        <div className="flex items-center justify-center px-4 py-2 bg-red-50 text-red-700 text-sm font-medium rounded-lg border border-red-100 opacity-75 cursor-not-allowed w-full sm:w-auto">
                          <AlertCircle className="w-4 h-4 mr-2" />
                          Reschedule Limit Reached
                        </div>
                      )
                    )}
                    {canCancel(appointment) && (
                      <Button
                        variant="danger"
                        size="small"
                        onClick={() => setCancelModal(appointment)}
                        className="w-full sm:w-auto"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    )}
                  </div>
                )}
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
            <div className="flex gap-3 justify-end w-full">
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
            </div>
          }
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to cancel this appointment? This action
              cannot be undone.
            </p>

            {cancelModal && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      {cancelModal.serviceId.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {cancelModal.businessId.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(cancelModal.appointmentDate, "MMM d")}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatTime(cancelModal.startTime)}
                    </p>
                  </div>
                </div>
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
                placeholder="E.g. Scheduling conflict, illness, etc."
                required
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0" />
              <p className="text-xs text-yellow-800">
                <strong>Policy:</strong> Cancellations made within 24 hours of
                the appointment time may be subject to a fee.
              </p>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
};

export default MyAppointments;
