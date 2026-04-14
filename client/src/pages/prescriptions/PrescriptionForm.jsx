import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { 
  Plus, 
  Trash2, 
  FileText, 
  Save, 
  X, 
  AlertCircle,
  Stethoscope,
  Pill,
  Clock,
  ArrowLeft
} from 'lucide-react';
import { prescriptionsApi, patientsApi, appointmentsApi } from '../../services/api';

export default function PrescriptionForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams(); // For edit mode
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    patientId: location.state?.patientId || '',
    appointmentId: location.state?.appointmentId || '',
    diagnosis: '',
    notes: '',
    medications: [
      { name: '', dosage: '', frequency: '', duration: '', instructions: '' }
    ]
  });

  const [patients, setPatients] = useState([]);

  useEffect(() => {
    loadPatients();
    if (id) {
      loadPrescription();
    }
  }, [id]);

  const loadPatients = async () => {
    try {
      const response = await patientsApi.getAll();
      setPatients(response.patients || []);
    } catch (err) {
      console.error('Failed to load patients:', err);
    }
  };

  const loadPrescription = async () => {
    try {
      const data = await prescriptionsApi.getById(id);
      setFormData({
        patientId: data.patientId?._id || data.patientId,
        appointmentId: data.appointmentId?._id || data.appointmentId,
        diagnosis: data.diagnosis,
        notes: data.notes,
        medications: data.medications
      });
    } catch (err) {
      setError('Failed to load prescription data');
    }
  };

  const handleAddMedication = () => {
    setFormData({
      ...formData,
      medications: [
        ...formData.medications,
        { name: '', dosage: '', frequency: '', duration: '', instructions: '' }
      ]
    });
  };

  const handleRemoveMedication = (index) => {
    const newMedications = formData.medications.filter((_, i) => i !== index);
    setFormData({ ...formData, medications: newMedications });
  };

  const handleMedicationChange = (index, field, value) => {
    const newMedications = [...formData.medications];
    newMedications[index] = { ...newMedications[index], [field]: value };
    setFormData({ ...formData, medications: newMedications });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (id) {
        await prescriptionsApi.update(id, formData);
      } else {
        await prescriptionsApi.create(formData);
      }
      navigate('/dashboard/appointments'); // Redirect back to appointments
    } catch (err) {
      setError(err.message || 'Failed to save prescription');
    } finally {
      setLoading(false);
    }
  };

  const selectedPatient = patients.find(p => p._id === formData.patientId);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-fadeIn">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-slate-600" />
          </button>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            {id ? 'Edit' : 'New'} <span className="text-primary">Prescription</span>
          </h1>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 font-bold text-sm">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Patient Selection & Diagnosis */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-card border border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-3">Select Patient</label>
              <select
                required
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black focus:ring-4 focus:ring-primary/10 transition-all appearance-none"
                value={formData.patientId}
                onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                disabled={location.state?.patientId}
              >
                <option value="">Choose a patient...</option>
                {patients.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.userId?.firstName} {p.userId?.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-3">Primary Diagnosis</label>
              <input
                required
                type="text"
                placeholder="e.g. Acute Bronchitis"
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-primary/10 transition-all"
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Medications List */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-card border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
              <Pill className="w-6 h-6 text-primary" />
              Prescribed Medications
            </h3>
            <button
              type="button"
              onClick={handleAddMedication}
              className="px-4 py-2 bg-primary/10 text-primary font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-primary/20 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add more
            </button>
          </div>

          <div className="space-y-6">
            {formData.medications.map((med, index) => (
              <div key={index} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 relative group animate-fadeIn">
                <button
                  type="button"
                  onClick={() => handleRemoveMedication(index)}
                  className="absolute -top-2 -right-2 w-8 h-8 bg-white border border-slate-100 rounded-full flex items-center justify-center text-slate-300 hover:text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="lg:col-span-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Medicine Name</label>
                    <input
                      required
                      type="text"
                      className="w-full p-3 bg-white border border-slate-100 rounded-xl text-sm font-bold shadow-sm"
                      value={med.name}
                      onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Dosage</label>
                    <input
                      required
                      type="text"
                      placeholder="500mg"
                      className="w-full p-3 bg-white border border-slate-100 rounded-xl text-sm font-bold shadow-sm"
                      value={med.dosage}
                      onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Frequency</label>
                    <input
                      required
                      type="text"
                      placeholder="Twice a day"
                      className="w-full p-3 bg-white border border-slate-100 rounded-xl text-sm font-bold shadow-sm"
                      value={med.frequency}
                      onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Duration</label>
                    <input
                      required
                      type="text"
                      placeholder="7 Days"
                      className="w-full p-3 bg-white border border-slate-100 rounded-xl text-sm font-bold shadow-sm"
                      value={med.duration}
                      onChange={(e) => handleMedicationChange(index, 'duration', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Specific Instructions</label>
                  <input
                    type="text"
                    placeholder="Take after meals"
                    className="w-full p-3 bg-white border border-slate-100 rounded-xl text-sm font-medium shadow-sm"
                    value={med.instructions}
                    onChange={(e) => handleMedicationChange(index, 'instructions', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Notes */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-card border border-slate-100">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-4">Doctor's Clinical Notes</label>
          <textarea
            className="w-full h-40 p-6 bg-slate-50 border border-slate-200 rounded-[2.5rem] text-sm font-medium focus:ring-4 focus:ring-primary/10 transition-all resize-none shadow-sm"
            placeholder="Add any additional observations or recovery tips..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          ></textarea>
        </div>

        {/* Submit Section */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-8 py-4 font-bold text-slate-400 hover:text-slate-600 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-12 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/30 hover:bg-primary-dark hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <Save className="w-5 h-5" />
                {id ? 'Update' : 'Confirm & Save'} Prescription
              </>
            )}
          </button>
        </div>
      </form>

      <div className="mt-12 text-center">
         <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">HealthCore Medical Information System • Secure clinical portal</p>
      </div>
    </div>
  );
}
