'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Users } from 'lucide-react';
import { employeesApi } from '@/lib/api';
import { formatCurrency, formatDate, getInitials } from '@/lib/utils';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', department: '', designation: '', salary: 0, shift: 'MORNING', dateOfJoining: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [data, statsData] = await Promise.all([
        employeesApi.list({ search: search || undefined }),
        employeesApi.getStats(),
      ]);
      setEmployees((data as any).data || []);
      setStats(statsData);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { setForm(prev => ({ ...prev, dateOfJoining: new Date().toISOString().slice(0, 10) })); }, []);

  useEffect(() => { fetchData(); }, [search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await employeesApi.create({ ...form, salary: Number(form.salary) });
      setShowForm(false);
      fetchData();
    } catch (err: any) { alert(err?.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Deactivate this employee?')) return;
    await employeesApi.deactivate(id);
    fetchData();
  };

  const deptColors: Record<string, string> = {
    OPERATIONS: 'bg-maroon-100 text-maroon-700',
    PICKUP: 'bg-green-100 text-green-700',
    DELIVERY: 'bg-teal-100 text-teal-700',
    QUALITY: 'bg-purple-100 text-purple-700',
    ACCOUNTS: 'bg-yellow-100 text-yellow-700',
    MANAGEMENT: 'bg-indigo-100 text-indigo-700',
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Employees</h2>
          <p className="text-sm text-gray-500">Staff management and payroll overview</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-maroon-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-maroon-700">
          <Plus size={16} /> Add Employee
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-2xl font-bold text-maroon-600">{stats.activeEmployees}</div>
            <div className="text-sm text-gray-500">Active Staff</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.totalEmployees}</div>
            <div className="text-sm text-gray-500">Total Employees</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.monthlyPayroll)}</div>
            <div className="text-sm text-gray-500">Monthly Payroll</div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-2">
        <Search size={15} className="text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, code, phone..."
          className="flex-1 text-sm outline-none placeholder-gray-400" />
      </div>

      {/* Employee cards */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin w-6 h-6 border-4 border-maroon-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((emp) => (
            <div key={emp.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-maroon-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm">
                    {getInitials(emp.name)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{emp.name}</p>
                    <p className="text-xs text-gray-500">{emp.employeeCode}</p>
                  </div>
                </div>
                {!emp.isActive && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Inactive</span>}
              </div>
              <div className="mt-3 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Department</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${deptColors[emp.department?.toUpperCase()] || 'bg-gray-100 text-gray-600'}`}>
                    {emp.department || '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Designation</span>
                  <span className="text-gray-700">{emp.designation || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Mobile</span>
                  <span className="text-gray-700">{emp.phone || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Salary</span>
                  <span className="font-medium text-gray-900">{formatCurrency(emp.salary)}/mo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Joined</span>
                  <span className="text-gray-700">{emp.dateOfJoining ? formatDate(emp.dateOfJoining) : '—'}</span>
                </div>
              </div>
              {emp.isActive && (
                <button onClick={() => handleDeactivate(emp.id)}
                  className="mt-3 w-full text-xs text-red-500 hover:text-red-700 py-1 border border-red-100 rounded-lg hover:bg-red-50 transition-colors">
                  Deactivate
                </button>
              )}
            </div>
          ))}
          {employees.length === 0 && (
            <div className="col-span-3 text-center py-16 text-gray-400">
              <Users size={28} className="mx-auto mb-2 opacity-30" />
              <p>No employees found</p>
            </div>
          )}
        </div>
      )}

      {/* Add Employee Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Add Employee</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile *</label>
                  <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
                    placeholder="e.g. Operations"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                  <input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })}
                    placeholder="e.g. Wash Operator"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Salary ₹</label>
                  <input type="number" min={0} value={form.salary} onChange={(e) => setForm({ ...form, salary: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date</label>
                  <input type="date" value={form.dateOfJoining} onChange={(e) => setForm({ ...form, dateOfJoining: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-maroon-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
                  <select value={form.shift} onChange={(e) => setForm({ ...form, shift: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-maroon-500">
                    {['MORNING','AFTERNOON','EVENING','NIGHT'].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 text-sm text-white bg-maroon-600 rounded-lg hover:bg-maroon-700 disabled:opacity-50">
                  {saving ? 'Adding...' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
