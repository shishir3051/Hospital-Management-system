// Patient Form Page - Create/Edit Patient
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { patientsApi } from '../../services/api';
import { ArrowLeft, Save } from 'lucide-react';

export default function PatientForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    dateOfBirth: '', gender: '', bloodGroup: '', address: '',
    emergencyContact: '', allergies: '', medicalHistory: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      loadPatient();
    }
  }, [id]);

  const loadPatient = async () => {
    try {
      const patient = await patientsApi.getById(id);
      setFormData({
        firstName: patient.user?.firstName || '',
        lastName: patient.user?.lastName || '',
        email: patient.user?.email || '',
        phone: patient.user?.phone || '',
        dateOfBirth: patient.dateOfBirth || '',
        gender: patient.gender || '',
        bloodGroup: patient.bloodGroup || '',
        address: patient.address || '',
        emergencyContact: patient.emergencyContact || '',
        allergies: patient.allergies || '',
        medicalHistory: patient.medicalHistory || ''
      });
    } catch (err) {
      setError('Failed to load patient');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isEdit) {
        await patientsApi.update(id, formData);
      } else {
        await patientsApi.create(formData);
      }
      navigate('/patients');
    } catch (err) {
      setError(err.message || 'Failed to save patient');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/patients')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Patient' : 'Add New Patient'}</h1>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-card p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
            <input type="text" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
            <input type="text" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
            <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
            <input type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
            <select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20">
              <option value="">Select</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Blood Group</label>
            <select value={formData.bloodGroup} onChange={(e) => setFormData({...formData, bloodGroup: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20">
              <option value="">Select</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact</label>
            <input type="text" value={formData.emergencyContact} onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
          <input type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Allergies</label>
          <textarea value={formData.allergies} onChange={(e) => setFormData({...formData, allergies: e.target.value})} rows="2" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20"></textarea>
        </div>
        <div className="flex justify-end gap-4">
          <button type="button" onClick={() => navigate('/patients')} className="px-6 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={loading} className="px-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark disabled:opacity-50 flex items-center gap-2">
            <Save className="w-5 h-5" /> {loading ? 'Saving...' : 'Save Patient'}
          </button>
        </div>
      </form>
    </div>
  );
}