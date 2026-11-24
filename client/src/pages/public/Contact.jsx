import { useState } from 'react';
import { contactApi } from '../../services/api';
import { Button, Card, Input, Textarea, ErrorAlert, useToast } from '../../components/ui';
import { SITE } from '../../config/site';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2 } from 'lucide-react';

export default function Contact() {
  const toast = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await contactApi.submit(formData);
      toast.success(res.message || 'Message sent successfully!');
      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      setError(err.message || 'Failed to submit inquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fadeIn">
      <section className="bg-secondary-950 text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-300">
            Patient Support &amp; Inquiries
          </p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-display font-extrabold text-white">
            Contact {SITE.name}
          </h1>
          <p className="mt-2 text-base text-slate-300 max-w-2xl">
            Reach our patient navigation team for scheduling help, medical records requests, billing inquiries, or clinic directions.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Contact Details */}
        <div className="lg:col-span-5 space-y-5">
          <Card className="space-y-5">
            <h2 className="text-lg font-display font-bold text-slate-900">Hospital Desk &amp; Hours</h2>
            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Main Medical Campus</p>
                  <p className="text-slate-600">{SITE.address}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">24/7 Emergency Triage</p>
                  <a href={`tel:${SITE.emergencyTel}`} className="text-rose-700 font-semibold hover:underline">
                    {SITE.emergencyPhone}
                  </a>
                  <p className="text-slate-600 mt-1">
                    Appointments:{' '}
                    <a href={`tel:${SITE.appointmentTel}`} className="text-primary-700 font-medium hover:underline">
                      {SITE.appointmentPhone}
                    </a>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-secondary-50 text-secondary-800 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Email Support</p>
                  <a href={`mailto:${SITE.email}`} className="text-primary-700 hover:underline block">
                    {SITE.email}
                  </a>
                  <a href={`mailto:${SITE.billingEmail}`} className="text-slate-600 hover:underline text-xs">
                    Billing: {SITE.billingEmail}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Operating Hours</p>
                  <p className="text-slate-600">{SITE.opdHours}</p>
                  <p className="text-slate-600">{SITE.emergencyHours}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Real Interactive Campus Map */}
          <Card padding="p-0" className="overflow-hidden">
            <iframe
              title="HealthCore Medical Center Campus Map"
              src="https://www.openstreetmap.org/export/embed.html?bbox=-71.1120%2C42.3320%2C-71.0960%2C42.3420&layer=mapnik&marker=42.3370%2C-71.1040"
              className="w-full h-60 border-0"
              loading="lazy"
            />
          </Card>
        </div>

        {/* Contact Form */}
        <Card className="lg:col-span-7">
          <h2 className="text-lg font-display font-bold text-slate-900 mb-1">Send Us a Message</h2>
          <p className="text-sm text-slate-600 mb-6">
            For medical emergencies, please call {SITE.emergencyPhone} immediately instead of using this form.
          </p>

          {error && <ErrorAlert message={error} className="mb-5" />}

          {submitted && (
            <div
              role="status"
              className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3 text-sm text-emerald-900"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-semibold">Inquiry received</p>
                <p className="text-emerald-800 mt-0.5">
                  Thank you for contacting {SITE.name}. Our team has logged your request and will reply shortly.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Jane Doe"
                required
              />
              <Input
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="jane@example.com"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Phone Number"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 234-5678"
              />
              <Input
                label="Subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Appointment, Billing, or Records"
                required
              />
            </div>

            <Textarea
              label="Message"
              rows={5}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="How can our care team assist you?"
              required
            />

            <Button type="submit" loading={loading} size="lg">
              <Send className="w-4 h-4" aria-hidden="true" />
              Submit Inquiry
            </Button>
          </form>
        </Card>
      </section>
    </div>
  );
}
