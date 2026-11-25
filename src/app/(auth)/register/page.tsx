'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import MobileInput from '@/components/ui/MobileInput';
import { getMobileError } from '@/lib/utils';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    phone: '',
    gstin: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    const mobileErr = getMobileError(form.phone, false, 'Mobile');
    if (mobileErr) {
      setError(mobileErr);
      return;
    }

    setLoading(true);
    try {
      await authApi.register({
        name: form.name,
        email: form.email,
        password: form.password,
        businessName: form.businessName,
        phone: form.phone || undefined,
        gstin: form.gstin || undefined,
      });
      router.push('/login?registered=1');
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: e.target.value });

  return (
    <div className="min-h-screen bg-gradient-to-br from-maroon-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-maroon-600 rounded-2xl mb-4">
            <Zap size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">LaundryMS</h1>
          <p className="text-gray-500 text-sm mt-1">Create your business account</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Register your business</h2>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-5">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Business section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Business Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.businessName}
                onChange={set('businessName')}
                placeholder="Your Laundry / CA Firm Name"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-maroon-500 outline-none transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  GSTIN <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.gstin}
                  onChange={set('gstin')}
                  placeholder="27AABCU9603R1ZX"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-maroon-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Mobile <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <MobileInput
                  label="Mobile"
                  value={form.phone}
                  onChange={(v) => setForm({ ...form, phone: v })}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-maroon-500 outline-none transition"
                />
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Account section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Your Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={set('name')}
                placeholder="Full name"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-maroon-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={set('email')}
                placeholder="you@company.com"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-maroon-500 outline-none transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    required
                    value={form.password}
                    onChange={set('password')}
                    placeholder="Min 8 characters"
                    className="w-full px-4 py-2.5 pr-10 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-maroon-500 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    required
                    value={form.confirmPassword}
                    onChange={set('confirmPassword')}
                    placeholder="Repeat password"
                    className={`w-full px-4 py-2.5 pr-10 text-sm border rounded-lg focus:ring-2 focus:ring-maroon-500 outline-none transition ${
                      form.confirmPassword && form.password !== form.confirmPassword
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-200'
                    }`}
                  />
                  {form.confirmPassword && form.password === form.confirmPassword && (
                    <CheckCircle size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-maroon-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-maroon-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-maroon-600 hover:text-maroon-800 font-medium">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          LaundryMS Enterprise Edition · Secure & Compliant
        </p>
      </div>
    </div>
  );
}
