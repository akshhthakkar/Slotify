import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, ArrowRight } from 'lucide-react';
import api from '../utils/api';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';
import { formatDate, formatTime, getDateRange, toISODate } from '../utils/dateHelpers';
import toast from 'react-hot-toast';

const RescheduleAppointment = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    fetchAppointment();
  }, [id]);

  useEffect(() => {
    if (selectedDate && appointment) {
      fetchAvailableSlots();
    }
  }, [selectedDate, appointment]);

  const fetchAppointment = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/appointments/${id}`);
      setAppointment(response.data.appointment);
    } catch (error) {
      toast.error('Failed to load appointment');
      navigate('/my-appointments');
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
        staffId: appointment.staffId._id,
        date: toISODate(selectedDate)
      };

      const response = await api.get('/appointments/available-slots', { params });
      setAvailableSlots(response.data.slots || []);
    } catch (error) {
      toast.error('Failed to load available slots');
      console.error(error);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error('Please select a new date and time');
      return;
    }

    try {
      setSubmitting(true);

      await api.post(`/appointments/${id}/reschedule`, {
        newDate: toISODate(selectedDate),
        newStartTime: selectedTime.startTime
      });

      toast.success('Appointment rescheduled successfully!');
      navigate('/my-appointments');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reschedule appointment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading fullscreen />;
  if (!appointment) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Reschedule Appointment</h1>

      {/* Current Appointment */}
      <div className="card mb-6 bg-gray-50">
        <h2 className="text-lg font-semibold mb-4">Current Appointment</h2>
        <div className="space-y-3">
          <div>
            <span className="text-gray-600">Service: </span>
            <span className="font-medium">{appointment.serviceId.name}</span>
          </div>
          <div>
            <span className="text-gray-600">Business: </span>
            <span className="font-medium">{appointment.businessId.name}</span>
          </div>
          <div>
            <span className="text-gray-600">Staff: </span>
            <span className="font-medium">{appointment.staffId.name}</span>
          </div>
          <div>
            <span className="text-gray-600">Date & Time: </span>
            <span className="font-medium">
              {formatDate(appointment.appointmentDate, 'MMM d, yyyy')} at {formatTime(appointment.startTime)}
            </span>
          </div>
        </div>
      </div>

      {/* New Date Selection */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">Select New Date</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {getDateRange(30).map((date) => {
            const isSelected = selectedDate && toISODate(date) === toISODate(selectedDate);
            return (
              <button
                key={date.toISOString()}
                onClick={() => {
                  setSelectedDate(date);
                  setSelectedTime(null);
                }}
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
      </div>

      {/* Time Selection */}
      {selectedDate && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">
            Select New Time - {formatDate(selectedDate, 'EEEE, MMMM d, yyyy')}
          </h2>

          {loadingSlots ? (
            <Loading />
          ) : availableSlots.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No available slots for this date. Please choose another date.
            </p>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3 max-h-96 overflow-y-auto">
              {availableSlots.map((slot, index) => {
                const isSelected = selectedTime?.startTime === slot.startTime;
                return (
                  <button
                    key={index}
                    onClick={() => setSelectedTime(slot)}
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
          )}
        </div>
      )}

      {/* Comparison */}
      {selectedDate && selectedTime && (
        <div className="card mb-6 bg-blue-50 border-blue-200">
          <h2 className="text-lg font-semibold mb-4 text-blue-900">Changes Summary</h2>
          <div className="flex items-center justify-between text-sm">
            <div className="flex-1">
              <p className="text-gray-600 mb-1">Current</p>
              <p className="font-medium text-gray-900">
                {formatDate(appointment.appointmentDate, 'MMM d, yyyy')}
              </p>
              <p className="font-medium text-gray-900">{formatTime(appointment.startTime)}</p>
            </div>
            <ArrowRight className="w-6 h-6 text-blue-600 mx-4" />
            <div className="flex-1 text-right">
              <p className="text-gray-600 mb-1">New</p>
              <p className="font-medium text-primary-600">
                {formatDate(selectedDate, 'MMM d, yyyy')}
              </p>
              <p className="font-medium text-primary-600">{formatTime(selectedTime.startTime)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          variant="secondary"
          onClick={() => navigate('/my-appointments')}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          loading={submitting}
          disabled={!selectedDate || !selectedTime}
          className="flex-1"
        >
          Confirm Reschedule
        </Button>
      </div>

      {/* Policy Warning */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> Rescheduling policies may apply. Please review the business's
          rescheduling policy before confirming.
        </p>
      </div>
    </div>
  );
};

export default RescheduleAppointment;