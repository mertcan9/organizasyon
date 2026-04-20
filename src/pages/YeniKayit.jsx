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

  const handlePDF = async () => {
    if (!pdfRef.current) return;
    setLoading(true);
    
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
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
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
      const { data: orgData, error: orgError } = await supabase
        .from('organizasyonlar')
        .insert([{
          musteri_id: customerData.id,
          tur: formData.org_icerik || 'Organizasyon',
          tarih_saat: `${formData.org_tarih}T${formData.org_saat || '00:00'}`,
          mekan_adi: formData.org_yer,
          ek_notlar: JSON.stringify({
              gelin_ad_soyad: formData.gelin_ad_soyad,
              gelin_tel: formData.gelin_tel,
              yakin_ad_soyad: formData.yakin_ad_soyad,
              yakin_tel: formData.yakin_tel,
              kina_tarih: formData.kina_tarih,
              kina_yer: formData.kina_yer,
              kina_saat: formData.kina_saat,
              paket_icerigi: formData.paket_icerigi,
              kina_paketi: formData.kina_paketi,
              ek_istekler: formData.ek_notlar, // Bu alan metin olarak kaydediliyor
              kina_ek_istekler: formData.kina_ek_istekler,
              _is_complex: true
            })
        }])
        .select()
        .single();

      if (orgError) throw orgError;

      // 3. Create finance record
      const total = (parseFloat(formData.toplam_ucret) || 0) + (parseFloat(formData.kina_toplam_ucret) || 0);
      const kaparo = (parseFloat(formData.kapora) || 0) + (parseFloat(formData.kina_kapora) || 0);
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
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Yeni Organizasyon Kaydı</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handlePDF}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-700 shadow-lg shadow-red-100"
          >
            <FileText size={18} /> PDF OLARAK AL
          </button>
          <button
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
          <div className="mt-4">
            <label className="block text-xs font-semibold text-gray-500 mb-1">EXTRA İSTEKLER;</label>
            <textarea 
              name="ek_notlar" 
              value={formData.ek_notlar} 
              onChange={handleChange} 
              placeholder="EXTRA İSTEKLER;" 
              className="w-full p-2 border border-gray-300 rounded-lg text-sm h-24 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
            />
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
            <textarea 
              name="kina_ek_istekler" 
              value={formData.kina_ek_istekler} 
              onChange={handleChange} 
              placeholder="EXTRA İSTEKLER;" 
              className="w-full p-2 border border-gray-300 rounded-lg text-sm h-24 mt-4 bg-white text-gray-900 focus:ring-2 focus:ring-pink-500"
            />
          </div>
        </div>

        {/* Finans */}
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
      </form>

      {/* Görünmez PDF Alanı */}
      <div style={{ visibility: 'hidden', position: 'absolute', left: '-9999px', top: 0 }}>
        <div ref={pdfRef} className="p-12 bg-white text-black font-serif" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', background: 'white' }}>
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
                    {formData.ek_notlar}
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

            <div className="mt-10 text-center text-[12px] font-black bg-gray-200 py-2 border-2 border-black">
              ÖDEMELER RANDEVU GÜNÜNDEN 1 HAFTA ÖNCE ALINMAKTADIR
            </div>

            <div className="mt-12 grid grid-cols-2 gap-24 text-[11px]">
              <div className="space-y-6">
                <div className="font-bold text-sm">RANDEVUYU ALAN YETKİLİ</div>
                <div className="border-b border-black pb-1 font-bold">İSİM SOYİSİM :</div>
                <div className="font-bold text-sm">İMZA</div>
              </div>
              <div className="space-y-6">
                <div className="font-bold text-sm">DÜĞÜN SAHİBİ YETKİLİ</div>
                <div className="border-b border-black pb-1 font-bold">İSİM SOYİSİM :</div>
                <div className="font-bold text-sm">İMZA</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YeniKayit;
