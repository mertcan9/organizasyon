import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, useParams } from 'react-router-dom';
import { User, Tag, CreditCard, ArrowLeft, FileText, Check } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const Duzenle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const pdfRef = useRef();

  const [formData, setFormData] = useState({
    sozlesme_turu: 'standart', // 'standart' veya 'randevu'
    damat_ad_soyad: '',
    damat_tel: '',
    gelin_ad_soyad: '',
    gelin_tel: '',
    yakin_ad_soyad: '',
    yakin_tel: '',
    org_icerik: '',
    org_tarih: '',
    org_yer: '',
    org_saat: '',
    kina_tarih: '',
    kina_yer: '',
    kina_saat: '',
    randevu_icerigi: [],
    ikramliklar: [],
    paket_icerigi: [],
    kina_paketi: [],
    ek_istekler: '',
    kina_ek_istekler: '',
    toplam_ucret: '',
    kapora: '',
    kalan: '',
    kina_toplam_ucret: '',
    kina_kapora: '',
    kina_kalan: '',
    musteri_id: '',
    finans_id: ''
  });

  const default_randevu_icerigi = [
    { ad: '100 KİŞİ KAPASİTELİ MEKAN', secili: false },
    { ad: 'GİRİŞ YOLU', secili: false },
    { ad: 'FOTOĞRAF KÖŞESİ', secili: false },
    { ad: 'KAHVE KÖŞESİ', secili: false },
    { ad: 'YÜZÜK VE KAHVE TEPSİSİ', secili: false },
    { ad: 'İNCİLİ KURDELA', secili: false },
    { ad: 'TAKI ŞERİDİ VE İĞNELİK', secili: false },
    { ad: 'PERSONEL', secili: false },
    { ad: 'SERVİS HİZMETİ', secili: false },
    { ad: 'ORGANİZASYON VE YÖNETİM', secili: false },
  ];

  const default_ikramliklar = [
    { ad: 'ÇAY', secili: false },
    { ad: 'KURU PASTA', secili: false },
    { ad: 'MEYVE SUYU', secili: false },
    { ad: 'SU', secili: false },
  ];

  const default_paket_icerigi = [
    { ad: 'KONSEPT', secili: false },
    { ad: 'GİRİŞ YOLU VE HALISI', secili: false },
    { ad: 'MÜZİSYEN', secili: false },
    { ad: 'SES SİSTEMİ', secili: false },
    { ad: 'GİRİŞ PANOSU', secili: false },
    { ad: 'İSİMLİ AYNA', secili: false },
    { ad: 'PLATFORM', secili: false },
    { ad: 'IŞIKLANDIRMA', secili: false },
    { ad: 'MASA', secili: false, sayi: '' },
    { ad: 'SANDALYE', secili: false, sayi: '' },
    { ad: 'VOLKAN SİSTEMİ', secili: false },
    { ad: 'KONFETİ', secili: false },
    { ad: 'PERSONEL', secili: false },
    { ad: 'ORGANİZASYON YÖNETİM', secili: false },
    { ad: 'BULUT MAKİNASI', secili: false },
    { ad: 'PASTA', secili: false, sayi: '' },
    { ad: 'İÇECEK', secili: false, sayi: '' },
    { ad: 'KURU PASTA', secili: false, sayi: '' },
    { ad: 'KURU YEMİŞ', secili: false, sayi: '' },
  ];

  const default_kina_paketi = [
    { ad: 'KONSEPT', secili: false },
    { ad: 'GİRİŞ YOLU VE HALISI', secili: false },
    { ad: 'MÜZİSYEN', secili: false },
    { ad: 'SES SİSTEMİ', secili: false },
    { ad: 'GİRİŞ PANOSU', secili: false },
    { ad: 'İSİMLİ AYNA', secili: false },
    { ad: 'PLATFORM', secili: false },
    { ad: 'IŞIKLANDIRMA', secili: false },
    { ad: 'MASA', secili: false, sayi: '' },
    { ad: 'SANDALYE', secili: false, sayi: '' },
    { ad: 'VOLKAN SİSTEMİ VE MEŞALE', secili: false },
    { ad: 'KONFETİ', secili: false },
    { ad: 'PERSONEL', secili: false },
    { ad: 'ORGANİZASYON YÖNETİM', secili: false },
    { ad: 'BULUT MAKİNASI', secili: false },
    { ad: 'İÇECEK', secili: false, sayi: '' },
    { ad: 'KURU PASTA', secili: false, sayi: '' },
    { ad: 'KURU YEMİŞ', secili: false, sayi: '' },
    { ad: 'KINA MALZEMELERİ', secili: false, detay: 'KURU/YAŞ KINA, SEPET/TEPSİ, GELİN DAMAT AL, GELİN İSİMLİ DEF, GELİN YELPAZESİ, DAVUL/TESTİ, NEDİME MUM/BİLEKLİK/ZİL' },
  ];

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

      let complexData = {};
      let cleanNotes = '';
      try {
        if (data.ek_notlar && (data.ek_notlar.startsWith('{') || data.ek_notlar.startsWith('['))) {
          complexData = JSON.parse(data.ek_notlar);
          cleanNotes = complexData.ek_istekler || '';
        } else {
          cleanNotes = data.ek_notlar || '';
        }
      } catch (e) {
        cleanNotes = data.ek_notlar || '';
      }

      const org_tarih = data.tarih_saat ? data.tarih_saat.split('T')[0] : '';
      const org_saat = data.tarih_saat ? data.tarih_saat.split('T')[1]?.slice(0, 5) : '';

      setFormData({
        sozlesme_turu: complexData.sozlesme_turu || 'standart',
        damat_ad_soyad: data.musteriler?.ad_soyad || '',
        damat_tel: data.musteriler?.telefon || '',
        gelin_ad_soyad: complexData.gelin_ad_soyad || '',
        gelin_tel: complexData.gelin_tel || '',
        yakin_ad_soyad: complexData.yakin_ad_soyad || '',
        yakin_tel: complexData.yakin_tel || '',
        org_icerik: data.tur || 'Düğün',
        org_tarih: org_tarih,
        org_yer: data.mekan_adi || '',
        org_saat: org_saat,
        kina_tarih: complexData.kina_tarih || '',
        kina_yer: complexData.kina_yer || '',
        kina_saat: complexData.kina_saat || '',
        paket_icerigi: complexData.paket_icerigi || default_paket_icerigi,
        kina_paketi: complexData.kina_paketi || default_kina_paketi,
        randevu_icerigi: complexData.randevu_icerigi || default_randevu_icerigi,
        ikramliklar: complexData.ikramliklar || default_ikramliklar,
        ek_istekler: cleanNotes,
        kina_ek_istekler: complexData.kina_ek_istekler || '',
        toplam_ucret: data.finans?.[0]?.toplam_tutar || '',
        kapora: data.finans?.[0]?.alinan_kaparo || '',
        kalan: ((data.finans?.[0]?.toplam_tutar || 0) - (data.finans?.[0]?.alinan_kaparo || 0)).toString(),
        kina_toplam_ucret: complexData.kina_toplam_ucret || '',
        kina_kapora: complexData.kina_kapora || '',
        kina_kalan: complexData.kina_kalan || '',
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

  const handlePDF = async (e) => {
    if (e) e.preventDefault();
    if (!pdfRef.current) return;
    setSaving(true);
    
    try {
      const element = pdfRef.current;
      const originalStyle = element.style.cssText;
      
      // Geçici olarak görünür yap
      element.style.cssText = `
        display: block !important; 
        position: fixed !important; 
        left: 0 !important; 
        top: 0 !important; 
        width: 210mm !important; 
        z-index: 9999 !important; 
        background: white !important;
        visibility: visible !important;
      `;

      await new Promise(resolve => setTimeout(resolve, 800));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      pdf.save(`Sozlesme_${formData.damat_ad_soyad || 'Kayit'}.pdf`);
      
      element.style.cssText = originalStyle;
    } catch (error) {
      console.error('PDF Error:', error);
      alert('PDF oluşturulamadı.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (saving) return;
    setSaving(true);

    try {
      const { error: customerError } = await supabase
        .from('musteriler')
        .update({ ad_soyad: formData.damat_ad_soyad, telefon: formData.damat_tel })
        .eq('id', formData.musteri_id);

      if (customerError) throw customerError;

      const isKinaOnly = formData.sozlesme_turu === 'kina';
      const orgDate = isKinaOnly ? formData.kina_tarih : formData.org_tarih;
      const orgTime = isKinaOnly ? formData.kina_saat : formData.org_saat;
      const orgPlace = isKinaOnly ? formData.kina_yer : formData.org_yer;
      const orgType = isKinaOnly ? 'Kına' : (formData.sozlesme_turu === 'dugun' ? 'Düğün' : (formData.org_icerik || 'Organizasyon'));

      const { error: orgError } = await supabase
        .from('organizasyonlar')
        .update({
          tur: orgType,
          tarih_saat: `${orgDate}T${orgTime || '00:00'}`,
          mekan_adi: orgPlace,
          ek_notlar: JSON.stringify({
            sozlesme_turu: formData.sozlesme_turu,
            gelin_ad_soyad: formData.gelin_ad_soyad,
            gelin_tel: formData.gelin_tel,
            yakin_ad_soyad: formData.yakin_ad_soyad,
            yakin_tel: formData.yakin_tel,
            kina_tarih: formData.kina_tarih,
            kina_yer: formData.kina_yer,
            kina_saat: formData.kina_saat,
            paket_icerigi: formData.paket_icerigi,
            kina_paketi: formData.kina_paketi,
            randevu_icerigi: formData.randevu_icerigi,
            ikramliklar: formData.ikramliklar,
            ek_istekler: formData.ek_istekler,
            kina_ek_istekler: formData.kina_ek_istekler,
            kina_toplam_ucret: formData.kina_toplam_ucret,
            kina_kapora: formData.kina_kapora,
            kina_kalan: formData.kina_kalan,
            _is_complex: true
          })
        })
        .eq('id', id);

      if (orgError) throw orgError;

      const isStandart = formData.sozlesme_turu === 'standart';
      const isKinaOnly = formData.sozlesme_turu === 'kina';
      
      let total = 0;
      let kaparo = 0;
      
      if (isStandart) {
        total = (parseFloat(formData.toplam_ucret) || 0) + (parseFloat(formData.kina_toplam_ucret) || 0);
        kaparo = (parseFloat(formData.kapora) || 0) + (parseFloat(formData.kina_kapora) || 0);
      } else if (isKinaOnly) {
        total = parseFloat(formData.kina_toplam_ucret) || 0;
        kaparo = parseFloat(formData.kina_kapora) || 0;
      } else {
        total = parseFloat(formData.toplam_ucret) || 0;
        kaparo = parseFloat(formData.kapora) || 0;
      }

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
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Organizasyon kalan hesaplama
      if (name === 'toplam_ucret' || name === 'kapora') {
        const t = parseFloat(newData.toplam_ucret) || 0;
        const k = parseFloat(newData.kapora) || 0;
        newData.kalan = (t - k).toString();
      }
      
      // Kına kalan hesaplama
      if (name === 'kina_toplam_ucret' || name === 'kina_kapora') {
        const t = parseFloat(newData.kina_toplam_ucret) || 0;
        const k = parseFloat(newData.kina_kapora) || 0;
        newData.kina_kalan = (t - k).toString();
      }
      
      return newData;
    });
  };

  const toggleCheck = (type, index) => {
    setFormData(prev => {
      const list = [...prev[type]];
      list[index].secili = !list[index].secili;
      return { ...prev, [type]: list };
    });
  };

  const handleSayiChange = (type, index, value) => {
    setFormData(prev => {
      const list = [...prev[type]];
      list[index].sayi = value;
      return { ...prev, [type]: list };
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '.... / .... / 20....';
    const [y, m, d] = dateStr.split('-');
    return `${d} / ${m} / ${y}`;
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '............';
    return timeStr;
  };

  if (loading) return <div className="text-center py-10 font-bold text-indigo-600">Yükleniyor...</div>;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-2 w-full md:w-auto">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <h2 className="text-xl font-bold text-gray-800">Kaydı Düzenle</h2>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto no-scrollbar w-full md:w-fit whitespace-nowrap">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, sozlesme_turu: 'standart' }))}
              className={`px-3 py-1.5 text-[10px] md:text-xs font-bold rounded-md transition-all flex-shrink-0 ${formData.sozlesme_turu === 'standart' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              STANDART (DÜĞÜN/KINA)
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, sozlesme_turu: 'dugun' }))}
              className={`px-3 py-1.5 text-[10px] md:text-xs font-bold rounded-md transition-all flex-shrink-0 ${formData.sozlesme_turu === 'dugun' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              DÜĞÜN SÖZLEŞMESİ
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, sozlesme_turu: 'kina' }))}
              className={`px-3 py-1.5 text-[10px] md:text-xs font-bold rounded-md transition-all flex-shrink-0 ${formData.sozlesme_turu === 'kina' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              KINA SÖZLEŞMESİ
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, sozlesme_turu: 'randevu' }))}
              className={`px-3 py-1.5 text-[10px] md:text-xs font-bold rounded-md transition-all flex-shrink-0 ${formData.sozlesme_turu === 'randevu' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              RANDEVU İÇERİĞİ
            </button>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto justify-end">
          <button type="button" onClick={handlePDF} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-700 shadow-lg shadow-red-100">
            <FileText size={18} /> PDF OLARAK AL
          </button>
          <button type="button" onClick={handleSubmit} disabled={saving} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-100 disabled:opacity-50">
            {saving ? 'Kaydediliyor...' : <span className="flex items-center gap-2"><Check size={18} /> Güncelle</span>}
          </button>
        </div>
      </div>

      <form className="space-y-6">
        {/* Kişi Bilgileri */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="font-bold text-indigo-600 flex items-center gap-2"><User size={18} /> DAMAT</div>
            <input name="damat_ad_soyad" value={formData.damat_ad_soyad} onChange={handleChange} placeholder="Ad Soyad" className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500" />
            <input name="damat_tel" value={formData.damat_tel} onChange={handleChange} placeholder="Telefon" className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="space-y-4">
            <div className="font-bold text-pink-600 flex items-center gap-2"><User size={18} /> GELİN</div>
            <input name="gelin_ad_soyad" value={formData.gelin_ad_soyad} onChange={handleChange} placeholder="Ad Soyad" className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500" />
            <input name="gelin_tel" value={formData.gelin_tel} onChange={handleChange} placeholder="Telefon" className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="space-y-4">
            <div className="font-bold text-gray-600 flex items-center gap-2"><User size={18} /> YAKINI</div>
            <input name="yakin_ad_soyad" value={formData.yakin_ad_soyad} onChange={handleChange} placeholder="Ad Soyad" className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500" />
            <input name="yakin_tel" value={formData.yakin_tel} onChange={handleChange} placeholder="Telefon" className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        {/* Dinamik Form İçeriği */}
        {formData.sozlesme_turu === 'standart' ? (
          <>
            {/* Organizasyon & Kına Detayları */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                <div className="font-bold text-indigo-600 flex items-center gap-2"><Tag size={18} /> ORGANİZASYON</div>
                <div className="grid grid-cols-1 gap-3">
                  <input name="org_icerik" value={formData.org_icerik} onChange={handleChange} placeholder="İçerik" className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500" />
                  <input name="org_tarih" type="date" value={formData.org_tarih} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500" />
                  <input name="org_yer" value={formData.org_yer} onChange={handleChange} placeholder="Yer" className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500" />
                  <input name="org_saat" type="time" value={formData.org_saat} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                <div className="font-bold text-pink-600 flex items-center gap-2"><Tag size={18} /> KINA</div>
                <div className="grid grid-cols-1 gap-3">
                  <input name="kina_tarih" type="date" value={formData.kina_tarih} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500" />
                  <input name="kina_yer" value={formData.kina_yer} onChange={handleChange} placeholder="Kına Yeri" className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500" />
                  <input name="kina_saat" type="time" value={formData.kina_saat} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
            </div>

            {/* Paket İçerikleri */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                <div className="font-bold text-indigo-600 text-center border-b pb-2 text-lg">PAKET İÇERİĞİ</div>
                <div className="space-y-1">
                  {formData.paket_icerigi.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-1 hover:bg-gray-50 rounded">
                      <label className="flex items-center gap-2 cursor-pointer flex-1 text-sm font-medium">
                        <input type="checkbox" checked={item.secili} onChange={() => toggleCheck('paket_icerigi', index)} className="w-4 h-4 text-indigo-600 rounded border-gray-300" />
                        {item.ad}
                      </label>
                      {item.sayi !== undefined && (
                        <input placeholder="sayı" value={item.sayi} onChange={(e) => handleSayiChange('paket_icerigi', index, e.target.value)} className="w-16 p-1 border border-gray-300 rounded text-xs text-center bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                <div className="font-bold text-pink-600 text-center border-b pb-2 text-lg">KINA PAKETİ</div>
                <div className="space-y-1">
                  {formData.kina_paketi.map((item, index) => (
                    <div key={index} className="flex flex-col p-1 hover:bg-gray-50 rounded">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer flex-1 text-sm font-medium">
                          <input type="checkbox" checked={item.secili} onChange={() => toggleCheck('kina_paketi', index)} className="w-4 h-4 text-pink-600 rounded border-gray-300" />
                          {item.ad}
                        </label>
                        {item.sayi !== undefined && (
                          <input placeholder="sayı" value={item.sayi} onChange={(e) => handleSayiChange('kina_paketi', index, e.target.value)} className="w-16 p-1 border border-gray-300 rounded text-xs text-center bg-white text-gray-900 focus:ring-2 focus:ring-pink-500" />
                        )}
                      </div>
                      {item.detay && <div className="ml-6 text-[10px] text-gray-500 leading-tight">{item.detay}</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="font-bold text-sm text-gray-600 mb-3 uppercase tracking-wider">İKRAMLIKLAR</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.ikramliklar.map((item, index) => (
                  <label key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={item.secili} 
                      onChange={() => toggleCheck('ikramliklar', index)}
                      className="w-5 h-5 text-indigo-600 rounded border-gray-300"
                    />
                    <span className="text-sm font-bold text-gray-700">{item.ad}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <label className="block text-xs font-semibold text-gray-500 mb-1">DÜĞÜN EXTRA İSTEKLER;</label>
                <textarea 
                  name="ek_istekler" 
                  value={formData.ek_istekler} 
                  onChange={handleChange} 
                  placeholder="EXTRA İSTEKLER;" 
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm h-24 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <label className="block text-xs font-semibold text-gray-500 mb-1">KINA EXTRA İSTEKLER;</label>
                <textarea 
                  name="kina_ek_istekler" 
                  value={formData.kina_ek_istekler} 
                  onChange={handleChange} 
                  placeholder="EXTRA İSTEKLER;" 
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm h-24 bg-white text-gray-900 focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>

            {/* Finans (Standart) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="font-bold text-indigo-600 flex items-center gap-2"><CreditCard size={18} /> ÖDEME (ORGANİZASYON)</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400">TOPLAM ÜCRET</label>
                    <input name="toplam_ucret" type="number" value={formData.toplam_ucret} onChange={handleChange} className="w-full p-2 border-b border-gray-300 bg-white text-gray-900 font-bold text-lg focus:outline-none focus:border-indigo-600" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400">KAPORA</label>
                    <input name="kapora" type="number" value={formData.kapora} onChange={handleChange} className="w-full p-2 border-b border-gray-300 bg-white text-gray-900 font-bold text-lg focus:outline-none focus:border-indigo-600" />
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <div className="text-xs text-gray-500">KALAN TUTAR</div>
                  <div className="text-2xl font-black text-indigo-600">{formData.kalan || '0'} ₺</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="font-bold text-pink-600 flex items-center gap-2"><CreditCard size={18} /> ÖDEME (KINA)</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400">TOPLAM ÜCRET</label>
                    <input name="kina_toplam_ucret" type="number" value={formData.kina_toplam_ucret} onChange={handleChange} className="w-full p-2 border-b border-gray-300 bg-white text-gray-900 font-bold text-lg focus:outline-none focus:border-pink-600" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400">KAPORA</label>
                    <input name="kina_kapora" type="number" value={formData.kina_kapora} onChange={handleChange} className="w-full p-2 border-b border-gray-300 bg-white text-gray-900 font-bold text-lg focus:outline-none focus:border-pink-600" />
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <div className="text-xs text-gray-500">KALAN TUTAR</div>
                  <div className="text-2xl font-black text-pink-600">{formData.kina_kalan || '0'} ₺</div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Tekil Sözleşme UI (Düğün, Kına veya Randevu) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
              <div className="font-bold text-indigo-600 text-center border-b pb-2 text-xl tracking-widest uppercase">
                {formData.sozlesme_turu === 'randevu' ? 'RANDEVU İÇERİĞİ' : 
                 formData.sozlesme_turu === 'dugun' ? 'DÜĞÜN PAKET İÇERİĞİ' : 'KINA PAKET İÇERİĞİ'}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <label className="text-xs font-bold text-gray-400 uppercase">
                      {formData.sozlesme_turu === 'randevu' ? 'RANDEVU TARİHİ' : 'ETKİNLİK TARİHİ'}
                    </label>
                    <input 
                      name={formData.sozlesme_turu === 'kina' ? 'kina_tarih' : 'org_tarih'} 
                      type="date" 
                      value={formData.sozlesme_turu === 'kina' ? formData.kina_tarih : formData.org_tarih} 
                      onChange={handleChange} 
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500" 
                    />
                    <label className="text-xs font-bold text-gray-400 uppercase">
                      {formData.sozlesme_turu === 'randevu' ? 'RANDEVU SAATİ' : 'ETKİNLİK SAATİ'}
                    </label>
                    <input 
                      name={formData.sozlesme_turu === 'kina' ? 'kina_saat' : 'org_saat'} 
                      type="time" 
                      value={formData.sozlesme_turu === 'kina' ? formData.kina_saat : formData.org_saat} 
                      onChange={handleChange} 
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500" 
                    />
                    {formData.sozlesme_turu !== 'randevu' && (
                      <>
                        <label className="text-xs font-bold text-gray-400 uppercase">ETKİNLİK YERİ</label>
                        <input 
                          name={formData.sozlesme_turu === 'kina' ? 'kina_yer' : 'org_yer'} 
                          value={formData.sozlesme_turu === 'kina' ? formData.kina_yer : formData.org_yer} 
                          onChange={handleChange} 
                          placeholder="Etkinlik Yeri" 
                          className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500" 
                        />
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="font-bold text-sm text-gray-600 mb-2 uppercase tracking-tighter">PAKET DETAYLARI</div>
                  <div className="grid grid-cols-1 gap-1">
                    {(formData.sozlesme_turu === 'randevu' ? formData.randevu_icerigi : 
                      formData.sozlesme_turu === 'dugun' ? formData.paket_icerigi : formData.kina_paketi).map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-1 hover:bg-gray-50 rounded">
                        <label className="flex items-center gap-3 cursor-pointer flex-1">
                          <input 
                            type="checkbox" 
                            checked={item.secili} 
                            onChange={() => toggleCheck(
                              formData.sozlesme_turu === 'randevu' ? 'randevu_icerigi' : 
                              formData.sozlesme_turu === 'dugun' ? 'paket_icerigi' : 'kina_paketi', 
                              index
                            )}
                            className="w-5 h-5 text-indigo-600 rounded border-gray-300"
                          />
                          <span className="text-sm font-semibold text-gray-700">{item.ad}</span>
                        </label>
                        {item.sayi !== undefined && (
                          <input 
                            placeholder="sayı" 
                            value={item.sayi} 
                            onChange={(e) => handleSayiChange(
                              formData.sozlesme_turu === 'dugun' ? 'paket_icerigi' : 'kina_paketi', 
                              index, 
                              e.target.value
                            )}
                            className="w-16 p-1 border rounded text-xs text-center"
                          />
                        )}
                        {item.detay && <div className="ml-8 text-[10px] text-gray-400">{item.detay}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="font-bold text-sm text-gray-600 mb-3 uppercase tracking-wider">İKRAMLIKLAR</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.ikramliklar.map((item, index) => (
                    <label key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={item.secili} 
                        onChange={() => toggleCheck('ikramliklar', index)}
                        className="w-5 h-5 text-indigo-600 rounded border-gray-300"
                      />
                      <span className="text-sm font-bold text-gray-700">{item.ad}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="border-t pt-6">
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">EXTRA İSTEKLER</label>
                <textarea 
                  name={formData.sozlesme_turu === 'kina' ? 'kina_ek_istekler' : 'ek_istekler'} 
                  value={formData.sozlesme_turu === 'kina' ? formData.kina_ek_istekler : formData.ek_istekler} 
                  onChange={handleChange} 
                  placeholder="Özel istekler ve notlar..." 
                  className="w-full p-3 border border-gray-300 rounded-xl text-sm h-32 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Finans (Tekil) */}
              <div className="border-t pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase">TOPLAM ÜCRET</label>
                  <input 
                    name={formData.sozlesme_turu === 'kina' ? 'kina_toplam_ucret' : 'toplam_ucret'} 
                    type="number" 
                    value={formData.sozlesme_turu === 'kina' ? formData.kina_toplam_ucret : formData.toplam_ucret} 
                    onChange={handleChange} 
                    className="w-full p-2 border-b-2 border-gray-200 bg-white text-gray-900 font-bold text-xl focus:outline-none focus:border-indigo-600" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase">KAPORA</label>
                  <input 
                    name={formData.sozlesme_turu === 'kina' ? 'kina_kapora' : 'kapora'} 
                    type="number" 
                    value={formData.sozlesme_turu === 'kina' ? formData.kina_kapora : formData.kapora} 
                    onChange={handleChange} 
                    className="w-full p-2 border-b-2 border-gray-200 bg-white text-gray-900 font-bold text-xl focus:outline-none focus:border-indigo-600" 
                  />
                </div>
                <div className="bg-indigo-600 p-3 rounded-xl text-white">
                  <div className="text-[10px] font-bold opacity-80 uppercase">KALAN TUTAR</div>
                  <div className="text-2xl font-black">
                    {formData.sozlesme_turu === 'kina' ? (formData.kina_kalan || '0') : (formData.kalan || '0')} ₺
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </form>

      {/* Görünmez PDF Alanı */}
      <div style={{ visibility: 'hidden', position: 'absolute', left: '-9999px', top: 0 }}>
        <div ref={pdfRef} className="p-12 bg-white text-black font-serif" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', background: 'white' }}>
          {formData.sozlesme_turu === 'standart' ? (
            <div className="pdf-container" style={{ background: 'white', color: 'black' }}>
              {/* Logo ve Başlık */}
              <div className="text-center mb-10">
                <div className="text-4xl font-black tracking-[0.2em] mb-1">TAC</div>
                <div className="text-xl italic font-serif">Organizasyon</div>
              </div>

              {/* Üst Bilgiler */}
              <div className="space-y-3 mb-8 text-[13px]">
                <div className="flex border-b border-black pb-1">
                  <span className="w-56 font-bold">DAMADIN ADI SOYADI :</span>
                  <span className="flex-1 uppercase font-semibold">{formData.damat_ad_soyad || '..................................................................'}</span>
                  <span className="w-10 font-bold">TEL</span>
                  <span className="w-48 font-semibold text-right">{formData.damat_tel || '...........................................'}</span>
                </div>
                <div className="flex border-b border-black pb-1">
                  <span className="w-56 font-bold">GELİNİN ADI SOYADI :</span>
                  <span className="flex-1 uppercase font-semibold">{formData.gelin_ad_soyad || '..................................................................'}</span>
                  <span className="w-10 font-bold">TEL</span>
                  <span className="w-48 font-semibold text-right">{formData.gelin_tel || '...........................................'}</span>
                </div>
                <div className="flex border-b border-black pb-1">
                  <span className="w-56 font-bold">YAKINININ ADI SOYADI :</span>
                  <span className="flex-1 uppercase font-semibold">{formData.yakin_ad_soyad || '..................................................................'}</span>
                  <span className="w-10 font-bold">TEL</span>
                  <span className="w-48 font-semibold text-right">{formData.yakin_tel || '...........................................'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-12 text-[12px] mb-8">
                <div className="space-y-2">
                  <div className="flex border-b border-black pb-1"><span className="w-48 font-bold">ORGANİZASYON İÇERİĞİ :</span><span className="font-semibold">{formData.org_icerik || '........................'}</span></div>
                  <div className="flex border-b border-black pb-1"><span className="w-48 font-bold">ORGANİZASYON TARİHİ :</span><span className="font-semibold">{formatDate(formData.org_tarih)}</span></div>
                  <div className="flex border-b border-black pb-1"><span className="w-48 font-bold">ORGANİZASYON YERİ :</span><span className="font-semibold">{formData.org_yer || '........................'}</span></div>
                  <div className="flex border-b border-black pb-1"><span className="w-48 font-bold">ORGANİZASYON SAATİ :</span><span className="font-semibold">{formatTime(formData.org_saat)}</span></div>
                </div>
                <div className="space-y-2">
                  <div className="flex border-b border-black pb-1"><span className="w-40 font-bold">KINA TARİHİ :</span><span className="font-semibold">{formatDate(formData.kina_tarih)}</span></div>
                  <div className="flex border-b border-black pb-1"><span className="w-40 font-bold">KINA YERİ :</span><span className="font-semibold">{formData.kina_yer || '........................'}</span></div>
                  <div className="flex border-b border-black pb-1"><span className="w-40 font-bold">KINA SAATİ :</span><span className="font-semibold">{formatTime(formData.kina_saat)}</span></div>
                </div>
              </div>

              {/* Dikey Çizgi Ayırıcı */}
              <div className="grid grid-cols-2 gap-12 relative">
                <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-black -translate-x-1/2"></div>
                
                {/* Paket İçeriği Sol */}
                <div className="pr-6">
                  <div className="text-center font-bold text-xl mb-6 tracking-widest">PAKET İÇERİĞİ</div>
                  <div className="space-y-1.5">
                    {formData.paket_icerigi.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-[11px]">
                        <div className={`w-4 h-4 border-2 border-black flex items-center justify-center rounded-sm ${item.secili ? 'bg-black' : ''}`}>
                          {item.secili && <Check size={10} className="text-white stroke-[3px]" />}
                        </div>
                        <span className="flex-1 font-bold uppercase">{item.ad}</span>
                        {item.sayi !== undefined && <span className="text-[10px] font-semibold">( sayısı: {item.sayi || '..........'} )</span>}
                      </div>
                    ))}
                  </div>
                  <div className="mt-6">
                    <div className="font-bold text-[11px] mb-1 uppercase">EXTRA İSTEKLER;</div>
                    <div className="min-h-[60px] border-b-2 border-black border-dotted font-semibold text-[11px] py-1 whitespace-pre-wrap">
                      {formData.ek_istekler}
                    </div>
                  </div>
                  <div className="mt-8 space-y-2 text-[12px]">
                    <div className="flex border-b border-black pb-1"><span className="w-32 font-bold">TOPLAM ÜCRET:</span><span className="font-bold text-right flex-1">{formData.toplam_ucret || '................'} ₺</span></div>
                    <div className="flex border-b border-black pb-1"><span className="w-32 font-bold">KAPORA:</span><span className="font-bold text-right flex-1">{formData.kapora || '................'} ₺</span></div>
                    <div className="flex border-b border-black pb-1"><span className="w-32 font-bold">KALAN:</span><span className="font-bold text-right flex-1">{formData.kalan || '................'} ₺</span></div>
                  </div>
                </div>

                {/* Kına Paketi Sağ */}
                <div className="pl-6">
                  <div className="text-center font-bold text-xl mb-6 tracking-widest">KINA PAKETİ</div>
                  <div className="space-y-1.5">
                    {formData.kina_paketi.map((item, idx) => (
                      <div key={idx} className="flex flex-col">
                        <div className="flex items-center gap-3 text-[11px]">
                          <div className={`w-4 h-4 border-2 border-black flex items-center justify-center rounded-sm ${item.secili ? 'bg-black' : ''}`}>
                            {item.secili && <Check size={10} className="text-white stroke-[3px]" />}
                          </div>
                          <span className="flex-1 font-bold uppercase">{item.ad}</span>
                          {item.sayi !== undefined && <span className="text-[10px] font-semibold">( sayısı: {item.sayi || '..........'} )</span>}
                        </div>
                        {item.detay && (
                          <div className="ml-7 text-[9px] font-medium leading-tight mt-0.5">
                            {item.detay.split(', ').map((d, i) => (
                              <span key={i} className="mr-2">. {d}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-6">
                    <div className="font-bold text-[11px] mb-1 uppercase">EXTRA İSTEKLER;</div>
                    <div className="min-h-[60px] border-b-2 border-black border-dotted font-semibold text-[11px] py-1 whitespace-pre-wrap">
                      {formData.kina_ek_istekler}
                    </div>
                  </div>
                  <div className="mt-8 space-y-2 text-[12px]">
                    <div className="flex border-b border-black pb-1"><span className="w-32 font-bold">TOPLAM ÜCRET:</span><span className="font-bold text-right flex-1">{formData.kina_toplam_ucret || '................'} ₺</span></div>
                    <div className="flex border-b border-black pb-1"><span className="w-32 font-bold">KAPORA:</span><span className="font-bold text-right flex-1">{formData.kina_kapora || '................'} ₺</span></div>
                    <div className="flex border-b border-black pb-1"><span className="w-32 font-bold">KALAN:</span><span className="font-bold text-right flex-1">{formData.kina_kalan || '................'} ₺</span></div>
                  </div>
                </div>
              </div>

              {/* İkramlıklar (Standart) */}
              <div className="mt-6 border-t border-black pt-4">
                <div className="font-bold text-[11px] mb-2 uppercase">İKRAMLIKLAR;</div>
                <div className="flex gap-8 ml-2">
                  {formData.ikramliklar.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[11px]">
                      <span className="font-bold">{item.ad}</span>
                      <div className="w-4 h-4 border border-black flex items-center justify-center">
                        {item.secili && <Check size={12} className="stroke-[3px]" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-10 text-center text-[12px] font-black bg-gray-200 py-2 border-2 border-black">
                ÖDEMELER RANDEVU GÜNÜNDEN 1 HAFTA ÖNCE ALINMAKTADIR
              </div>

              <div className="mt-12 grid grid-cols-2 gap-24 text-[11px]">
                <div className="space-y-6">
                  <div className="font-bold text-sm">SÖZLEŞMEYİ ALAN YETKİLİ</div>
                  <div className="border-b border-black pb-1 font-bold">İSİM SOYİSİM :</div>
                  <div className="font-bold text-sm">İMZA</div>
                </div>
                <div className="space-y-6">
                  <div className="font-bold text-sm">MÜŞTERİ YETKİLİ</div>
                  <div className="border-b border-black pb-1 font-bold">İSİM SOYİSİM :</div>
                  <div className="font-bold text-sm">İMZA</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="pdf-container" style={{ background: 'white', color: 'black' }}>
              {/* Tekil Sözleşme Şablonu (Randevu, Düğün veya Kına) */}
              <div className="space-y-3 mb-6 text-[13px]">
                <div className="flex border-b border-black pb-1">
                  <span className="w-56 font-bold">DAMADIN ADI SOYADI :</span>
                  <span className="flex-1 uppercase font-semibold">{formData.damat_ad_soyad || '..................................................................'}</span>
                  <span className="w-10 font-bold">TEL</span>
                  <span className="w-48 font-semibold text-right">{formData.damat_tel || '...........................................'}</span>
                </div>
                <div className="flex border-b border-black pb-1">
                  <span className="w-56 font-bold">GELİNİN ADI SOYADI :</span>
                  <span className="flex-1 uppercase font-semibold">{formData.gelin_ad_soyad || '..................................................................'}</span>
                  <span className="w-10 font-bold">TEL</span>
                  <span className="w-48 font-semibold text-right">{formData.gelin_tel || '...........................................'}</span>
                </div>
                <div className="flex border-b border-black pb-1">
                  <span className="w-56 font-bold">YAKINININ ADI SOYADI :</span>
                  <span className="flex-1 uppercase font-semibold">{formData.yakin_ad_soyad || '..................................................................'}</span>
                  <span className="w-10 font-bold">TEL</span>
                  <span className="w-48 font-semibold text-right">{formData.yakin_tel || '...........................................'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-12 text-[12px] mb-6">
                <div className="flex border-b border-black pb-1">
                  <span className="w-48 font-bold uppercase">
                    {formData.sozlesme_turu === 'randevu' ? 'RANDEVU TARİHİ :' : 'ETKİNLİK TARİHİ :'}
                  </span>
                  <span className="font-semibold">
                    {formatDate(formData.sozlesme_turu === 'kina' ? formData.kina_tarih : formData.org_tarih)}
                  </span>
                </div>
                <div className="flex border-b border-black pb-1">
                  <span className="w-48 font-bold uppercase">
                    {formData.sozlesme_turu === 'randevu' ? 'RANDEVU SAATİ :' : 'ETKİNLİK SAATİ :'}
                  </span>
                  <span className="font-semibold">
                    {formatTime(formData.sozlesme_turu === 'kina' ? formData.kina_saat : formData.org_saat)}
                  </span>
                </div>
              </div>

              <div className="text-center font-bold text-4xl mb-8 tracking-[0.3em] uppercase">
                {formData.sozlesme_turu === 'randevu' ? 'RANDEVU İÇERİĞİ' : 
                 formData.sozlesme_turu === 'dugun' ? 'DÜĞÜN PAKET İÇERİĞİ' : 'KINA PAKET İÇERİĞİ'}
              </div>

              <div className="space-y-3 mb-10 ml-4">
                {(formData.sozlesme_turu === 'randevu' ? formData.randevu_icerigi : 
                  formData.sozlesme_turu === 'dugun' ? formData.paket_icerigi : formData.kina_paketi).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 text-[16px]">
                    <div className="w-6 h-6 border-2 border-black flex items-center justify-center">
                      {item.secili && <Check size={20} className="stroke-[4px]" />}
                    </div>
                    <span className="font-bold uppercase tracking-wide">{item.ad}</span>
                    {item.sayi !== undefined && <span className="text-[12px] font-semibold italic">( {item.sayi || '....'} adet )</span>}
                  </div>
                ))}
              </div>

              <div className="mb-8">
                <div className="font-bold text-[14px] mb-4 uppercase">İKRAMLIKLAR;</div>
                <div className="flex gap-12 ml-4">
                  {formData.ikramliklar.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-[14px]">
                      <span className="font-bold">{item.ad}</span>
                      <div className="w-6 h-6 border-2 border-black flex items-center justify-center">
                        {item.secili && <Check size={18} className="stroke-[4px]" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-10">
                <div className="font-bold text-[14px] mb-2 uppercase">EXTRA İSTEKLER :</div>
                <div className="min-h-[100px] border-b-2 border-black border-dotted font-semibold text-[14px] py-1 whitespace-pre-wrap leading-relaxed">
                  {formData.sozlesme_turu === 'kina' ? formData.kina_ek_istekler : formData.ek_istekler}
                </div>
              </div>

              <div className="text-center space-y-2 mb-10">
                <p className="text-[12px] font-bold">SÖZLEŞMEYE DAHİL OLAN İÇERİKLERİ DİKKATLİCE OKUYUN.</p>
                <p className="text-[12px] font-bold">PAKET İÇERİĞİ KURALLARI KESİN VE NETTİR.</p>
                <p className="text-[12px] font-bold">MEKAN KAPASİTESİ 100 KİŞİLİK OLUP KAPASİTENİN DIŞINA ÇIKILMASI</p>
                <p className="text-[12px] font-bold">DURUMUNDA EXTRA MEKAN VE HİZMET ÜCRETİ TALEP EDİLECEKTİR</p>
                <p className="text-[12px] font-bold">ÖDEMELER RANDEVU GÜNÜNDEN 1 HAFTA ÖNCE ALINMAKTADIR</p>
              </div>

              <div className="grid grid-cols-1 gap-3 text-[16px] w-1/2 mb-12">
                <div className="flex border-b-2 border-black pb-1"><span className="w-48 font-bold">TOPLAM ÜCRET :</span><span className="font-black text-right flex-1">{ (formData.sozlesme_turu === 'kina' ? formData.kina_toplam_ucret : formData.toplam_ucret) || '................'} ₺</span></div>
                <div className="flex border-b-2 border-black pb-1"><span className="w-48 font-bold">KAPORA :</span><span className="font-black text-right flex-1">{ (formData.sozlesme_turu === 'kina' ? formData.kina_kapora : formData.kapora) || '................'} ₺</span></div>
                <div className="flex border-b-2 border-black pb-1"><span className="w-48 font-bold">KALAN :</span><span className="font-black text-right flex-1">{ (formData.sozlesme_turu === 'kina' ? formData.kina_kalan : formData.kalan) || '................'} ₺</span></div>
              </div>

              <div className="grid grid-cols-2 gap-24 text-[13px]">
                <div className="space-y-8">
                  <div className="font-bold text-base uppercase">SÖZLEŞMEYİ ALAN YETKİLİ</div>
                  <div className="border-b-2 border-black pb-1 font-bold">İSİM SOYİSİM :</div>
                  <div className="font-bold text-base">İMZA</div>
                </div>
                <div className="space-y-8">
                  <div className="font-bold text-base uppercase">MÜŞTERİ YETKİLİ</div>
                  <div className="border-b-2 border-black pb-1 font-bold">İSİM SOYİSİM :</div>
                  <div className="font-bold text-base">İMZA</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Duzenle;
