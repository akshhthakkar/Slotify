import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Loading from '../components/common/Loading';
import Button from '../components/common/Button';
import { formatDate, formatTime } from '../utils/dateHelpers';
import { 
  Calendar, 
  Clock, 
  Users, 
  Briefcase, 
  TrendingUp,
  Settings,
  Plus,
  ChevronRight
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayAppointments: 0,
    totalServices: 0,
    totalStaff: 0,
    monthlyAppointments: 0
  });
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [business, setBusiness] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch business info
      const businessRes = await api.get('/business');
      const businessData = businessRes.data.business;
      setBusiness(businessData);

      if (businessData?._id) {
        // Fetch services count
        const servicesRes = await api.get(`/services?businessId=${businessData._id}`);
        const services = servicesRes.data.services || [];

        // Fetch staff count
        const staffRes = await api.get(`/staff?businessId=${businessData._id}`);
        const staffMembers = staffRes.data.staff || [];

        // Fetch today's appointments
        const today = new Date().toISOString().split('T')[0];
        const appointmentsRes = await api.get(`/appointments?businessId=${businessData._id}`);
        const appointments = appointmentsRes.data.appointments || [];
        
        const todayApts = appointments.filter(apt => 
          apt.appointmentDate.split('T')[0] === today && apt.status === 'scheduled'
        );

        // Count monthly appointments
        const thisMonth = new Date().getMonth();
        const monthlyApts = appointments.filter(apt => 
          new Date(apt.appointmentDate).getMonth() === thisMonth
        );

        setStats({
          todayAppointments: todayApts.length,
          totalServices: services.length,
          totalStaff: staffMembers.length,
          monthlyAppointments: monthlyApts.length
        });

        setTodayAppointments(todayApts.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading fullscreen text="Loading dashboard..." />;

  // If no business, redirect to onboarding
  if (!business) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Briefcase className="w-20 h-20 text-gray-400 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Set Up Your Business</h1>
        <p className="text-gray-600 mb-8">
          You haven't set up your business yet. Complete the onboarding process to get started.
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
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">{business.name}</p>
        </div>
        <Link to="/admin/settings">
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Today's Appointments</p>
              <p className="text-3xl font-bold text-primary-600">{stats.todayAppointments}</p>
            </div>
            <Calendar className="w-12 h-12 text-primary-200" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Services</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalServices}</p>
            </div>
            <Briefcase className="w-12 h-12 text-gray-200" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Staff Members</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalStaff}</p>
            </div>
            <Users className="w-12 h-12 text-gray-200" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">This Month</p>
              <p className="text-3xl font-bold text-green-600">{stats.monthlyAppointments}</p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-200" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Link to="/admin/services" className="card hover:shadow-lg transition-shadow group">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mr-4">
                <Plus className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold">Manage Services</h3>
                <p className="text-sm text-gray-600">Add or edit services</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600" />
          </div>
        </Link>
        <Link to="/admin/staff" className="card hover:shadow-lg transition-shadow group">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">Manage Staff</h3>
                <p className="text-sm text-gray-600">Add or edit staff members</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600" />
          </div>
        </Link>
        <Link to="/admin/settings" className="card hover:shadow-lg transition-shadow group">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                <Settings className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <h3 className="font-semibold">Business Settings</h3>
                <p className="text-sm text-gray-600">Hours, policies, branding</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600" />
          </div>
        </Link>
      </div>

      {/* Today's Appointments */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Today's Appointments</h2>
        </div>

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
                  <div>
                    <h3 className="font-semibold">{appointment.serviceId?.name}</h3>
                    <p className="text-sm text-gray-600">
                      {appointment.customerId?.name} • {appointment.staffId?.name}
                    </p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                      </span>
                    </div>
                  </div>
                  <span className="badge badge-info">Scheduled</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
