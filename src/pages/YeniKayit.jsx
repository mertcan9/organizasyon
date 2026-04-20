import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Tag, CreditCard, FileText, Check } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const YeniKayit = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const pdfRef = useRef();

  const [formData, setFormData] = useState({
    sozlesme_turu: 'standart', // 'standart', 'randevu', 'dugun', 'kina'
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
    // Randevu İçeriği Şablonu
    randevu_icerigi: [
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
    ],
    ikramliklar: [
      { ad: 'ÇAY', secili: false },
      { ad: 'KURU PASTA', secili: false },
      { ad: 'MEYVE SUYU', secili: false },
      { ad: 'SU', secili: false },
    ],
    kina_tarih: '',
    kina_yer: '',
    kina_saat: '',
    paket_icerigi: [
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
    ],
    kina_paketi: [
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
    ],
    ek_istekler: '',
    kina_ek_istekler: '',
    ek_notlar: '',
    toplam_ucret: '',
    kapora: '',
    kalan: '',
    kina_toplam_ucret: '',
    kina_kapora: '',
    kina_kalan: ''
  });

  useEffect(() => {
    try {
      const queryParams = new URLSearchParams(location.search);
      const dateParam = queryParams.get('date');
      if (dateParam) {
        setFormData(prev => ({ ...prev, org_tarih: dateParam }));
      }
    } catch (error) {
      console.error('Date parse error:', error);
    }
  }, [location.search]);

  const handlePDF = async (e) => {
    if (e) e.preventDefault();
    if (!pdfRef.current) return;
    setLoading(true);
    
    try {
      const element = pdfRef.current;
      
      // Capturing directly from the DOM (element is fixed and hidden from view)
      const canvas = await html2canvas(element, {
        scale: 3, // Higher scale for better quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 794, // Standard A4 width at 96 DPI
        windowWidth: 794,
        allowTaint: true,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById('pdf-content');
          if (clonedElement) {
            clonedElement.style.position = 'static';
            clonedElement.style.left = '0';
            clonedElement.style.top = '0';
            clonedElement.style.visibility = 'visible';
          }
        }
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = 210;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Sozlesme_${formData.damat_ad_soyad || 'Kayit'}.pdf`);
      
    } catch (error) {
      console.error('PDF Error:', error);
      alert('PDF oluşturulamadı.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      // 1. Create customer (use damat_ad_soyad as primary)
      const { data: customerData, error: customerError } = await supabase
        .from('musteriler')
        .insert([{ 
          ad_soyad: formData.damat_ad_soyad, 
          telefon: formData.damat_tel 
        }])
        .select()
        .single();

      if (customerError) throw customerError;

      // 2. Create organization
      const isKinaOnly = formData.sozlesme_turu === 'kina';
      const orgDate = isKinaOnly ? formData.kina_tarih : formData.org_tarih;
      const orgTime = isKinaOnly ? formData.kina_saat : formData.org_saat;
      const orgPlace = isKinaOnly ? formData.kina_yer : formData.org_yer;
      const orgType = isKinaOnly ? 'Kına' : (formData.sozlesme_turu === 'dugun' ? 'Düğün' : (formData.org_icerik || 'Organizasyon'));

      const { data: orgData, error: orgError } = await supabase
        .from('organizasyonlar')
        .insert([{
          musteri_id: customerData.id,
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
              ek_istekler: formData.ek_notlar, 
              kina_ek_istekler: formData.kina_ek_istekler,
              _is_complex: true
            })
        }])
        .select()
        .single();

      if (orgError) throw orgError;

      // 3. Create finance record
      const isStandart = formData.sozlesme_turu === 'standart';
      
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
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Calculate remaining amounts
      if (name === 'toplam_ucret' || name === 'kapora') {
        const t = parseFloat(newData.toplam_ucret) || 0;
        const k = parseFloat(newData.kapora) || 0;
        newData.kalan = (t - k).toString();
      }
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

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-2 w-full md:w-auto">
          <h2 className="text-xl font-bold text-gray-800">Yeni Organizasyon Kaydı</h2>
          <div className="flex bg-gray-100 p-1.5 rounded-xl overflow-x-auto no-scrollbar w-full md:w-fit whitespace-nowrap gap-1">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, sozlesme_turu: 'standart' }))}
              className={`px-4 py-2 text-[11px] md:text-xs font-bold rounded-lg transition-all flex-shrink-0 ${formData.sozlesme_turu === 'standart' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              STANDART (DÜĞÜN/KINA)
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, sozlesme_turu: 'dugun' }))}
              className={`px-4 py-2 text-[11px] md:text-xs font-bold rounded-lg transition-all flex-shrink-0 ${formData.sozlesme_turu === 'dugun' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              DÜĞÜN SÖZLEŞMESİ
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, sozlesme_turu: 'kina' }))}
              className={`px-4 py-2 text-[11px] md:text-xs font-bold rounded-lg transition-all flex-shrink-0 ${formData.sozlesme_turu === 'kina' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              KINA SÖZLEŞMESİ
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, sozlesme_turu: 'randevu' }))}
              className={`px-4 py-2 text-[11px] md:text-xs font-bold rounded-lg transition-all flex-shrink-0 ${formData.sozlesme_turu === 'randevu' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              RANDEVU İÇERİĞİ
            </button>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={handlePDF}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-700 shadow-lg shadow-red-100"
          >
            <FileText size={18} /> PDF OLARAK AL
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-100 disabled:opacity-50"
          >
            {loading ? 'Kaydediliyor...' : <span className="flex items-center gap-2"><Check size={18} /> Kaydet ve Onayla</span>}
          </button>
        </div>
      </div>

      <form className="space-y-6">
        {/* Kişi Bilgileri */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="font-bold text-indigo-600 flex items-center gap-2"><User size={18} /> DAMAT</div>
            <input name="damat_ad_soyad" value={formData.damat_ad_soyad} onChange={handleChange} placeholder="Ad Soyad" className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
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
                  <input name="org_icerik" value={formData.org_icerik} onChange={handleChange} placeholder="İçerik (Düğün, Nişan vb.)" className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500" />
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
                        <input 
                          type="checkbox" 
                          checked={item.secili} 
                          onChange={() => toggleCheck('paket_icerigi', index)}
                          className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                        />
                        {item.ad}
                      </label>
                      {item.sayi !== undefined && (
                        <input 
                          placeholder="sayı" 
                          value={item.sayi} 
                          onChange={(e) => handleSayiChange('paket_icerigi', index, e.target.value)}
                          className="w-16 p-1 border rounded text-xs text-center"
                        />
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
                          <input 
                            type="checkbox" 
                            checked={item.secili} 
                            onChange={() => toggleCheck('kina_paketi', index)}
                            className="w-4 h-4 text-pink-600 rounded border-gray-300 focus:ring-pink-500"
                          />
                          {item.ad}
                        </label>
                        {item.sayi !== undefined && (
                          <input 
                            placeholder="sayı" 
                            value={item.sayi} 
                            onChange={(e) => handleSayiChange('kina_paketi', index, e.target.value)}
                            className="w-16 p-1 border border-gray-300 rounded text-xs text-center bg-white text-gray-900 focus:ring-2 focus:ring-pink-500"
                          />
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
                  name="ek_notlar" 
                  value={formData.ek_notlar} 
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
                  name={formData.sozlesme_turu === 'kina' ? 'kina_ek_istekler' : 'ek_notlar'} 
                  value={formData.sozlesme_turu === 'kina' ? formData.kina_ek_istekler : formData.ek_notlar} 
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
      <div style={{ position: 'fixed', left: '-20000px', top: 0, width: '210mm', zIndex: -9999 }}>
        <div ref={pdfRef} id="pdf-content" style={{ width: '210mm', padding: '15mm', background: 'white', color: 'black', boxSizing: 'border-box', fontFamily: "'Times New Roman', serif" }}>
          
          {/* HEADER */}
          <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '5px double black', paddingBottom: '10px' }}>
            <h1 style={{ fontSize: '48px', fontWeight: '900', margin: '0', letterSpacing: '8px', textTransform: 'uppercase' }}>TAÇ ORGANİZASYON</h1>
            <p style={{ fontSize: '18px', margin: '5px 0 0', fontStyle: 'italic', fontWeight: 'bold' }}>Profesyonel Organizasyon Hizmetleri</p>
          </div>

          {/* CUSTOMER INFO TABLE */}
          <div style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
            {[
              { label: 'DAMADIN ADI SOYADI:', val: formData.damat_ad_soyad, tel: formData.damat_tel },
              { label: 'GELİNİN ADI SOYADI:', val: formData.gelin_ad_soyad, tel: formData.gelin_tel },
              { label: 'YAKINININ ADI SOYADI:', val: formData.yakin_ad_soyad, tel: formData.yakin_tel }
            ].map((row, i) => (
              <div key={i} style={{ display: 'table', width: '100%', borderBottom: '1px solid black', padding: '8px 0', minHeight: '30px' }}>
                <div style={{ display: 'table-cell', width: '160px', fontWeight: 'bold', fontSize: '14px' }}>{row.label}</div>
                <div style={{ display: 'table-cell', fontWeight: 'bold', fontSize: '14px' }}>{row.val || '.....................................'}</div>
                <div style={{ display: 'table-cell', width: '40px', fontWeight: 'bold', fontSize: '14px', textAlign: 'right' }}>TEL:</div>
                <div style={{ display: 'table-cell', width: '140px', fontWeight: 'bold', fontSize: '14px', textAlign: 'right' }}>{row.tel || '.....................'}</div>
              </div>
            ))}
          </div>

          {/* DATE & TIME TABLE */}
          <div style={{ display: 'table', width: '100%', marginBottom: '10px' }}>
            <div style={{ display: 'table-row' }}>
              <div style={{ display: 'table-cell', width: '48%', borderBottom: '1px solid black', padding: '8px 0' }}>
                <span style={{ fontWeight: 'bold', fontSize: '14px', marginRight: '10px' }}>TARİH:</span>
                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{formatDate(formData.sozlesme_turu === 'kina' ? formData.kina_tarih : formData.org_tarih)}</span>
              </div>
              <div style={{ display: 'table-cell', width: '4%' }}></div>
              <div style={{ display: 'table-cell', width: '48%', borderBottom: '1px solid black', padding: '8px 0' }}>
                <span style={{ fontWeight: 'bold', fontSize: '14px', marginRight: '10px' }}>SAAT:</span>
                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{formatTime(formData.sozlesme_turu === 'kina' ? formData.kina_saat : formData.org_saat)}</span>
              </div>
            </div>
          </div>

          {/* VENUE ROW */}
          <div style={{ display: 'table', width: '100%', borderBottom: '1px solid black', padding: '8px 0', marginBottom: '20px' }}>
            <div style={{ display: 'table-cell', width: '130px', fontWeight: 'bold', fontSize: '14px' }}>ETKİNLİK YERİ:</div>
            <div style={{ display: 'table-cell', fontWeight: 'bold', fontSize: '14px' }}>
              {(formData.sozlesme_turu === 'kina' ? formData.kina_yer : formData.org_yer) || '..........................................................................................'}
            </div>
          </div>

          {/* TITLE */}
          <div style={{ textAlign: 'center', fontSize: '26px', fontWeight: 'bold', margin: '20px 0', borderTop: '2px solid black', borderBottom: '2px solid black', padding: '10px 0', background: '#f9f9f9', textTransform: 'uppercase' }}>
            {formData.sozlesme_turu === 'randevu' ? 'RANDEVU İÇERİĞİ' : 
             formData.sozlesme_turu === 'dugun' ? 'DÜĞÜN PAKET İÇERİĞİ' : 
             formData.sozlesme_turu === 'kina' ? 'KINA PAKET İÇERİĞİ' : 'ORGANİZASYON İÇERİĞİ'}
          </div>

          {/* ITEMS GRID */}
          <div style={{ overflow: 'hidden', margin: '15px 0' }}>
            {(formData.sozlesme_turu === 'randevu' ? formData.randevu_icerigi : 
              formData.sozlesme_turu === 'dugun' ? formData.paket_icerigi : 
              formData.sozlesme_turu === 'kina' ? formData.kina_paketi : 
              [...formData.paket_icerigi, ...formData.kina_paketi]).map((item, idx) => (
              <div key={idx} style={{ width: '48%', float: 'left', height: '30px', display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                <div style={{ width: '20px', height: '20px', border: '2px solid black', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '10px', fontWeight: 'bold', fontSize: '18px', fontFamily: 'Arial' }}>
                  {item.secili ? '✓' : ''}
                </div>
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{item.ad}</span>
                {item.sayi && <span style={{ marginLeft: '5px', fontSize: '12px' }}>({item.sayi})</span>}
              </div>
            ))}
            <div style={{ clear: 'both' }}></div>
          </div>

          {/* REFRESHMENTS */}
          <div style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold', margin: '15px 0', borderTop: '1px solid black', borderBottom: '1px solid black', padding: '5px 0', background: '#f9f9f9' }}>İKRAMLIKLAR</div>
          <div style={{ overflow: 'hidden', marginBottom: '15px' }}>
            {formData.ikramliklar.map((item, idx) => (
              <div key={idx} style={{ width: '25%', float: 'left', height: '30px', display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '18px', height: '18px', border: '2px solid black', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '8px', fontWeight: 'bold', fontSize: '16px', fontFamily: 'Arial' }}>
                  {item.secili ? '✓' : ''}
                </div>
                <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{item.ad}</span>
              </div>
            ))}
            <div style={{ clear: 'both' }}></div>
          </div>

          {/* EXTRA REQUESTS */}
          <div style={{ marginTop: '10px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '14px' }}>EKSTRA İSTEKLER:</div>
            <div style={{ border: '2px solid black', padding: '10px', minHeight: '100px', fontSize: '14px', fontWeight: 'bold', lineHeight: '1.4' }}>
              {formData.sozlesme_turu === 'kina' ? formData.kina_ek_istekler : formData.ek_notlar}
            </div>
          </div>

          {/* FOOTER RULES */}
          <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: 'bold', margin: '30px 0', padding: '15px', border: '2px solid black', background: '#f0f0f0', lineHeight: '1.5' }}>
            SÖZLEŞMEYE DAHİL OLAN İÇERİKLERİ DİKKATLİCE OKUYUN. KURALLAR KESİN VE NETTİR.<br/>
            MEKAN KAPASİTESİ 100 KİŞİLİK OLUP KAPASİTENİN DIŞINA ÇIKILMASI DURUMUNDA EK ÜCRET ALINIR.<br/>
            ÖDEMELER RANDEVU GÜNÜNDEN 1 HAFTA ÖNCE ALINMAKTADIR.
          </div>

          {/* FINANCE TABLE */}
          <div style={{ width: '45%', float: 'right', marginTop: '20px' }}>
            {[
              { label: 'TOPLAM ÜCRET:', val: (formData.sozlesme_turu === 'kina' ? formData.kina_toplam_ucret : formData.toplam_ucret) || '0' },
              { label: 'KAPORA:', val: (formData.sozlesme_turu === 'kina' ? formData.kina_kapora : formData.kapora) || '0' },
              { label: 'KALAN:', val: (formData.sozlesme_turu === 'kina' ? formData.kina_kalan : formData.kalan) || '0', isLast: true }
            ].map((row, i) => (
              <div key={i} style={{ display: 'table', width: '100%', borderBottom: row.isLast ? '4px solid black' : '2px solid black', padding: '8px 0' }}>
                <div style={{ display: 'table-cell', fontWeight: 'bold', fontSize: '16px' }}>{row.label}</div>
                <div style={{ display: 'table-cell', textAlign: 'right', fontWeight: 'bold', fontSize: row.isLast ? '22px' : '16px' }}>{row.val} ₺</div>
              </div>
            ))}
          </div>
          <div style={{ clear: 'both' }}></div>

          {/* SIGNATURE AREA */}
          <div style={{ marginTop: '50px', display: 'table', width: '100%' }}>
            <div style={{ display: 'table-row' }}>
              <div style={{ display: 'table-cell', width: '45%', borderTop: '2px solid black', paddingTop: '10px', fontWeight: 'bold', minHeight: '120px' }}>
                SÖZLEŞMEYİ ALAN YETKİLİ<br/><br/>
                İSİM SOYİSİM:<br/><br/>
                İMZA
              </div>
              <div style={{ display: 'table-cell', width: '10%' }}></div>
              <div style={{ display: 'table-cell', width: '45%', borderTop: '2px solid black', paddingTop: '10px', fontWeight: 'bold', minHeight: '120px' }}>
                MÜŞTERİ YETKİLİ<br/><br/>
                İSİM SOYİSİM:<br/><br/>
                İMZA
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default YeniKayit;
