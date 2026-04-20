import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, PlusCircle, List, Calendar, LogOut } from 'lucide-react';
import { supabase } from '../supabaseClient';

const Layout = ({ children }) => {
  const location = useLocation();

  const handleLogout = async () => {
    if (window.confirm('Çıkış yapmak istediğinize emin misiniz?')) {
      await supabase.auth.signOut();
    }
  };

  const navItems = [
    { path: '/', icon: Home, label: 'Ana Sayfa' },
    { path: '/liste', icon: List, label: 'Liste' },
    { path: '/defter', icon: Calendar, label: 'Defter' },
    { path: '/yeni', icon: PlusCircle, label: 'Yeni Kayıt' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-indigo-600 flex items-center gap-2 uppercase tracking-tight">
            <Calendar size={24} />
            Taç Organizasyon
          </h1>
          <button 
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 safe-area-bottom">
        <div className="max-w-md mx-auto flex justify-around">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center p-2 ${
                location.pathname === item.path ? 'text-indigo-600' : 'text-gray-500'
              }`}
            >
              <item.icon size={24} />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
