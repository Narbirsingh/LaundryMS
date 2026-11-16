'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { platformApi } from '@/lib/api';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';

function Field({
  label, name, type = 'text', value, onChange, required = false, placeholder,
}: {
  label: string; name: string; type?: string; value: string;
  onChange: (v: string) => void; required?: boolean; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 bg-white"
      />
    </div>
  );
}

const SUBSCRIPTION_PLANS = ['FREE', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE'];

export default function RegisterLaundryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    alternatePhone: '',
    gstin: '',
    registrationNumber: '',
    country: 'India',
    state: '',
    city: '',
    address: '',
    pincode: '',
    commissionPercentage: '0',
    subscriptionPlan: 'FREE',
    adminEmail: '',
    adminPassword: '',
  });

  const set = (key: string) => (v: string) => setForm((f) => ({ ...f, [key]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await platformApi.registerLaundry({
        ...form,
        commissionPercentage: parseFloat(form.commissionPercentage) || 0,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Laundry Registered!</h2>
        <p className="text-gray-500 text-sm mb-6">
          <strong>{form.businessName}</strong> has been created with admin account{' '}
          <strong>{form.adminEmail}</strong>.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => { setSuccess(false); setForm(f => ({ ...f, businessName: '', email: '', adminEmail: '', adminPassword: '' })); }}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
          >
            Register Another
          </button>
          <Link
            href="/superadmin/laundries"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
          >
            View All Laundries
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-5">
        <Link
          href="/superadmin/laundries"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft size={14} />
          Back to Laundries
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Business Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Business Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Business Name" name="businessName" value={form.businessName} onChange={set('businessName')} required />
            <Field label="Owner Name" name="ownerName" value={form.ownerName} onChange={set('ownerName')} required />
            <Field label="Business Email" name="email" type="email" value={form.email} onChange={set('email')} required />
            <Field label="Phone" name="phone" value={form.phone} onChange={set('phone')} required />
            <Field label="Alternate Phone" name="alternatePhone" value={form.alternatePhone} onChange={set('alternatePhone')} />
            <Field label="GSTIN" name="gstin" value={form.gstin} onChange={set('gstin')} />
            <Field label="Registration Number" name="registrationNumber" value={form.registrationNumber} onChange={set('registrationNumber')} />
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Address</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Country" name="country" value={form.country} onChange={set('country')} />
            <Field label="State" name="state" value={form.state} onChange={set('state')} />
            <Field label="City" name="city" value={form.city} onChange={set('city')} />
            <Field label="Pincode" name="pincode" value={form.pincode} onChange={set('pincode')} />
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
              <textarea
                value={form.address}
                onChange={(e) => set('address')(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 bg-white resize-none"
              />
            </div>
          </div>
        </div>

        {/* Platform Settings */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Platform Settings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Commission %</label>
              <input
                type="number" min="0" max="100" step="0.01"
                value={form.commissionPercentage}
                onChange={(e) => set('commissionPercentage')(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Plan</label>
              <select
                value={form.subscriptionPlan}
                onChange={(e) => set('subscriptionPlan')(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              >
                {SUBSCRIPTION_PLANS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Admin Account */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Admin Account</h2>
          <p className="text-xs text-gray-500">
            This creates the Business Owner login for this laundry.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Admin Email" name="adminEmail" type="email" value={form.adminEmail} onChange={set('adminEmail')} required />
            <Field label="Admin Password" name="adminPassword" type="password" value={form.adminPassword} onChange={set('adminPassword')} required placeholder="Min 8 characters" />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <Link
            href="/superadmin/laundries"
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-60 transition-colors"
          >
            {loading ? 'Registering…' : 'Register Laundry'}
          </button>
        </div>
      </form>
    </div>
  );
}
