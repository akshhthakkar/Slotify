import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Check, ChevronRight, Clock, User, Calendar as CalendarIcon, CheckCircle, Mail, AlertTriangle } from 'lucide-react';
import api from '../utils/api';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';
import { formatDuration, formatDate, formatTime, getDateRange, toISODate } from '../utils/dateHelpers';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const BookAppointment = () => {
  const { businessId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Data
  const [business, setBusiness] = useState(null);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Selections
  const [selectedService, setSelectedService] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [notes, setNotes] = useState('');

  const steps = [
    { number: 1, name: 'Select Service' },
    { number: 2, name: 'Choose Staff' },
    { number: 3, name: 'Pick Date' },
    { number: 4, name: 'Select Time' },
    { number: 5, name: 'Confirm' }
  ];

  useEffect(() => {
    fetchData();
  }, [businessId]);

  useEffect(() => {
    const serviceId = searchParams.get('serviceId');
    if (serviceId && services.length > 0) {
      const service = services.find(s => s._id === serviceId);
      if (service) {
        setSelectedService(service);
        setCurrentStep(2);
      }
    }
  }, [searchParams, services]);

  useEffect(() => {
    if (selectedService && selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedService, selectedStaff, selectedDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [businessRes, servicesRes] = await Promise.all([
        api.get(`/business/${businessId}`),
        api.get(`/services?businessId=${businessId}`)
      ]);

      setBusiness(businessRes.data.business);
      setServices(servicesRes.data.services);
    } catch (error) {
      toast.error('Failed to load booking information');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      setLoadingSlots(true);
      const params = {
        businessId,
        serviceId: selectedService._id,
        date: toISODate(selectedDate)
      };
      if (selectedStaff) {
        params.staffId = selectedStaff._id;
      }

      const response = await api.get('/appointments/available-slots', { params });
      setAvailableSlots(response.data.slots || []);
    } catch (error) {
      toast.error('Failed to load available slots');
      console.error(error);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setCurrentStep(2);
  };

  const handleStaffSelect = (staffMember) => {
    setSelectedStaff(staffMember);
    setCurrentStep(3);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    setCurrentStep(4);
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    setCurrentStep(5);
  };

  const handleSubmit = async () => {
    // Block unverified users
    if (!user?.emailVerified) {
      toast.error('Please verify your email before booking appointments');
      return;
    }

    try {
      setSubmitting(true);

      const bookingData = {
        businessId,
        serviceId: selectedService._id,
        staffId: selectedStaff?._id || selectedTime.staffId,
        appointmentDate: toISODate(selectedDate),
        startTime: selectedTime.startTime,
        notes
      };

      await api.post('/appointments', bookingData);
      
      toast.success('Appointment booked successfully!');
      navigate('/my-appointments');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to book appointment');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const { user } = useAuth();

  if (loading) return <Loading fullscreen />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Email Verification Warning */}
        {!user?.emailVerified && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-yellow-800 font-medium">Email verification required</p>
              <p className="text-yellow-700 text-sm mt-1">
                You must verify your email before booking appointments. 
                <Link to="/profile" className="underline ml-1">Go to Profile</Link> to resend verification email.
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Book Appointment</h1>
          <p className="text-gray-600">{business?.name}</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex items-center justify-between min-w-max">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                      step.number < currentStep
                        ? 'bg-green-500 text-white'
                        : step.number === currentStep
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {step.number < currentStep ? <Check className="w-5 h-5" /> : step.number}
                  </div>
                  <span className="text-xs mt-2 text-gray-600 text-center">{step.name}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-0.5 w-16 mx-2 ${step.number < currentStep ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="card">
          {/* Step 1: Select Service */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Select a Service</h2>
              {services.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No services available</p>
              ) : (
                <div className="space-y-3">
                  {services.map((service) => (
                    <button
                      key={service._id}
                      onClick={() => handleServiceSelect(service)}
                      className="w-full p-4 border-2 rounded-lg text-left hover:border-primary-500 transition-colors group"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg group-hover:text-primary-600">
                            {service.name}
                          </h3>
                          {service.description && (
                            <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {formatDuration(service.duration)}
                            </span>
                          </div>
                        </div>
                        <span className="text-xl font-bold text-primary-600">${service.price}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Choose Staff */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-2xl font-bold mb-2">Choose Staff Member</h2>
              <p className="text-gray-600 mb-6">Or select "Any Available" to book with the first available staff</p>

              <div className="space-y-3">
                <button
                  onClick={() => handleStaffSelect(null)}
                  className="w-full p-4 border-2 rounded-lg text-left hover:border-primary-500 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-4">
                      <User className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Any Available Staff</h3>
                      <p className="text-sm text-gray-600">Book with the first available staff member</p>
                    </div>
                  </div>
                </button>

                {selectedService?.staffIds?.map((staffMember) => (
                  <button
                    key={staffMember._id}
                    onClick={() => handleStaffSelect(staffMember)}
                    className="w-full p-4 border-2 rounded-lg text-left hover:border-primary-500 transition-colors"
                  >
                    <div className="flex items-center">
                      {staffMember.profilePicture ? (
                        <img
                          src={staffMember.profilePicture}
                          alt={staffMember.name}
                          className="w-12 h-12 rounded-full object-cover mr-4"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                          <span className="text-primary-600 font-semibold text-lg">
                            {staffMember.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-lg">{staffMember.name}</h3>
                        {staffMember.specialization && (
                          <p className="text-sm text-gray-600">{staffMember.specialization}</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <Button
                variant="secondary"
                onClick={() => setCurrentStep(1)}
                className="mt-6"
              >
                Back to Services
              </Button>
            </div>
          )}

          {/* Step 3: Pick Date */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Select Date</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {getDateRange(30).map((date) => {
                  const isSelected = selectedDate && toISODate(date) === toISODate(selectedDate);
                  return (
                    <button
                      key={date.toISOString()}
                      onClick={() => handleDateSelect(date)}
                      className={`p-4 border-2 rounded-lg transition-colors ${
                        isSelected
                          ? 'border-primary-600 bg-primary-50'
                          : 'hover:border-primary-500'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-sm text-gray-600">{formatDate(date, 'EEE')}</div>
                        <div className="text-2xl font-bold">{formatDate(date, 'd')}</div>
                        <div className="text-sm text-gray-600">{formatDate(date, 'MMM')}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <Button
                variant="secondary"
                onClick={() => setCurrentStep(2)}
                className="mt-6"
              >
                Back to Staff
              </Button>
            </div>
          )}

          {/* Step 4: Select Time */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-2xl font-bold mb-2">Select Time</h2>
              <p className="text-gray-600 mb-6">
                {formatDate(selectedDate, 'EEEE, MMMM d, yyyy')}
              </p>

              {loadingSlots ? (
                <Loading />
              ) : availableSlots.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">No available slots for this date</p>
                  <Button variant="secondary" onClick={() => setCurrentStep(3)}>
                    Choose Another Date
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-3 max-h-96 overflow-y-auto">
                    {availableSlots.map((slot, index) => {
                      const isSelected = selectedTime?.startTime === slot.startTime;
                      return (
                        <button
                          key={index}
                          onClick={() => handleTimeSelect(slot)}
                          className={`p-3 border-2 rounded-lg transition-colors ${
                            isSelected
                              ? 'border-primary-600 bg-primary-50'
                              : 'hover:border-primary-500'
                          }`}
                        >
                          <div className="text-center font-medium">{slot.startTime}</div>
                        </button>
                      );
                    })}
                  </div>

                  <Button
                    variant="secondary"
                    onClick={() => setCurrentStep(3)}
                    className="mt-6"
                  >
                    Back to Date
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Step 5: Confirm */}
          {currentStep === 5 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Confirm Booking</h2>

              <div className="space-y-4 mb-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{selectedService.name}</h3>
                      <p className="text-sm text-gray-600">{formatDuration(selectedService.duration)}</p>
                    </div>
                    <span className="text-lg font-bold text-primary-600">${selectedService.price}</span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-700">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {formatDate(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </div>
                    <div className="flex items-center text-gray-700">
                      <Clock className="w-4 h-4 mr-2" />
                      {formatTime(selectedTime.startTime)}
                    </div>
                    <div className="flex items-center text-gray-700">
                      <User className="w-4 h-4 mr-2" />
                      {selectedStaff ? selectedStaff.name : 'Any Available Staff'}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows="3"
                    className="input"
                    placeholder="Any special requests or notes..."
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setCurrentStep(4)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  loading={submitting}
                  className="flex-1"
                >
                  Confirm Booking
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookAppointment;