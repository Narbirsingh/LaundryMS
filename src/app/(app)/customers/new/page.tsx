'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { customersApi } from '@/lib/api';

interface FieldProps {
  label: string;
  field: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  value: string;
  onChange: (field: string, value: string) => void;
}

function Field({ label, field, type = 'text', placeholder = '', required = false, value, onChange }: FieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && ' *'}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(field, e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-maroon-500 outline-none"
      />
    </div>
  );
}

export default function NewCustomerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', mobile: '', email: '', type: 'INDIVIDUAL',
    address: '', city: '', pincode: '', gstin: '', notes: '',
  });

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.mobile) { setError('Name and mobile are required'); return; }
    setLoading(true); setError('');
    try {
      const customer = await customersApi.create(form);
      router.push(`/customers/${(customer as any).id}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create customer');
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={18} /></button>
        <h2 className="text-lg font-semibold text-gray-900">New Customer</h2>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h3 className="font-medium text-gray-900">Basic Info</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full Name" field="name" required placeholder="e.g. Rahul Sharma" value={form.name} onChange={set} />
          <Field label="Mobile" field="mobile" required placeholder="10-digit mobile number" value={form.mobile} onChange={set} />
          <Field label="Email" field="email" type="email" placeholder="optional" value={form.email} onChange={set} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Type</label>
            <select value={form.type} onChange={(e) => set('type', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-maroon-500 outline-none">
              <option value="INDIVIDUAL">Individual</option>
              <option value="CORPORATE">Corporate</option>
              <option value="HOTEL">Hotel</option>
              <option value="HOSPITAL">Hospital</option>
              <option value="RESTAURANT">Restaurant</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h3 className="font-medium text-gray-900">Address</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="Address" field="address" placeholder="Street, Locality" value={form.address} onChange={set} />
          </div>
          <Field label="City" field="city" value={form.city} onChange={set} />
          <Field label="Pincode" field="pincode" value={form.pincode} onChange={set} />
          {(form.type !== 'INDIVIDUAL') && <Field label="GSTIN" field="gstin" placeholder="For corporate billing" value={form.gstin} onChange={set} />}
        </div>
        <Field label="Notes" field="notes" placeholder="Preferences, allergies, special instructions..." value={form.notes} onChange={set} />
      </div>

      <div className="flex gap-3 justify-end">
        <button type="button" onClick={() => router.back()}
          className="px-5 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">
          Cancel
        </button>
        <button type="submit" disabled={loading}
          className="px-5 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
          {loading && <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />}
          Add Customer
        </button>
      </div>
    </form>
  );
}
