'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { caApi } from '@/lib/api';

const TAXPAYER_TYPES = ['INDIVIDUAL', 'HUF', 'PARTNERSHIP', 'LLP', 'COMPANY', 'TRUST', 'AOP', 'BOI', 'LOCAL_AUTHORITY', 'AJP'];
const TAX_REGIMES = ['OLD', 'NEW'];

export default function NewCaClientPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    legalName: '',
    taxpayerType: 'INDIVIDUAL',
    pan: '',
    dateOfBirth: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstin: '',
    businessActivity: '',
    taxRegime: 'OLD',
    residentialStatus: 'RESIDENT',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const created: any = await caApi.createClient({
        ...form,
        dateOfBirth: form.dateOfBirth || undefined,
        gstin: form.gstin || undefined,
        businessActivity: form.businessActivity || undefined,
      });
      router.push(`/ca/clients/${created.id}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create client');
    } finally {
      setSaving(false);
    }
  };

  const f = (label: string, key: keyof typeof form, type = 'text', placeholder = '', required = false) => (
    <div key={key}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && ' *'}</label>
      <input required={required} type={type} value={form[key]} placeholder={placeholder}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-maroon-500" />
    </div>
  );

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/ca/clients" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={16} className="text-gray-500" />
        </Link>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">New CA Client</h2>
          <p className="text-sm text-gray-500">Add a new client for ITR filing</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Basic Information</h3>
          <div className="grid grid-cols-2 gap-4">
            {f('Legal Name', 'legalName', 'text', 'As per PAN card', true)}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Taxpayer Type *</label>
              <select required value={form.taxpayerType} onChange={(e) => setForm({ ...form, taxpayerType: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-maroon-500">
                {TAXPAYER_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            {f('PAN', 'pan', 'text', 'ABCDE1234F', true)}
            {form.taxpayerType === 'INDIVIDUAL' && f('Date of Birth', 'dateOfBirth', 'date')}
            {f('Phone', 'phone', 'tel', '+91 98765 43210')}
            {f('Email', 'email', 'email', 'client@example.com')}
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Address</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">{f('Address', 'address', 'text', 'Street, Locality')}</div>
            {f('City', 'city', 'text', 'Mumbai')}
            {f('State', 'state', 'text', 'Maharashtra')}
            {f('Pincode', 'pincode', 'text', '400001')}
          </div>
        </div>

        {/* Tax Details */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Tax Details</h3>
          <div className="grid grid-cols-2 gap-4">
            {f('GSTIN', 'gstin', 'text', '27ABCDE1234F1Z5')}
            {f('Business Activity', 'businessActivity', 'text', 'e.g. Retail Trade')}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tax Regime</label>
              <select value={form.taxRegime} onChange={(e) => setForm({ ...form, taxRegime: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-maroon-500">
                {TAX_REGIMES.map((r) => <option key={r} value={r}>{r} REGIME</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Residential Status</label>
              <select value={form.residentialStatus} onChange={(e) => setForm({ ...form, residentialStatus: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-maroon-500">
                {['RESIDENT', 'NON_RESIDENT', 'RNOR'].map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-maroon-500 resize-none" />
          </div>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{error}</p>}

        <div className="flex gap-3 justify-end">
          <Link href="/ca/clients"
            className="px-5 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">
            Cancel
          </Link>
          <button type="submit" disabled={saving}
            className="px-5 py-2 text-sm text-white bg-maroon-600 rounded-lg hover:bg-maroon-700 disabled:opacity-50">
            {saving ? 'Creating...' : 'Create Client'}
          </button>
        </div>
      </form>
    </div>
  );
}
