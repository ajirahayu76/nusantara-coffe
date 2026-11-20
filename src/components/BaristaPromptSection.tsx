import React, { useState } from 'react';
import { Sparkles, ArrowRight, CheckCircle2, RotateCcw } from 'lucide-react';
import { MenuItem } from '../types';
import { MENU_ITEMS } from '../data/menuData';

interface BaristaPromptSectionProps {
  onAddRecommendation: (item: MenuItem, notes: string) => void;
}

interface PromptPreset {
  title: string;
  query: string;
  emoji: string;
}

export const BaristaPromptSection: React.FC<BaristaPromptSectionProps> = ({
  onAddRecommendation,
}) => {
  const [promptInput, setPromptInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<{
    matchedItem: MenuItem;
    headline: string;
    reason: string;
    customizationTip: string;
    suggestedNotes: string;
  } | null>(null);

  const presets: PromptPreset[] = [
    {
      emoji: '💻',
      title: 'Fokus Kerja & WFC',
      query: 'Lagi mau laptopan berjam-jam, butuh kopi yang bikin fokus tapi ramah di lambung dan gak bikin deg-degan',
    },
    {
      emoji: '☀️',
      title: 'Cuaca Panas Terik',
      query: 'Siang ini panas banget, pengen minuman yang dingin, segar, asam buah, dan langsung nyegerin tenggorokan',
    },
    {
      emoji: '🍯',
      title: 'Manis Gurih Teman Santai',
      query: 'Mau ngobrol santai sama teman, pengen kopi susu creamy yang ada manis gula aren karamel gurih',
    },
    {
      emoji: '🍃',
      title: 'Rendah Kalori & Nabati',
      query: 'Lagi diet sehat, pengen plant-based oat milk atau kopi hitam single origin tanpa gula',
    },
    {
      emoji: '🌙',
      title: 'Sore Santai Rendah Kafein',
      query: 'Sudah menjelang malam, mau yang hangat menenangkan dan gak bikin susah tidur',
    },
  ];

  const handleAnalyze = (textToAnalyze?: string) => {
    const text = (textToAnalyze || promptInput).toLowerCase();
    if (!text.trim()) return;

    setIsAnalyzing(true);
    setResult(null);

    setTimeout(() => {
      let matchedItem: MenuItem;
      let headline = '';
      let reason = '';
      let customizationTip = '';
      let suggestedNotes = '';

      if (text.includes('panas') || text.includes('segar') || text.includes('buah') || text.includes('lemon') || text.includes('haus')) {
        matchedItem = MENU_ITEMS.find((m) => m.id === 'cascara-lemon-fizz') || MENU_ITEMS[0];
        headline = 'Cascara Lemon Fizz Sparkling 🍋';
        reason = 'Dibuat dari seduhan kulit ceri kopi organik dengan perasan lemon dan sparkling soda dingin. Asam buah alaminya sangat menyegarkan dan ringan kafein.';
        customizationTip = 'Disajikan ekstra dingin dengan irisan lemon segar.';
        suggestedNotes = 'Bikin ekstra dingin ya kak';
      } else if (text.includes('fokus') || text.includes('kerja') || text.includes('wfc') || text.includes('lambung') || text.includes('ngantuk') || text.includes('hitam')) {
        matchedItem = MENU_ITEMS.find((m) => m.id === 'manual-gayo-wine') || MENU_ITEMS[5];
        headline = 'Aceh Gayo Anaerobic Winey (V60) 🍇';
        reason = 'Proses fermentasi anaerobik menghasilkan rasa manis buah anggur alami dengan keasaman lembut yang aman di lambung saat kerja panjang.';
        customizationTip = 'Rasio seduh 1:15 air suhu 92°C untuk kejernihan aroma maksimal.';
        suggestedNotes = 'Seduh V60 hangat rasio 1:15';
      } else if (text.includes('diet') || text.includes('oat') || text.includes('nabati') || text.includes('sehat') || text.includes('plant')) {
        matchedItem = MENU_ITEMS.find((m) => m.id === 'salted-caramel-oat-latte') || MENU_ITEMS[3];
        headline = 'Salted Caramel Oat Latte 🌾';
        reason = '100% susu gandum oat barista yang gurih alami bebas susu hewani (lactose-free), berpadu espresso Bali Kintamani dan sea salt murni.';
        customizationTip = 'Pilih tingkat gula 25% atau stevia untuk hasil rendah kalori seimbang.';
        suggestedNotes = 'Less sugar 25%, oat milk barista';
      } else if (text.includes('malam') || text.includes('tidur') || text.includes('hangat') || text.includes('santai') || text.includes('cokelat')) {
        matchedItem = MENU_ITEMS.find((m) => m.id === 'dark-chocolate-java') || MENU_ITEMS[14];
        headline = 'Dark Chocolate Java 70% 🍫';
        reason = 'Cokelat kakao murni Jawa Timur dengan kadar teobromin yang menenangkan pikiran setelah seharian beraktivitas, bebas kafein.';
        customizationTip = 'Sajikan hangat dengan busa susu lembut bertabur cokelat bubuk.';
        suggestedNotes = 'Sajikan hangat ya kak';
      } else {
        // Default classic signature
        matchedItem = MENU_ITEMS.find((m) => m.id === 'kopi-susu-salam') || MENU_ITEMS[0];
        headline = 'Kopi Susu Gula Aren Salam ☕';
        reason = 'Kombinasi espresso signature kami dengan gula aren asli Lebak Banten. Rasa manis karamel alaminya memberikan dorongan semangat seketika.';
        customizationTip = 'Pesan dengan Less Ice dan Normal Aren untuk rasa yang paling gurih kental.';
        suggestedNotes = 'Less ice, gula aren pas';
      }

      setResult({
        matchedItem,
        headline,
        reason,
        customizationTip,
        suggestedNotes,
      });
      setIsAnalyzing(false);
    }, 600);
  };

  const handlePresetClick = (query: string) => {
    setPromptInput(query);
    handleAnalyze(query);
  };

  return (
    <section id="prompt-barista" className="py-14 sm:py-20 bg-[#F5EFE6] relative overflow-hidden scroll-mt-20">
      {/* Decorative background coffee bean icon */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Section title */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFEDD5] text-[#C2410C] text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Barista Prompt Matcher</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#292524]">
            Ceritakan Harimu, Barista Kami Racikkan
          </h2>
          <p className="text-xs sm:text-sm text-[#57534E] mt-2">
            Bingung mau pesan apa? Ketik suasana hati, kebutuhan kafein, atau aktivitasmu. Algoritma rasa Salam Kopi akan menemukan racikan paling pas.
          </p>
        </div>

        {/* Prompt Input Box Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-[#E7DFD5] p-5 sm:p-7 max-w-3xl mx-auto">
          
          {/* Quick preset tags */}
          <div className="mb-4">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#78716C] mb-2">
              Pilih Cepat Berdasarkan Suasana Hati:
            </label>
            <div className="flex flex-wrap gap-2">
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handlePresetClick(p.query)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E7DFD5] bg-[#FAF7F2] hover:bg-[#FFEDD5] hover:border-[#C2410C] text-xs font-medium text-[#44403C] transition-all cursor-pointer"
                >
                  <span>{p.emoji}</span>
                  <span>{p.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Text Area & Submit */}
          <div className="relative">
            <textarea
              rows={3}
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="Tuliskan prompt kamu di sini... (contoh: 'Lagi butuh kopi nendang yang gak bikin enek buat ngerjain skripsi sore ini' atau 'mau yang manis dingin segar berasa buah')"
              className="w-full p-4 pr-12 rounded-xl border border-[#D7C4B7] bg-[#FAF7F2] text-xs sm:text-sm text-[#292524] placeholder:text-[#A8A29E] focus:outline-hidden focus:border-[#C2410C] focus:bg-white transition-all resize-none"
            />
            
            <div className="flex items-center justify-between mt-3 pt-2">
              <span className="text-[11px] text-[#A8A29E]">
                Tekan tombol racik untuk mendapatkan rekomendasi menu
              </span>
              
              <button
                type="button"
                disabled={!promptInput.trim() || isAnalyzing}
                onClick={() => handleAnalyze()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#451A03] hover:bg-[#2A0E02] disabled:opacity-50 text-white text-xs sm:text-sm font-semibold transition-all shadow-sm cursor-pointer active:scale-95"
              >
                {isAnalyzing ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Meracik Rasa...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#FDE68A]" />
                    <span>Racik Menu Saya</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Analysis Result Card */}
          {result && (
            <div className="mt-6 pt-6 border-t border-[#E7DFD5] bg-[#FAF7F2] rounded-xl p-5 border">
              <div className="flex items-center gap-2 text-xs font-bold text-[#C2410C] mb-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Rekomendasi Barista Salam Kopi:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                {/* Photo */}
                <div className="sm:col-span-4 h-36 rounded-xl overflow-hidden bg-white shadow-xs">
                  <img
                    src={result.matchedItem.image}
                    alt={result.matchedItem.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="sm:col-span-8 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-serif text-lg font-bold text-[#292524]">
                        {result.headline}
                      </h3>
                      <p className="text-xs text-[#57534E] mt-0.5">
                        {result.reason}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="font-mono text-base font-bold text-[#451A03]">
                        Rp {result.matchedItem.price.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white border border-[#E7DFD5] text-[11px] text-[#78716C] space-y-1">
                    <div>
                      <strong className="text-[#44403C]">Saran Barista:</strong> {result.customizationTip}
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setPromptInput('');
                        setResult(null);
                      }}
                      className="text-xs text-[#78716C] hover:text-[#292524] inline-flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Coba Prompt Lain
                    </button>

                    <button
                      type="button"
                      onClick={() => onAddRecommendation(result.matchedItem, result.suggestedNotes)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95"
                    >
                      <span>Pesan Racikan Ini</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </section>
  );
};
