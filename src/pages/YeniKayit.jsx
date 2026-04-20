import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, useLocation } from 'react-router-dom';
import { Save, User, Phone, Calendar as CalendarIcon, MapPin, Tag, CreditCard } from 'lucide-react';

const YeniKayit = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    ad_soyad: '',
    telefon: '',
    tur: 'Düğün',
    tarih_saat: '',
    mekan_adi: '',
    ek_notlar: '',
    toplam_tutar: '',
    alinan_kaparo: ''
  });

  useEffect(() => {
    try {
      const queryParams = new URLSearchParams(location.search);
      const dateParam = queryParams.get('date');
      if (dateParam) {
        setFormData(prev => ({ ...prev, tarih_saat: `${dateParam}T09:00` }));
      }
    } catch (error) {
      console.error('Date parse error:', error);
    }
  }, [location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Create customer
      const { data: customerData, error: customerError } = await supabase
        .from('musteriler')
        .insert([{ ad_soyad: formData.ad_soyad, telefon: formData.telefon }])
        .select()
        .single();

      if (customerError) throw customerError;

      // 2. Create organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizasyonlar')
        .insert([{
          musteri_id: customerData.id,
          tur: formData.tur,
          tarih_saat: formData.tarih_saat,
          mekan_adi: formData.mekan_adi,
          ek_notlar: formData.ek_notlar
        }])
        .select()
        .single();

      if (orgError) throw orgError;

      // 3. Create finance record
      const total = parseFloat(formData.toplam_tutar) || 0;
      const kaparo = parseFloat(formData.alinan_kaparo) || 0;
      const odeme_durumu = kaparo >= total ? 'Ödendi' : (kaparo > 0 ? 'Kısmi' : 'Ödenmedi');

      const { error: financeError } = await supabase
        .from('finans')
        .insert([{
          organizasyon_id: orgData.id,
          toplam_tutar: total,
          alinan_kaparo: kaparo,
          odeme_durumu: odeme_durumu
        }]);

      if (financeError) throw financeError;

      alert('Kayıt başarıyla oluşturuldu!');
      navigate('/');
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Yeni Organizasyon Kaydı</h2>

      <form onSubmit={handleSubmit} className="space-y-4 pb-10">
        {/* Müşteri Bilgileri */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm mb-2">
            <User size={18} /> Müşteri Bilgileri
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">AD SOYAD</label>
            <input
              required
              type="text"
              name="ad_soyad"
              value={formData.ad_soyad}
              onChange={handleChange}
              placeholder="Müşteri adı"
              className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">TELEFON</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-3.5 text-gray-400" />
              <input
                required
                type="tel"
                name="telefon"
                value={formData.telefon}
                onChange={handleChange}
                placeholder="5XX XXX XX XX"
                className="w-full bg-gray-50 border-none rounded-xl p-3 pl-10 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Organizasyon Detayları */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm mb-2">
            <Tag size={18} /> Organizasyon Detayları
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">TÜR</label>
              <select
                name="tur"
                value={formData.tur}
                onChange={handleChange}
                className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500"
              >
                <option>Düğün</option>
                <option>Kına</option>
                <option>Nişan</option>
                <option>Sünnet</option>
                <option>Doğum Günü</option>
                <option>Diğer</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">TARİH & SAAT</label>
              <input
                required
                type="datetime-local"
                name="tarih_saat"
                value={formData.tarih_saat}
                onChange={handleChange}
                className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">MEKAN</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-3.5 text-gray-400" />
              <input
                type="text"
                name="mekan_adi"
                value={formData.mekan_adi}
                onChange={handleChange}
                placeholder="Mekan adı"
                className="w-full bg-gray-50 border-none rounded-xl p-3 pl-10 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">NOTLAR</label>
            <textarea
              name="ek_notlar"
              value={formData.ek_notlar}
              onChange={handleChange}
              placeholder="Ek notlar..."
              className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 h-24"
            />
          </div>
        </div>

        {/* Finans */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm mb-2">
            <CreditCard size={18} /> Ödeme Bilgileri
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">TOPLAM TUTAR</label>
              <input
                type="number"
                name="toplam_tutar"
                value={formData.toplam_tutar}
                onChange={handleChange}
                placeholder="0.00"
                className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">ALINAN KAPARO</label>
              <input
                type="number"
                name="alinan_kaparo"
                value={formData.alinan_kaparo}
                onChange={handleChange}
                placeholder="0.00"
                className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <button
          disabled={loading}
          type="submit"
          className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 disabled:opacity-50"
        >
          <Save size={20} />
          {loading ? 'Kaydediliyor...' : 'Kaydı Tamamla'}
        </button>
      </form>
    </div>
  );
};

export default YeniKayit;
