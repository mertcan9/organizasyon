import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { format, isAfter, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { ArrowRight, CheckCircle, AlertCircle, Edit2, Trash2, MessageCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
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
      const upcoming = data.filter(org => isAfter(parseISO(org.tarih_saat), now));
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

  const handleDelete = async (id) => {
    if (window.confirm('Bu kaydı silmek istediğinize emin misiniz?')) {
      try {
        const { error } = await supabase
          .from('organizasyonlar')
          .delete()
          .eq('id', id);

        if (error) throw error;
        fetchData(); // Refresh stats and list
      } catch (error) {
        console.error('Error deleting:', error);
        alert('Silme işlemi başarısız oldu.');
      }
    }
  };

  const sendWhatsApp = (telefon, musteriAdi, tarih, toplam, kaparo) => {
    const kalan = (parseFloat(toplam) || 0) - (parseFloat(kaparo) || 0);
    const temizNo = telefon.replace(/\D/g, '');
    const formatliTarih = format(parseISO(tarih), 'dd MMMM yyyy HH:mm', { locale: tr });
    
    const mesaj = `Merhaba ${musteriAdi}, ${formatliTarih} tarihindeki organizasyonunuz onaylanmıştır. Kalan ödemeniz: ${kalan} TL'dir. İyi günler dileriz.`;
    const url = `https://wa.me/90${temizNo}?text=${encodeURIComponent(mesaj)}`;
    
    window.open(url, '_blank');
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
                  <p className="text-sm text-gray-500">{(org.tur || '').toLowerCase() === 'randevu' ? 'TAÇ EVENT' : org.tur}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-indigo-600">
                    {format(parseISO(org.tarih_saat), 'dd MMM', { locale: tr })}
                  </p>
                  <p className="text-xs text-gray-400">
                    {format(parseISO(org.tarih_saat), 'HH:mm')}
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

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-gray-50 flex justify-end gap-2">
                <button 
                  onClick={() => navigate(`/duzenle/${org.id}`)}
                  className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => handleDelete(org.id)}
                  className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
                <button 
                  onClick={() => sendWhatsApp(
                    org.musteriler?.telefon, 
                    org.musteriler?.ad_soyad, 
                    org.tarih_saat,
                    org.finans?.[0]?.toplam_tutar,
                    org.finans?.[0]?.alinan_kaparo
                  )}
                  className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors flex items-center gap-1 font-bold text-xs"
                >
                  <MessageCircle size={18} />
                  <span>Mesaj</span>
                </button>
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
