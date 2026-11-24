import {
  User,
  Patient,
  Doctor,
  Appointment,
  Billing,
  Prescription
} from './db.js';
import { env } from '../config/env.js';
import { roundCurrency } from './errors.js';

export async function initializeData({ force = false } = {}) {
  if (env.isProduction) {
    throw new Error('Refusing to run seed script in production environment.');
  }

  const existingUsers = await User.countDocuments();
  if (existingUsers > 0 && !force) {
    console.log('ℹ️  Database already contains data. Pass --force to wipe and reseed.');
    return { skipped: true };
  }

  console.log('🔄 Seeding HealthCore Medical Center demo database...');

  await Promise.all([
    User.deleteMany({}),
    Patient.deleteMany({}),
    Doctor.deleteMany({}),
    Appointment.deleteMany({}),
    Billing.deleteMany({}),
    Prescription.deleteMany({})
  ]);

  // Note: User model pre('save') hashes passwords automatically — pass plaintext once!
  const adminUser = await User.create({
    email: 'admin@healthcore.org',
    password: 'Password123',
    role: 'ADMIN',
    firstName: 'Elena',
    lastName: 'Vance',
    phone: '+1 (555) 201-0100',
    status: 'ACTIVE'
  });

  await User.create([
    {
      email: 'nurse@healthcore.org',
      password: 'Password123',
      role: 'NURSE',
      firstName: 'Hannah',
      lastName: 'Brooks',
      phone: '+1 (555) 201-0101',
      status: 'ACTIVE'
    },
    {
      email: 'accountant@healthcore.org',
      password: 'Password123',
      role: 'ACCOUNTANT',
      firstName: 'David',
      lastName: 'Chen',
      phone: '+1 (555) 201-0102',
      status: 'ACTIVE'
    }
  ]);

  const defaultSchedule = {
    monday: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
    tuesday: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
    wednesday: ['09:00', '10:00', '11:00', '14:00', '15:00'],
    thursday: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
    friday: ['09:00', '10:00', '11:00'],
    saturday: ['10:00', '11:00'],
    sunday: []
  };

  const doctorsData = [
    {
      email: 'dr.miller@healthcore.org',
      firstName: 'Sarah',
      lastName: 'Miller',
      phone: '+1 (555) 201-0201',
      specialization: 'Interventional Cardiology',
      department: 'Cardiology',
      licenseNumber: 'MC-CARD-1001',
      education: 'MD, Johns Hopkins University School of Medicine; FACC',
      yearsOfExperience: 16,
      consultationFee: 220,
      rating: 4.9,
      bio: 'Board-certified cardiologist specializing in preventive cardiology, heart failure management, and non-invasive cardiac imaging.'
    },
    {
      email: 'dr.patel@healthcore.org',
      firstName: 'Arjun',
      lastName: 'Patel',
      phone: '+1 (555) 201-0202',
      specialization: 'Clinical Neurology & Stroke Care',
      department: 'Neurology & Neurosurgery',
      licenseNumber: 'MC-NEUR-1002',
      education: 'MD, Harvard Medical School; Fellowship in Vascular Neurology',
      yearsOfExperience: 14,
      consultationFee: 240,
      rating: 4.8,
      bio: 'Neurologist focused on stroke rehabilitation, migraine therapeutics, and movement disorders.'
    },
    {
      email: 'dr.morales@healthcore.org',
      firstName: 'Carlos',
      lastName: 'Morales',
      phone: '+1 (555) 201-0203',
      specialization: 'Sports Medicine & Spine Surgery',
      department: 'Orthopedics & Spine',
      licenseNumber: 'MC-ORTH-1003',
      education: 'MD, Stanford University; Board Certified Orthopedic Surgeon',
      yearsOfExperience: 12,
      consultationFee: 210,
      rating: 4.9,
      bio: 'Orthopedic specialist dedicated to minimally invasive joint reconstruction and spinal care.'
    },
    {
      email: 'dr.kim@healthcore.org',
      firstName: 'Grace',
      lastName: 'Kim',
      phone: '+1 (555) 201-0204',
      specialization: 'Pediatric & Adolescent Medicine',
      department: 'Pediatrics',
      licenseNumber: 'MC-PEDI-1004',
      education: 'MD, Columbia University Vagelos College of Physicians & Surgeons',
      yearsOfExperience: 11,
      consultationFee: 160,
      rating: 4.9,
      bio: 'Compassionate pediatrician focusing on childhood immunizations, developmental screenings, and family wellness.'
    },
    {
      email: 'dr.foster@healthcore.org',
      firstName: 'James',
      lastName: 'Foster',
      phone: '+1 (555) 201-0205',
      specialization: 'Internal & Preventive Medicine',
      department: 'General Medicine / Internal Medicine',
      licenseNumber: 'MC-INTM-1005',
      education: 'MD, Mayo Clinic Alix School of Medicine; FACP',
      yearsOfExperience: 18,
      consultationFee: 150,
      rating: 4.7,
      bio: 'Primary care internist managing chronic conditions including diabetes, hypertension, and executive health screenings.'
    },
    {
      email: 'dr.alvarez@healthcore.org',
      firstName: 'Sofia',
      lastName: 'Alvarez',
      phone: '+1 (555) 201-0206',
      specialization: 'Clinical Dermatology',
      department: 'Dermatology (Skin & VD)',
      licenseNumber: 'MC-DERM-1006',
      education: 'MD, UCSF School of Medicine; FAAD',
      yearsOfExperience: 9,
      consultationFee: 175,
      rating: 4.8,
      bio: 'Dermatologist specializing in eczema, psoriasis, skin cancer screening, and evidence-based medical dermatology.'
    }
  ];

  const createdDoctors = [];
  for (const d of doctorsData) {
    const user = await User.create({
      email: d.email,
      password: 'Password123',
      role: 'DOCTOR',
      firstName: d.firstName,
      lastName: d.lastName,
      phone: d.phone,
      status: 'ACTIVE'
    });
    const doctor = await Doctor.create({
      userId: user._id,
      specialization: d.specialization,
      department: d.department,
      licenseNumber: d.licenseNumber,
      education: d.education,
      yearsOfExperience: d.yearsOfExperience,
      consultationFee: d.consultationFee,
      rating: d.rating,
      bio: d.bio,
      schedule: defaultSchedule,
      status: 'AVAILABLE'
    });
    createdDoctors.push(doctor);
  }

  const patientsData = [
    {
      email: 'patient@healthcore.org',
      firstName: 'Liam',
      lastName: 'Carter',
      phone: '+1 (555) 301-0001',
      dob: '1988-06-14',
      gender: 'MALE',
      bloodGroup: 'O+',
      address: '420 Oakwood Avenue, Suite 4B, Boston, MA',
      emergencyContact: 'Claire Carter — +1 (555) 301-0099',
      allergies: 'Penicillin',
      medicalHistory: ['Mild Hypertension', 'Seasonal Allergic Rhinitis'],
      vitals: { bloodPressure: '124/80', heartRate: 70, temperature: 98.4, oxygenSaturation: 99, weight: 76 }
    },
    {
      email: 'olivia.bennett@example.com',
      firstName: 'Olivia',
      lastName: 'Bennett',
      phone: '+1 (555) 301-0002',
      dob: '1993-11-22',
      gender: 'FEMALE',
      bloodGroup: 'A+',
      address: '88 Beacon Street, Boston, MA',
      emergencyContact: 'Mark Bennett — +1 (555) 301-0098',
      allergies: 'None',
      medicalHistory: ['Migraine'],
      vitals: { bloodPressure: '116/74', heartRate: 68, temperature: 98.6, oxygenSaturation: 99, weight: 61 }
    }
  ];

  const createdPatients = [];
  for (const p of patientsData) {
    const user = await User.create({
      email: p.email,
      password: 'Password123',
      role: 'PATIENT',
      firstName: p.firstName,
      lastName: p.lastName,
      phone: p.phone,
      status: 'ACTIVE'
    });
    const patient = await Patient.create({
      userId: user._id,
      dateOfBirth: new Date(p.dob),
      gender: p.gender,
      bloodGroup: p.bloodGroup,
      address: p.address,
      emergencyContact: p.emergencyContact,
      allergies: p.allergies,
      medicalHistory: p.medicalHistory,
      vitals: { ...p.vitals, updatedAt: new Date() }
    });
    createdPatients.push(patient);
  }

  // Create sample completed + upcoming appointments, invoices, and prescriptions
  const pastDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
  pastDate.setHours(10, 0, 0, 0);
  const futureDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  futureDate.setHours(14, 0, 0, 0);

  const completedApt = await Appointment.create({
    patientId: createdPatients[0]._id,
    doctorId: createdDoctors[0]._id,
    dateTime: pastDate,
    duration: 30,
    type: 'CONSULTATION',
    status: 'COMPLETED',
    reason: 'Annual cardiovascular evaluation and blood pressure follow-up',
    notes: 'ECG normal sinus rhythm. Continue lifestyle modifications and low-dose ACE inhibitor.'
  });

  const upcomingApt = await Appointment.create({
    patientId: createdPatients[1]._id,
    doctorId: createdDoctors[1]._id,
    dateTime: futureDate,
    duration: 30,
    type: 'FOLLOWUP',
    status: 'CONFIRMED',
    reason: 'Migraine preventive therapy review'
  });

  const taxRate = env.TAX_RATE;
  const fee1 = createdDoctors[0].consultationFee;
  const tax1 = roundCurrency(fee1 * taxRate);
  await Billing.create({
    patientId: createdPatients[0]._id,
    appointmentId: completedApt._id,
    items: [{ description: 'Cardiology Consultation — Dr. Sarah Miller', quantity: 1, unitPrice: fee1, total: fee1 }],
    subtotal: fee1,
    discount: 0,
    taxRate,
    tax: tax1,
    total: roundCurrency(fee1 + tax1),
    paidAmount: roundCurrency(fee1 + tax1),
    status: 'PAID',
    paymentMethod: 'CARD',
    paymentDate: pastDate,
    dueDate: new Date(pastDate.getTime() + 30 * 24 * 60 * 60 * 1000)
  });

  const fee2 = createdDoctors[1].consultationFee;
  const tax2 = roundCurrency(fee2 * taxRate);
  await Billing.create({
    patientId: createdPatients[1]._id,
    appointmentId: upcomingApt._id,
    items: [{ description: 'Neurology Follow-up — Dr. Arjun Patel', quantity: 1, unitPrice: fee2, total: fee2 }],
    subtotal: fee2,
    discount: 0,
    taxRate,
    tax: tax2,
    total: roundCurrency(fee2 + tax2),
    paidAmount: 0,
    status: 'UNPAID',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  });

  await Prescription.create({
    patientId: createdPatients[0]._id,
    doctorId: createdDoctors[0]._id,
    appointmentId: completedApt._id,
    diagnosis: 'Stage 1 Essential Hypertension — Controlled',
    medications: [
      {
        name: 'Lisinopril',
        dosage: '10 mg',
        frequency: 'Once daily (morning)',
        duration: '90 days',
        instructions: 'Monitor home blood pressure twice weekly'
      },
      {
        name: 'Omega-3 Fatty Acids',
        dosage: '1000 mg',
        frequency: 'Once daily with meals',
        duration: '90 days',
        instructions: 'Take with largest meal'
      }
    ],
    notes: 'Follow up in 3 months with basic metabolic panel.',
    status: 'ACTIVE'
  });

  console.log(`✅ Seeded database cleanly (Admin: ${adminUser.email} / Password123)`);
  return { seeded: true };
}
