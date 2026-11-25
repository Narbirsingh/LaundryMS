'use client';

import { useEffect, useState } from 'react';
import { Save, Building2 } from 'lucide-react';
import MobileInput from '@/components/ui/MobileInput';
import { getMobileError } from '@/lib/utils';

const TIMEZONES = ['Asia/Kolkata', 'UTC', 'Asia/Dubai', 'America/New_York'];

const DEFAULT_SETTINGS = {
  businessName: '',
  gstin: '',
  pan: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  pincode: '',
  timezone: 'Asia/Kolkata',
  currency: 'INR',
  invoicePrefix: 'INV',
  orderPrefix: 'ORD',
  expressMultiplier: 1.5,
  enablePickupDelivery: true,
  enableCAModule: false,
  defaultGstRate: 18,
  taxRegistered: true,
};

export default function SettingsPage() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<'general' | 'billing' | 'modules'>('general');

  useEffect(() => {
    const stored = localStorage.getItem('lms_settings');
    if (stored) {
      try { setSettings(JSON.parse(stored)); } catch {}
    }
  }, []);

  const handleSave = () => {
    const mobileErr = getMobileError(settings.phone, false, 'Mobile');
    if (mobileErr) { alert(mobileErr); return; }
    localStorage.setItem('lms_settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const field = (label: string, key: keyof typeof settings, type = 'text', placeholder = '') => (
    <div key={key}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} value={String(settings[key])} placeholder={placeholder}
        onChange={(e) => setSettings({ ...settings, [key]: type === 'number' ? Number(e.target.value) : e.target.value })}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-maroon-500" />
    </div>
  );

  const toggle = (label: string, key: keyof typeof settings, description?: string) => (
    <div key={key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <button onClick={() => setSettings({ ...settings, [key]: !settings[key as keyof typeof settings] })}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings[key] ? 'bg-maroon-600' : 'bg-gray-200'}`}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings[key] ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
          <p className="text-sm text-gray-500">Configure your laundry management system</p>
        </div>
        <button onClick={handleSave}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${saved ? 'bg-green-600 text-white' : 'bg-maroon-600 text-white hover:bg-maroon-700'}`}>
          <Save size={15} />
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1">
        {(['general', 'billing', 'modules'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm rounded-lg font-medium capitalize transition-colors ${tab === t ? 'bg-maroon-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {tab === 'general' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Building2 size={16} className="text-maroon-600" />
              <h3 className="text-sm font-semibold text-gray-700">Business Information</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {field('Business Name', 'businessName', 'text', 'Your Laundry Name')}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                <MobileInput label="Mobile" value={settings.phone} onChange={(v) => setSettings({ ...settings, phone: v })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-maroon-500" />
              </div>
              {field('Email', 'email', 'email', 'info@yourlaundry.com')}
              {field('GSTIN', 'gstin', 'text', '27AABCU9603R1ZX')}
              {field('PAN', 'pan', 'text', 'AABCU9603R')}
              <div className="col-span-2">{field('Address', 'address', 'text', 'Street address')}</div>
              {field('City', 'city', 'text', 'Mumbai')}
              {field('Pincode', 'pincode', 'text', '400001')}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
              <select value={settings.timezone} onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-maroon-500">
                {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>
          </div>
        )}

        {tab === 'billing' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Billing & Invoice Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              {field('Invoice Prefix', 'invoicePrefix', 'text', 'INV')}
              {field('Order Prefix', 'orderPrefix', 'text', 'ORD')}
              {field('Default GST Rate %', 'defaultGstRate', 'number')}
              {field('Express Multiplier', 'expressMultiplier', 'number')}
            </div>
            <div className="pt-2 border-t border-gray-100">
              {toggle('Tax Registered', 'taxRegistered', 'Show CGST/SGST breakdown on invoices')}
            </div>
          </div>
        )}

        {tab === 'modules' && (
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Feature Modules</h3>
            {toggle('Pickup & Delivery', 'enablePickupDelivery', 'Enable scheduling and tracking for pickup/delivery orders')}
            {toggle('CA / ITR Module', 'enableCAModule', 'Enable CA client management and ITR filing workflow')}
          </div>
        )}
      </div>
    </div>
  );
}
