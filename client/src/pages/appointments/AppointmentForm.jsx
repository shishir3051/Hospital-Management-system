// Appointment Form Page
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { appointmentsApi, doctorsApi, patientsApi } from '../../services/api';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';

export default function AppointmentForm() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [slots, setSlots] = useState([]);
  const [formData, setFormData] = useState({
    doctorId: '', patientId: '', date: '', time: '', type: 'CONSULTATION', reason: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    if (formData.doctorId && formData.date) {
      loadSlots();
    }
  }, [formData.doctorId, formData.date]);

  const loadDoctors = async () => {
    try {
      const response = await doctorsApi.getAll({ status: 'AVAILABLE' });
      setDoctors(response.doctors || []);
    } catch (err) { console.error(err); }
  };

  const loadSlots = async () => {
    try {
      const response = await appointmentsApi.getAvailableSlots(formData.doctorId, formData.date);
      setSlots(response.slots || []);
    } catch (err) { setSlots([]); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.time) { setError('Please select a time slot'); return; }
    setError('');
    setLoading(true);
    try {
      const dateTime = `${formData.date}T${formData.time}:00`;
      await appointmentsApi.create({
        doctorId: formData.doctorId,
        patientId: formData.patientId,
        dateTime,
        type: formData.type,
        reason: formData.reason
      });
      navigate('/appointments');
    } catch (err) { setError(err.message || 'Failed to book appointment'); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/appointments')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-2xl font-bold text-gray-900">Book Appointment</h1>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-card p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Select Doctor *</label>
          <select value={formData.doctorId} onChange={(e) => setFormData({...formData, doctorId: e.target.value})} required className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20">
            <option value="">Choose a doctor</option>
            {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.user?.firstName} {d.user?.lastName} - {d.specialization}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Appointment Date *</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value, time: ''})} required min={new Date().toISOString().split('T')[0]} className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>

        {formData.date && formData.doctorId && (
          <div>
            <label className="block text-sm font-medium mb-2">Available Time Slots *</label>
            {slots.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {slots.map(slot => (
                  <button key={slot} type="button" onClick={() => setFormData({...formData, time: slot})} className={`px-3 py-2 text-sm rounded-lg border ${formData.time === slot ? 'bg-primary text-white border-primary' : 'hover:bg-gray-50'}`}>{slot}</button>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No available slots for this date</p>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">Appointment Type</label>
          <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20">
            <option value="CONSULTATION">Consultation</option>
            <option value="FOLLOWUP">Follow-up</option>
            <option value="CHECKUP">Check-up</option>
            <option value="EMERGENCY">Emergency</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Reason for Visit</label>
          <textarea value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} rows="3" placeholder="Briefly describe the reason for your visit..." className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20"></textarea>
        </div>

        <div className="flex justify-end gap-4">
          <button type="button" onClick={() => navigate('/appointments')} className="px-6 py-2.5 border rounded-lg hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={loading || !formData.time} className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50">Book Appointment</button>
        </div>
      </form>
    </div>
  );
}