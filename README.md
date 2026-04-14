# Enterprise Healthcare Management System (HMS) - Technical Specification

## 1. Project Overview

### Project Name
**HealthCore HMS** - Enterprise Healthcare Management System

### Project Type
Full-stack healthcare management application with microservices architecture simulation

### Core Feature Summary
A comprehensive hospital management system enabling patient registration, appointment scheduling, doctor management, billing, and administrative dashboard with role-based access control.

### Target Users
- **Admin**: System administrators managing doctors, staff, and system settings
- **Doctor**: Healthcare providers managing appointments and patient records
- **Nurse**: Medical staff assisting with patient management
- **Patient**: Individuals booking appointments and viewing their health records
- **Accountant**: Finance staff managing billing and payments

---

## 2. Architecture Overview

### System Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│              Tailwind CSS + Redux Toolkit                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway (Express)                    │
│              JWT Auth + Rate Limiting                       │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│ Auth Service  │    │ Patient Svc   │    │ Appointment   │
│               │    │               │    │ Service       │
└───────────────┘    └───────────────┘    └───────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Database Layer                            │
│        PostgreSQL + Redis (Session/Cache)                   │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: SQLite (simulated PostgreSQL for demo)
- **Cache**: In-memory store (simulated Redis)
- **Authentication**: JWT with bcrypt password hashing

---

## 3. UI/UX Specification

### Color Palette (Healthcare Theme)
- **Primary**: `#0D9488` (Teal - Trust & Healthcare)
- **Primary Dark**: `#0F766E`
- **Primary Light**: `#14B8A6`
- **Secondary**: `#1E40AF` (Deep Blue - Professional)
- **Accent**: `#F59E0B` (Amber - Alerts/Highlights)
- **Success**: `#10B981` (Green)
- **Warning**: `#F97316` (Orange)
- **Error**: `#EF4444` (Red)
- **Background**: `#F8FAFC` (Light gray-blue)
- **Surface**: `#FFFFFF` (White cards)
- **Text Primary**: `#0F172A` (Slate 900)
- **Text Secondary**: `#64748B` (Slate 500)

### Typography
- **Headings**: Inter (Google Fonts), weights: 600, 700
- **Body**: Inter, weight: 400, 500
- **Monospace**: JetBrains Mono (for medical codes/IDs)
- **Scale**: 12px, 14px, 16px, 18px, 24px, 32px, 48px

### Spacing System
- Base unit: 4px
- Margins: 16px, 24px, 32px, 48px
- Padding: 8px, 12px, 16px, 24px, 32px
- Border radius: 6px (small), 8px (medium), 12px (large), 16px (cards)

### Visual Effects
- **Shadows**:
  - Card: `0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)`
  - Elevated: `0 10px 15px -3px rgba(0,0,0,0.1)`
  - Modal: `0 25px 50px -12px rgba(0,0,0,0.25)`
- **Gradients**:
  - Primary: `linear-gradient(135deg, #0D9488 0%, #0F766E 100%)`
  - Hero: `linear-gradient(135deg, #0D9488 0%, #1E40AF 100%)`
- **Transitions**: 200ms ease-in-out for hover states

### Layout Structure

#### Dashboard Layout
```
┌─────────────────────────────────────────────────────────┐
│  Header (Logo + Search + User Profile)                 │
├─────────┬───────────────────────────────────────────────┤
│         │                                               │
│  Side   │   Main Content Area                          │
│  Nav    │   - Dashboard Widgets                         │
│  (200px)│   - Tables/Lists                             │
│         │   - Forms                                     │
│         │                                               │
├─────────┴───────────────────────────────────────────────┤
│  Footer (Optional)                                       │
└─────────────────────────────────────────────────────────┘
```

### Component Specifications

#### Navigation Sidebar
- Width: 240px (collapsed: 64px)
- Icons: Lucide React icons (24px)
- Active state: Teal background with white text
- Hover: Light teal background
- Badge support for notifications

#### Cards
- Border radius: 12px
- Padding: 24px
- Shadow: Card shadow
- Hover: Slight elevation increase

#### Tables
- Header: Gray background (#F1F5F9)
- Row hover: Light blue tint (#F0F9FF)
- Pagination: Bottom right
- Sort indicators: Up/Down arrows

#### Forms
- Input height: 40px
- Border: 1px solid #E2E8F0
- Focus: 2px teal ring
- Error: Red border + message below
- Labels: Above input, font-weight 500

#### Buttons
- Primary: Teal background, white text, 40px height
- Secondary: White background, teal border
- Danger: Red background, white text
- Disabled: Gray background, reduced opacity
- Loading: Spinner icon

---

## 4. Core Modules Specification

### 4.1 Authentication & IAM

#### Login Page
- Email input field
- Password field with show/hide toggle
- Remember me checkbox
- Forgot password link
- Error messages for invalid credentials
- Loading state during authentication

#### Registration
- Full name, email, password, confirm password
- Role selection (Patient default)
- Terms acceptance checkbox

#### JWT Token Structure
```json
{
  "userId": "uuid",
  "email": "string",
  "role": "ADMIN|DOCTOR|NURSE|PATIENT|ACCOUNTANT",
  "iat": "timestamp",
  "exp": "timestamp (24h)"
}
```

### 4.2 Patient Management (EHR)

#### Patient List View
- Search by name, email, phone, patient ID
- Filter by status (Active/Inactive)
- Sort by name, registration date
- Pagination (20 per page)
- Export to CSV

#### Patient Profile
- Personal Information: Name, DOB, Gender, Blood Group, Contact
- Medical History: Conditions, allergies, medications
- Documents: Upload/View medical documents
- Visit History: Timeline of all visits
- Billing: Associated invoices and payments

#### Fields
```javascript
{
  id: "string (UUID)",
  firstName: "string",
  lastName: "string",
  email: "string",
  phone: "string",
  dateOfBirth: "date",
  gender: "MALE|FEMALE|OTHER",
  bloodGroup: "A+|A-|B+|B-|AB+|AB-|O+|O-",
  address: "string",
  emergencyContact: "string",
  allergies: ["string"],
  medicalHistory: ["string"],
  medications: ["string"],
  insuranceProvider: "string",
  insurancePolicyNumber: "string",
  status: "ACTIVE|INACTIVE",
  createdAt: "timestamp"
}
```

### 4.3 Doctor Management

#### Doctor List
- Search by name, specialization
- Filter by availability, specialization
- View schedule availability
- Performance metrics (ratings, completed appointments)

#### Doctor Profile
- Personal info: Name, credentials, specialization
- Education: Degrees, certifications
- Schedule: Weekly availability slots
- Statistics: Patients seen, ratings, response time

#### Doctor Fields
```javascript
{
  id: "string",
  userId: "string",
  firstName: "string",
  lastName: "string",
  specialization: "GENERAL|CARDIOLOGY|DERMATOLOGY|ORTHOPEDICS|...",
  licenseNumber: "string",
  education: "string",
  yearsOfExperience: "number",
  consultationFee: "number",
  schedule: {
    monday: ["09:00", "10:00", ...],
    tuesday: [...],
    // ...
  },
  rating: "number (1-5)",
  status: "AVAILABLE|BUSY|OFFLINE"
}
```

### 4.4 Appointment System

#### Appointment Booking Flow
1. Select department/specialization
2. Choose available doctor
3. Pick date and time slot
4. Enter reason for visit
5. Confirm booking
6. Receive confirmation + SMS/Email

#### Appointment States
- `SCHEDULED` - Booked, upcoming
- `CONFIRMED` - Confirmed by both parties
- `IN_PROGRESS` - Currently being seen
- `COMPLETED` - Successfully completed
- `CANCELLED` - Cancelled by patient
- `NO_SHOW` - Patient didn't arrive

#### Appointment Fields
```javascript
{
  id: "string",
  patientId: "string",
  doctorId: "string",
  dateTime: "datetime",
  duration: "number (minutes)",
  type: "CONSULTATION|FOLLOWUP|CHECKUP|EMERGENCY",
  status: "SCHEDULED|CONFIRMED|IN_PROGRESS|COMPLETED|CANCELLED|NO_SHOW",
  reason: "string",
  notes: "string",
  paymentStatus: "PENDING|COMPLETED|REFUNDED"
}
```

### 4.5 Billing & Payments

#### Invoice Generation
- Auto-generate on appointment completion
- Include: Consultation fee, tests, medications, services
- Apply insurance if applicable
- Generate receipt on payment

#### Payment Methods
- Cash
- Credit/Debit Card
- Insurance
- Online Payment

#### Billing Fields
```javascript
{
  id: "string",
  patientId: "string",
  appointmentId: "string",
  items: [{
    description: "string",
    quantity: "number",
    unitPrice: "number",
    total: "number"
  }],
  subtotal: "number",
  discount: "number",
  tax: "number",
  total: "number",
  status: "PENDING|PAID|PARTIAL|CANCELLED",
  paymentMethod: "CASH|CARD|INSURANCE|ONLINE",
  paymentDate: "date",
  dueDate: "date"
}
```

### 4.6 Admin Dashboard

#### Overview Widgets
- Total Patients (with trend)
- Today's Appointments (with status breakdown)
- Revenue (today, this week, this month)
- Doctor Availability

#### Charts & Analytics
- Patient Registration Trend (Line chart)
- Appointments by Department (Pie chart)
- Revenue by Month (Bar chart)
- Doctor Performance (Horizontal bar)

#### Admin Actions
- Manage Doctors (Add/Edit/Deactivate)
- Manage Staff
- System Settings
- View Audit Logs
- Reports Generation

---

## 5. User Flows

### Patient Registration Flow
```
Landing Page → Register → Patient Dashboard → Book Appointment
                                    ↓
                              Complete Visit ← Doctor Dashboard
                                    ↓
                              View Bill → Make Payment
```

### Doctor Workflow
```
Login → View Schedule → See Appointments → Start Consultation
                                              ↓
                                    Update Patient Record → Complete Appointment
                                              ↓
                                    Generate Bill
```

### Admin Workflow
```
Login → Dashboard Overview → Manage Users → View Reports → System Settings
```

---

## 6. API Endpoints

### Authentication
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
GET  /api/auth/me
```

### Patients
```
GET    /api/patients
POST   /api/patients
GET    /api/patients/:id
PUT    /api/patients/:id
DELETE /api/patients/:id
GET    /api/patients/:id/appointments
GET    /api/patients/:id/billing
```

### Doctors
```
GET    /api/doctors
POST   /api/doctors
GET    /api/doctors/:id
PUT    /api/doctors/:id
DELETE /api/doctors/:id
GET    /api/doctors/:id/schedule
PUT    /api/doctors/:id/schedule
```

### Appointments
```
GET    /api/appointments
POST   /api/appointments
GET    /api/appointments/:id
PUT    /api/appointments/:id
DELETE /api/appointments/:id
PUT    /api/appointments/:id/status
GET    /api/appointments/available-slots
```

### Billing
```
GET    /api/billing
POST   /api/billing
GET    /api/billing/:id
PUT    /api/billing/:id
POST   /api/billing/:id/pay
GET    /api/billing/patient/:patientId
```

### Dashboard
```
GET    /api/dashboard/stats
GET    /api/dashboard/appointments/today
GET    /api/dashboard/revenue
```

---

## 7. Data Models

### User
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'DOCTOR', 'NURSE', 'PATIENT', 'ACCOUNTANT')),
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  phone TEXT,
  avatar TEXT,
  status TEXT DEFAULT 'ACTIVE',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Patient
```sql
CREATE TABLE patients (
  id TEXT PRIMARY KEY,
  userId TEXT UNIQUE NOT NULL,
  dateOfBirth DATE,
  gender TEXT,
  bloodGroup TEXT,
  address TEXT,
  emergencyContact TEXT,
  allergies TEXT,
  medicalHistory TEXT,
  medications TEXT,
  insuranceProvider TEXT,
  insurancePolicyNumber TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

### Doctor
```sql
CREATE TABLE doctors (
  id TEXT PRIMARY KEY,
  userId TEXT UNIQUE NOT NULL,
  specialization TEXT NOT NULL,
  licenseNumber TEXT,
  education TEXT,
  yearsOfExperience INTEGER,
  consultationFee REAL,
  schedule TEXT,
  rating REAL DEFAULT 0,
  status TEXT DEFAULT 'AVAILABLE',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

### Appointment
```sql
CREATE TABLE appointments (
  id TEXT PRIMARY KEY,
  patientId TEXT NOT NULL,
  doctorId TEXT NOT NULL,
  dateTime DATETIME NOT NULL,
  duration INTEGER DEFAULT 30,
  type TEXT,
  status TEXT DEFAULT 'SCHEDULED',
  reason TEXT,
  notes TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patientId) REFERENCES patients(id),
  FOREIGN KEY (doctorId) REFERENCES doctors(id)
);
```

### Billing
```sql
CREATE TABLE billing (
  id TEXT PRIMARY KEY,
  patientId TEXT NOT NULL,
  appointmentId TEXT,
  items TEXT,
  subtotal REAL,
  discount REAL DEFAULT 0,
  tax REAL DEFAULT 0,
  total REAL,
  status TEXT DEFAULT 'PENDING',
  paymentMethod TEXT,
  paymentDate DATETIME,
  dueDate DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patientId) REFERENCES patients(id)
);
```

---

## 8. Security Requirements

### Password Policy
- Minimum 8 characters
- At least one uppercase, one lowercase, one number
- Bcrypt hashing with salt rounds: 10

### JWT Configuration
- Expiration: 24 hours
- Refresh token: 7 days
- Algorithm: HS256

### Role-Based Access Control
| Resource | ADMIN | DOCTOR | NURSE | PATIENT | ACCOUNTANT |
|----------|-------|--------|-------|---------|------------|
| Users (CRUD) | ✓ | - | - | - | - |
| Doctors (CRUD) | ✓ | R | - | - | - |
| Patients (CRUD) | ✓ | R | CRU | R | R |
| Appointments | ✓ | CRUD | CRU | CR | R |
| Billing | ✓ | R | - | R | CRUD |

---

## 9. File Structure

```
/healthcare-hms/
├── client/                    # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/       # Reusable components
│   │   │   ├── layout/       # Layout components
│   │   │   └── modules/       # Feature-specific components
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── patients/
│   │   │   ├── doctors/
│   │   │   ├── appointments/
│   │   │   └── billing/
│   │   ├── services/          # API services
│   │   ├── store/             # Redux store
│   │   ├── hooks/             # Custom hooks
│   │   ├── utils/             # Utility functions
│   │   └── styles/            # Global styles
│   ├── package.json
│   └── vite.config.js
│
├── server/                    # Node.js Backend
│   ├── src/
│   │   ├── config/           # Configuration
│   │   ├── controllers/      # Route controllers
│   │   ├── middleware/       # Auth, validation middleware
│   │   ├── models/           # Data models
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic
│   │   └── utils/            # Utilities
│   ├── package.json
│   └── server.js
│
└── package.json               # Root package.json for monorepo
```

---

## 10. Acceptance Criteria

### Authentication
- [ ] Users can register with email and password
- [ ] Users can login and receive JWT token
- [ ] Protected routes redirect to login if unauthorized
- [ ] Role-based access control works correctly

### Patient Management
- [ ] Admin/Doctor can create, read, update patients
- [ ] Patients can view their own profile
- [ ] Search and filter functionality works
- [ ] Patient medical history is stored correctly

### Doctor Management
- [ ] Admin can manage doctor profiles
- [ ] Doctors can update their schedule
- [ ] Specialization filtering works
- [ ] Availability status updates correctly

### Appointments
- [ ] Patients can book appointments
- [ ] Available slots are shown correctly
- [ ] Doctors can manage their appointments
- [ ] Status transitions work correctly

### Billing
- [ ] Bills are generated automatically
- [ ] Payment processing works
- [ ] Invoice history is maintained
- [ ] Status tracking is accurate

### Dashboard
- [ ] Real-time statistics display
- [ ] Charts render correctly
- [ ] Data updates without page refresh
- [ ] Responsive on all screen sizes

### Visual Checkpoints
- [ ] Color scheme matches healthcare theme
- [ ] Typography is consistent throughout
- [ ] Spacing and layout are uniform
- [ ] Animations are smooth (200ms)
- [ ] Responsive on mobile/tablet/desktop

---

## 11. Implementation Phases

### Phase 1: Core MVP (Current)
- Authentication with JWT
- Patient Management (CRUD)
- Doctor Management (CRUD)
- Appointment System
- Basic Billing
- Admin Dashboard

### Phase 2: Enhancement
- Pharmacy Management
- Lab/Diagnostics Integration
- Real-time Notifications
- Audit Logging

### Phase 3: Advanced
- AI Diagnosis Assistant
- Advanced Analytics
- Multi-language Support
- Mobile App

---

*Specification Version: 1.0*
*Last Updated: 2026-04-14*