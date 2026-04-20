import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { format, isAfter, isBefore } from 'date-fns';
import { tr } from 'date-fns/locale';
import { ArrowRight, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ upcoming: 0, total: 0, unpaid: 0 });
  const [upcomingOrgs, setUpcomingOrgs] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch organizations with customer and finance info
      const { data, error } = await supabase
        .from('organizasyonlar')
        .select(`
          *,
          musteriler (*),
          finans (*)
        `)
        .order('tarih_saat', { ascending: true });

      if (error) throw error;

      const now = new Date();
      const upcoming = data.filter(org => isAfter(new Date(org.tarih_saat), now));
      const unpaid = data.filter(org => org.finans?.[0]?.odeme_durumu !== 'Ödendi');

      setStats({
        upcoming: upcoming.length,
        total: data.length,
        unpaid: unpaid.length
      });

      setUpcomingOrgs(upcoming.slice(0, 3));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-10">Yükleniyor...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-2xl text-center">
          <span className="text-2xl font-bold text-blue-600">{stats.upcoming}</span>
          <p className="text-[10px] uppercase tracking-wider text-blue-500 font-semibold mt-1">Yaklaşan</p>
        </div>
        <div className="bg-green-50 p-4 rounded-2xl text-center">
          <span className="text-2xl font-bold text-green-600">{stats.total}</span>
          <p className="text-[10px] uppercase tracking-wider text-green-500 font-semibold mt-1">Toplam</p>
        </div>
        <div className="bg-red-50 p-4 rounded-2xl text-center">
          <span className="text-2xl font-bold text-red-600">{stats.unpaid}</span>
          <p className="text-[10px] uppercase tracking-wider text-red-500 font-semibold mt-1">Ödenmemiş</p>
        </div>
      </div>

      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800">Yaklaşan Organizasyonlar</h2>
          <Link to="/liste" className="text-indigo-600 text-sm font-medium flex items-center gap-1">
            Tümü <ArrowRight size={16} />
          </Link>
        </div>

        <div className="space-y-4">
          {upcomingOrgs.length > 0 ? upcomingOrgs.map((org) => (
            <div key={org.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-900">{org.musteriler?.ad_soyad}</h3>
                  <p className="text-sm text-gray-500">{org.tur}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-indigo-600">
                    {format(new Date(org.tarih_saat), 'dd MMM', { locale: tr })}
                  </p>
                  <p className="text-xs text-gray-400">
                    {format(new Date(org.tarih_saat), 'HH:mm')}
                  </p>
                </div>
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {org.finans?.[0]?.odeme_durumu === 'Ödendi' ? (
                    <span className="bg-green-100 text-green-700 text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1">
                      <CheckCircle size={10} /> ÖDENDİ
                    </span>
                  ) : (
                    <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1">
                      <AlertCircle size={10} /> BEKLEYEN ÖDEME
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 font-medium">{org.mekan_adi}</p>
              </div>
            </div>
          )) : (
            <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <p className="text-gray-400 text-sm">Yaklaşan organizasyon yok.</p>
            </div>
          )}
        </div>
      </section>

      <Link 
        to="/liste"
        className="block w-full bg-slate-800 text-white text-center py-4 rounded-2xl font-bold shadow-lg shadow-slate-200 active:scale-95 transition-transform mb-4"
      >
        Takvimi Görüntüle
      </Link>

      <Link 
        to="/yeni"
        className="block w-full bg-indigo-600 text-white text-center py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 active:scale-95 transition-transform"
      >
        Yeni Kayıt Oluştur
      </Link>
    </div>
  );
};

export default Dashboard;
