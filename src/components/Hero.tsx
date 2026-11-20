import React from 'react';
import { ArrowRight, Sparkles, Award, HeartHandshake, Flame } from 'lucide-react';

interface HeroProps {
  onQuickOrderClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onQuickOrderClick }) => {
  return (
    <section className="relative pt-24 sm:pt-28 pb-12 sm:pb-16 overflow-hidden">
      {/* Subtle organic background glow */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-br from-[#FED7AA]/30 via-[#FFEDD5]/20 to-transparent blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Text Content */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Status indicator */}
            <div className="inline-flex items-center gap-2.5 text-xs text-[#78716C] bg-[#EFE8DD] px-3.5 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-medium text-[#44403C]">Kedai Buka Hari Ini</span>
              <span className="text-[#A8A29E]" aria-hidden="true">·</span>
              <span>07:00 – 23:00 WIB</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#292524] leading-[1.15]">
              Salam Hangat dari Secangkir Kopi{' '}
              <span className="text-[#C2410C] italic font-normal">Terbaik Nusantara.</span>
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg text-[#57534E] max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Dari lereng sejuk Bener Meriah Aceh hingga tanah vulkanik Kintamani Bali. Dipanggang segar setiap minggu di roastery kami, diseduh sepenuh rasa untuk menemani harimu.
            </p>

            {/* CTA Action Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
              <a
                href="#menu"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#451A03] text-[#FAF7F2] font-semibold text-sm hover:bg-[#2B1002] transition-all shadow-md active:scale-95"
              >
                <span>Buka Menu & Pesan</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <a
                href="#prompt-barista"
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white border border-[#D7C4B7] text-[#44403C] font-semibold text-sm hover:border-[#C2410C] hover:text-[#C2410C] transition-all shadow-xs"
              >
                <Sparkles className="w-4 h-4 text-[#C2410C]" />
                <span>Barista Prompt AI</span>
              </a>

              <a
                href="#origins"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-3.5 text-xs font-semibold text-[#78716C] hover:text-[#C2410C] transition-colors"
              >
                <span>Lihat Peta Kopi Nusantara</span>
                <span aria-hidden="true">→</span>
              </a>
            </div>

            {/* Trust Badges - Unboxed anti-slop */}
            <div className="pt-4 border-t border-[#E7DFD5] flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 text-xs text-[#78716C]">
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#C2410C]" />
                <span className="font-medium text-[#292524]">100% Biji Pilihan Grade 1</span>
              </div>
              <span className="text-[#D6D3D1]" aria-hidden="true">·</span>
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-[#C2410C]" />
                <span className="font-medium text-[#292524]">Fresh Roasted Weekly</span>
              </div>
              <span className="text-[#D6D3D1]" aria-hidden="true">·</span>
              <div className="flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 text-[#C2410C]" />
                <span className="font-medium text-[#292524]">Direct Trade Bersama Petani Lokal</span>
              </div>
            </div>
          </div>

          {/* Right Visual Collage */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Primary Hero Card */}
              <div className="relative rounded-2xl overflow-hidden shadow-xl border-4 border-white bg-white">
                <img
                  src="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=900&q=80"
                  alt="Salam Kopi Espresso & Manual Brew"
                  className="w-full h-72 sm:h-80 object-cover object-center"
                />
                
                {/* Overlay Card Details */}
                <div className="p-4 bg-white/95 backdrop-blur-xs flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-[#C2410C] uppercase tracking-wider block">
                      Signature Favorite
                    </span>
                    <h3 className="font-serif font-bold text-base text-[#292524]">
                      Kopi Susu Gula Aren Salam
                    </h3>
                    <p className="text-xs text-[#78716C]">
                      Espresso gayo + susu gurih + aren organik lebak
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-base font-bold text-[#451A03] block">
                      Rp 24.000
                    </span>
                    <a
                      href="#menu"
                      className="text-xs font-semibold text-[#C2410C] hover:underline"
                    >
                      Pesan Sekarang
                    </a>
                  </div>
                </div>
              </div>

              {/* Floating Accent Card 1: V60 Tasting Notes */}
              <div className="absolute -bottom-6 -left-4 sm:-left-6 bg-white p-3.5 rounded-xl shadow-lg border border-[#E7DFD5] max-w-[210px] hidden sm:block">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-[#C2410C]"></span>
                  <span className="text-[11px] font-bold text-[#292524]">Aceh Gayo Anaerobic</span>
                </div>
                <p className="text-[11px] text-[#78716C] leading-snug">
                  Notes: Winey grape, peach manis, jasmine floral finish.
                </p>
              </div>

              {/* Floating Accent Card 2: Rating */}
              <div className="absolute -top-4 -right-4 sm:-right-6 bg-[#451A03] text-white py-2 px-3.5 rounded-xl shadow-lg border border-[#78350F] flex items-center gap-2.5">
                <span className="text-lg">⭐</span>
                <div>
                  <div className="text-xs font-bold leading-tight">4.9 / 5.0</div>
                  <div className="text-[10px] text-[#FDE68A] leading-tight">1.400+ Pecinta Kopi</div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
