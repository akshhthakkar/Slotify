import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import Loading from '../components/common/Loading';
import Button from '../components/common/Button';
import { Settings, Clock, Calendar, Image, Store, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const BusinessSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [business, setBusiness] = useState(null);
  const [activeTab, setActiveTab] = useState('general');

  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    description: '',
    contactEmail: '',
    contactPhone: '',
    website: ''
  });

  const [bookingSettings, setBookingSettings] = useState({
    minAdvanceTime: 1,
    maxAdvanceTime: 90,
    cancellationWindow: 24,
    rescheduleWindow: 24,
    maxReschedulesPerAppointment: 2,
    allowWalkIns: true
  });

  const tabs = [
    { id: 'general', label: 'General', icon: Store },
    { id: 'booking', label: 'Booking Policies', icon: Calendar },
    { id: 'hours', label: 'Working Hours', icon: Clock },
  ];

  useEffect(() => {
    fetchBusiness();
  }, []);

  const fetchBusiness = async () => {
    try {
      setLoading(true);
      const response = await api.get('/business');
      const businessData = response.data.business;
      setBusiness(businessData);
      
      if (businessData) {
        setFormData({
          name: businessData.name || '',
          tagline: businessData.tagline || '',
          description: businessData.description || '',
          contactEmail: businessData.contactEmail || '',
          contactPhone: businessData.contactPhone || '',
          website: businessData.website || ''
        });
        setBookingSettings(businessData.bookingSettings || bookingSettings);
      }
    } catch (error) {
      console.error('Error loading business:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneralSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.put(`/business/${business._id}`, formData);
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.put(`/business/${business._id}/settings`, { bookingSettings });
      toast.success('Booking policies saved');
    } catch (error) {
      toast.error('Failed to save booking policies');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading fullscreen text="Loading settings..." />;

  if (!business) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Store className="w-20 h-20 text-gray-400 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">No Business Found</h1>
        <p className="text-gray-600 mb-8">
          You need to set up your business first.
        </p>
        <Link to="/admin/onboarding">
          <Button variant="primary" size="large">
            Start Business Setup
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Business Settings</h1>
        <p className="text-gray-600 mt-1">Manage your business configuration</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="card p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-primary-50 text-primary-600' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="card">
              <h2 className="text-xl font-bold mb-6">General Information</h2>
              <form onSubmit={handleGeneralSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Business Name</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tagline</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.tagline}
                    onChange={(e) => setFormData({...formData, tagline: e.target.value})}
                    placeholder="Short description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    className="input"
                    rows="4"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Contact Email</label>
                    <input
                      type="email"
                      className="input"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Contact Phone</label>
                    <input
                      type="tel"
                      className="input"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Website</label>
                  <input
                    type="url"
                    className="input"
                    value={formData.website}
                    onChange={(e) => setFormData({...formData, website: e.target.value})}
                    placeholder="https://your-website.com"
                  />
                </div>
                <Button type="submit" variant="primary" loading={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </form>
            </div>
          )}

          {/* Booking Policies */}
          {activeTab === 'booking' && (
            <div className="card">
              <h2 className="text-xl font-bold mb-6">Booking Policies</h2>
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Min Advance Booking (hours)</label>
                    <input
                      type="number"
                      className="input"
                      value={bookingSettings.minAdvanceTime}
                      onChange={(e) => setBookingSettings({...bookingSettings, minAdvanceTime: parseInt(e.target.value)})}
                      min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">How far in advance must bookings be made</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Max Advance Booking (days)</label>
                    <input
                      type="number"
                      className="input"
                      value={bookingSettings.maxAdvanceTime}
                      onChange={(e) => setBookingSettings({...bookingSettings, maxAdvanceTime: parseInt(e.target.value)})}
                      min="1"
                    />
                    <p className="text-xs text-gray-500 mt-1">How far ahead can bookings be made</p>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Cancellation Window (hours)</label>
                    <input
                      type="number"
                      className="input"
                      value={bookingSettings.cancellationWindow}
                      onChange={(e) => setBookingSettings({...bookingSettings, cancellationWindow: parseInt(e.target.value)})}
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Reschedule Window (hours)</label>
                    <input
                      type="number"
                      className="input"
                      value={bookingSettings.rescheduleWindow}
                      onChange={(e) => setBookingSettings({...bookingSettings, rescheduleWindow: parseInt(e.target.value)})}
                      min="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max Reschedules Per Appointment</label>
                  <input
                    type="number"
                    className="input"
                    value={bookingSettings.maxReschedulesPerAppointment}
                    onChange={(e) => setBookingSettings({...bookingSettings, maxReschedulesPerAppointment: parseInt(e.target.value)})}
                    min="0"
                    max="10"
                  />
                </div>
                <div className="flex items-center gap-3 py-3">
                  <button
                    type="button"
                    onClick={() => setBookingSettings({...bookingSettings, allowWalkIns: !bookingSettings.allowWalkIns})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      bookingSettings.allowWalkIns ? 'bg-primary-600' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      bookingSettings.allowWalkIns ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                  <span className="text-sm font-medium">Allow Walk-ins</span>
                </div>
                <Button type="submit" variant="primary" loading={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Policies
                </Button>
              </form>
            </div>
          )}

          {/* Working Hours */}
          {activeTab === 'hours' && (
            <div className="card">
              <h2 className="text-xl font-bold mb-6">Working Hours</h2>
              <p className="text-gray-600 mb-4">
                To update working hours, please use the business onboarding flow.
              </p>
              <Link to="/admin/onboarding">
                <Button variant="outline">
                  <Clock className="w-4 h-4 mr-2" />
                  Update Working Hours
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessSettings;
