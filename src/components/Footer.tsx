import React from 'react';
import { Coffee, MapPin, Phone, Mail, MessageCircle, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#29170E] text-[#FAF7F2] pt-14 pb-8 border-t border-[#3D2316]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 pb-12 border-b border-[#3D2316]">
          
          {/* Brand Info */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C2410C] text-white flex items-center justify-center">
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <span className="font-serif text-2xl font-bold tracking-tight">
                  Salam Kopi
                </span>
                <span className="text-xs text-[#FDE68A] block font-sans">
                  Kedai Kopi & Specialty Coffee Nusantara
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#D7C4B7] leading-relaxed max-w-sm">
              Menghubungkan petani kopi dataran tinggi Indonesia langsung dengan cangkirmu. Disangrai dengan penuh cinta, disajikan dengan salam hangat kebersamaan.
            </p>

            <div className="flex items-center gap-3 pt-1">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-[#3D2316] hover:bg-[#C2410C] text-white flex items-center justify-center transition-colors"
                aria-label="Instagram Salam Kopi"
              >
                <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                </svg>
              </a>
              <a
                href="https://wa.me/6281288227711"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-[#3D2316] hover:bg-[#16A34A] text-white flex items-center justify-center transition-colors"
                aria-label="WhatsApp Salam Kopi"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
              <a
                href="mailto:halo@salamkopi.id"
                className="w-8 h-8 rounded-lg bg-[#3D2316] hover:bg-[#C2410C] text-white flex items-center justify-center transition-colors"
                aria-label="Email Salam Kopi"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="font-serif text-sm font-bold text-[#FDE68A] uppercase tracking-wider">
              Jelajahi
            </h4>
            <ul className="space-y-2 text-xs text-[#D7C4B7]">
              <li><a href="#menu" className="hover:text-white transition-colors">Menu Minuman</a></li>
              <li><a href="#prompt-barista" className="hover:text-white transition-colors">Barista Prompt AI</a></li>
              <li><a href="#origins" className="hover:text-white transition-colors">Biji Kopi Nusantara</a></li>
              <li><a href="#brew-guide" className="hover:text-white transition-colors">Panduan Seduh Rumahan</a></li>
              <li><a href="#locations" className="hover:text-white transition-colors">Lokasi Kedai</a></li>
            </ul>
          </div>

          {/* Branches */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="font-serif text-sm font-bold text-[#FDE68A] uppercase tracking-wider">
              Kedai Kami
            </h4>
            <ul className="space-y-2 text-xs text-[#D7C4B7]">
              <li>Senopati, Jakarta Selatan</li>
              <li>Dago Atas, Bandung</li>
              <li>Prawirotaman, Yogyakarta</li>
              <li>Batu Bolong, Canggu Bali</li>
            </ul>
          </div>

          {/* Contact / Service */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-serif text-sm font-bold text-[#FDE68A] uppercase tracking-wider">
              Hubungi Barista
            </h4>
            <div className="space-y-2 text-xs text-[#D7C4B7]">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#C2410C] flex-shrink-0 mt-0.5" />
                <span>Pusat Roastery: Jl. Senopati No. 42B, Jakarta Selatan</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#C2410C] flex-shrink-0" />
                <span>+62 812-8822-7711 (Fast Respon WA)</span>
              </div>
              <div className="text-[11px] text-[#A8A29E] pt-2">
                Buka Setiap Hari: 07:00 – 23:00 WIB
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Credits */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#A8A29E] gap-3">
          <p>© {new Date().getFullYear()} Salam Kopi Indonesia. Hak cipta dilindungi undang-undang.</p>
          <div className="flex items-center gap-1.5">
            <span>Dibuat dengan</span>
            <Heart className="w-3.5 h-3.5 text-[#C2410C] fill-[#C2410C]" />
            <span>untuk pecinta kopi Nusantara</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
