import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Calendar as CalendarIcon,
  Clock,
  ArrowRight,
  User,
  AlertCircle,
  Info,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import api from "../utils/api";
import Button from "../components/common/Button";
import Loading from "../components/common/Loading";
import Modal from "../components/common/Modal";
import {
  formatDate,
  formatTime,
  getDateRange,
  toISODate,
} from "../utils/dateHelpers";
import toast from "react-hot-toast";

const RescheduleAppointment = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Modal states
  const [showConsentModal, setShowConsentModal] = useState(true); // Show on page load
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    fetchAppointment();
  }, [id]);

  useEffect(() => {
    if (selectedDate && appointment) {
      fetchAvailableSlots();
    }
  }, [selectedDate, selectedStaff, appointment]);

  const fetchAppointment = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/appointments/${id}`);
      const apt = response.data.appointment;
      setAppointment(apt);

      // Set current staff as default
      setSelectedStaff(apt.staffId);

      // Fetch staff for this service
      try {
        const staffRes = await api.get(`/staff/public/${apt.businessId._id}`);
        const allStaff = staffRes.data.staff || [];
        // Filter staff who can perform this service
        const serviceStaff = allStaff.filter(
          (s) =>
            s.serviceIds?.some(
              (svcId) =>
                (svcId._id || svcId).toString() === apt.serviceId._id.toString()
            ) && s.isActive !== false
        );
        setStaffList(serviceStaff);
      } catch (staffError) {
        console.log("Staff fetch failed:", staffError);
        setStaffList([]);
      }
    } catch (error) {
      toast.error("Failed to load appointment");
      navigate("/my-appointments");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      setLoadingSlots(true);
      const params = {
        businessId: appointment.businessId._id,
        serviceId: appointment.serviceId._id,
        date: toISODate(selectedDate),
      };

      // If specific staff selected, filter by that staff
      if (selectedStaff && selectedStaff._id) {
        params.staffId = selectedStaff._id;
      }

      const response = await api.get("/appointments/available-slots", {
        params,
      });
      setAvailableSlots(response.data.slots || []);
    } catch (error) {
      toast.error("Failed to load available slots");
      console.error(error);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleProceedToReschedule = () => {
    setShowConsentModal(false);
  };

  const handleCancelConsent = () => {
    navigate("/my-appointments");
  };

  const handleConfirmReschedule = () => {
    setShowConfirmModal(true);
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error("Please select a new date and time");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        newDate: toISODate(selectedDate),
        newStartTime: selectedTime.startTime,
      };

      // Include new staff if changed
      if (selectedStaff && selectedStaff._id !== appointment.staffId._id) {
        payload.newStaffId = selectedStaff._id;
      }

      await api.post(`/appointments/${id}/reschedule`, payload);

      toast.success("Appointment rescheduled successfully!");
      navigate("/my-appointments");
    } catch (error) {
      const errorCode = error.response?.data?.errorCode;
      const errorMessage = error.response?.data?.message;

      // Slot aging errors - refresh slots and show specific message
      const slotAgingErrors = [
        "SLOT_PAST",
        "SLOT_TOO_SOON",
        "SLOT_BOOKED",
        "SLOT_TOO_FAR",
        "SLOT_NOT_FOUND",
      ];

      if (slotAgingErrors.includes(errorCode)) {
        toast.error(
          errorMessage || "Slot is no longer available. Refreshing..."
        );
        setSelectedTime(null);
        fetchAvailableSlots(); // Refresh slots to show updated state
      } else if (errorCode === "RESCHEDULE_WINDOW_VIOLATION") {
        toast.error(errorMessage || "Cannot reschedule at this time");
      } else {
        toast.error(errorMessage || "Failed to reschedule appointment");
      }

      setShowConfirmModal(false);
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const getRemainingReschedules = () => {
    if (!appointment?.businessId?.bookingSettings) return null;
    const max =
      appointment.businessId.bookingSettings.maxReschedulesPerAppointment || 2;
    const used = appointment.rescheduleCount || 0;
    return max - used;
  };

  if (loading) return <Loading fullscreen />;
  if (!appointment) return null;

  const remainingReschedules = getRemainingReschedules();

  // BLOCKING LOGIC: If limit reached, prevent any further action
  if (remainingReschedules !== null && remainingReschedules <= 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-brand font-bold text-gray-900 mb-6">
          Reschedule Appointment
        </h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="w-12 h-12 text-red-600" />
          </div>
          <h2 className="text-red-800 font-bold text-xl mb-2">
            Reschedule Limit Reached
          </h2>
          <p className="text-red-600 mb-6">
            You have reached the maximum number of allowed reschedules for this
            appointment. Please contact the business directly if you need
            further assistance.
          </p>
          <Button
            onClick={() => navigate("/my-appointments")}
            variant="secondary"
          >
            Back to Appointments
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Consent Modal - "Before You Reschedule" */}
      <Modal
        isOpen={showConsentModal}
        onClose={handleCancelConsent}
        title="Before You Reschedule"
        closeOnBackdrop={false}
        footer={
          <>
            <Button variant="secondary" onClick={handleCancelConsent}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleProceedToReschedule}>
              I Understand, Continue
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-blue-900 font-medium mb-2">
                Please read before continuing:
              </p>
              <ul className="space-y-2 text-blue-800 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>
                    Rescheduling will change your appointment's{" "}
                    <strong>date, time, or staff</strong>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <span>
                    The <strong>service cannot be changed</strong> — you'll need
                    to cancel and book again for a different service
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Availability depends on real-time slots</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <span>
                    The number of allowed reschedules is{" "}
                    <strong>limited</strong>
                    {remainingReschedules !== null && (
                      <span> ({remainingReschedules} remaining)</span>
                    )}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>
                    Once confirmed, the old slot will be released for others
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <p className="text-gray-700 text-center font-medium pt-2">
            Do you want to continue?
          </p>
        </div>
      </Modal>

      {/* Final Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Reschedule"
        closeOnBackdrop={false}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowConfirmModal(false)}
              disabled={submitting}
            >
              Go Back
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={submitting}
            >
              Confirm Reschedule
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            You are about to reschedule your appointment:
          </p>

          <div className="p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  From
                </p>
                <p className="font-medium text-gray-900 line-through opacity-60">
                  {formatDate(appointment.appointmentDate, "MMM d, yyyy")}
                </p>
                <p className="font-medium text-gray-900 line-through opacity-60">
                  {formatTime(appointment.startTime)}
                </p>
                <p className="text-sm text-gray-600">
                  {appointment.staffId.name}
                </p>
              </div>

              <ArrowRight className="w-8 h-8 text-primary-500 mx-4" />

              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  To
                </p>
                <p className="font-semibold text-primary-600">
                  {selectedDate && formatDate(selectedDate, "MMM d, yyyy")}
                </p>
                <p className="font-semibold text-primary-600">
                  {selectedTime && formatTime(selectedTime.startTime)}
                </p>
                <p className="text-sm text-primary-600">
                  {selectedStaff?.name || appointment.staffId.name}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              This action cannot be undone automatically. You will receive a
              confirmation email once the reschedule is complete.
            </p>
          </div>
        </div>
      </Modal>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-brand font-bold text-gray-900 mb-2">
          Reschedule Appointment
        </h1>

        <p className="text-gray-600 mb-6">
          Change the date, time, or staff for your appointment.
        </p>

        {/* Reschedule Count Warning */}
        {remainingReschedules !== null && remainingReschedules <= 1 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-yellow-800 font-medium">
                {remainingReschedules === 0
                  ? "No reschedules remaining"
                  : `Only ${remainingReschedules} reschedule remaining`}
              </p>
              <p className="text-yellow-700 text-sm mt-1">
                {remainingReschedules === 0
                  ? "You have reached the maximum reschedule limit for this appointment."
                  : "After this, you will not be able to reschedule again."}
              </p>
            </div>
          </div>
        )}

        {/* Current Appointment */}
        <div className="card mb-6 bg-gray-50 border border-gray-200">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Info className="w-5 h-5 mr-2 text-gray-500" />
            Current Appointment
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <span className="text-gray-600 text-sm">Service</span>
              <p className="font-medium text-gray-900">
                {appointment.serviceId.name}
              </p>
            </div>
            <div>
              <span className="text-gray-600 text-sm">Business</span>
              <p className="font-medium text-gray-900">
                {appointment.businessId.name}
              </p>
            </div>
            <div>
              <span className="text-gray-600 text-sm">Current Staff</span>
              <p className="font-medium text-gray-900">
                {appointment.staffId.name}
              </p>
            </div>
            <div>
              <span className="text-gray-600 text-sm">Current Date & Time</span>
              <p className="font-medium text-gray-900">
                {formatDate(appointment.appointmentDate, "MMM d, yyyy")} at{" "}
                {formatTime(appointment.startTime)}
              </p>
            </div>
          </div>
        </div>

        {/* Staff Selection */}
        {staffList.length > 0 && (
          <div className="card mb-6">
            <h2 className="text-lg font-semibold mb-4">
              Select Staff (Optional)
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {staffList.map((staff) => {
                const isSelected = selectedStaff?._id === staff._id;
                return (
                  <button
                    key={staff._id}
                    onClick={() => {
                      setSelectedStaff(staff);
                      setSelectedTime(null); // Reset time when staff changes
                    }}
                    className={`p-4 border-2 rounded-lg text-left transition-colors ${
                      isSelected
                        ? "border-primary-600 bg-primary-50"
                        : "hover:border-primary-500"
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-primary-600 font-semibold">
                          {staff.name?.charAt(0) || "S"}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {staff.name}
                        </p>
                        {staff.specialization && (
                          <p className="text-xs text-gray-500">
                            {staff.specialization}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* New Date Selection */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">Select New Date</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {getDateRange(30).map((date) => {
              const isSelected =
                selectedDate && toISODate(date) === toISODate(selectedDate);
              return (
                <button
                  key={date.toISOString()}
                  onClick={() => {
                    setSelectedDate(date);
                    setSelectedTime(null);
                  }}
                  className={`p-3 border-2 rounded-lg transition-colors ${
                    isSelected
                      ? "border-primary-600 bg-primary-50"
                      : "hover:border-primary-500"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-xs text-gray-600">
                      {formatDate(date, "EEE")}
                    </div>
                    <div className="text-xl font-bold">
                      {formatDate(date, "d")}
                    </div>
                    <div className="text-xs text-gray-600">
                      {formatDate(date, "MMM")}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Selection */}
        {selectedDate && (
          <div className="card mb-6">
            <h2 className="text-lg font-semibold mb-2">Select New Time</h2>
            <p className="text-gray-600 text-sm mb-4">
              {formatDate(selectedDate, "EEEE, MMMM d, yyyy")}
              {selectedStaff && ` • With ${selectedStaff.name}`}
            </p>

            {loadingSlots ? (
              <Loading />
            ) : availableSlots.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 mb-2">
                  No available slots for this date
                </p>
                <p className="text-gray-400 text-sm">
                  Please choose another date or staff member.
                </p>
              </div>
            ) : (
              <>
                {/* Legend */}
                <div className="flex flex-wrap gap-4 mb-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded border-2 border-primary-500 bg-white"></div>
                    <span className="text-gray-600">Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-amber-100 border-2 border-amber-300"></div>
                    <span className="text-gray-600">Too Soon</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gray-200"></div>
                    <span className="text-gray-600">Booked</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gray-100"></div>
                    <span className="text-gray-600">Past</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 md:grid-cols-5 gap-3 max-h-80 overflow-y-auto">
                  {availableSlots.map((slot, index) => {
                    const isSelected =
                      selectedTime?.startTime === slot.startTime;
                    const isAvailable = slot.status === "available";
                    const isBooked = slot.status === "booked";
                    const isPast = slot.status === "past";
                    const isTooSoon = slot.status === "too-soon";
                    const isTooFar = slot.status === "too-far";

                    return (
                      <button
                        key={index}
                        onClick={() => isAvailable && setSelectedTime(slot)}
                        disabled={!isAvailable}
                        className={`p-3 border-2 rounded-lg transition-colors flex flex-col items-center justify-center ${
                          isSelected
                            ? "border-primary-600 bg-primary-50"
                            : isAvailable
                            ? "hover:border-primary-500 cursor-pointer bg-white"
                            : isTooSoon
                            ? "bg-amber-50 border-amber-200 cursor-not-allowed opacity-80"
                            : isTooFar
                            ? "bg-purple-50 border-purple-200 cursor-not-allowed opacity-80"
                            : isBooked
                            ? "bg-gray-200 border-gray-200 cursor-not-allowed opacity-75"
                            : "bg-gray-100 border-gray-100 cursor-not-allowed opacity-50"
                        }`}
                      >
                        <div
                          className={`text-center font-medium text-sm ${
                            isAvailable
                              ? "text-gray-900"
                              : isTooSoon
                              ? "text-amber-700"
                              : isTooFar
                              ? "text-purple-700"
                              : "text-gray-500"
                          }`}
                        >
                          {formatTime(slot.startTime)}
                        </div>
                        {isTooSoon && (
                          <div className="text-xs text-amber-600 font-medium mt-1">
                            Too Soon
                          </div>
                        )}
                        {isTooFar && (
                          <div className="text-xs text-purple-600 font-medium mt-1">
                            Too Far
                          </div>
                        )}
                        {isBooked && (
                          <div className="text-xs text-red-500 font-medium mt-1">
                            Booked
                          </div>
                        )}
                        {isPast && (
                          <div className="text-xs text-gray-400 mt-1">Past</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Changes Summary */}
        {selectedDate && selectedTime && (
          <div className="card mb-6 bg-blue-50 border-blue-200">
            <h2 className="text-lg font-semibold mb-4 text-blue-900">
              Changes Summary
            </h2>
            <div className="flex items-center justify-between text-sm">
              <div className="flex-1">
                <p className="text-gray-600 mb-1">Current</p>
                <p className="font-medium text-gray-900">
                  {formatDate(appointment.appointmentDate, "MMM d, yyyy")}
                </p>
                <p className="font-medium text-gray-900">
                  {formatTime(appointment.startTime)}
                </p>
                <p className="text-gray-600 text-sm">
                  {appointment.staffId.name}
                </p>
              </div>
              <ArrowRight className="w-6 h-6 text-blue-600 mx-4" />
              <div className="flex-1 text-right">
                <p className="text-gray-600 mb-1">New</p>
                <p className="font-medium text-primary-600">
                  {formatDate(selectedDate, "MMM d, yyyy")}
                </p>
                <p className="font-medium text-primary-600">
                  {formatTime(selectedTime.startTime)}
                </p>
                <p className="text-primary-600 text-sm">
                  {selectedStaff?.name || appointment.staffId.name}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            variant="secondary"
            onClick={() => navigate("/my-appointments")}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirmReschedule}
            disabled={
              !selectedDate || !selectedTime || remainingReschedules === 0
            }
            className="flex-1"
          >
            Reschedule Appointment
          </Button>
        </div>

        {/* Policy Warning */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0" />
          <p className="text-sm text-yellow-800">
            <strong>Policy:</strong> Rescheduling policies may apply. Please
            review the business's rescheduling policy before confirming.
            {appointment.businessId.bookingSettings?.rescheduleWindow && (
              <span>
                {" "}
                You must reschedule at least{" "}
                {appointment.businessId.bookingSettings.rescheduleWindow} hours
                in advance.
              </span>
            )}
          </p>
        </div>
      </div>
    </>
  );
};

export default RescheduleAppointment;
