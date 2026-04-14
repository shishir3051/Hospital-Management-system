// Doctor Form Page - Create/Edit Doctor
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doctorsApi } from '../../services/api';
import { ArrowLeft, Save } from 'lucide-react';

export default function DoctorForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    specialization: '', education: '', yearsOfExperience: '', consultationFee: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) loadDoctor();
  }, [id]);

  const loadDoctor = async () => {
    try {
      const doctor = await doctorsApi.getById(id);
      setFormData({
        firstName: doctor.user?.firstName || '',
        lastName: doctor.user?.lastName || '',
        email: doctor.user?.email || '',
        phone: doctor.user?.phone || '',
        specialization: doctor.specialization || '',
        education: doctor.education || '',
        yearsOfExperience: doctor.yearsOfExperience || '',
        consultationFee: doctor.consultationFee || ''
      });
    } catch (err) { setError('Failed to load doctor'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isEdit) await doctorsApi.update(id, formData);
      else await doctorsApi.create(formData);
      navigate('/doctors');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const specializations = ['CARDIOLOGY', 'DERMATOLOGY', 'ORTHOPEDICS', 'NEUROLOGY', 'PEDIATRICS', 'GENERAL'];

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/doctors')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Doctor' : 'Add New Doctor'}</h1>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-card p-6 space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div><label className="block text-sm font-medium mb-2">First Name *</label>
            <input type="text" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} required className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20" /></div>
          <div><label className="block text-sm font-medium mb-2">Last Name *</label>
            <input type="text" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} required className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20" /></div>
          <div><label className="block text-sm font-medium mb-2">Email *</label>
            <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20" /></div>
          <div><label className="block text-sm font-medium mb-2">Phone</label>
            <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20" /></div>
          <div><label className="block text-sm font-medium mb-2">Specialization *</label>
            <select value={formData.specialization} onChange={(e) => setFormData({...formData, specialization: e.target.value})} required className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20">
              <option value="">Select</option>
              {specializations.map(s => <option key={s} value={s}>{s}</option>)}
            </select></div>
          <div><label className="block text-sm font-medium mb-2">Years of Experience</label>
            <input type="number" value={formData.yearsOfExperience} onChange={(e) => setFormData({...formData, yearsOfExperience: e.target.value})} className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20" /></div>
          <div><label className="block text-sm font-medium mb-2">Consultation Fee ($)</label>
            <input type="number" value={formData.consultationFee} onChange={(e) => setFormData({...formData, consultationFee: e.target.value})} className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20" /></div>
          <div className="col-span-2"><label className="block text-sm font-medium mb-2">Education</label>
            <input type="text" value={formData.education} onChange={(e) => setFormData({...formData, education: e.target.value})} placeholder="e.g., MD from Harvard Medical School" className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20" /></div>
        </div>
        <div className="flex justify-end gap-4">
          <button type="button" onClick={() => navigate('/doctors')} className="px-6 py-2.5 border rounded-lg hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={loading} className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 flex items-center gap-2">
            <Save className="w-5 h-5" /> {loading ? 'Saving...' : 'Save Doctor'}
          </button>
        </div>
      </form>
    </div>
  );
}