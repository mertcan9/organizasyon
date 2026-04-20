import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, User, Phone, Calendar as CalendarIcon, MapPin, Tag, CreditCard, ArrowLeft } from 'lucide-react';

const Duzenle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    ad_soyad: '',
    telefon: '',
    tur: 'Düğün',
    tarih_saat: '',
    mekan_adi: '',
    ek_notlar: '',
    toplam_tutar: '',
    alinan_kaparo: '',
    musteri_id: '',
    finans_id: ''
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from('organizasyonlar')
        .select(`
          *,
          musteriler (*),
          finans (*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      setFormData({
        ad_soyad: data.musteriler?.ad_soyad || '',
        telefon: data.musteriler?.telefon || '',
        tur: data.tur || 'Düğün',
        tarih_saat: data.tarih_saat ? data.tarih_saat.slice(0, 16) : '',
        mekan_adi: data.mekan_adi || '',
        ek_notlar: data.ek_notlar || '',
        toplam_tutar: data.finans?.[0]?.toplam_tutar || '',
        alinan_kaparo: data.finans?.[0]?.alinan_kaparo || '',
        musteri_id: data.musteri_id,
        finans_id: data.finans?.[0]?.id
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Hata: Kayıt bulunamadı.');
      navigate('/liste');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // 1. Update customer
      const { error: customerError } = await supabase
        .from('musteriler')
        .update({ ad_soyad: formData.ad_soyad, telefon: formData.telefon })
        .eq('id', formData.musteri_id);

      if (customerError) throw customerError;

      // 2. Update organization
      const { error: orgError } = await supabase
        .from('organizasyonlar')
        .update({
          tur: formData.tur,
          tarih_saat: formData.tarih_saat,
          mekan_adi: formData.mekan_adi,
          ek_notlar: formData.ek_notlar
        })
        .eq('id', id);

      if (orgError) throw orgError;

      // 3. Update finance
      const total = parseFloat(formData.toplam_tutar) || 0;
      const kaparo = parseFloat(formData.alinan_kaparo) || 0;
      const odeme_durumu = kaparo >= total ? 'Ödendi' : (kaparo > 0 ? 'Kısmi' : 'Ödenmedi');

      const { error: financeError } = await supabase
        .from('finans')
        .update({
          toplam_tutar: total,
          alinan_kaparo: kaparo,
          odeme_durumu: odeme_durumu
        })
        .eq('id', formData.finans_id);

      if (financeError) throw financeError;

      alert('Kayıt başarıyla güncellendi!');
      navigate('/liste');
    } catch (error) {
      console.error('Error updating data:', error);
      alert('Hata oluştu: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (loading) return <div className="text-center py-10">Yükleniyor...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h2 className="text-xl font-bold text-gray-800">Kaydı Düzenle</h2>
      </div>

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
                className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <button
          disabled={saving}
          type="submit"
          className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 disabled:opacity-50"
        >
          <Save size={20} />
          {saving ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet'}
        </button>
      </form>
    </div>
  );
};

export default Duzenle;
