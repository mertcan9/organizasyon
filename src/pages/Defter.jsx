import React, { useEffect, useState, useRef } from 'react';
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
  parseISO,
  startOfYear,
  endOfYear,
  eachMonthOfInterval
} from 'date-fns';
import { tr } from 'date-fns/locale';
import { 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  TrendingUp, 
  Wallet, 
  Clock, 
  FileText,
  Calendar as CalendarIcon,
  BarChart3
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const Defter = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({ total: 0, collected: 0, remaining: 0 });
  const [monthlyChart, setMonthlyChart] = useState([]);
  const pdfRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all organizations for the current year to build reports
      const yearStart = startOfYear(currentDate);
      const yearEnd = endOfYear(currentDate);

      const { data: allOrgs, error } = await supabase
        .from('organizasyonlar')
        .select(`
          *,
          musteriler (*),
          finans (*)
        `)
        .gte('tarih_saat', yearStart.toISOString())
        .lte('tarih_saat', yearEnd.toISOString())
        .order('tarih_saat', { ascending: true });

      if (error) throw error;

      setData(allOrgs || []);

      // Calculate stats for CURRENT MONTH
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const monthOrgs = allOrgs.filter(org => {
        const d = parseISO(org.tarih_saat);
        return d >= monthStart && d <= monthEnd;
      });

      let total = 0, collected = 0;
      monthOrgs.forEach(org => {
        const finance = org.finans?.[0] || {};
        total += parseFloat(finance.toplam_tutar) || 0;
        collected += parseFloat(finance.alinan_kaparo) || 0;
      });

      setStats({
        total,
        collected,
        remaining: total - collected
      });

      // Build Monthly Chart Data (Yearly View)
      const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });
      const chartData = months.map(m => {
        const mOrgs = allOrgs.filter(org => isSameMonth(parseISO(org.tarih_saat), m));
        const mTotal = mOrgs.reduce((acc, org) => acc + (parseFloat(org.finans?.[0]?.toplam_tutar) || 0), 0);
        return {
          month: format(m, 'MMM', { locale: tr }),
          total: mTotal
        };
      });
      setMonthlyChart(chartData);

    } catch (error) {
      console.error('Defter data fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
    const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

    return (
      <div className="bg-white rounded-3xl shadow-sm p-4 mb-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4 px-2">
          <h2 className="text-lg font-bold text-gray-800 capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: tr })}
          </h2>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ChevronLeft size={20} className="text-gray-600" />
            </button>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ChevronRight size={20} className="text-gray-600" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map(d => (
            <div key={d} className="text-center text-[10px] font-bold text-gray-400 uppercase py-2">
              {d}
            </div>
          ))}
          {calendarDays.map((day, idx) => {
            const dayOrgs = data.filter(org => isSameDay(parseISO(org.tarih_saat), day));
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, monthStart);

            return (
              <div 
                key={idx}
                onClick={() => setSelectedDate(day)}
                className={`
                  relative h-12 flex flex-col items-center justify-center cursor-pointer rounded-xl transition-all
                  ${isSelected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'hover:bg-gray-50'}
                  ${!isCurrentMonth && !isSelected ? 'text-gray-300' : ''}
                  ${isCurrentMonth && !isSelected ? 'text-gray-700' : ''}
                `}
              >
                <span className="text-sm font-semibold">{format(day, 'd')}</span>
                {dayOrgs.length > 0 && (
                  <div className={`w-1.5 h-1.5 rounded-full mt-1 ${isSelected ? 'bg-white' : 'bg-indigo-400 animate-pulse'}`}></div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderStats = () => (
    <div className="grid grid-cols-1 gap-4 mb-6">
      <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-indigo-100 text-sm font-medium opacity-80 uppercase tracking-wider">Aylık Toplam Ciro</p>
              <h3 className="text-3xl font-bold mt-1">{stats.total.toLocaleString('tr-TR')} ₺</h3>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
              <TrendingUp size={24} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/10">
            <div>
              <p className="text-indigo-100 text-[10px] uppercase font-bold opacity-70">Alınan</p>
              <p className="text-lg font-bold">{stats.collected.toLocaleString('tr-TR')} ₺</p>
            </div>
            <div>
              <p className="text-indigo-100 text-[10px] uppercase font-bold opacity-70">Kalan</p>
              <p className="text-lg font-bold">{stats.remaining.toLocaleString('tr-TR')} ₺</p>
            </div>
          </div>
        </div>
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
      </div>
    </div>
  );

  const renderSelectedEvents = () => {
    const selectedOrgs = data.filter(org => isSameDay(parseISO(org.tarih_saat), selectedDate));

    return (
      <div className="space-y-4 mb-8">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Clock size={18} className="text-indigo-500" />
            {format(selectedDate, 'd MMMM', { locale: tr })} İşleri
          </h3>
          <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase">
            {selectedOrgs.length} Kayıt
          </span>
        </div>
        
        {selectedOrgs.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-dashed border-gray-200">
            <p className="text-gray-400 text-sm">Bu tarihte kayıt bulunmuyor.</p>
          </div>
        ) : (
          selectedOrgs.map(org => (
            <div key={org.id} className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                  <FileText size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">{org.musteriler?.ad_soyad || 'İsimsiz'}</h4>
                  <p className="text-xs text-gray-500">{format(parseISO(org.tarih_saat), 'HH:mm')}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-800 text-sm">{parseFloat(org.finans?.[0]?.toplam_tutar || 0).toLocaleString('tr-TR')} ₺</p>
                <p className={`text-[10px] font-bold uppercase ${org.finans?.[0]?.odeme_durumu === 'Ödendi' ? 'text-green-500' : 'text-orange-500'}`}>
                  {org.finans?.[0]?.odeme_durumu || 'Bekliyor'}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  const renderVisualReports = () => {
    const maxVal = Math.max(...monthlyChart.map(m => m.total), 1);

    return (
      <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-100 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 size={18} className="text-indigo-500" />
            Yıllık Kazanç Grafiği
          </h3>
        </div>
        
        <div className="flex items-end justify-between h-40 gap-2">
          {monthlyChart.map((m, i) => {
            const height = (m.total / maxVal) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center group">
                <div className="relative w-full flex flex-col items-center">
                  <div 
                    style={{ height: `${height}%` }}
                    className={`w-full max-w-[12px] rounded-full transition-all duration-500 ${m.total > 0 ? 'bg-indigo-500 group-hover:bg-indigo-600' : 'bg-gray-100'}`}
                  >
                    {m.total > 0 && (
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[8px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {m.total.toLocaleString('tr-TR')} ₺
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-[8px] font-bold text-gray-400 mt-2 uppercase">{m.month}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const handlePDF = async () => {
    if (!pdfRef.current) return;
    setLoading(true);
    try {
      const element = pdfRef.current;
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = 210;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Defter_Raporu_${format(currentDate, 'MMMM_yyyy')}.pdf`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && data.length === 0) return <div className="flex justify-center py-10 text-indigo-600 animate-pulse font-bold uppercase tracking-widest">Veriler Hazırlanıyor...</div>;

  return (
    <div className="pb-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">DEFTER</h1>
          <p className="text-xs text-gray-500 font-medium">Finansal Takip ve Planlama</p>
        </div>
        <button 
          onClick={handlePDF}
          className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 text-indigo-600 hover:bg-indigo-50 transition-colors"
        >
          <Download size={20} />
        </button>
      </div>

      {/* Rapor İçin Yakalanacak Alan */}
      <div ref={pdfRef}>
        {renderStats()}
        {renderCalendar()}
        {renderSelectedEvents()}
        {renderVisualReports()}
      </div>

      <div className="bg-indigo-50 rounded-3xl p-6 border border-indigo-100">
        <h4 className="font-bold text-indigo-900 text-sm mb-2 flex items-center gap-2">
          <CalendarIcon size={16} />
          Genel Özet
        </h4>
        <p className="text-xs text-indigo-700 leading-relaxed font-medium">
          Bu yıl toplam <span className="font-bold">{data.length}</span> organizasyon planlandı. 
          En yüksek kazanç sağlanan ay verileri yukarıdaki grafikte listelenmiştir.
        </p>
      </div>
    </div>
  );
};

export default Defter;
