'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, ShoppingBag, Users, Truck, Factory, Tag, Package,
  Receipt, CreditCard, UserCheck, BarChart3, Settings, LogOut,
  Calculator, FileText, GitMerge, CheckCircle, Send, Calendar, ChevronRight,
  Zap, Building2, Gift, Ticket, Bell, Clock, ShieldCheck, ShoppingCart,
  BookOpen, Boxes, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import ConfirmModal from '@/components/ui/ConfirmModal';

const ICON_MAP: Record<string, any> = {
  LayoutDashboard, ShoppingBag, Users, Truck, Factory, Tag, Package,
  Receipt, CreditCard, UserCheck, BarChart3, Settings, Calculator,
  FileText, GitMerge, CheckCircle, Send, Calendar, Building2, Gift,
  Ticket, Bell, Clock, ShieldCheck, ShoppingCart, BookOpen, Boxes,
};

type NavItem = { label: string; href: string; icon: string; children?: NavItem[] };

const LAUNDRY_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Orders', href: '/orders', icon: 'ShoppingBag' },
  { label: 'POS Terminal', href: '/pos', icon: 'ShoppingCart' },
  { label: 'Customers', href: '/customers', icon: 'Users' },
  { label: 'Online Booking', href: '/booking', icon: 'BookOpen' },
  {
    label: 'Operations', href: '#ops', icon: 'Factory',
    children: [
      { label: 'Pickup & Delivery', href: '/pickup-delivery', icon: 'Truck' },
      { label: 'Rider View', href: '/delivery', icon: 'Truck' },
      { label: 'Production', href: '/production', icon: 'Factory' },
      { label: 'Garment Tracking', href: '/garments', icon: 'Tag' },
      { label: 'Quality Control', href: '/quality', icon: 'ShieldCheck' },
    ],
  },
  { label: 'Services & Pricing', href: '/services', icon: 'Tag' },
  {
    label: 'Finance', href: '#finance', icon: 'Receipt',
    children: [
      { label: 'Billing', href: '/billing', icon: 'Receipt' },
      { label: 'Expenses', href: '/expenses', icon: 'CreditCard' },
    ],
  },
  {
    label: 'Loyalty & Marketing', href: '#loyalty', icon: 'Gift',
    children: [
      { label: 'Loyalty Program', href: '/loyalty', icon: 'Gift' },
      { label: 'Coupons', href: '/coupons', icon: 'Ticket' },
    ],
  },
  {
    label: 'HR & Staff', href: '#hr', icon: 'UserCheck',
    children: [
      { label: 'Employees', href: '/employees', icon: 'UserCheck' },
      { label: 'Attendance', href: '/attendance', icon: 'Clock' },
    ],
  },
  { label: 'Notifications', href: '/notifications', icon: 'Bell' },
  {
    label: 'Infrastructure', href: '#infra', icon: 'Building2',
    children: [
      { label: 'Branches', href: '/branches', icon: 'Building2' },
      { label: 'Inventory', href: '/inventory', icon: 'Package' },
      { label: 'Suppliers', href: '/suppliers', icon: 'Boxes' },
    ],
  },
  { label: 'Reports', href: '/reports', icon: 'BarChart3' },
  { label: 'Settings', href: '/settings', icon: 'Settings' },
];

const CA_NAV = [
  { label: 'CA Dashboard', href: '/ca', icon: 'LayoutDashboard' },
  { label: 'Clients', href: '/ca/clients', icon: 'Users' },
  { label: 'Documents', href: '/ca/documents', icon: 'FileText' },
  { label: 'Reconciliation', href: '/ca/reconciliation', icon: 'GitMerge' },
  { label: 'ITR Readiness', href: '/ca/readiness', icon: 'CheckCircle' },
  { label: 'Tax Computation', href: '/ca/computation', icon: 'Calculator' },
  { label: 'Filing Status', href: '/ca/filing', icon: 'Send' },
  { label: 'Deadlines', href: '/ca/deadlines', icon: 'Calendar' },
  { label: 'Reports', href: '/ca/reports', icon: 'BarChart3' },
];

interface SidebarProps {
  workspace: 'laundry' | 'ca';
  onWorkspaceChange: (w: 'laundry' | 'ca') => void;
  onClose?: () => void;
}

function NavLink({ item, pathname, activeColor, onClose }: { item: NavItem; pathname: string; activeColor: string; onClose?: () => void }) {
  const Icon = ICON_MAP[item.icon] || LayoutDashboard;
  const hasChildren = item.children && item.children.length > 0;
  const isChildActive = hasChildren && item.children!.some(c => pathname === c.href || pathname.startsWith(`${c.href}/`));
  const [open, setOpen] = useState(isChildActive);

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setOpen(o => !o)}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all',
            isChildActive ? 'text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white',
          )}
        >
          <Icon size={16} className="flex-shrink-0" />
          <span className="flex-1 text-left">{item.label}</span>
          <ChevronDown size={13} className={cn('transition-transform', open ? 'rotate-180' : '')} />
        </button>
        {open && (
          <div className="ml-4 mt-0.5 space-y-0.5 border-l border-gray-700 pl-3">
            {item.children!.map(child => (
              <NavLink key={child.href} item={child} pathname={pathname} activeColor={activeColor} onClose={onClose} />
            ))}
          </div>
        )}
      </div>
    );
  }

  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all',
        isActive ? `${activeColor} text-white` : 'text-gray-400 hover:bg-gray-800 hover:text-white',
      )}
    >
      <Icon size={16} className="flex-shrink-0" />
      <span className="flex-1">{item.label}</span>
      {isActive && <ChevronRight size={14} />}
    </Link>
  );
}

export default function Sidebar({ workspace, onWorkspaceChange, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navItems = workspace === 'ca' ? CA_NAV : LAUNDRY_NAV;
  const activeColor = workspace === 'ca' ? 'bg-indigo-600' : 'bg-maroon-600';

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white w-64 min-h-screen">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-maroon-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Zap size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm leading-tight">LaundryMS</div>
            <div className="text-xs text-gray-400 leading-tight">Enterprise Edition</div>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 md:hidden">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          )}
        </div>
      </div>

      {/* Workspace toggle */}
      <div className="px-3 py-3 border-b border-gray-700">
        <div className="flex rounded-lg bg-gray-800 p-1 gap-1">
          <button
            onClick={() => onWorkspaceChange('laundry')}
            className={cn(
              'flex-1 text-xs py-1.5 rounded-md font-medium transition-all',
              workspace === 'laundry'
                ? 'bg-maroon-600 text-white'
                : 'text-gray-400 hover:text-white',
            )}
          >
            Laundry
          </button>
          <button
            onClick={() => onWorkspaceChange('ca')}
            className={cn(
              'flex-1 text-xs py-1.5 rounded-md font-medium transition-all',
              workspace === 'ca'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-white',
            )}
          >
            CA / ITR
          </button>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-0.5">
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} activeColor={activeColor} onClose={onClose} />
        ))}
      </nav>

      {/* User info */}
      <div className="px-3 py-3 border-t border-gray-700">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-800">
          <div className="w-8 h-8 bg-maroon-600 rounded-full flex items-center justify-center text-xs font-bold">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{user?.name || 'User'}</div>
            <div className="text-xs text-gray-400 truncate">{user?.role?.replace(/_/g, ' ')}</div>
          </div>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="text-gray-400 hover:text-white transition-colors"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      <ConfirmModal
        open={showLogoutConfirm}
        title="Sign out?"
        message="You'll be returned to the login page. Any unsaved work will be lost."
        confirmLabel="Sign out"
        cancelLabel="Stay"
        variant="warning"
        onConfirm={() => { setShowLogoutConfirm(false); logout(); }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
}
