# HealthCore Medical Center — Clinical Management Platform

A production-hardened, full-stack **Healthcare Management System (HMS)** built with **React 18 + Vite + Tailwind CSS** on the frontend and **Node.js + Express + MongoDB (Mongoose)** on the backend.

---

## Key Capabilities

### Public Patient Portal
- **Live Clinical Directory:** Real-time specialty departments and active physician counts pulled directly from MongoDB.
- **Specialist Search & Profiles:** Search physicians by name, specialty, department, or credentials; view verified license numbers and weekly 7-day schedules with clickable time slots.
- **4-Step Live Booking Flow:** Select specialist, pick live available slots with duration-aware conflict prevention, preserve selections across sign-in, and generate an automatic consultation invoice.
- **Contact & Inquiries:** Validated inquiry form persisted in MongoDB with optional SMTP staff notification and an interactive campus map.

### Role-Based Clinical Portal (`ADMIN`, `DOCTOR`, `NURSE`, `PATIENT`, `ACCOUNTANT`)
- **Role-Specific Dashboards:** Real-time MongoDB aggregation analytics, Chart.js revenue trends (`month`, `6months`, `year`), appointment status distribution, physician queues, nursing operations, financial ledgers, and patient portals.
- **Electronic Health Records (EHR):** Demographics, allergies, medical history, clinical vitals recording, visit timeline, digital prescriptions, and patient billing.
- **Appointments Workflow:** Full lifecycle management (`SCHEDULED` → `CONFIRMED` → `IN_PROGRESS` → `COMPLETED` / `CANCELLED` / `NO_SHOW`), rescheduling with overlap validation, and automatic voiding of unpaid invoices on cancellation.
- **Digital Prescriptions (Rx):** Structured medication regimens with A4 print-ready prescription sheets (`@media print`).
- **Financial Billing & Payments:** Itemized USD (`$`) invoice builder, configurable tax rate (`TAX_RATE`), full & partial payments, CSV ledger exports, and A4 printable statements.
- **Security Audit Trail & Inquiries:** Admin dashboard tracking authentication, clinical mutations, billing settlements, and public contact messages.

---

## Security & Architecture Highlights

- **Fail-Fast Environment Config ([env.js](server/src/config/env.js)):** Loads `dotenv/config` before any module imports—eliminating ESM hoisting bugs and hardcoded JWT fallbacks.
- **Strict Auth & OTP Hardening:** `HS256` JWT enforcement, active-account verification on every request, `PATIENT`-locked public registration, CSPRNG 6-digit OTPs stored as SHA-256 hashes with 5-attempt lockout, and `zod` input validation blocking NoSQL operator injection.
- **Defense-in-Depth RBAC & Ownership Scoping:** Every clinical route enforces role and resource ownership checks so patients only access their own records, doctors only modify assigned visits/prescriptions, and password hashes are never serialized (`select: false`).
- **Production Middleware:** `helmet` security headers, allowlisted CORS, HTTP-boundary NoSQL operator sanitizer (`sanitizeIncomingRequest`), tiered rate limiters (`apiLimiter`, `authLimiter`, `otpLimiter`, `contactLimiter`), `compression`, `morgan` request logs, `/api/health` + `/api/ready` probes, and graceful `SIGTERM`/`SIGINT` shutdown.

---

## Project Structure

```text
healthcare-hms/
├── .github/workflows/ci.yml      # GitHub Actions CI (backend tests + frontend build)
├── package.json                  # Root workspace helper scripts
├── client/                       # React 18 + Vite + Tailwind CSS frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/           # PublicLayout, AuthLayout, DashboardLayout
│   │   │   └── ui/               # Accessible clinical design system primitives
│   │   ├── config/site.js        # Hospital branding, USD currency & date utilities
│   │   ├── pages/                # Public, Auth, Dashboard, Patients, Doctors, Appointments, Billing, Prescriptions, Settings, AuditLogs
│   │   ├── services/api.js       # HTTP client with safe JSON parsing & 401 session handling
│   │   └── store/AuthContext.jsx # Global authentication state
│   └── .env.example
└── server/                       # Node.js + Express + MongoDB backend
    ├── src/
    │   ├── config/env.js         # Validated environment & domain constants
    │   ├── middleware/           # auth, validate (Zod), rateLimiter, errorHandler
    │   ├── models/               # Mongoose schemas with indexes & JSON transforms
    │   ├── routes/               # auth, patient, doctor, appointment, billing, prescription, dashboard, contact
    │   ├── utils/                # db, errors, audit, emailService, initializeData
    │   ├── app.js                # Express app factory (used by server.js & Supertest)
    │   ├── server.js             # DB-first bootstrap & graceful shutdown
    │   └── seed.js               # Guarded non-production seed CLI
    ├── test/                     # Automated Node test runner + Supertest security & API tests
    └── .env.example
```

---

## Getting Started

### Prerequisites
- **Node.js** `>= 20.0.0`
- **MongoDB** (Atlas cluster or local MongoDB instance)

### 1. Configure Environment Variables
Copy the example files and fill in your credentials:
```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```
> **Important:** Never commit `.env` files to Git. If secrets were ever committed previously, rotate your `MONGODB_URI` password, `JWT_SECRET`, and `SMTP_PASS`.

### 2. Install Dependencies
```bash
npm run install:all
```

### 3. (Optional) Seed Demo Data in Development
```bash
# Safe by default (skips if database already has users; refuses to run in production)
npm run seed

# Wipe and reseed demo accounts (development only)
npm --prefix server run seed -- --force
```

### 4. Run in Development
Open two terminals:
```bash
# Terminal 1 — Backend API (http://localhost:3001)
npm run dev:server

# Terminal 2 — Frontend Vite Dev Server (http://localhost:5173)
npm run dev:client
```
*(On Windows PowerShell if script execution policy blocks `npm`, use `npm.cmd` instead of `npm`.)*

### 5. Run Tests & Production Build
```bash
# Run backend security, RBAC & validation tests
npm test

# Build optimized frontend bundle
npm run build

# Run full verification (tests + build)
npm run verify
```

---

## RBAC Matrix

| Resource | ADMIN | DOCTOR | NURSE | PATIENT | ACCOUNTANT |
|---|---|---|---|---|---|
| Patients Directory | CRUD | CRU | CRU | Own Record | Read |
| Doctors Roster | CRUD | Own Profile & Schedule | Read | Public Profile | Read |
| Appointments | Full | Assigned Visits | Manage & Status | Own Visits | Read |
| Prescriptions | Full | Issue & Edit Own | Read | Own Rx (Read/Print) | — |
| Billing & Invoices | Full | Read | Read | Own Bills & Pay | Full |
| Audit Logs & Inquiries | Full | — | — | — | — |
| Profile & Password | Own | Own | Own | Own | Own |
