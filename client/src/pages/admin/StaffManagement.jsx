import { useState, useEffect, useCallback } from 'react';
import { usersApi } from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import {
  PageHeader,
  Card,
  StatCard,
  Button,
  Input,
  Select,
  Avatar,
  RoleBadge,
  StatusBadge,
  Modal,
  LoadingSpinner,
  ErrorAlert,
  EmptyState,
  Pagination,
  useToast,
  useConfirm
} from '../../components/ui';
import { formatDate } from '../../config/site';
import {
  Search,
  UserPlus,
  Users,
  ShieldCheck,
  UserCheck,
  UserX,
  Stethoscope,
  FlaskConical,
  Pill,
  X
} from 'lucide-react';

const STAFF_ROLES = [
  { value: 'NURSE', label: 'Nurse' },
  { value: 'RECEPTIONIST', label: 'Receptionist (Front Desk)' },
  { value: 'PHARMACIST', label: 'Pharmacist' },
  { value: 'LAB_TECH', label: 'Lab Technician' },
  { value: 'ACCOUNTANT', label: 'Accountant (Billing)' },
  { value: 'ADMIN', label: 'Administrator' }
];

export default function StaffManagement() {
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();

  const [users, setUsers] = useState([]);
  const [roleCounts, setRoleCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [scope, setScope] = useState('staff');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 20 });

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [tempCreds, setTempCreds] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'NURSE',
    password: ''
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await usersApi.getAll({
        search: debouncedSearch,
        role: roleFilter,
        status: statusFilter,
        scope,
        page: pagination.page,
        limit: pagination.limit
      });
      setUsers(res.users || []);
      setRoleCounts(res.roleCounts || {});
      setPagination((prev) => ({
        ...prev,
        page: res.page || 1,
        totalPages: res.totalPages || 1,
        total: res.total || 0
      }));
    } catch (err) {
      setError(err.message || 'Failed to load staff roster');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, roleFilter, statusFilter, scope, pagination.page, pagination.limit]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreating(true);
    try {
      const res = await usersApi.create(formData);
      toast.success(res.message || 'Staff member created.');
      if (res.temporaryPassword) {
        setTempCreds({ email: res.user.email, password: res.temporaryPassword, role: res.user.role });
      } else {
        setCreateOpen(false);
      }
      setFormData({ firstName: '', lastName: '', email: '', phone: '', role: 'NURSE', password: '' });
      loadUsers();
    } catch (err) {
      setCreateError(err.message || 'Failed to create staff member');
    } finally {
      setCreating(false);
    }
  };

  const handleStatusToggle = async (u, nextStatus) => {
    const accepted = await confirm({
      title: `${nextStatus === 'ACTIVE' ? 'Activate' : 'Suspend'} Account`,
      message: `Change status of ${u.firstName} ${u.lastName} (${u.email}) to ${nextStatus}?`,
      confirmLabel: nextStatus === 'ACTIVE' ? 'Activate' : 'Suspend',
      variant: nextStatus === 'ACTIVE' ? 'primary' : 'danger'
    });
    if (!accepted) return;

    try {
      await usersApi.updateStatus(u._id, nextStatus);
      toast.success(`Account marked ${nextStatus.toLowerCase()}.`);
      loadUsers();
    } catch (err) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  const handleRoleChange = async (u, nextRole) => {
    if (nextRole === u.role) return;
    try {
      await usersApi.updateRole(u._id, nextRole);
      toast.success(`${u.firstName}'s role updated to ${nextRole.replace('_', ' ')}.`);
      loadUsers();
    } catch (err) {
      toast.error(err.message || 'Failed to change role');
    }
  };

  const totalStaff =
    (roleCounts.ADMIN || 0) +
    (roleCounts.DOCTOR || 0) +
    (roleCounts.NURSE || 0) +
    (roleCounts.ACCOUNTANT || 0) +
    (roleCounts.RECEPTIONIST || 0) +
    (roleCounts.PHARMACIST || 0) +
    (roleCounts.LAB_TECH || 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Hospital Staff & Role Management"
        subtitle="Onboard hospital personnel across Nursing, Reception, Lab, Pharmacy, Billing, and Admin departments."
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setTempCreds(null);
              setCreateError('');
              setCreateOpen(true);
            }}
          >
            <UserPlus className="w-4 h-4" aria-hidden="true" />
            Add Staff Member
          </Button>
        }
      />

      {/* Department Headcount */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Hospital Staff"
          value={totalStaff}
          subtitle={`${roleCounts.ADMIN || 0} Admins · ${roleCounts.NURSE || 0} Nurses`}
          icon={ShieldCheck}
          tone="secondary"
        />
        <StatCard
          label="Physicians"
          value={roleCounts.DOCTOR || 0}
          subtitle="Managed via Doctors roster"
          icon={Stethoscope}
          tone="primary"
        />
        <StatCard
          label="Lab & Pharmacy"
          value={(roleCounts.LAB_TECH || 0) + (roleCounts.PHARMACIST || 0)}
          subtitle={`${roleCounts.LAB_TECH || 0} Lab · ${roleCounts.PHARMACIST || 0} Pharmacy`}
          icon={FlaskConical}
          tone="success"
        />
        <StatCard
          label="Front Desk & Finance"
          value={(roleCounts.RECEPTIONIST || 0) + (roleCounts.ACCOUNTANT || 0)}
          subtitle={`${roleCounts.RECEPTIONIST || 0} Reception · ${roleCounts.ACCOUNTANT || 0} Finance`}
          icon={Pill}
          tone="warning"
        />
      </div>

      {/* Filters */}
      <Card padding="p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <Input
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone..."
            aria-label="Search hospital accounts"
            className="flex-1"
          />
          <Select
            aria-label="Account scope"
            value={scope}
            onChange={(e) => {
              setScope(e.target.value);
              setRoleFilter('');
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="md:w-44"
          >
            <option value="staff">Staff Only</option>
            <option value="all">All Users (+ Patients)</option>
          </Select>
          <Select
            aria-label="Filter by role"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="md:w-48"
          >
            <option value="">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="DOCTOR">Doctor</option>
            <option value="NURSE">Nurse</option>
            <option value="RECEPTIONIST">Receptionist</option>
            <option value="PHARMACIST">Pharmacist</option>
            <option value="LAB_TECH">Lab Tech</option>
            <option value="ACCOUNTANT">Accountant</option>
            <option value="PATIENT">Patient</option>
          </Select>
          <Select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="md:w-40"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
          {(search || roleFilter || statusFilter) && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearch('');
                setRoleFilter('');
                setStatusFilter('');
              }}
            >
              <X className="w-4 h-4" />
              Reset
            </Button>
          )}
        </div>
      </Card>

      {error && <ErrorAlert message={error} onRetry={loadUsers} />}

      {/* Staff Table */}
      <Card padding="p-0" className="overflow-hidden">
        {loading ? (
          <LoadingSpinner label="Loading hospital personnel..." />
        ) : users.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No accounts found"
            description="No hospital accounts match your current filters."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Member
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Role
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Status
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Joined
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-600 text-right">
                      Access Control
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {users.map((u) => {
                    const isSelf = u._id === currentUser?._id;
                    const canReassignRole = !isSelf && u.role !== 'PATIENT' && u.role !== 'DOCTOR';
                    return (
                      <tr key={u._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar
                              src={u.avatar}
                              firstName={u.firstName}
                              lastName={u.lastName}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 truncate">
                                {u.firstName} {u.lastName}
                                {isSelf && (
                                  <span className="ml-1.5 text-xs font-normal text-primary-700">(You)</span>
                                )}
                              </p>
                              <p className="text-xs text-slate-600 truncate">
                                {u.email} {u.phone ? `· ${u.phone}` : ''}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          {canReassignRole ? (
                            <Select
                              aria-label={`Change role for ${u.firstName}`}
                              value={u.role}
                              onChange={(e) => handleRoleChange(u, e.target.value)}
                              className="w-44"
                              selectClassName="!h-8 !text-xs"
                            >
                              {STAFF_ROLES.map((r) => (
                                <option key={r.value} value={r.value}>
                                  {r.label}
                                </option>
                              ))}
                            </Select>
                          ) : (
                            <RoleBadge role={u.role} />
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={u.status} />
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                          {formatDate(u.createdAt)}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {!isSelf && (
                            <div className="inline-flex items-center gap-1.5">
                              {u.status === 'ACTIVE' ? (
                                <Button
                                  variant="danger-outline"
                                  size="sm"
                                  onClick={() => handleStatusToggle(u, 'SUSPENDED')}
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                  Suspend
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleStatusToggle(u, 'ACTIVE')}
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                  Activate
                                </Button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              limit={pagination.limit}
              onPageChange={(p) => setPagination((prev) => ({ ...prev, page: p }))}
            />
          </>
        )}
      </Card>

      {/* Onboard Staff Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Onboard Hospital Staff Member"
        subtitle="Create a role-scoped account for clinical, laboratory, pharmacy, reception, or finance personnel."
      >
        {tempCreds ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 space-y-2 text-sm text-emerald-950">
              <p className="font-semibold">Account created successfully!</p>
              <p className="text-xs text-emerald-800">
                Share these temporary sign-in credentials securely with the staff member. They can change their password under Settings.
              </p>
              <div className="rounded-lg bg-white border border-emerald-200 p-3 font-mono text-xs space-y-1">
                <p><strong>Role:</strong> {tempCreds.role}</p>
                <p><strong>Email:</strong> {tempCreds.email}</p>
                <p><strong>Temporary Password:</strong> {tempCreds.password}</p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="primary" onClick={() => setCreateOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateStaff} className="space-y-4">
            {createError && <ErrorAlert message={createError} />}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                label="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
              <Input
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
            <Input
              label="Work Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="staff@healthcore.org"
              required
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                label="Phone Number"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 201-0150"
              />
              <Select
                label="Hospital Role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                required
              >
                {STAFF_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </Select>
            </div>
            <Input
              label="Initial Password (Optional)"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Leave blank to auto-generate securely"
              hint="If specified, must be 8+ chars with upper, lower, and number."
            />
            <div className="flex justify-end gap-2.5 pt-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={creating}>
                Create Staff Account
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
