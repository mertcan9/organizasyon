import { useEffect, useState, useRef } from 'react';
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
  Clock, 
  FileText,
  Calendar as CalendarIcon,
  BarChart3,
  Plus,
  Trash2,
  TrendingDown,
  CircleDollarSign
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const Defter = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState({ total: 0, collected: 0, remaining: 0, totalExpenses: 0, netProfit: 0 });
  const [monthlyChart, setMonthlyChart] = useState([]);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [newExpense, setNewExpense] = useState({ ad: '', tutar: '', tarih: format(new Date(), 'yyyy-MM-dd') });
  const pdfRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const yearStart = startOfYear(currentDate);
      const yearEnd = endOfYear(currentDate);

      // 1. Organizasyonları çek
      const { data: allOrgs, error: orgError } = await supabase
        .from('organizasyonlar')
        .select(`*, musteriler (*), finans (*)`)
        .gte('tarih_saat', yearStart.toISOString())
        .lte('tarih_saat', yearEnd.toISOString())
        .order('tarih_saat', { ascending: true });

      if (orgError) throw orgError;
      setData(allOrgs || []);

      // 2. Harcamaları çek
      const { data: allExpenses, error: expError } = await supabase
        .from('harcamalar')
        .select('*')
        .gte('tarih', yearStart.toISOString())
        .lte('tarih', yearEnd.toISOString());

      // Harcamalar tablosu yoksa hata vermesin, boş dönsün
      const currentExpenses = expError ? [] : (allExpenses || []);
      setExpenses(currentExpenses);

      // 3. İstatistikleri hesapla (MEVCUT AY İÇİN)
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      
      const monthOrgs = allOrgs.filter(org => {
        const d = parseISO(org.tarih_saat);
        return d >= monthStart && d <= monthEnd;
      });

      const monthExpenses = currentExpenses.filter(exp => {
        const d = parseISO(exp.tarih);
        return d >= monthStart && d <= monthEnd;
      });

      let total = 0, collected = 0;
      monthOrgs.forEach(org => {
        const finance = org.finans?.[0] || {};
        total += parseFloat(finance.toplam_tutar) || 0;
        collected += parseFloat(finance.alinan_kaparo) || 0;
      });

      const totalExpenses = monthExpenses.reduce((acc, exp) => acc + (parseFloat(exp.tutar) || 0), 0);

      setStats({
        total,
        collected,
        remaining: total - collected,
        totalExpenses,
        netProfit: collected - totalExpenses // Net Kar = Alınan Nakit - Harcamalar
      });

      // 4. Grafik Verisi (Yıllık)
      const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });
      const chartData = months.map(m => {
        const mOrgs = allOrgs.filter(org => isSameMonth(parseISO(org.tarih_saat), m));
        const mExps = currentExpenses.filter(exp => isSameMonth(parseISO(exp.tarih), m));
        
        const mTotal = mOrgs.reduce((acc, org) => acc + (parseFloat(org.finans?.[0]?.toplam_tutar) || 0), 0);
        const mExpTotal = mExps.reduce((acc, exp) => acc + (parseFloat(exp.tutar) || 0), 0);
        
        return {
          month: format(m, 'MMM', { locale: tr }),
          total: mTotal,
          expense: mExpTotal,
          profit: mTotal - mExpTotal
        };
      });
      setMonthlyChart(chartData);

    } catch (error) {
      console.error('Defter data fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!newExpense.ad || !newExpense.tutar) return;

    try {
      const { error } = await supabase
        .from('harcamalar')
        .insert([{
          ad: newExpense.ad,
          tutar: parseFloat(newExpense.tutar),
          tarih: newExpense.tarih
        }]);

      if (error) {
        if (error.code === '42P01') {
          alert('Harcamalar tablosu bulunamadı. Lütfen Supabase üzerinden tabloyu oluşturun.');
        } else {
          throw error;
        }
      } else {
        setNewExpense({ ad: '', tutar: '', tarih: format(new Date(), 'yyyy-MM-dd') });
        setShowExpenseForm(false);
        fetchData();
      }
    } catch (error) {
      console.error('Harcama ekleme hatası:', error);
      alert('Harcama eklenemedi.');
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Bu harcamayı silmek istediğinize emin misiniz?')) return;
    try {
      const { error } = await supabase.from('harcamalar').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Harcama silme hatası:', error);
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
            const dayExps = expenses.filter(exp => isSameDay(parseISO(exp.tarih), day));
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
                <div className="flex gap-0.5 mt-1">
                  {dayOrgs.length > 0 && (
                    <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-indigo-400'}`}></div>
                  )}
                  {dayExps.length > 0 && (
                    <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-red-400'}`}></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {/* Gelir Kartı */}
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
              <p className="text-indigo-100 text-[10px] uppercase font-bold opacity-70">Alınan Nakit</p>
              <p className="text-lg font-bold">{stats.collected.toLocaleString('tr-TR')} ₺</p>
            </div>
            <div>
              <p className="text-indigo-100 text-[10px] uppercase font-bold opacity-70">Bekleyen</p>
              <p className="text-lg font-bold">{stats.remaining.toLocaleString('tr-TR')} ₺</p>
            </div>
          </div>
        </div>
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      {/* Harcama ve Kar Kartı */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-red-50 p-3 rounded-2xl text-red-500">
              <TrendingDown size={24} />
            </div>
            <div>
              <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Aylık Harcama</p>
              <h4 className="text-xl font-bold text-gray-800">{stats.totalExpenses.toLocaleString('tr-TR')} ₺</h4>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-green-50 p-3 rounded-2xl text-green-500">
              <CircleDollarSign size={24} />
            </div>
            <div>
              <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Net Kâr (Nakit)</p>
              <h4 className="text-xl font-bold text-gray-800">{stats.netProfit.toLocaleString('tr-TR')} ₺</h4>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setShowExpenseForm(!showExpenseForm)}
          className="w-full bg-gray-900 text-white py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-black transition-all"
        >
          <Plus size={18} /> Harcama Ekle
        </button>
      </div>
    </div>
  );

  const renderExpenseForm = () => showExpenseForm && (
    <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 mb-6 animate-in slide-in-from-top duration-300">
      <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 uppercase text-sm tracking-widest">Yeni Harcama Kaydı</h3>
      <form onSubmit={handleAddExpense} className="space-y-4">
        <input 
          type="text" 
          placeholder="Harcama Açıklaması (Örn: Kira, Personel)" 
          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          value={newExpense.ad}
          onChange={e => setNewExpense({...newExpense, ad: e.target.value})}
        />
        <div className="grid grid-cols-2 gap-4">
          <input 
            type="number" 
            placeholder="Tutar (₺)" 
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            value={newExpense.tutar}
            onChange={e => setNewExpense({...newExpense, tutar: e.target.value})}
          />
          <input 
            type="date" 
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            value={newExpense.tarih}
            onChange={e => setNewExpense({...newExpense, tarih: e.target.value})}
          />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-2xl font-bold text-sm">Kaydet</button>
          <button type="button" onClick={() => setShowExpenseForm(false)} className="px-6 bg-gray-100 text-gray-600 py-3 rounded-2xl font-bold text-sm">İptal</button>
        </div>
      </form>
    </div>
  );

  const renderSelectedEvents = () => {
    const selectedOrgs = data.filter(org => isSameDay(parseISO(org.tarih_saat), selectedDate));
    const selectedExps = expenses.filter(exp => isSameDay(parseISO(exp.tarih), selectedDate));

    return (
      <div className="space-y-4 mb-8">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Clock size={18} className="text-indigo-500" />
            {format(selectedDate, 'd MMMM', { locale: tr })} Detayları
          </h3>
          <div className="flex gap-2">
            <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase">
              {selectedOrgs.length} İş
            </span>
            <span className="bg-red-50 text-red-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase">
              {selectedExps.length} Harcama
            </span>
          </div>
        </div>
        
        {selectedOrgs.length === 0 && selectedExps.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-dashed border-gray-200">
            <p className="text-gray-400 text-sm">Bu tarihte kayıt bulunmuyor.</p>
          </div>
        ) : (
          <>
            {/* İşler */}
            {selectedOrgs.map(org => (
              <div key={org.id} className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
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
            ))}
            
            {/* Harcamalar */}
            {selectedExps.map(exp => (
              <div key={exp.id} className="bg-red-50/50 rounded-3xl p-4 shadow-sm border border-red-100 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-500 flex items-center justify-center">
                    <TrendingDown size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm">{exp.ad}</h4>
                    <p className="text-xs text-gray-500">Harcama Kaydı</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-bold text-red-600 text-sm">-{parseFloat(exp.tutar).toLocaleString('tr-TR')} ₺</p>
                  <button onClick={() => handleDeleteExpense(exp.id)} className="p-2 text-gray-300 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    );
  };

  const renderVisualReports = () => {
    const maxVal = Math.max(...monthlyChart.map(m => Math.max(m.total, m.expense)), 1);

    return (
      <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-100 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 uppercase text-xs tracking-widest">
            <BarChart3 size={18} className="text-indigo-500" />
            Yıllık Gelir & Gider Analizi
          </h3>
        </div>
        
        <div className="flex items-end justify-between h-48 gap-1.5">
          {monthlyChart.map((m, i) => {
            const hTotal = (m.total / maxVal) * 100;
            const hExp = (m.expense / maxVal) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center group relative h-full">
                <div className="w-full flex justify-center gap-0.5 items-end h-full pb-8">
                  <div 
                    style={{ height: `${hTotal}%` }}
                    className={`w-full max-w-[8px] rounded-t-full bg-indigo-500 group-hover:bg-indigo-600 transition-all`}
                  />
                  <div 
                    style={{ height: `${hExp}%` }}
                    className={`w-full max-w-[8px] rounded-t-full bg-red-400 group-hover:bg-red-500 transition-all`}
                  />
                </div>
                <div className="absolute bottom-0 text-[7px] font-bold text-gray-400 uppercase">{m.month}</div>
                
                {/* Tooltip */}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white p-2 rounded-xl text-[8px] opacity-0 group-hover:opacity-100 transition-all z-20 pointer-events-none whitespace-nowrap shadow-xl">
                  <p className="text-indigo-300">Gelir: {m.total.toLocaleString('tr-TR')} ₺</p>
                  <p className="text-red-300">Gider: {m.expense.toLocaleString('tr-TR')} ₺</p>
                  <p className="font-bold border-t border-white/10 mt-1 pt-1">Kâr: {m.profit.toLocaleString('tr-TR')} ₺</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex justify-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
            <span className="text-[10px] font-bold text-gray-500 uppercase">Gelir</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
            <span className="text-[10px] font-bold text-gray-500 uppercase">Gider</span>
          </div>
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
          <p className="text-xs text-gray-500 font-medium uppercase tracking-tighter">Finansal Takip & Kar Analizi</p>
        </div>
        <button 
          onClick={handlePDF}
          className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 text-indigo-600 hover:bg-indigo-50 transition-colors"
        >
          <Download size={20} />
        </button>
      </div>

      {renderExpenseForm()}

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
          İşletme Özeti
        </h4>
        <p className="text-xs text-indigo-700 leading-relaxed font-medium">
          Bu yıl toplam <span className="font-bold">{data.length}</span> iş yapıldı. 
          Aylık nakit akışınız ve harcamalarınız doğrultusunda net kârınız otomatik hesaplanmaktadır.
        </p>
      </div>
    </div>
  );
};

export default Defter;
