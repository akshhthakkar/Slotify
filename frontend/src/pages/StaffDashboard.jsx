import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Loading from '../components/common/Loading';
import Button from '../components/common/Button';
import { formatDate, formatTime } from '../utils/dateHelpers';
import { Calendar, Clock, User, CheckCircle, XCircle, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

const StaffDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [stats, setStats] = useState({
    today: 0,
    upcoming: 0,
    completed: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/appointments');
      const allAppointments = response.data.appointments || [];
      
      const today = new Date().toISOString().split('T')[0];
      
      // Filter today's appointments
      const todayApts = allAppointments.filter(apt => 
        apt.appointmentDate.split('T')[0] === today && apt.status === 'scheduled'
      ).sort((a, b) => a.startTime.localeCompare(b.startTime));
      
      // Upcoming appointments
      const upcomingApts = allAppointments.filter(apt => 
        new Date(apt.appointmentDate) >= new Date() && apt.status === 'scheduled'
      );

      setTodayAppointments(todayApts);
      setAppointments(upcomingApts.slice(0, 10));
      setStats({
        today: todayApts.length,
        upcoming: upcomingApts.length,
        completed: allAppointments.filter(a => a.status === 'completed').length
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async (appointmentId) => {
    try {
      await api.post(`/appointments/${appointmentId}/complete`);
      toast.success('Appointment marked as completed');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to update appointment');
    }
  };

  const handleMarkNoShow = async (appointmentId) => {
    try {
      await api.post(`/appointments/${appointmentId}/no-show`);
      toast.success('Appointment marked as no-show');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to update appointment');
    }
  };

  if (loading) return <Loading fullscreen text="Loading dashboard..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user?.name}</p>
        </div>
        <Link to="/staff/availability">
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            My Availability
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Today's Appointments</p>
              <p className="text-3xl font-bold text-primary-600">{stats.today}</p>
            </div>
            <Calendar className="w-12 h-12 text-primary-200" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Upcoming</p>
              <p className="text-3xl font-bold text-blue-600">{stats.upcoming}</p>
            </div>
            <Clock className="w-12 h-12 text-blue-200" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Completed</p>
              <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-200" />
          </div>
        </div>
      </div>

      {/* Today's Appointments */}
      <div className="card mb-8">
        <h2 className="text-2xl font-bold mb-6">Today's Schedule</h2>
        
        {todayAppointments.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No appointments scheduled for today</p>
          </div>
        ) : (
          <div className="space-y-4">
            {todayAppointments.map((appointment) => (
              <div
                key={appointment._id}
                className="p-4 border rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 text-center">
                      <p className="text-lg font-bold text-primary-600">{formatTime(appointment.startTime)}</p>
                      <p className="text-xs text-gray-500">{formatTime(appointment.endTime)}</p>
                    </div>
                    <div className="border-l pl-4">
                      <h3 className="font-semibold">{appointment.serviceId?.name}</h3>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <User className="w-4 h-4 mr-1" />
                        {appointment.customerId?.name}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleMarkComplete(appointment._id)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                      title="Mark Complete"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleMarkNoShow(appointment._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Mark No-Show"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                {appointment.notes && (
                  <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    Note: {appointment.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Appointments */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">Upcoming Appointments</h2>
        
        {appointments.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No upcoming appointments</p>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((appointment) => (
              <div
                key={appointment._id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-medium">{appointment.serviceId?.name}</p>
                    <p className="text-sm text-gray-500">
                      {appointment.customerId?.name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatDate(appointment.appointmentDate, 'MMM d')}</p>
                  <p className="text-sm text-gray-500">{formatTime(appointment.startTime)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;
