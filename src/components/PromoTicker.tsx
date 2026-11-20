import React from 'react';
import { Tag } from 'lucide-react';

export const PromoTicker: React.FC = () => {
  const promos = [
    '☕ Bawa Tumbler Sendiri Diskon Rp 3.000',
    '🥐 Bundling Sarapan: Kopi Susu Aren + Croissant Mentega cuma Rp 38.000 (07:00 - 11:00)',
    '🛵 Gratis Ongkir radius 3 KM pemesanan WhatsApp minimal Rp 75.000',
    '🌱 100% Single Origin Fair-Trade dari Petani Bener Meriah & Kintamani',
  ];

  return (
    <div className="bg-[#451A03] text-[#FAF7F2] py-2 px-4 text-xs font-medium overflow-hidden border-b border-[#2E1002]">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2 text-[#FDE68A] flex-shrink-0">
          <Tag className="w-3.5 h-3.5" />
          <span className="font-semibold uppercase tracking-wider text-[11px]">Promo Kedai</span>
        </div>
        
        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-0.5 text-xs text-[#FAF7F2]/90">
          {promos.map((promo, idx) => (
            <div key={idx} className="flex items-center gap-2 whitespace-nowrap">
              <span>{promo}</span>
              {idx < promos.length - 1 && (
                <span className="text-[#C2410C] font-bold" aria-hidden="true">·</span>
              )}
            </div>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-1.5 text-[11px] text-[#E7DFD5]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Roaster Aktif Hari Ini</span>
        </div>
      </div>
    </div>
  );
};
