import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Check, Upload, X } from 'lucide-react';
import api from '../utils/api';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';

const BusinessOnboarding = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [businessId, setBusinessId] = useState(null);
  const [loading, setLoading] = useState(false);

  const [basicInfo, setBasicInfo] = useState({
    name: '',
    tagline: '',
    description: '',
    category: 'beauty',
    subcategory: '',
    contactEmail: user?.email || '',
    contactPhone: '',
    contactCountryCode: '+1'
  });

  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    landmark: '',
    instructions: ''
  });

  const [images, setImages] = useState({
    logo: null,
    coverPhoto: null,
    gallery: []
  });

  const [workingHours, setWorkingHours] = useState({
    monday: { isOpen: true, slots: [{ start: '09:00', end: '17:00' }], breaks: [] },
    tuesday: { isOpen: true, slots: [{ start: '09:00', end: '17:00' }], breaks: [] },
    wednesday: { isOpen: true, slots: [{ start: '09:00', end: '17:00' }], breaks: [] },
    thursday: { isOpen: true, slots: [{ start: '09:00', end: '17:00' }], breaks: [] },
    friday: { isOpen: true, slots: [{ start: '09:00', end: '17:00' }], breaks: [] },
    saturday: { isOpen: false, slots: [], breaks: [] },
    sunday: { isOpen: false, slots: [], breaks: [] }
  });

  const [bookingSettings, setBookingSettings] = useState({
    minAdvanceTime: 1,
    maxAdvanceTime: 90,
    cancellationWindow: 24,
    rescheduleWindow: 24,
    maxReschedulesPerAppointment: 2,
    requiresCustomerApproval: false,
    allowWalkIns: true
  });

  const steps = [
    { number: 1, name: 'Basic Info' },
    { number: 2, name: 'Location' },
    { number: 3, name: 'Branding' },
    { number: 4, name: 'Hours' },
    { number: 5, name: 'Verification' },
    { number: 6, name: 'Policies' }
  ];

  const categories = [
    { value: 'beauty', label: 'Beauty & Spa' },
    { value: 'health', label: 'Health & Wellness' },
    { value: 'professional', label: 'Professional Services' },
    { value: 'automotive', label: 'Automotive' },
    { value: 'home', label: 'Home Services' }
  ];

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await api.post('/business', basicInfo);
      setBusinessId(response.data.business._id);
      updateUser({ ...user, businessId: response.data.business._id, role: 'admin' });
      await api.put(`/business/${response.data.business._id}/onboarding`, { step: 1 });
      setCurrentStep(2);
      toast.success('Business created!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create business');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.put(`/business/${businessId}`, { address });
      await api.put(`/business/${businessId}/onboarding`, { step: 2 });
      setCurrentStep(3);
      toast.success('Location saved!');
    } catch (error) {
      toast.error('Failed to save location');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file, type) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        await api.post(`/business/${businessId}/images`, {
          image: reader.result,
          type
        });
        toast.success('Image uploaded!');
        if (type === 'logo') setImages(prev => ({ ...prev, logo: reader.result }));
        if (type === 'cover') setImages(prev => ({ ...prev, coverPhoto: reader.result }));
        if (type === 'gallery') setImages(prev => ({ ...prev, gallery: [...prev.gallery, reader.result] }));
      } catch (error) {
        toast.error('Failed to upload image');
      }
    };
  };

  const handleStep3Submit = async () => {
    try {
      setLoading(true);
      await api.put(`/business/${businessId}/onboarding`, { step: 3 });
      setCurrentStep(4);
      toast.success('Images saved!');
    } catch (error) {
      toast.error('Failed to proceed');
    } finally {
      setLoading(false);
    }
  };

  const handleStep4Submit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.put(`/business/${businessId}/hours`, { workingHours });
      await api.put(`/business/${businessId}/onboarding`, { step: 4 });
      setCurrentStep(5);
      toast.success('Working hours saved!');
    } catch (error) {
      toast.error('Failed to save hours');
    } finally {
      setLoading(false);
    }
  };

  const handleStep5Submit = () => {
    setCurrentStep(6);
  };

  const handleStep6Submit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.put(`/business/${businessId}/settings`, { bookingSettings });
      await api.put(`/business/${businessId}/onboarding`, { 
        step: 6, 
        data: { onboardingCompleted: true } 
      });
      toast.success('Onboarding complete!');
      navigate('/admin/dashboard');
    } catch (error) {
      toast.error('Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  const toggleDayOpen = (day) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: { ...prev[day], isOpen: !prev[day].isOpen }
    }));
  };

  const updateSlot = (day, index, field, value) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.map((slot, i) => 
          i === index ? { ...slot, [field]: value } : slot
        )
      }
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Business Onboarding</h1>
        <p className="text-gray-600 mb-8">Let's set up your business profile</p>

        {/* Progress Steps */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex items-center justify-between min-w-max">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step.number < currentStep ? 'bg-green-500 text-white' :
                    step.number === currentStep ? 'bg-primary-600 text-white' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {step.number < currentStep ? <Check className="w-5 h-5" /> : step.number}
                  </div>
                  <span className="text-xs mt-2 text-gray-600">{step.name}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-0.5 w-16 mx-2 ${step.number < currentStep ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <form onSubmit={handleStep1Submit} className="card">
            <h2 className="text-2xl font-bold mb-6">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Business Name *</label>
                <input
                  type="text"
                  className="input"
                  value={basicInfo.name}
                  onChange={(e) => setBasicInfo({...basicInfo, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tagline</label>
                <input
                  type="text"
                  className="input"
                  value={basicInfo.tagline}
                  onChange={(e) => setBasicInfo({...basicInfo, tagline: e.target.value})}
                  placeholder="Short description of your business"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description *</label>
                <textarea
                  className="input"
                  rows="4"
                  value={basicInfo.description}
                  onChange={(e) => setBasicInfo({...basicInfo, description: e.target.value})}
                  required
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category *</label>
                  <select
                    className="input"
                    value={basicInfo.category}
                    onChange={(e) => setBasicInfo({...basicInfo, category: e.target.value})}
                    required
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Subcategory</label>
                  <input
                    type="text"
                    className="input"
                    value={basicInfo.subcategory}
                    onChange={(e) => setBasicInfo({...basicInfo, subcategory: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Contact Email *</label>
                <input
                  type="email"
                  className="input"
                  value={basicInfo.contactEmail}
                  onChange={(e) => setBasicInfo({...basicInfo, contactEmail: e.target.value})}
                  required
                />
              </div>
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Code</label>
                  <input
                    type="text"
                    className="input"
                    value={basicInfo.contactCountryCode}
                    onChange={(e) => setBasicInfo({...basicInfo, contactCountryCode: e.target.value})}
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="tel"
                    className="input"
                    value={basicInfo.contactPhone}
                    onChange={(e) => setBasicInfo({...basicInfo, contactPhone: e.target.value})}
                  />
                </div>
              </div>
              <Button type="submit" variant="primary" size="large" loading={loading} className="w-full">
                Next Step
              </Button>
            </div>
          </form>
        )}

        {/* Step 2: Location */}
        {currentStep === 2 && (
          <form onSubmit={handleStep2Submit} className="card">
            <h2 className="text-2xl font-bold mb-6">Business Location</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Street Address</label>
                <input
                  type="text"
                  className="input"
                  value={address.street}
                  onChange={(e) => setAddress({...address, street: e.target.value})}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">City</label>
                  <input
                    type="text"
                    className="input"
                    value={address.city}
                    onChange={(e) => setAddress({...address, city: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">State</label>
                  <input
                    type="text"
                    className="input"
                    value={address.state}
                    onChange={(e) => setAddress({...address, state: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Country</label>
                  <input
                    type="text"
                    className="input"
                    value={address.country}
                    onChange={(e) => setAddress({...address, country: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Postal Code</label>
                  <input
                    type="text"
                    className="input"
                    value={address.postalCode}
                    onChange={(e) => setAddress({...address, postalCode: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Landmark</label>
                <input
                  type="text"
                  className="input"
                  value={address.landmark}
                  onChange={(e) => setAddress({...address, landmark: e.target.value})}
                  placeholder="Near..."
                />
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={() => setCurrentStep(1)}>
                  Back
                </Button>
                <Button type="submit" variant="primary" size="large" loading={loading} className="flex-1">
                  Next Step
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* Step 3: Branding */}
        {currentStep === 3 && (
          <div className="card">
            <h2 className="text-2xl font-bold mb-6">Visual Branding</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Logo</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {images.logo ? (
                    <img src={images.logo} alt="Logo" className="w-32 h-32 mx-auto object-cover rounded-lg" />
                  ) : (
                    <div>
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Upload your logo</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files[0] && handleImageUpload(e.target.files[0], 'logo')}
                    className="mt-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Cover Photo</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {images.coverPhoto ? (
                    <img src={images.coverPhoto} alt="Cover" className="w-full h-48 object-cover rounded-lg" />
                  ) : (
                    <div>
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Upload cover photo</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files[0] && handleImageUpload(e.target.files[0], 'cover')}
                    className="mt-2"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={() => setCurrentStep(2)}>
                  Back
                </Button>
                <Button type="button" variant="primary" size="large" onClick={handleStep3Submit} loading={loading} className="flex-1">
                  Next Step
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Working Hours */}
        {currentStep === 4 && (
          <form onSubmit={handleStep4Submit} className="card">
            <h2 className="text-2xl font-bold mb-6">Working Hours</h2>
            <div className="space-y-4">
              {Object.entries(workingHours).map(([day, hours]) => (
                <div key={day} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium capitalize">{day}</span>
                    <button
                      type="button"
                      onClick={() => toggleDayOpen(day)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        hours.isOpen ? 'bg-primary-600' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        hours.isOpen ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  {hours.isOpen && (
                    <div className="grid grid-cols-2 gap-3">
                      {hours.slots.map((slot, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input
                            type="time"
                            className="input"
                            value={slot.start}
                            onChange={(e) => updateSlot(day, idx, 'start', e.target.value)}
                          />
                          <input
                            type="time"
                            className="input"
                            value={slot.end}
                            onChange={(e) => updateSlot(day, idx, 'end', e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={() => setCurrentStep(3)}>
                  Back
                </Button>
                <Button type="submit" variant="primary" size="large" loading={loading} className="flex-1">
                  Next Step
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* Step 5: Verification (Skip) */}
        {currentStep === 5 && (
          <div className="card">
            <h2 className="text-2xl font-bold mb-6">Verification (Optional)</h2>
            <p className="text-gray-600 mb-6">You can upload verification documents later from settings.</p>
            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => setCurrentStep(4)}>
                Back
              </Button>
              <Button type="button" variant="primary" size="large" onClick={handleStep5Submit} className="flex-1">
                Skip for Now
              </Button>
            </div>
          </div>
        )}

        {/* Step 6: Booking Policies */}
        {currentStep === 6 && (
          <form onSubmit={handleStep6Submit} className="card">
            <h2 className="text-2xl font-bold mb-6">Booking Policies</h2>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Min Advance Booking (hours)</label>
                  <input
                    type="number"
                    className="input"
                    value={bookingSettings.minAdvanceTime}
                    onChange={(e) => setBookingSettings({...bookingSettings, minAdvanceTime: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max Advance Booking (days)</label>
                  <input
                    type="number"
                    className="input"
                    value={bookingSettings.maxAdvanceTime}
                    onChange={(e) => setBookingSettings({...bookingSettings, maxAdvanceTime: parseInt(e.target.value)})}
                  />
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
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max Reschedules</label>
                  <input
                    type="number"
                    className="input"
                    value={bookingSettings.maxReschedulesPerAppointment}
                    onChange={(e) => setBookingSettings({...bookingSettings, maxReschedulesPerAppointment: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={() => setCurrentStep(5)}>
                  Back
                </Button>
                <Button type="submit" variant="primary" size="large" loading={loading} className="flex-1">
                  Complete Onboarding
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default BusinessOnboarding;