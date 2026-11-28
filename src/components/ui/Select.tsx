'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Option { value: string; label: string }

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  searchable?: boolean;
  className?: string;
}

export default function Select({ value, onChange, options, placeholder = 'Select...', searchable = true, className }: SelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const selected = options.find((o) => o.value === value);

  const filtered = search.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open && searchable) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
    if (!open) setSearch('');
  }, [open, searchable]);

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-maroon-500 text-left"
      >
        <span className={selected ? 'text-gray-900' : 'text-gray-400'}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={14} className={cn('text-gray-400 flex-shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
          {searchable && (
            <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
              <Search size={13} className="text-gray-400 flex-shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="flex-1 text-sm outline-none bg-transparent placeholder-gray-400"
              />
            </div>
          )}
          <div className="max-h-52 overflow-y-auto">
            {!search && (
              <div
                onClick={() => { onChange(''); setOpen(false); setSearch(''); }}
                className={cn(
                  'flex items-center px-3 py-2 text-sm cursor-pointer border-b border-gray-100',
                  value === ''
                    ? 'bg-maroon-600 text-white'
                    : 'text-gray-400 hover:bg-maroon-50 hover:text-maroon-700'
                )}
              >
                {placeholder}
              </div>
            )}
            {filtered.map((opt) => (
              <div
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); setSearch(''); }}
                className={cn(
                  'flex items-center justify-between px-3 py-2 text-sm cursor-pointer',
                  opt.value === value
                    ? 'bg-maroon-600 text-white'
                    : 'text-gray-900 hover:bg-maroon-50 hover:text-maroon-700'
                )}
              >
                <span>{opt.label}</span>
                {opt.value === value && <Check size={14} className="flex-shrink-0" />}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-3 text-sm text-gray-400 text-center">No results</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
