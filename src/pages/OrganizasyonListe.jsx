import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isAfter,
  isBefore,
  parseISO
} from 'date-fns';
import { tr } from 'date-fns/locale';
import { MessageCircle, Phone, MapPin, Search, ChevronLeft, ChevronRight, Mic, Edit2, Trash2, StickyNote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const OrganizasyonListe = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orgs, setOrgs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());

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

  const getNotes = (ek_notlar) => {
    if (!ek_notlar) return '';
    try {
      if (ek_notlar.startsWith('{')) {
        const data = JSON.parse(ek_notlar);
        return data.ek_istekler || '';
      }
    } catch (e) {}
    return ek_notlar;
  };

  const sendWhatsApp = (telefon, musteriAdi, tarih, toplam, kaparo) => {
    const kalan = (parseFloat(toplam) || 0) - (parseFloat(kaparo) || 0);
    const temizNo = telefon.replace(/\D/g, '');
    const formatliTarih = format(parseISO(tarih), 'dd MMMM yyyy HH:mm', { locale: tr });
    
    const mesaj = `Merhaba ${musteriAdi}, ${formatliTarih} tarihindeki organizasyonunuz onaylanmıştır. Kalan ödemeniz: ${kalan} TL'dir. İyi günler dileriz.`;
    const url = `https://wa.me/90${temizNo}?text=${encodeURIComponent(mesaj)}`;
    
    window.open(url, '_blank');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bu kaydı silmek istediğinize emin misiniz?')) {
      try {
        const { error } = await supabase
          .from('organizasyonlar')
          .delete()
          .eq('id', id);

        if (error) throw error;
        setOrgs(orgs.filter(org => org.id !== id));
      } catch (error) {
        console.error('Error deleting:', error);
        alert('Silme işlemi başarısız oldu.');
      }
    }
  };

  // Calendar Logic
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const getOrgsForDay = (day) => {
    return orgs.filter(org => isSameDay(parseISO(org.tarih_saat), day));
  };

  const filteredOrgs = orgs.filter(org => {
    const matchesSearch = org.musteriler?.ad_soyad.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.tur.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) return <div className="text-center py-10">Yükleniyor...</div>;

  const handleDayClick = (day, dayOrgs, isCurrentMonth) => {
    if (!isCurrentMonth) return;
    
    if (dayOrgs.length > 0) {
      // Eğer o güne ait kayıt varsa, ilk kaydı düzenleme sayfasına git
      navigate(`/duzenle/${dayOrgs[0].id}`);
    } else {
      // Kayıt yoksa yeni kayıt sayfasına o tarihi göndererek git
      navigate(`/yeni?date=${format(day, 'yyyy-MM-dd')}`);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Search Bar */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-3 text-gray-400" />
        <input
          type="text"
          placeholder="Rezervasyon ara"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-xl p-3 pl-10 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Calendar View */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-50">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 bg-slate-800 text-white">
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-lg font-bold text-gray-800 capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: tr })}
          </h2>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 bg-slate-800 text-white">
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Week Days */}
        <div className="grid grid-cols-7 text-center bg-white border-b border-gray-50">
          {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => (
            <div key={day} className="py-2 text-[10px] font-bold text-blue-500 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, idx) => {
            const dayOrgs = getOrgsForDay(day);
            const hasOrgs = dayOrgs.length > 0;
            const isCurrentMonth = isSameMonth(day, monthStart);
            
            return (
              <div 
                key={day.toString()} 
                onClick={() => handleDayClick(day, dayOrgs, isCurrentMonth)}
                className={`
                  min-h-[50px] border-b border-r border-gray-50 p-1 flex flex-col items-center justify-start relative cursor-pointer transition-colors
                  ${!isCurrentMonth ? 'bg-gray-50' : 'bg-white hover:bg-indigo-50'}
                  ${idx % 7 === 6 ? 'border-r-0' : ''}
                `}
              >
                <span className={`
                  text-xs font-medium mt-1
                  ${!isCurrentMonth ? 'text-gray-300' : 'text-blue-600'}
                  ${hasOrgs ? 'text-red-500 font-bold' : ''}
                `}>
                  {hasOrgs && <span className="text-red-500 mr-0.5">*</span>}
                  {format(day, 'd')}
                </span>
                
                {/* Visual indicator for multiple orgs if needed */}
                {hasOrgs && dayOrgs.length > 1 && (
                  <div className="absolute bottom-1 w-1 h-1 bg-red-400 rounded-full"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* List View Below Calendar */}
      <div className="space-y-4">
        <h3 className="font-bold text-gray-800 px-1">Seçili Ayın Kayıtları</h3>
        {filteredOrgs
          .filter(org => isSameMonth(parseISO(org.tarih_saat), currentDate))
          .map((org) => (
          <div key={org.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">{org.tur}</span>
                <h3 className="font-bold text-gray-900 text-lg leading-tight">{org.musteriler?.ad_soyad}</h3>
              </div>
              <div className="text-right bg-indigo-50 p-2 rounded-xl min-w-[70px]">
                <p className="text-xs font-bold text-indigo-700">
                  {format(parseISO(org.tarih_saat), 'dd MMM', { locale: tr })}
                </p>
                <p className="text-[10px] text-indigo-400 font-bold">
                  {format(parseISO(org.tarih_saat), 'HH:mm')}
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
              {getNotes(org.ek_notlar) && (
                <div className="flex items-start gap-2 text-gray-500 text-xs bg-gray-50 p-2 rounded-lg">
                  <StickyNote size={14} className="mt-0.5" />
                  <span>{getNotes(org.ek_notlar)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-50">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Kalan Ödeme</p>
                <p className="font-bold text-gray-900">
                  {(org.finans?.[0]?.toplam_tutar || 0) - (org.finans?.[0]?.alinan_kaparo || 0)} TL
                </p>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => navigate(`/duzenle/${org.id}`)}
                  className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                >
                  <Edit2 size={20} />
                </button>
                <button 
                  onClick={() => handleDelete(org.id)}
                  className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
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
