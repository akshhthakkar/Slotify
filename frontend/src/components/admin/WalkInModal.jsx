import { useState, useEffect } from "react";
import { X, User, Calendar, Clock, FileText, Check } from "lucide-react";
import Button from "../common/Button";
import api from "../../utils/api";
import toast from "react-hot-toast";

const WalkInModal = ({ isOpen, onClose, onSuccess, services, staff }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    serviceId: "",
    staffId: "",
    walkInNotes: "",
  });

  // Reset form when opening
  useEffect(() => {
    if (isOpen) {
      setFormData({
        serviceId: "",
        staffId: "",
        walkInNotes: "",
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.serviceId) {
      toast.error("Please select a service");
      return;
    }

    try {
      setLoading(true);
      await api.post("/appointments/walk-in", formData);
      toast.success("Walk-in added successfully");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add walk-in");
    } finally {
      setLoading(false);
    }
  };

  const selectedService = services.find((s) => s._id === formData.serviceId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Add Walk-In</h2>
            <p className="text-xs text-gray-500">
              Record an instant appointment
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Service Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service <span className="text-red-500">*</span>
            </label>
            <select
              className="input w-full"
              value={formData.serviceId}
              onChange={(e) =>
                setFormData({ ...formData, serviceId: e.target.value })
              }
              required
            >
              <option value="">Select a service...</option>
              {services.map((service) => (
                <option key={service._id} value={service._id}>
                  {service.name} ({service.duration} min) - ₹{service.price}
                </option>
              ))}
            </select>
          </div>

          {/* Staff Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Staff (Optional)
            </label>
            <div className="relative">
              <select
                className="input w-full pl-9"
                value={formData.staffId}
                onChange={(e) =>
                  setFormData({ ...formData, staffId: e.target.value })
                }
              >
                <option value="">Any Available / Admin</option>
                {staff
                  .filter((member) => {
                    if (!selectedService) return true;
                    // Check if member.serviceIds contains the service ID (handle both strings and populated objects)
                    return member.serviceIds?.some((s) => {
                      const sId = typeof s === "object" ? s._id : s;
                      return (
                        sId?.toString() === selectedService._id?.toString()
                      );
                    });
                  })
                  .map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.name}
                    </option>
                  ))}
              </select>
              <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Leave empty if performed by you or unassigned.
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              className="input w-full"
              rows="3"
              placeholder="Customer name, special requests..."
              value={formData.walkInNotes}
              onChange={(e) =>
                setFormData({ ...formData, walkInNotes: e.target.value })
              }
            />
          </div>

          {/* Summary */}
          {selectedService && (
            <div className="bg-blue-50 p-3 rounded-lg flex items-start gap-2 text-sm text-blue-800">
              <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p>
                  <strong>Duration:</strong> {selectedService.duration} mins
                </p>
                <p>
                  <strong>Price:</strong> ₹{selectedService.price}
                </p>
                <p className="text-xs mt-1 opacity-80">
                  This appointment will be marked as <strong>Completed</strong>{" "}
                  immediately.
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={onClose}
              type="button"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              loading={loading}
              type="submit"
            >
              <Check className="w-4 h-4 mr-1" />
              Add Walk-In
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WalkInModal;
