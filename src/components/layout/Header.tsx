'use client';

import { Bell, Search, Menu, Sun, Moon } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title: string;
  onMenuClick?: () => void;
}

export default function Header({ title, onMenuClick }: HeaderProps) {
  const [dark, setDark] = useState(false);

  return (
    <header className="h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 gap-4 sticky top-0 z-30">
      <button
        onClick={onMenuClick}
        className="text-gray-500 hover:text-gray-900 md:hidden"
      >
        <Menu size={20} />
      </button>

      <h1 className="font-semibold text-gray-900 dark:text-white text-base flex-1">
        {title}
      </h1>

      <div className="flex items-center gap-2">
        <div className="relative hidden sm:flex">
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Quick search..."
            className="pl-8 pr-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg border-0 focus:ring-2 focus:ring-maroon-500 outline-none w-48 text-gray-900 dark:text-white placeholder:text-gray-400"
          />
        </div>

        <button
          onClick={() => setDark(!dark)}
          className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button className="relative p-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
      </div>
    </header>
  );
}
