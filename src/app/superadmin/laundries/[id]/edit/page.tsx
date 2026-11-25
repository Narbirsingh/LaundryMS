'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { platformApi } from '@/lib/api';
import MobileInput from '@/components/ui/MobileInput';
import { getMobileError } from '@/lib/utils';
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
        type={type} value={value} placeholder={placeholder} required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 bg-white"
      />
    </div>
  );
}

export default function EditLaundryPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [adminEmail, setAdminEmail] = useState('');
  const [form, setForm] = useState({
    businessName: '', ownerName: '', email: '', phone: '',
    alternatePhone: '', gstin: '', registrationNumber: '',
    country: '', state: '', city: '', address: '', pincode: '',
  });

  useEffect(() => {
    platformApi.getOrganization(id)
      .then((org: any) => {
        setAdminEmail(org.adminUser?.email || '');
        setForm({
          businessName: org.businessName || '',
          ownerName: org.ownerName || '',
          email: org.email || '',
          phone: org.phone || '',
          alternatePhone: org.alternatePhone || '',
          gstin: org.gstin || '',
          registrationNumber: org.registrationNumber || '',
          country: org.country || '',
          state: org.state || '',
          city: org.city || '',
          address: org.address || '',
          pincode: org.pincode || '',
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const set = (key: string) => (v: string) => setForm((f) => ({ ...f, [key]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const mobileErr = getMobileError(form.phone, true, 'Mobile') || getMobileError(form.alternatePhone, false, 'Alternate Mobile');
    if (mobileErr) { setError(mobileErr); return; }
    setSaving(true);
    setError('');
    try {
      await platformApi.editOrganization(id, form);
      setSuccess(true);
      setTimeout(() => router.push(`/superadmin/laundries/${id}`), 1200);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center">
        <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={28} className="text-emerald-600" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">Changes saved</h2>
        <p className="text-sm text-gray-500 mt-1">Redirecting to detail page…</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-5 flex items-center gap-3">
        <Link
          href={`/superadmin/laundries/${id}`}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft size={14} />
          Back to details
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-700 font-medium">Edit Laundry</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Business Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Business Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Business Name" name="businessName" value={form.businessName} onChange={set('businessName')} required />
            <Field label="Owner Name" name="ownerName" value={form.ownerName} onChange={set('ownerName')} />
            <Field label="Business Email" name="email" type="email" value={form.email} onChange={set('email')} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email <span className="text-xs text-gray-400">(login email, read-only)</span></label>
              <input
                type="email" value={adminEmail} readOnly
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile <span className="text-red-500">*</span></label>
              <MobileInput label="Mobile" value={form.phone} onChange={set('phone')} required
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 bg-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alternate Mobile</label>
              <MobileInput label="Alternate Mobile" value={form.alternatePhone} onChange={set('alternatePhone')}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 bg-white" />
            </div>
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

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <Link
            href={`/superadmin/laundries/${id}`}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-60 transition-colors"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
