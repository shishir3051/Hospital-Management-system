// Patient Detail Page
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { patientsApi, appointmentsApi, billingApi } from '../../services/api';
import { ArrowLeft, Edit, Calendar, CreditCard, User, Phone, Mail, MapPin, Droplet, AlertTriangle, Clock } from 'lucide-react';

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [billing, setBilling] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatientData();
  }, [id]);

  const loadPatientData = async () => {
    try {
      const [patientData, appointmentsData, billingData] = await Promise.all([
        patientsApi.getById(id),
        appointmentsApi.getAll({ patientId: id }),
        billingApi.getByPatient(id)
      ]);
      setPatient(patientData);
      setAppointments(appointmentsData.appointments || []);
      setBilling(billingData.bills || []);
    } catch (err) {
      console.error('Failed to load patient:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div></div>;
  }

  if (!patient) {
    return <div className="text-center p-8">Patient not found</div>;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/patients')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-5 h-5" /> Back to Patients
        </button>
        <Link to={`/patients/${id}/edit`} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark">
          <Edit className="w-4 h-4" /> Edit Patient
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Info Card */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-card p-6">
          <div className="flex items-start gap-4 mb-6 pb-6 border-b border-gray-100">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center">
              <span className="text-white text-xl font-bold">{patient.user?.firstName?.[0]}{patient.user?.lastName?.[0]}</span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{patient.user?.firstName} {patient.user?.lastName}</h2>
              <p className="text-gray-500 font-mono text-sm">ID: {patient.id}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {patient.user?.email}</span>
                <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {patient.user?.phone || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-gray-500 uppercase">Blood Group</p>
              <p className="flex items-center gap-2 mt-1 font-medium">
                <Droplet className="w-4 h-4 text-red-500" /> {patient.bloodGroup || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Gender</p>
              <p className="mt-1 font-medium">{patient.gender || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Date of Birth</p>
              <p className="mt-1 font-medium">{patient.dateOfBirth || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Appointments</p>
              <p className="mt-1 font-medium">{patient.appointments || 0}</p>
            </div>
          </div>

          {patient.allergies && patient.allergies !== 'None' && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">Allergies</span>
              </div>
              <p className="text-amber-700 mt-1">{patient.allergies}</p>
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-gray-500 uppercase">Address</p>
              <p className="mt-1 flex items-center gap-2 text-gray-700"><MapPin className="w-4 h-4" /> {patient.address || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Emergency Contact</p>
              <p className="mt-1 flex items-center gap-2 text-gray-700"><Phone className="w-4 h-4" /> {patient.emergencyContact || 'N/A'}</p>
            </div>
          </div>

          {patient.insuranceProvider && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-gray-500 uppercase">Insurance</p>
              <p className="font-medium text-blue-900 mt-1">{patient.insuranceProvider}</p>
              <p className="text-sm text-blue-700">Policy: {patient.insurancePolicyNumber}</p>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-primary" />
                  <span className="text-sm">Total Appointments</span>
                </div>
                <span className="font-semibold">{appointments.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-green-500" />
                  <span className="text-sm">Total Bills</span>
                </div>
                <span className="font-semibold">{billing.length}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Insurance</h3>
            <p className="text-gray-600">{patient.insuranceProvider || 'No insurance on file'}</p>
          </div>
        </div>
      </div>

      {/* Recent Appointments */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Appointments</h3>
          <Link to="/appointments" className="text-sm text-primary hover:underline">View all</Link>
        </div>
        {appointments.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No appointments found</p>
        ) : (
          <div className="space-y-3">
            {appointments.slice(0, 5).map(apt => (
              <div key={apt.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${apt.status === 'COMPLETED' ? 'bg-green-100' : apt.status === 'CANCELLED' ? 'bg-red-100' : 'bg-amber-100'}`}>
                    <Clock className={`w-5 h-5 ${apt.status === 'COMPLETED' ? 'text-green-600' : apt.status === 'CANCELLED' ? 'text-red-600' : 'text-amber-600'}`} />
                  </div>
                  <div>
                    <p className="font-medium">{apt.reason || apt.type}</p>
                    <p className="text-sm text-gray-500">Dr. {apt.doctor?.firstName} {apt.doctor?.lastName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{new Date(apt.dateTime).toLocaleDateString()}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${apt.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : apt.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{apt.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}