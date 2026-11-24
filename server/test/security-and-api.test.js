import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import jwt from 'jsonwebtoken';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-only-jwt-secret-key-minimum-32-bytes';

const { createApp } = await import('../src/app.js');
const { generateToken, verifyToken } = await import('../src/middleware/auth.js');
const {
  roundCurrency,
  escapeRegex,
  parsePagination,
  normalizeDepartment
} = await import('../src/utils/errors.js');
const { User, Prescription } = await import('../src/models/index.js');

const app = createApp();

test('Security headers and error envelopes', async () => {
  const healthRes = await request(app).get('/api/health');
  assert.ok([200, 503].includes(healthRes.status));
  assert.equal(healthRes.headers['x-powered-by'], undefined);
  assert.ok(healthRes.headers['x-content-type-options']);

  const notFoundRes = await request(app).get('/api/does-not-exist');
  assert.equal(notFoundRes.status, 404);
  assert.match(notFoundRes.headers['content-type'], /application\/json/);
  assert.ok(notFoundRes.body.error);

  const badJsonRes = await request(app)
    .post('/api/auth/login')
    .set('Content-Type', 'application/json')
    .send('{"email": "broken');
  assert.equal(badJsonRes.status, 400);
  assert.match(badJsonRes.body.error, /Invalid JSON/i);
});

test('Protected endpoints reject unauthenticated and forged hardcoded-secret JWTs', async () => {
  const forgedToken = jwt.sign(
    { userId: '507f1f77bcf86cd799439011', email: 'attacker@evil.com', role: 'ADMIN' },
    'healthcore-secret-key-2024',
    { algorithm: 'HS256', expiresIn: '1h' }
  );

  const protectedPaths = [
    '/api/auth/me',
    '/api/patients',
    '/api/appointments',
    '/api/billing',
    '/api/billing/stats/summary',
    '/api/prescriptions',
    '/api/dashboard/stats',
    '/api/dashboard/audit-logs',
    '/api/users',
    '/api/labs',
    '/api/pharmacy/medicines',
    '/api/pharmacy/queue',
    '/api/referrals'
  ];

  for (const path of protectedPaths) {
    const anonRes = await request(app).get(path);
    assert.equal(anonRes.status, 401, `Expected 401 for unauthenticated GET ${path}`);

    const forgedRes = await request(app)
      .get(path)
      .set('Authorization', `Bearer ${forgedToken}`);
    assert.equal(forgedRes.status, 401, `Expected 401 for forged legacy-secret token on GET ${path}`);
  }
});

test('Auth validation blocks NoSQL OTP operator injection and weak passwords', async () => {
  const nosqlRegister = await request(app).post('/api/auth/register').send({
    email: 'victim@example.com',
    password: 'StrongPassword1',
    firstName: 'Test',
    lastName: 'User',
    otp: { $ne: null },
    role: 'ADMIN'
  });
  assert.equal(nosqlRegister.status, 400);

  const nosqlReset = await request(app).post('/api/auth/reset-password').send({
    email: 'admin@healthcore.org',
    otp: { $gt: '' },
    newPassword: 'StrongPassword1'
  });
  assert.equal(nosqlReset.status, 400);

  const weakPassword = await request(app).post('/api/auth/register').send({
    email: 'user@example.com',
    password: '123',
    firstName: 'Weak',
    lastName: 'Pass',
    otp: '123456'
  });
  assert.equal(weakPassword.status, 400);
  assert.match(weakPassword.body.error, /8 characters/i);
});

test('Input validation rejects invalid ObjectIds, dates, and contact payloads cleanly with 400', async () => {
  const badDoctorId = await request(app).get('/api/doctors/not-an-object-id');
  assert.equal(badDoctorId.status, 400);

  const badSlotsDoctor = await request(app).get('/api/appointments/available-slots?doctorId=bad&date=2026-12-01');
  assert.equal(badSlotsDoctor.status, 400);

  const badSlotsDate = await request(app).get(
    '/api/appointments/available-slots?doctorId=507f1f77bcf86cd799439011&date=not-a-date'
  );
  assert.equal(badSlotsDate.status, 400);

  const badContact = await request(app).post('/api/contact').send({
    name: 'A',
    email: 'not-an-email',
    subject: 'Hi',
    message: 'Short'
  });
  assert.equal(badContact.status, 400);
});

test('Core utilities handle currency, regex escaping, pagination bounds, and department normalization', () => {
  assert.equal(roundCurrency(19.999), 20);
  assert.equal(roundCurrency(10.005), 10.01);

  assert.equal(escapeRegex('a+b*(c)?[d]'), 'a\\+b\\*\\(c\\)\\?\\[d\\]');

  const pZero = parsePagination({ page: '-2', limit: '0' });
  assert.equal(pZero.page, 1);
  assert.equal(pZero.limit, 20);
  assert.equal(pZero.skip, 0);

  const pHuge = parsePagination({ page: '3', limit: '99999' });
  assert.equal(pHuge.page, 3);
  assert.equal(pHuge.limit, 100);
  assert.equal(pHuge.skip, 200);

  assert.equal(normalizeDepartment('GENERAL'), 'General Medicine / Internal Medicine');
  assert.equal(normalizeDepartment('cardiology'), 'Cardiology');
  assert.equal(normalizeDepartment('ENT'), 'ENT (Otolaryngology)');
});

test('JWT helper signs with HS256 and rejects tampered tokens', () => {
  const token = generateToken({
    _id: '507f1f77bcf86cd799439011',
    email: 'doc@healthcore.org',
    role: 'DOCTOR'
  });
  const decoded = verifyToken(token);
  assert.equal(decoded.role, 'DOCTOR');
  assert.equal(decoded.userId, '507f1f77bcf86cd799439011');
  assert.equal(verifyToken(`${token}tampered`), null);
});

test('Mongoose model transforms strip sensitive fields and normalize legacy prescription medicines', () => {
  const userDoc = new User({
    email: 'nurse@healthcore.org',
    password: 'HashedPassword123',
    role: 'NURSE',
    firstName: 'Hannah',
    lastName: 'Brooks'
  });
  const userJson = userDoc.toJSON();
  assert.equal(userJson.password, undefined);
  assert.equal(userJson.__v, undefined);
  assert.equal(userJson.id, userDoc._id.toString());

  const rxDoc = new Prescription({
    patientId: '507f1f77bcf86cd799439011',
    doctorId: '507f1f77bcf86cd799439012',
    diagnosis: 'Acute Sinusitis',
    medicines: [
      { name: 'Amoxicillin', dosage: '500mg', frequency: 'TID', duration: '7 days' }
    ]
  });
  const rxJson = rxDoc.toJSON();
  assert.equal(rxJson.medicines, undefined);
  assert.equal(rxJson.medications.length, 1);
  assert.equal(rxJson.medications[0].name, 'Amoxicillin');
});
