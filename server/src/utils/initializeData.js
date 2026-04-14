// Data initialization utility for MongoDB
import { 
  User, 
  Patient, 
  Doctor, 
  Appointment, 
  Billing,
  Prescription,
  hashPassword 
} from './db.js';

export async function initializeData() {
  try {
    console.log('🗑️ Clearing existing database for fresh localization...');
    await Promise.all([
      User.deleteMany({}),
      Patient.deleteMany({}),
      Doctor.deleteMany({}),
      Appointment.deleteMany({}),
      Billing.deleteMany({}),
      Prescription.deleteMany({})
    ]);

    console.log('🌱 Seeding localized database...');

    const adminPassword = await hashPassword('admin123');
    const doctorPassword = await hashPassword('doctor123');
    const patientPassword = await hashPassword('patient123');

    // Admin User
    const adminUser = await User.create({
      email: 'admin@healthcore.com',
      password: adminPassword,
      role: 'ADMIN',
      firstName: 'Sarah',
      lastName: 'Mitchell',
      phone: '+880 1711000001',
      status: 'ACTIVE'
    });

    // Doctors
    const doctorsData = [
      { 
        firstName: 'Md. Khurshed', lastName: 'Ahmed', email: 'khurshed.ahmed@healthcore.com', specialization: 'Cardiology', fee: 1500, experience: 25, department: 'Cardiology', education: 'MBBS, FCPS (Medicine), MD (Cardiology)', affiliation: 'Professor, BSMMU',
        schedule: {
          saturday: ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'],
          sunday: ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'],
          monday: ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'],
          tuesday: ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'],
          wednesday: ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'],
          thursday: ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'],
          friday: []
        }
      },
      { 
        firstName: 'Golam', lastName: 'Morshed', email: 'golam.morshed@healthcore.com', specialization: 'Cardiology', fee: 1200, experience: 12, department: 'Cardiology', education: 'MBBS, MD (Cardiology)', affiliation: 'Assistant Professor, NICVD',
        schedule: {
          saturday: ['16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'],
          sunday: ['16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'],
          monday: ['16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'],
          tuesday: ['16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'],
          wednesday: ['16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'],
          thursday: ['16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'],
          friday: []
        }
      },
      { 
        firstName: 'Md. Kamrul', lastName: 'Ahsan', email: 'kamrul.ahsan@healthcore.com', specialization: 'Orthopedics & Spine', fee: 2000, experience: 20, department: 'Orthopedics & Spine', education: 'MBBS, MS (Ortho), FRCS, FACS, FICS', affiliation: 'Professor of Spinal Surgery, BSMMU',
        schedule: {
          saturday: [],
          sunday: [],
          monday: ['15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'],
          tuesday: [],
          wednesday: [],
          thursday: ['15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'],
          friday: []
        }
      },
      { 
        firstName: 'Chowdhury Iqbal', lastName: 'Mahmud', email: 'iqbal.mahmud@healthcore.com', specialization: 'Orthopedics & Spine', fee: 1500, experience: 15, department: 'Orthopedics & Spine', education: 'MBBS, FRCS (Glasg, Edin), MCh (Orth)', affiliation: 'Associate Professor, BSMMU',
        schedule: {
          saturday: ['17:30', '18:00', '18:30', '19:00', '19:30'],
          sunday: ['17:30', '18:00', '18:30', '19:00', '19:30'],
          monday: ['17:30', '18:00', '18:30', '19:00', '19:30'],
          tuesday: [],
          wednesday: ['17:30', '18:00', '18:30', '19:00', '19:30'],
          thursday: [],
          friday: []
        }
      },
      { 
        firstName: 'Haradhan', lastName: 'Deb Nath', email: 'haradhan.dn@healthcore.com', specialization: 'Neurology & Neurosurgery', fee: 2500, experience: 22, department: 'Neurology & Neurosurgery', education: 'MBBS, MS (Neurosurgery)', affiliation: 'Professor, Dept of Neurosurgery, BSMMU',
        schedule: {
          saturday: ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'],
          sunday: ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'],
          monday: ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'],
          tuesday: ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'],
          wednesday: ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'],
          thursday: ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'],
          friday: []
        }
      },
      { 
        firstName: 'Dhiman', lastName: 'Chowdhury', email: 'dhiman.c@healthcore.com', specialization: 'Neurology & Neurosurgery', fee: 2000, experience: 25, department: 'Neurology & Neurosurgery', education: 'MBBS, MS (Neurosurgery)', affiliation: 'Professor & Unit Chief, BSMMU',
        schedule: {
          saturday: ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'],
          sunday: [],
          monday: ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'],
          tuesday: [],
          wednesday: ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'],
          thursday: [],
          friday: []
        }
      },
      { 
        firstName: 'Md. Mizanur', lastName: 'Rahman', email: 'mizanur.r@healthcore.com', specialization: 'Pediatrics', fee: 1200, experience: 30, department: 'Pediatrics', education: 'MBBS, MD (Paediatrics)', affiliation: 'Professor (Retd.), Dhaka Shishu Hospital',
        schedule: {
          saturday: ['19:00', '19:30', '20:00', '20:30', '21:00', '21:30'],
          sunday: ['19:00', '19:30', '20:00', '20:30', '21:00', '21:30'],
          monday: ['19:00', '19:30', '20:00', '20:30', '21:00', '21:30'],
          tuesday: ['19:00', '19:30', '20:00', '20:30', '21:00', '21:30'],
          wednesday: ['19:00', '19:30', '20:00', '20:30', '21:00', '21:30'],
          thursday: ['19:00', '19:30', '20:00', '20:30', '21:00', '21:30'],
          friday: []
        }
      },
      { 
        firstName: 'Bidhan Kumar', lastName: 'Pramanik', email: 'bidhan.p@healthcore.com', specialization: 'Pediatrics', fee: 800, experience: 12, department: 'Pediatrics', education: 'MBBS, BCS (HEALTH), MD (PAEDIATRICS)', affiliation: 'Junior Consultant, Durgapur Health Complex',
        schedule: {
          saturday: ['16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'],
          sunday: ['16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'],
          monday: ['16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'],
          tuesday: ['16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'],
          wednesday: ['16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'],
          thursday: ['16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'],
          friday: []
        }
      },
      { 
        firstName: 'Rumana', lastName: 'Ahmed', email: 'rumana.a@healthcore.com', specialization: 'Pediatrics', fee: 1000, experience: 14, department: 'Pediatrics', education: 'MBBS (DU), MD (Pediatric Nephrology-BSMMU)', affiliation: 'Assistant Professor, EMCH',
        schedule: {
          saturday: ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30'],
          sunday: ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30'],
          monday: ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30'],
          tuesday: ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30'],
          wednesday: ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30'],
          thursday: ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30'],
          friday: []
        }
      },
      { 
        firstName: 'S M', lastName: 'Selimuzzaman', email: 'selimuzzaman@healthcore.com', specialization: 'General Medicine / Internal Medicine', fee: 1500, experience: 30, department: 'General Medicine / Internal Medicine', education: 'MBBS (DMC), MPhil, FCPS (Medicine)', affiliation: 'Brig. Gen. & Head of Internal Medicine, CMH',
        schedule: {
          saturday: ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'],
          sunday: ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'],
          monday: ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'],
          tuesday: ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'],
          wednesday: ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'],
          thursday: ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'],
          friday: []
        }
      },
      { 
        firstName: 'Tanvir', lastName: 'Ahmed', email: 'tanvir.a@healthcore.com', specialization: 'ENT (Otolaryngology)', fee: 1000, experience: 12, department: 'ENT (Otolaryngology)', education: 'MBBS, DLO (ENT)', affiliation: 'Consultant, BSMMU (PG Hospital)',
        schedule: {
          saturday: [],
          sunday: ['15:00', '15:30', '16:00', '16:30', '17:00'],
          monday: [],
          tuesday: ['15:00', '15:30', '16:00', '16:30', '17:00'],
          wednesday: [],
          thursday: ['15:00', '15:30', '16:00', '16:30', '17:00'],

          friday: []
        }
      }
    ];

    const createdDoctors = [];
    for (const d of doctorsData) {
      const user = await User.create({
        email: d.email,
        password: doctorPassword,
        role: 'DOCTOR',
        firstName: d.firstName,
        lastName: d.lastName,
        phone: '+880 1' + (Math.floor(Math.random() * 9)) + (Math.floor(Math.random() * 90000000) + 10000000).toString().substring(0, 8),
        status: 'ACTIVE'
      });

      const doctor = await Doctor.create({
        userId: user._id,
        specialization: d.specialization,
        department: d.department,
        licenseNumber: 'BMDC-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        education: d.education,
        yearsOfExperience: d.experience,
        consultationFee: d.fee,
        bio: `Specialized in ${d.affiliation}. Committed to providing world-class healthcare in Bangladesh.`,
        schedule: d.schedule,
        rating: (4.4 + Math.random() * 0.6).toFixed(1),
        status: 'AVAILABLE'
      });
      createdDoctors.push(doctor);
    }

    // Patients (Increased for pagination)
    const patientsData = [
      { firstName: 'Michael', lastName: 'Johnson', email: 'michael.j@email.com', dob: '1985-03-15', gender: 'MALE', blood: 'O+' },
      { firstName: 'Amanda', lastName: 'Roberts', email: 'amanda.r@email.com', dob: '1992-07-22', gender: 'FEMALE', blood: 'A-' },
      { firstName: 'Christopher', lastName: 'Lee', email: 'chris.lee@email.com', dob: '1978-11-08', gender: 'MALE', blood: 'B+' },
      { firstName: 'Jessica', lastName: 'Martinez', email: 'jess.m@email.com', dob: '1995-02-28', gender: 'FEMALE', blood: 'AB+' },
      { firstName: 'Daniel', lastName: 'Anderson', email: 'dan.a@email.com', dob: '1988-09-14', gender: 'MALE', blood: 'O-' },
      { firstName: 'Sarah', lastName: 'Thompson', email: 'sarah.t@email.com', dob: '1990-05-30', gender: 'FEMALE', blood: 'A+' },
      { firstName: 'Matthew', lastName: 'White', email: 'matt.w@email.com', dob: '1982-12-03', gender: 'MALE', blood: 'B-' },
      { firstName: 'Ashley', lastName: 'Harris', email: 'ashley.h@email.com', dob: '1993-08-19', gender: 'FEMALE', blood: 'O+' },
      { firstName: 'David', lastName: 'Miller', email: 'david.m@email.com', dob: '1975-06-12', gender: 'MALE', blood: 'A+' },
      { firstName: 'Jennifer', lastName: 'Davis', email: 'jen.d@email.com', dob: '1989-10-05', gender: 'FEMALE', blood: 'B+' },
      { firstName: 'Robert', lastName: 'Wilson', email: 'robert.w@email.com', dob: '1968-04-25', gender: 'MALE', blood: 'O-' },
      { firstName: 'Emily', lastName: 'Brown', email: 'emily.b@email.com', dob: '1998-12-30', gender: 'FEMALE', blood: 'AB-' },
      { firstName: 'James', lastName: 'Taylor', email: 'james.t@email.com', dob: '1980-01-15', gender: 'MALE', blood: 'A-' },
      { firstName: 'Linda', lastName: 'Jones', email: 'linda.j@email.com', dob: '1972-08-18', gender: 'FEMALE', blood: 'O+' },
      { firstName: 'Mark', lastName: 'Clark', email: 'mark.c@email.com', dob: '1984-05-22', gender: 'MALE', blood: 'B+' }
    ];

    const createdPatients = [];
    for (const p of patientsData) {
      const user = await User.create({
        email: p.email,
        password: patientPassword,
        role: 'PATIENT',
        firstName: p.firstName,
        lastName: p.lastName,
        phone: '+880 16' + (Math.floor(Math.random() * 90000000) + 10000000).toString().substring(0, 8),
        status: 'ACTIVE'
      });

      const patient = await Patient.create({
        userId: user._id,
        dateOfBirth: p.dob,
        gender: p.gender,
        bloodGroup: p.blood,
        address: 'Dhaka, Bangladesh',
        emergencyContact: '+880 1711223344',
        allergies: Math.random() > 0.5 ? 'Penicillin' : 'None',
        medicalHistory: ['Annual checkup', 'Vaccinations up to date'],
        medications: [],
        insuranceProvider: 'Bima Medical',
        insurancePolicyNumber: 'BM' + Math.random().toString().substring(2, 12)
      });
      createdPatients.push(patient);
    }

    // Sample appointments
    const appointmentTypes = ['CONSULTATION', 'FOLLOWUP', 'CHECKUP'];

    for (let i = 0; i < 40; i++) {
      const patient = createdPatients[Math.floor(Math.random() * createdPatients.length)];
      const doctor = createdDoctors[Math.floor(Math.random() * createdDoctors.length)];
      
      const daysOffset = Math.floor(Math.random() * 30) - 5;
      const appointmentDate = new Date();
      appointmentDate.setDate(appointmentDate.getDate() + daysOffset);
      appointmentDate.setHours(9 + Math.floor(Math.random() * 7), Math.random() > 0.5 ? 0 : 30, 0, 0);

      const status = daysOffset < 0 ? 'COMPLETED' : 'SCHEDULED';

      const appointment = await Appointment.create({
        patientId: patient._id,
        doctorId: doctor._id,
        dateTime: appointmentDate,
        duration: 30,
        type: appointmentTypes[Math.floor(Math.random() * appointmentTypes.length)],
        status: status,
        reason: ['Regular checkup', 'Follow-up visit', 'New symptoms', 'Prescription renewal'][Math.floor(Math.random() * 4)],
        notes: status === 'COMPLETED' ? 'Patient consultation completed successfully.' : ''
      });

      // Create billing for completed appointments
      if (status === 'COMPLETED') {
        const items = [{ description: 'Consultation Fee', quantity: 1, unitPrice: doctor.consultationFee, total: doctor.consultationFee }];
        const subtotal = doctor.consultationFee;
        const tax = subtotal * 0.05;
        const total = subtotal + tax;

        await Billing.create({
          patientId: patient._id,
          appointmentId: appointment._id,
          items,
          subtotal,
          tax,
          total,
          status: 'PAID',
          paymentMethod: 'CASH',
          paymentDate: appointmentDate,
          dueDate: appointmentDate
        });

        // Add sample prescription
        await Prescription.create({
          patientId: patient._id,
          doctorId: doctor._id,
          appointmentId: appointment._id,
          diagnosis: 'General malaise and mild seasonal allergies',
          medications: [
            { name: 'Napa Extend', dosage: '665mg', frequency: 'Three times daily', duration: '5 days', instructions: 'After meal' },
            { name: 'Fexo 120', dosage: '120mg', frequency: 'Once daily', duration: '10 days', instructions: 'Take before sleep' }
          ],
          notes: 'Advised to drink plenty of warm water.',
          issuedDate: appointmentDate
        });
      }
    }

    console.log('✅ Sample data successfully seeded to MongoDB with realistic Bangladeshi doctors');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
}