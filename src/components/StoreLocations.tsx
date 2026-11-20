import React, { useState } from 'react';
import { MapPin, Clock, Wifi, Phone, ExternalLink, Check } from 'lucide-react';
import { STORES } from '../data/storesData';

export const StoreLocations: React.FC = () => {
  const [selectedStoreId, setSelectedStoreId] = useState(STORES[0].id);
  const currentStore = STORES.find((s) => s.id === selectedStoreId) || STORES[0];

  return (
    <section id="locations" className="py-14 sm:py-20 bg-[#FAF7F2] border-t border-[#EFE8DD] scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-[#C2410C]">
            Kunjungi Kedai Kami
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#292524] mt-1">
            Rumah Bagi Pecinta Kopi
          </h2>
          <p className="text-xs sm:text-sm text-[#57534E] mt-2">
            Nikmati aroma sangrai biji kopi, barista yang ramah, Wi-Fi super kencang, dan tempat duduk yang nyaman untuk bekerja maupun bersua bersama teman.
          </p>
        </div>

        {/* Store Tabs */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-8">
          {STORES.map((store) => (
            <button
              key={store.id}
              type="button"
              onClick={() => setSelectedStoreId(store.id)}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                selectedStoreId === store.id
                  ? 'bg-[#451A03] text-white shadow-sm'
                  : 'bg-white border border-[#E7DFD5] text-[#57534E] hover:border-[#D7C4B7]'
              }`}
            >
              {store.city} · {store.name.split('Salam Kopi')[1]?.trim() || store.city}
            </button>
          ))}
        </div>

        {/* Store Card Details */}
        <div className="bg-white rounded-3xl border border-[#E7DFD5] p-6 sm:p-9 shadow-sm max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between gap-6 pb-6 border-b border-[#EFE8DD]">
            <div>
              <span className="text-xs font-bold text-[#C2410C] uppercase tracking-wider block">
                {currentStore.city}
              </span>
              <h3 className="font-serif text-2xl font-bold text-[#292524] mt-1">
                {currentStore.name}
              </h3>
              <p className="text-xs sm:text-sm text-[#57534E] mt-2 flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#C2410C] flex-shrink-0 mt-0.5" />
                <span>{currentStore.address}</span>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 flex-shrink-0">
              <a
                href={currentStore.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#451A03] text-white text-xs font-semibold hover:bg-[#2A0E02] transition-colors"
              >
                <span>Buka Petunjuk Arah</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <a
                href={`https://wa.me/${currentStore.phone.replace(/[^0-9]/g, '')}?text=Halo%20Salam%20Kopi%20${currentStore.city}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#D7C4B7] text-[#44403C] text-xs font-semibold hover:border-[#C2410C] hover:text-[#C2410C] transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{currentStore.phone}</span>
              </a>
            </div>
          </div>

          {/* Highlights & Amenities */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6">
            
            {/* Hours & Wifi */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] border border-[#E7DFD5] flex items-center justify-center text-[#C2410C] flex-shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#292524]">Jam Operasional</div>
                  <div className="text-xs text-[#57534E] mt-0.5">{currentStore.hours}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] border border-[#E7DFD5] flex items-center justify-center text-[#16A34A] flex-shrink-0">
                  <Wifi className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#292524]">Kecepatan Wi-Fi Kedai</div>
                  <div className="text-xs text-[#57534E] mt-0.5">{currentStore.wifiSpeed}</div>
                </div>
              </div>
            </div>

            {/* Amenities Checklist */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#78716C] mb-3">
                Fasilitas Kedai:
              </div>
              <div className="space-y-2">
                {currentStore.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-[#44403C]">
                    <div className="w-4 h-4 rounded-full bg-[#FFEDD5] text-[#C2410C] flex items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
