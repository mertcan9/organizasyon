import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { MessageCircle, Phone, Calendar, MapPin, Search, Filter } from 'lucide-react';

const OrganizasyonListe = () => {
  const [loading, setLoading] = useState(true);
  const [orgs, setOrgs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('Hepsi'); // Hepsi, Yaklaşan, Geçmiş

  useEffect(() => {
    fetchOrgs();
  }, []);

  const fetchOrgs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('organizasyonlar')
        .select(`
          *,
          musteriler (*),
          finans (*)
        `)
        .order('tarih_saat', { ascending: false });

      if (error) throw error;
      setOrgs(data);
    } catch (error) {
      console.error('Error fetching orgs:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendWhatsApp = (telefon, musteriAdi, tarih, toplam, kaparo) => {
    const kalan = (parseFloat(toplam) || 0) - (parseFloat(kaparo) || 0);
    const temizNo = telefon.replace(/\D/g, '');
    const formatliTarih = format(new Date(tarih), 'dd MMMM yyyy HH:mm', { locale: tr });
    
    const mesaj = `Merhaba ${musteriAdi}, ${formatliTarih} tarihindeki organizasyonunuz onaylanmıştır. Kalan ödemeniz: ${kalan} TL'dir. İyi günler dileriz.`;
    const url = `https://wa.me/90${temizNo}?text=${encodeURIComponent(mesaj)}`;
    
    window.open(url, '_blank');
  };

  const filteredOrgs = orgs.filter(org => {
    const matchesSearch = org.musteriler?.ad_soyad.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.tur.toLowerCase().includes(searchTerm.toLowerCase());
    
    const now = new Date();
    const orgDate = new Date(org.tarih_saat);
    
    if (filter === 'Yaklaşan') return matchesSearch && orgDate >= now;
    if (filter === 'Geçmiş') return matchesSearch && orgDate < now;
    return matchesSearch;
  });

  if (loading) return <div className="text-center py-10">Yükleniyor...</div>;

  return (
    <div className="space-y-4 pb-20">
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Müşteri veya tür ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border-none rounded-xl p-3 pl-10 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {['Hepsi', 'Yaklaşan', 'Geçmiş'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                filter === f ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 shadow-sm'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredOrgs.map((org) => (
          <div key={org.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">{org.tur}</span>
                <h3 className="font-bold text-gray-900 text-lg leading-tight">{org.musteriler?.ad_soyad}</h3>
              </div>
              <div className="text-right bg-indigo-50 p-2 rounded-xl min-w-[70px]">
                <p className="text-xs font-bold text-indigo-700">
                  {format(new Date(org.tarih_saat), 'dd MMM', { locale: tr })}
                </p>
                <p className="text-[10px] text-indigo-400 font-bold">
                  {format(new Date(org.tarih_saat), 'HH:mm')}
                </p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-gray-500 text-xs">
                <MapPin size={14} /> {org.mekan_adi || 'Mekan belirtilmedi'}
              </div>
              <div className="flex items-center gap-2 text-gray-500 text-xs">
                <Phone size={14} /> {org.musteriler?.telefon}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-50">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Kalan Ödeme</p>
                <p className="font-bold text-gray-900">
                  {(org.finans?.[0]?.toplam_tutar || 0) - (org.finans?.[0]?.alinan_kaparo || 0)} TL
                </p>
              </div>
              
              <div className="flex gap-2">
                <a 
                  href={`tel:${org.musteriler?.telefon}`}
                  className="p-3 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <Phone size={20} />
                </a>
                <button 
                  onClick={() => sendWhatsApp(
                    org.musteriler?.telefon, 
                    org.musteriler?.ad_soyad, 
                    org.tarih_saat,
                    org.finans?.[0]?.toplam_tutar,
                    org.finans?.[0]?.alinan_kaparo
                  )}
                  className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors flex items-center gap-2 font-bold text-sm"
                >
                  <MessageCircle size={20} />
                  <span className="hidden xs:inline">Mesaj</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrganizasyonListe;
