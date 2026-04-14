// Doctor Detail Page
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doctorsApi, appointmentsApi } from '../../services/api';
import { ArrowLeft, Edit, Star, Clock, DollarSign, Calendar, Award } from 'lucide-react';

export default function DoctorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDoctorData();
  }, [id]);

  const loadDoctorData = async () => {
    try {
      const [doctorData, appointmentsData] = await Promise.all([
        doctorsApi.getById(id),
        appointmentsApi.getAll({ doctorId: id })
      ]);
      setDoctor(doctorData);
      setAppointments(appointmentsData.appointments || []);
    } catch (err) { console.error('Failed to load doctor:', err); }
    finally { setLoading(false); }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div></div>;
  }

  if (!doctor) return <div className="text-center p-8">Doctor not found</div>;

  const schedule = doctor.schedule || {};
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/doctors')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-5 h-5" /> Back to Doctors
        </button>
        <Link to={`/doctors/${id}/edit`} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark">
          <Edit className="w-4 h-4" /> Edit Profile
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-card p-6">
          <div className="text-center mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-secondary to-secondary-dark rounded-full flex items-center justify-center mx-auto">
              <span className="text-white text-3xl font-bold">{doctor.user?.firstName?.[0]}{doctor.user?.lastName?.[0]}</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mt-4">Dr. {doctor.user?.firstName} {doctor.user?.lastName}</h2>
            <p className="text-primary font-medium">{doctor.specialization}</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span className="font-semibold">{doctor.rating}</span>
              <span className="text-gray-400">|</span>
              <span>{doctor.yearsOfExperience} years</span>
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center gap-3 text-sm"><DollarSign className="w-5 h-5 text-gray-400" /><span>${doctor.consultationFee}/visit</span></div>
            <div className="flex items-center gap-3 text-sm"><Award className="w-5 h-5 text-gray-400" /><span>{doctor.education || 'Not specified'}</span></div>
            <div className="flex items-center gap-3 text-sm"><span className={`w-2 h-2 rounded-full ${doctor.status === 'AVAILABLE' ? 'bg-green-500' : 'bg-gray-400'}`}></span><span>{doctor.status}</span></div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 uppercase mb-2">License</p>
            <p className="font-mono text-sm">{doctor.licenseNumber}</p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Weekly Schedule</h3>
            <div className="grid grid-cols-5 gap-4">
              {days.map(day => (
                <div key={day} className="text-center">
                  <p className="text-xs text-gray-500 uppercase mb-2">{day.slice(0, 3)}</p>
                  <div className="space-y-1">
                    {(schedule[day] || []).length > 0 ? (
                      schedule[day].map((time, i) => (
                        <div key={i} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">{time}</div>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400">Off</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Recent Appointments</h3>
              <span className="text-sm text-gray-500">{appointments.length} total</span>
            </div>
            {appointments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No appointments found</p>
            ) : (
              <div className="space-y-3">
                {appointments.slice(0, 5).map(apt => (
                  <div key={apt.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{apt.patient?.firstName} {apt.patient?.lastName}</p>
                      <p className="text-sm text-gray-500">{apt.reason || apt.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{new Date(apt.dateTime).toLocaleDateString()}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${apt.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : apt.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{apt.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}