import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import Button from "../common/Button";

const CANCELLATION_REASONS = [
  "Customer request",
  "Staff unavailable",
  "Emergency closure",
  "Double booking",
  "Other",
];

const CancelAppointmentModal = ({ appointment, onCancel, onClose }) => {
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    const finalReason = reason === "Other" ? customReason : reason;
    if (!finalReason.trim()) {
      return;
    }
    setLoading(true);
    await onCancel(appointment._id, finalReason);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Cancel Appointment
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-start gap-3 p-3 bg-yellow-50 text-yellow-800 rounded-lg">
            <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Customer will be notified</p>
              <p className="text-yellow-700">
                An email will be sent to {appointment.customerId?.name}{" "}
                informing them of this cancellation.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cancellation Reason <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Select a reason...</option>
              {CANCELLATION_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {reason === "Other" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Custom Reason
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Please specify the reason..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={2}
              />
            </div>
          )}

          <div className="bg-gray-50 -mx-4 -mb-4 px-4 py-3 mt-4 border-t rounded-b-xl flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose} disabled={loading}>
              Keep Appointment
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirm}
              loading={loading}
              disabled={!reason || (reason === "Other" && !customReason.trim())}
            >
              Cancel Appointment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancelAppointmentModal;
