import { Printer } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { BrandLogo } from './BrandLogo';
import { StatusBadge } from './Badge';
import { SITE, formatDate, formatShortId } from '../../config/site';

export function PrintablePrescriptionModal({ prescription, open, onClose }) {
  if (!prescription) return null;

  const patientUser = prescription.patientId?.userId;
  const doctorUser = prescription.doctorId?.userId;
  const medications = prescription.medications || [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Official Prescription Sheet"
      subtitle={`Rx ${formatShortId(prescription._id, '#RX-')}`}
      maxWidth="max-w-3xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" onClick={() => window.print()}>
            <Printer className="w-4 h-4" />
            Print / Save PDF
          </Button>
        </>
      }
    >
      <div className="print-sheet space-y-6">
        {/* Letterhead */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-200">
          <BrandLogo subtitle={SITE.tagline} />
          <div className="text-xs text-slate-600 sm:text-right space-y-0.5">
            <p className="font-semibold text-slate-900">{SITE.name}</p>
            <p>{SITE.address}</p>
            <p>{SITE.appointmentPhone} · {SITE.email}</p>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 rounded-xl border border-slate-200 p-4 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Patient</p>
            <p className="font-semibold text-slate-900 mt-0.5">
              {patientUser ? `${patientUser.firstName} ${patientUser.lastName}` : 'Patient Record'}
            </p>
            <p className="text-xs font-mono text-slate-600 mt-0.5">
              PID {formatShortId(prescription.patientId?._id, '')}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Prescribing Physician</p>
            <p className="font-semibold text-slate-900 mt-0.5">
              Dr. {doctorUser ? `${doctorUser.firstName} ${doctorUser.lastName}` : 'Attending Physician'}
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              {prescription.doctorId?.department || prescription.doctorId?.specialization || 'Clinical Care'}
              {prescription.doctorId?.licenseNumber ? ` · Lic. ${prescription.doctorId.licenseNumber}` : ''}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Issued Date</p>
            <p className="font-medium text-slate-900 mt-0.5">
              {formatDate(prescription.issuedDate || prescription.createdAt)}
            </p>
          </div>
          <div className="sm:text-right flex sm:flex-col sm:items-end justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Status</p>
            <div className="mt-1">
              <StatusBadge status={prescription.status || 'ACTIVE'} />
            </div>
          </div>
        </div>

        {/* Diagnosis */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1">
            Clinical Diagnosis
          </p>
          <p className="text-base font-semibold text-slate-900">{prescription.diagnosis}</p>
        </div>

        {/* Rx Table */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="font-display text-2xl font-extrabold text-primary-700 leading-none">Rx</span>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Prescribed Medications ({medications.length})
            </span>
          </div>
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5 text-xs font-semibold text-slate-700">Medication</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-slate-700">Dosage</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-slate-700">Frequency</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-slate-700">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {medications.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-600">
                      No medications listed on this prescription.
                    </td>
                  </tr>
                ) : (
                  medications.map((med, idx) => (
                    <tr key={`${med.name}-${idx}`}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{med.name}</p>
                        {med.instructions && (
                          <p className="text-xs text-slate-600 mt-0.5">{med.instructions}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-800">{med.dosage}</td>
                      <td className="px-4 py-3 text-slate-700">{med.frequency}</td>
                      <td className="px-4 py-3 text-slate-700">{med.duration}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notes & Follow-up */}
        {(prescription.notes || prescription.followUpDate) && (
          <div className="rounded-xl bg-primary-50/60 border border-primary-100 p-4 space-y-2">
            {prescription.notes && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary-800">
                  Clinical Advice & Instructions
                </p>
                <p className="text-sm text-slate-800 mt-1 whitespace-pre-line">{prescription.notes}</p>
              </div>
            )}
            {prescription.followUpDate && (
              <p className="text-xs font-semibold text-primary-800">
                Recommended Follow-up: {formatDate(prescription.followUpDate)}
              </p>
            )}
          </div>
        )}

        {/* Signature block */}
        <div className="pt-6 border-t border-slate-200 flex items-end justify-between text-xs text-slate-600">
          <p>Electronically issued via {SITE.name} EHR</p>
          <div className="text-right">
            <div className="w-44 border-b border-slate-400 mb-1" />
            <p className="font-semibold text-slate-900">
              Dr. {doctorUser ? `${doctorUser.firstName} ${doctorUser.lastName}` : 'Physician'}
            </p>
            <p>Authorized Medical Signature</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
