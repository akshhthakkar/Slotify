import { useState, useEffect } from 'react';
import api from '../utils/api';
import Loading from '../components/common/Loading';
import Button from '../components/common/Button';
import { Calendar, Clock, Save, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const StaffAvailability = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [staffData, setStaffData] = useState(null);

  const [workingHours, setWorkingHours] = useState({
    monday: { isOpen: true, slots: [{ start: '09:00', end: '17:00' }] },
    tuesday: { isOpen: true, slots: [{ start: '09:00', end: '17:00' }] },
    wednesday: { isOpen: true, slots: [{ start: '09:00', end: '17:00' }] },
    thursday: { isOpen: true, slots: [{ start: '09:00', end: '17:00' }] },
    friday: { isOpen: true, slots: [{ start: '09:00', end: '17:00' }] },
    saturday: { isOpen: false, slots: [] },
    sunday: { isOpen: false, slots: [] }
  });

  const [unavailableDates, setUnavailableDates] = useState([]);
  const [newUnavailableDate, setNewUnavailableDate] = useState({
    date: '',
    reason: ''
  });

  useEffect(() => {
    fetchStaffData();
  }, []);

  const fetchStaffData = async () => {
    try {
      setLoading(true);
      // Get staff profile (current user's staff record)
      const response = await api.get('/staff/me');
      const staff = response.data.staff;
      setStaffData(staff);
      
      if (staff?.workingHours) {
        setWorkingHours(staff.workingHours);
      }
      if (staff?.unavailableDates) {
        setUnavailableDates(staff.unavailableDates.map(d => ({
          date: d.date?.split('T')[0] || d.date,
          reason: d.reason
        })));
      }
    } catch (error) {
      console.error('Error fetching staff data:', error);
      // If no staff record, show message
    } finally {
      setLoading(false);
    }
  };

  const toggleDayOpen = (day) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: { 
        ...prev[day], 
        isOpen: !prev[day].isOpen,
        slots: !prev[day].isOpen ? [{ start: '09:00', end: '17:00' }] : []
      }
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

  const handleSaveHours = async () => {
    try {
      setSaving(true);
      await api.put(`/staff/${staffData._id}/availability`, { workingHours });
      toast.success('Working hours saved');
    } catch (error) {
      toast.error('Failed to save working hours');
    } finally {
      setSaving(false);
    }
  };

  const handleAddUnavailableDate = async () => {
    if (!newUnavailableDate.date) {
      toast.error('Please select a date');
      return;
    }

    try {
      const updatedDates = [...unavailableDates, newUnavailableDate];
      await api.put(`/staff/${staffData._id}/availability`, { 
        unavailableDates: updatedDates 
      });
      setUnavailableDates(updatedDates);
      setNewUnavailableDate({ date: '', reason: '' });
      toast.success('Unavailable date added');
    } catch (error) {
      toast.error('Failed to add date');
    }
  };

  const handleRemoveUnavailableDate = async (index) => {
    try {
      const updatedDates = unavailableDates.filter((_, i) => i !== index);
      await api.put(`/staff/${staffData._id}/availability`, { 
        unavailableDates: updatedDates 
      });
      setUnavailableDates(updatedDates);
      toast.success('Date removed');
    } catch (error) {
      toast.error('Failed to remove date');
    }
  };

  if (loading) return <Loading fullscreen text="Loading availability..." />;

  if (!staffData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Calendar className="w-20 h-20 text-gray-400 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Staff Profile Not Found</h1>
        <p className="text-gray-600">
          You don't have a staff profile associated with your account.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Availability</h1>
        <p className="text-gray-600 mt-1">Set your working hours and time off</p>
      </div>

      {/* Working Hours */}
      <div className="card mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Working Hours
          </h2>
          <Button variant="primary" onClick={handleSaveHours} loading={saving}>
            <Save className="w-4 h-4 mr-2" />
            Save Hours
          </Button>
        </div>

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
              {hours.isOpen && hours.slots && (
                <div className="grid grid-cols-2 gap-3">
                  {hours.slots.map((slot, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="time"
                        className="input"
                        value={slot.start}
                        onChange={(e) => updateSlot(day, idx, 'start', e.target.value)}
                      />
                      <span className="self-center text-gray-500">to</span>
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
              {!hours.isOpen && (
                <p className="text-sm text-gray-500">Not available</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Unavailable Dates (Time Off) */}
      <div className="card">
        <h2 className="text-xl font-bold mb-6 flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Time Off / Unavailable Dates
        </h2>

        {/* Add new date */}
        <div className="flex gap-3 mb-6">
          <input
            type="date"
            className="input flex-1"
            value={newUnavailableDate.date}
            onChange={(e) => setNewUnavailableDate({...newUnavailableDate, date: e.target.value})}
            min={new Date().toISOString().split('T')[0]}
          />
          <input
            type="text"
            className="input flex-1"
            placeholder="Reason (optional)"
            value={newUnavailableDate.reason}
            onChange={(e) => setNewUnavailableDate({...newUnavailableDate, reason: e.target.value})}
          />
          <Button variant="primary" onClick={handleAddUnavailableDate}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* List of unavailable dates */}
        {unavailableDates.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No time off scheduled. Add dates when you're unavailable.
          </p>
        ) : (
          <div className="space-y-2">
            {unavailableDates.map((item, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium">
                    {new Date(item.date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                  {item.reason && (
                    <p className="text-sm text-gray-600">{item.reason}</p>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveUnavailableDate(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffAvailability;
