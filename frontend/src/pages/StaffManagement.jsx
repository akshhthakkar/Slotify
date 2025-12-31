import { useState, useEffect } from "react";
import api from "../utils/api";
import Loading from "../components/common/Loading";
import Modal from "../components/common/Modal";
import Button from "../components/common/Button";
import { Plus, Edit2, Trash2, Mail, User, Calendar } from "lucide-react";
import toast from "react-hot-toast";

const StaffManagement = () => {
  const [staff, setStaff] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const [formData, setFormData] = useState({
    email: "",
    name: "",
    phone: "",
    password: "",
    specialization: "",
    serviceIds: [],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [staffRes, servicesRes] = await Promise.all([
        api.get("/staff"),
        api.get("/services"),
      ]);
      setStaff(staffRes.data.staff || []);
      setServices(servicesRes.data.services || []);
    } catch (error) {
      toast.error("Failed to load staff data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: "",
      name: "",
      phone: "",
      password: "",
      specialization: "",
      serviceIds: [],
    });
    setEditingStaff(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (member) => {
    setFormData({
      email: member.userId?.email || "",
      name: member.userId?.name || "",
      phone: member.userId?.phone || "",
      password: "", // Don't populate password for security
      specialization: member.specialization || "",
      serviceIds: member.serviceIds?.map((s) => s._id || s) || [],
    });
    setEditingStaff(member);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editingStaff) {
        await api.put(`/staff/${editingStaff._id}`, {
          specialization: formData.specialization,
          serviceIds: formData.serviceIds,
        });
        toast.success("Staff updated successfully");
      } else {
        await api.post("/staff", {
          email: formData.email,
          name: formData.name,
          phone: formData.phone,
          password: formData.password,
          specialization: formData.specialization,
          serviceIds: formData.serviceIds,
        });
        toast.success("Staff member added successfully!");
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save staff");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (staffId) => {
    if (!confirm("Are you sure you want to remove this staff member?")) return;

    try {
      setDeleting(staffId);
      await api.delete(`/staff/${staffId}`);
      toast.success("Staff member removed");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove staff");
    } finally {
      setDeleting(null);
    }
  };

  const toggleService = (serviceId) => {
    setFormData((prev) => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(serviceId)
        ? prev.serviceIds.filter((id) => id !== serviceId)
        : [...prev.serviceIds, serviceId],
    }));
  };

  if (loading) return <Loading fullscreen text="Loading staff..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff</h1>
          <p className="text-gray-600 mt-1">Manage your team members</p>
        </div>
        <Button variant="primary" onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-2" />
          Add Staff
        </Button>
      </div>

      {staff.length === 0 ? (
        <div className="card text-center py-16">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No staff members yet
          </h2>
          <p className="text-gray-600 mb-6">
            Invite team members to help manage appointments
          </p>
          <Button variant="primary" onClick={openCreateModal}>
            <Plus className="w-4 h-4 mr-2" />
            Invite Your First Staff Member
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {staff.map((member) => (
            <div key={member._id} className="card">
              <div className="flex items-start gap-4 mb-4">
                {member.userId?.profilePicture ? (
                  <img
                    src={member.userId.profilePicture}
                    alt={member.userId.name}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-xl font-bold text-primary-600">
                      {member.userId?.name?.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {member.userId?.name}
                  </h3>
                  <p className="text-sm text-gray-600 truncate">
                    {member.userId?.email}
                  </p>
                  {member.specialization && (
                    <p className="text-sm text-primary-600 mt-1">
                      {member.specialization}
                    </p>
                  )}
                </div>
              </div>

              {member.serviceIds?.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">
                    Assigned Services:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {member.serviceIds.slice(0, 3).map((service) => (
                      <span
                        key={service._id || service}
                        className="badge badge-info text-xs"
                      >
                        {service.name || "Service"}
                      </span>
                    ))}
                    {member.serviceIds.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{member.serviceIds.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <span
                  className={`text-sm ${
                    member.isActive ? "text-green-600" : "text-gray-500"
                  }`}
                >
                  {member.isActive ? "Active" : "Inactive"}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(member)}
                    className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(member._id)}
                    disabled={deleting === member._id}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingStaff ? "Edit Staff Member" : "Add Staff Member"}
        size="medium"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} loading={saving}>
              {editingStaff ? "Save Changes" : "Create Staff Member"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingStaff && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    className="input pl-10"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="staff@example.com"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
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
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    className="input"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+1234567890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    className="input"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="Set initial password"
                  />
                </div>
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">
              Specialization
            </label>
            <input
              type="text"
              className="input"
              value={formData.specialization}
              onChange={(e) =>
                setFormData({ ...formData, specialization: e.target.value })
              }
              placeholder="e.g., Senior Stylist, Massage Therapist"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Assigned Services
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
              {services.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No services available. Create services first.
                </p>
              ) : (
                services.map((service) => (
                  <label
                    key={service._id}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.serviceIds.includes(service._id)}
                      onChange={() => toggleService(service._id)}
                      className="rounded text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm">{service.name}</span>
                    <span className="text-xs text-gray-500">
                      ${service.price}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StaffManagement;
