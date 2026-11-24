import { AuditLog } from '../models/AuditLog.js';
import { env } from '../config/env.js';

export async function recordAudit({
  req = null,
  actor = null,
  action,
  resourceType,
  resourceId = '',
  details = {}
}) {
  if (env.isTest) return;
  try {
    const user = actor || req?.user || null;
    await AuditLog.create({
      actorId: user?._id || null,
      actorEmail: user?.email || '',
      actorRole: user?.role || 'ANONYMOUS',
      action,
      resourceType,
      resourceId: resourceId ? String(resourceId) : '',
      details,
      ipAddress: req?.ip || req?.socket?.remoteAddress || ''
    });
  } catch (err) {
    console.error('Audit log write failed:', err.message);
  }
}
