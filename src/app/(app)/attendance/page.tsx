'use client';

import { useState, useEffect } from 'react';
import { Clock, Users, Calendar, CheckCircle, XCircle, AlertCircle, Plus, LogIn, LogOut } from 'lucide-react';
import apiClient, { unwrap } from '@/lib/api';

const attendanceApi = {
  getStats: () => apiClient.get('/attendance/stats').then(unwrap),
  listRecords: (params?: any) => apiClient.get('/attendance', { params }).then(unwrap),
  mark: (data: any) => apiClient.post('/attendance', data).then(unwrap),
  checkIn: (employeeId: string) => apiClient.post('/attendance/check-in', { employeeId }).then(unwrap),
  checkOut: (employeeId: string) => apiClient.post('/attendance/check-out', { employeeId }).then(unwrap),
  listLeaves: () => apiClient.get('/attendance/leaves').then(unwrap),
  requestLeave: (data: any) => apiClient.post('/attendance/leaves', data).then(unwrap),
  approveLeave: (id: string) => apiClient.patch(`/attendance/leaves/${id}/approve`).then(unwrap),
};

const STATUS_COLOR: Record<string, string> = {
  PRESENT: 'bg-green-100 text-green-700',
  ABSENT: 'bg-red-100 text-red-700',
  HALF_DAY: 'bg-yellow-100 text-yellow-700',
  ON_LEAVE: 'bg-maroon-100 text-maroon-700',
  HOLIDAY: 'bg-purple-100 text-purple-700',
};

const toArray = (v: any): any[] => {
  if (Array.isArray(v)) return v;
  if (v && Array.isArray(v.data)) return v.data;
  if (v && Array.isArray(v.items)) return v.items;
  return [];
};

export default function AttendancePage() {
  const [tab, setTab] = useState<'records' | 'leaves' | 'checkin'>('records');
  const [stats, setStats] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [dateFilter, setDateFilter] = useState('');
  const [checkInId, setCheckInId] = useState('');
  const [leaveForm, setLeaveForm] = useState({ employeeId: '', fromDate: '', toDate: '', leaveType: 'SICK', reason: '' });
  const [bulkForm, setBulkForm] = useState({ employeeId: '', date: '', status: 'PRESENT', checkIn: '', checkOut: '' });

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setDateFilter(today);
    setBulkForm(prev => ({ ...prev, date: today }));
  }, []);

  const load = async () => {
    if (!dateFilter) return;
    try {
      const [s, r, l] = await Promise.all([
        attendanceApi.getStats(),
        attendanceApi.listRecords({ from: dateFilter, to: dateFilter }),
        attendanceApi.listLeaves(),
      ]);
      setStats(s); setRecords(toArray(r)); setLeaves(toArray(l));
    } catch { /* auth redirect handled by interceptor */ }
  };

  useEffect(() => { load(); }, [dateFilter]);

  const handleCheckIn = async () => {
    if (!checkInId) return;
    await attendanceApi.checkIn(checkInId);
    setCheckInId('');
    load();
  };

  const handleCheckOut = async () => {
    if (!checkInId) return;
    await attendanceApi.checkOut(checkInId);
    setCheckInId('');
    load();
  };

  const handleMark = async (e: React.FormEvent) => {
    e.preventDefault();
    await attendanceApi.mark(bulkForm);
    load();
  };

  const handleLeaveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    await attendanceApi.requestLeave(leaveForm);
    setLeaveForm({ employeeId: '', fromDate: '', toDate: '', leaveType: 'SICK', reason: '' });
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance & Shifts</h1>
        <p className="text-sm text-gray-500 mt-1">Track employee check-ins, leave requests and shift logs</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center"><Users size={18} className="text-green-600" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{stats.presentToday}</p><p className="text-xs text-gray-500">Present Today</p></div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center"><AlertCircle size={18} className="text-yellow-600" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{stats.pendingLeaves}</p><p className="text-xs text-gray-500">Pending Leave Requests</p></div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          {(['records', 'checkin', 'leaves'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`pb-3 text-sm font-medium capitalize border-b-2 transition-colors ${tab === t ? 'border-maroon-600 text-maroon-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t === 'records' ? 'Attendance Records' : t === 'checkin' ? 'Check In / Out' : 'Leave Requests'}
            </button>
          ))}
        </div>
      </div>

      {/* Records */}
      {tab === 'records' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-gray-400" />
              <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500" />
            </div>
            <span className="text-sm text-gray-500">{records.length} records</span>
          </div>

          {/* Quick mark form */}
          <div className="bg-maroon-50 rounded-xl border border-maroon-100 p-4">
            <p className="text-sm font-medium text-maroon-900 mb-3">Mark Attendance</p>
            <form onSubmit={handleMark} className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="block text-xs font-medium text-maroon-700 mb-1">Employee ID</label>
                <input required value={bulkForm.employeeId} onChange={e => setBulkForm({...bulkForm, employeeId: e.target.value})} className="border border-maroon-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500 w-48" />
              </div>
              <div>
                <label className="block text-xs font-medium text-maroon-700 mb-1">Date</label>
                <input type="date" value={bulkForm.date} onChange={e => setBulkForm({...bulkForm, date: e.target.value})} className="border border-maroon-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-maroon-700 mb-1">Status</label>
                <select value={bulkForm.status} onChange={e => setBulkForm({...bulkForm, status: e.target.value})} className="border border-maroon-200 rounded-lg px-3 py-2 text-sm outline-none">
                  <option value="PRESENT">Present</option>
                  <option value="ABSENT">Absent</option>
                  <option value="HALF_DAY">Half Day</option>
                  <option value="ON_LEAVE">On Leave</option>
                </select>
              </div>
              <button type="submit" className="bg-maroon-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-maroon-700">Save</button>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Employee</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Check In</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Check Out</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-10 text-gray-400">No records for this date</td></tr>
                ) : records.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{r.employeeId}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[r.status] || 'bg-gray-100 text-gray-600'}`}>{r.status?.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{r.checkIn ? new Date(r.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{r.checkOut ? new Date(r.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{r.hoursWorked ? `${r.hoursWorked}h` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Check In / Out */}
      {tab === 'checkin' && (
        <div className="max-w-sm space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Clock size={18} className="text-maroon-500" /> Quick Check In / Out</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
              <input value={checkInId} onChange={e => setCheckInId(e.target.value)} placeholder="Enter employee ID" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-maroon-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleCheckIn} disabled={!checkInId} className="flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-40">
                <LogIn size={16} /> Check In
              </button>
              <button onClick={handleCheckOut} disabled={!checkInId} className="flex items-center justify-center gap-2 bg-orange-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-40">
                <LogOut size={16} /> Check Out
              </button>
            </div>
          </div>
          <div className="text-xs text-gray-400 text-center">Today: {dateFilter ? new Date(dateFilter + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</div>
        </div>
      )}

      {/* Leaves */}
      {tab === 'leaves' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">New Leave Request</h3>
            <form onSubmit={handleLeaveRequest} className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Employee ID</label>
                <input required value={leaveForm.employeeId} onChange={e => setLeaveForm({...leaveForm, employeeId: e.target.value})} className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none w-40" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
                <input required type="date" value={leaveForm.fromDate} onChange={e => setLeaveForm({...leaveForm, fromDate: e.target.value})} className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
                <input required type="date" value={leaveForm.toDate} onChange={e => setLeaveForm({...leaveForm, toDate: e.target.value})} className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                <select value={leaveForm.leaveType} onChange={e => setLeaveForm({...leaveForm, leaveType: e.target.value})} className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none">
                  <option value="SICK">Sick Leave</option>
                  <option value="CASUAL">Casual</option>
                  <option value="EARNED">Earned</option>
                  <option value="UNPAID">Unpaid</option>
                </select>
              </div>
              <button type="submit" className="bg-maroon-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-maroon-700">Submit</button>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Employee</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Period</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leaves.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-10 text-gray-400">No leave requests</td></tr>
                ) : leaves.map(l => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{l.employeeId}</td>
                    <td className="px-4 py-3 text-gray-600">{l.leaveType}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {new Date(l.fromDate).toLocaleDateString('en-IN')} → {new Date(l.toDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${l.status === 'APPROVED' ? 'bg-green-100 text-green-700' : l.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {l.status === 'PENDING' && (
                        <button onClick={() => attendanceApi.approveLeave(l.id).then(load)} className="text-xs text-green-600 hover:text-green-800 border border-green-200 rounded px-2 py-1">
                          Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
