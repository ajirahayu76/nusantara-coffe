import React, { useState } from 'react';
import { MapPin, Compass, Coffee, ArrowRight } from 'lucide-react';
import { COFFEE_ORIGINS } from '../data/originsData';
import { CoffeeOrigin } from '../types';

interface OriginsSectionProps {
  onSelectOriginToOrder: (originName: string) => void;
}

export const OriginsSection: React.FC<OriginsSectionProps> = ({
  onSelectOriginToOrder,
}) => {
  const [selectedOrigin, setSelectedOrigin] = useState<CoffeeOrigin>(COFFEE_ORIGINS[0]);

  return (
    <section id="origins" className="py-14 sm:py-20 bg-[#FAF7F2] border-t border-[#EFE8DD] scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-2xl mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-[#C2410C]">
            Kekayaan Tanah Nusantara
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#292524] mt-1">
            Dari Sabang Sampai Merauke
          </h2>
          <p className="text-xs sm:text-sm text-[#57534E] mt-2">
            Indonesia diberkahi tanah vulkanik subur dan iklim tropis yang melahirkan profil rasa kopi paling unik di dunia. Kenali asal biji kopi di cangkirmu.
          </p>
        </div>

        {/* Region Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-8">
          {COFFEE_ORIGINS.map((origin) => (
            <button
              key={origin.id}
              type="button"
              onClick={() => setSelectedOrigin(origin)}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                selectedOrigin.id === origin.id
                  ? 'bg-[#451A03] text-white shadow-sm'
                  : 'bg-white border border-[#E7DFD5] text-[#57534E] hover:border-[#D7C4B7]'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-[#C2410C]" />
              <span>{origin.region.split(',')[0]}</span>
              <span className="text-[10px] opacity-75 font-normal">({origin.island})</span>
            </button>
          ))}
        </div>

        {/* Selected Region Showcase Card */}
        <div className="bg-white rounded-3xl border border-[#E7DFD5] overflow-hidden shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            
            {/* Visual Image */}
            <div className="lg:col-span-5 relative h-64 lg:h-auto min-h-[300px]">
              <img
                src={selectedOrigin.image}
                alt={selectedOrigin.region}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent lg:hidden" />
              <div className="absolute bottom-4 left-4 right-4 text-white lg:hidden">
                <span className="text-[11px] font-bold text-[#FDE68A] uppercase tracking-wider">
                  {selectedOrigin.island}
                </span>
                <h3 className="font-serif text-2xl font-bold">
                  {selectedOrigin.region}
                </h3>
              </div>
            </div>

            {/* Region Details */}
            <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
              
              <div>
                <div className="hidden lg:flex items-center gap-2 text-xs font-bold text-[#C2410C] uppercase tracking-wider mb-1">
                  <Compass className="w-3.5 h-3.5" />
                  <span>Pulau {selectedOrigin.island}</span>
                </div>
                <h3 className="hidden lg:block font-serif text-2xl sm:text-3xl font-bold text-[#292524]">
                  {selectedOrigin.region}
                </h3>

                {/* Farmer Story */}
                <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed mt-3">
                  {selectedOrigin.story}
                </p>

                {/* Partner Farmer */}
                <div className="mt-4 p-3 bg-[#FAF7F2] rounded-xl border border-[#E7DFD5] text-xs text-[#78716C]">
                  <strong className="text-[#292524]">Mitra Petani Kami:</strong> {selectedOrigin.partnerFarmer}
                </div>
              </div>

              {/* Specifications Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-[#EFE8DD] text-xs">
                <div className="p-2.5 rounded-lg bg-[#FAF7F2]">
                  <span className="text-[10px] uppercase font-bold text-[#78716C] block">Ketinggian</span>
                  <span className="font-semibold text-[#292524]">{selectedOrigin.altitude}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#FAF7F2]">
                  <span className="text-[10px] uppercase font-bold text-[#78716C] block">Varietas</span>
                  <span className="font-semibold text-[#292524] truncate block">{selectedOrigin.variety}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#FAF7F2] col-span-2 sm:col-span-1">
                  <span className="text-[10px] uppercase font-bold text-[#78716C] block">Proses Pasca-Panen</span>
                  <span className="font-semibold text-[#292524]">{selectedOrigin.process}</span>
                </div>
              </div>

              {/* Flavor Profile Gauges & Tasting Notes */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#78716C] mb-2.5">
                  Profil Rasa & Tasting Notes:
                </div>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {selectedOrigin.notes.map((note, idx) => (
                    <span
                      key={idx}
                      className="text-xs font-medium text-[#451A03] bg-[#FFEDD5] px-2.5 py-1 rounded-md"
                    >
                      {note}
                    </span>
                  ))}
                </div>

                {/* Gauges */}
                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] font-medium text-[#57534E] mb-1">
                      <span>Keasaman (Acidity)</span>
                      <span>{selectedOrigin.acidity} / 5</span>
                    </div>
                    <div className="w-full h-2 bg-[#EFE8DD] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#C2410C] rounded-full transition-all duration-500"
                        style={{ width: `${(selectedOrigin.acidity / 5) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-medium text-[#57534E] mb-1">
                      <span>Kekentalan Tubuh (Body)</span>
                      <span>{selectedOrigin.body} / 5</span>
                    </div>
                    <div className="w-full h-2 bg-[#EFE8DD] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#451A03] rounded-full transition-all duration-500"
                        style={{ width: `${(selectedOrigin.body / 5) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-medium text-[#57534E] mb-1">
                      <span>Manis Alami (Sweetness)</span>
                      <span>{selectedOrigin.sweetness} / 5</span>
                    </div>
                    <div className="w-full h-2 bg-[#EFE8DD] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#D97706] rounded-full transition-all duration-500"
                        style={{ width: `${(selectedOrigin.sweetness / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-[#EFE8DD] flex items-center justify-between">
                <span className="text-xs text-[#78716C]">
                  Tersedia dalam seduhan V60 & biji sangrai 250g
                </span>
                <button
                  type="button"
                  onClick={() => onSelectOriginToOrder(selectedOrigin.region)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#451A03] hover:bg-[#2A0E02] text-white text-xs font-semibold shadow-xs cursor-pointer active:scale-95 transition-all"
                >
                  <Coffee className="w-3.5 h-3.5 text-[#FDE68A]" />
                  <span>Pesan Kopi {selectedOrigin.island}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
