import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Loading from '../components/common/Loading';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import { formatDuration } from '../utils/dateHelpers';
import { Plus, Edit2, Trash2, Clock, DollarSign, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';

const ServicesManagement = () => {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    duration: 60,
    price: 0,
    bufferTime: 0
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await api.get('/services');
      setServices(response.data.services || []);
    } catch (error) {
      toast.error('Failed to load services');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      duration: 60,
      price: 0,
      bufferTime: 0
    });
    setEditingService(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (service) => {
    setFormData({
      name: service.name,
      description: service.description || '',
      category: service.category || '',
      duration: service.duration,
      price: service.price,
      bufferTime: service.bufferTime || 0
    });
    setEditingService(service);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editingService) {
        await api.put(`/services/${editingService._id}`, formData);
        toast.success('Service updated successfully');
      } else {
        await api.post('/services', formData);
        toast.success('Service created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchServices();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save service');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (service) => {
    try {
      await api.patch(`/services/${service._id}/toggle`);
      toast.success(`Service ${service.isActive ? 'deactivated' : 'activated'}`);
      fetchServices();
    } catch (error) {
      toast.error('Failed to update service status');
    }
  };

  const handleDelete = async (serviceId) => {
    try {
      setDeleting(serviceId);
      await api.delete(`/services/${serviceId}`);
      toast.success('Service deleted');
      fetchServices();
    } catch (error) {
      toast.error('Failed to delete service');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return <Loading fullscreen text="Loading services..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Services</h1>
          <p className="text-gray-600 mt-1">Manage your service offerings</p>
        </div>
        <Button variant="primary" onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-2" />
          Add Service
        </Button>
      </div>

      {services.length === 0 ? (
        <div className="card text-center py-16">
          <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No services yet</h2>
          <p className="text-gray-600 mb-6">Add your first service to start accepting bookings</p>
          <Button variant="primary" onClick={openCreateModal}>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Service
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div 
              key={service._id} 
              className={`card ${!service.isActive ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                  {service.category && (
                    <span className="text-sm text-gray-500">{service.category}</span>
                  )}
                </div>
                <span className="text-xl font-bold text-primary-600">${service.price}</span>
              </div>
              
              {service.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{service.description}</p>
              )}

              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {formatDuration(service.duration)}
                </span>
                {service.bufferTime > 0 && (
                  <span className="text-gray-400">+{service.bufferTime}min buffer</span>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <button
                  onClick={() => handleToggleStatus(service)}
                  className={`flex items-center text-sm ${
                    service.isActive ? 'text-green-600' : 'text-gray-500'
                  }`}
                >
                  {service.isActive ? (
                    <><ToggleRight className="w-5 h-5 mr-1" /> Active</>
                  ) : (
                    <><ToggleLeft className="w-5 h-5 mr-1" /> Inactive</>
                  )}
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(service)}
                    className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(service._id)}
                    disabled={deleting === service._id}
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
        title={editingService ? 'Edit Service' : 'Add New Service'}
        size="medium"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} loading={saving}>
              {editingService ? 'Save Changes' : 'Create Service'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Service Name *</label>
            <input
              type="text"
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              className="input"
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <input
              type="text"
              className="input"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              placeholder="e.g., Haircut, Massage, Consultation"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Duration (minutes) *</label>
              <input
                type="number"
                className="input"
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                min="5"
                max="480"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Price ($) *</label>
              <input
                type="number"
                className="input"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Buffer Time (minutes)</label>
            <input
              type="number"
              className="input"
              value={formData.bufferTime}
              onChange={(e) => setFormData({...formData, bufferTime: parseInt(e.target.value)})}
              min="0"
              max="60"
            />
            <p className="text-xs text-gray-500 mt-1">Time between appointments for preparation</p>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ServicesManagement;
