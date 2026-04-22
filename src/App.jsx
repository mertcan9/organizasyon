import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase, supabaseConfigError } from './supabaseClient';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import YeniKayit from './pages/YeniKayit';
import OrganizasyonListe from './pages/OrganizasyonListe';
import Duzenle from './pages/Duzenle';
import Defter from './pages/Defter';
import Login from './pages/Login';

function App() {
  if (!supabase) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md w-full bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-3">
          <div className="text-lg font-extrabold text-red-600">Kurulum Hatası</div>
          <div className="text-sm text-gray-700 font-medium">{supabaseConfigError}</div>
          <div className="text-xs text-gray-500">
            Vercel → Project Settings → Environment Variables alanına bu iki değeri ekleyin ve yeniden deploy edin.
          </div>
          <div className="text-xs font-mono text-gray-800 bg-gray-50 p-3 rounded-xl">
            VITE_SUPABASE_URL
            <br />
            VITE_SUPABASE_ANON_KEY
          </div>
        </div>
      </div>
    )
  }

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mevcut oturumu kontrol et
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Session error:', error);
        setSession(null);
        setLoading(false);
      });

    // Oturum değişikliklerini dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-indigo-600 font-bold animate-pulse text-lg">TAÇ ORGANİZASYON Yükleniyor...</div>
    </div>
  );

  return (
    <Router>
      {!session ? (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/yeni" element={<YeniKayit />} />
            <Route path="/liste" element={<OrganizasyonListe />} />
            <Route path="/defter" element={<Defter />} />
            <Route path="/duzenle/:id" element={<Duzenle />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      )}
    </Router>
  );
}

export default App;
