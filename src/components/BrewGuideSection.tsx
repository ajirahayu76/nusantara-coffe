import React, { useState } from 'react';
import { Coffee, Flame, Droplets, Clock, Sliders } from 'lucide-react';
import { BREW_METHODS } from '../data/brewData';
import { BrewMethod } from '../types';

export const BrewGuideSection: React.FC = () => {
  const [activeMethod, setActiveMethod] = useState<BrewMethod>(BREW_METHODS[0]);
  const [coffeeDose, setCoffeeDose] = useState<number>(activeMethod.defaultDose);

  const handleSelectMethod = (m: BrewMethod) => {
    setActiveMethod(m);
    setCoffeeDose(m.defaultDose);
  };

  const calculatedWater = Math.round(coffeeDose * activeMethod.defaultRatio);

  return (
    <section id="brew-guide" className="py-14 sm:py-20 bg-[#F5EFE6] scroll-mt-20 border-t border-[#EFE8DD]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-[#C2410C]">
            Panduan Seduh Rumahan
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#292524] mt-1">
            Kalkulator Rasio & Resep Barista
          </h2>
          <p className="text-xs sm:text-sm text-[#57534E] mt-2">
            Seduh biji kopi Salam Kopi di rumah dengan presisi standar kompetisi. Sesuaikan takaran bubuk kopimu, dan biarkan kalkulator menentukan volume air dan waktunya.
          </p>
        </div>

        {/* Method Picker Tabs */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-8">
          {BREW_METHODS.map((method) => (
            <button
              key={method.id}
              type="button"
              onClick={() => handleSelectMethod(method)}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeMethod.id === method.id
                  ? 'bg-[#451A03] text-white shadow-sm'
                  : 'bg-white border border-[#E7DFD5] text-[#57534E] hover:border-[#D7C4B7]'
              }`}
            >
              {method.name}
            </button>
          ))}
        </div>

        {/* Interactive Calculator & Steps Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Interactive Ratio & Dose Slider */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-6 sm:p-7 border border-[#E7DFD5] shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DD]">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#C2410C]" />
                <h3 className="font-serif font-bold text-base text-[#292524]">
                  Kalkulator Seduh {activeMethod.name}
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-[#C2410C] bg-[#FFEDD5] px-2 py-0.5 rounded">
                Rasio 1:{activeMethod.defaultRatio}
              </span>
            </div>

            {/* Dose Slider */}
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-[#57534E]">Takaran Bubuk Kopi (Dose):</span>
                <span className="font-mono text-base font-bold text-[#451A03]">
                  {coffeeDose} gram
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="35"
                step="1"
                value={coffeeDose}
                onChange={(e) => setCoffeeDose(Number(e.target.value))}
                className="w-full accent-[#C2410C] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#A8A29E] mt-1">
                <span>10g (1 cangkir kecil)</span>
                <span>20g (mug sedang)</span>
                <span>35g (sharing 2-3 orang)</span>
              </div>
            </div>

            {/* Calculated Results */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E7DFD5] text-center">
                <div className="flex items-center justify-center gap-1 text-[#0284C7] mb-1">
                  <Droplets className="w-4 h-4" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#57534E]">Volume Air</span>
                </div>
                <div className="font-mono text-2xl font-bold text-[#292524]">
                  {calculatedWater} <span className="text-xs font-normal text-[#78716C]">ml</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E7DFD5] text-center">
                <div className="flex items-center justify-center gap-1 text-[#DC2626] mb-1">
                  <Flame className="w-4 h-4" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#57534E]">Suhu Air</span>
                </div>
                <div className="font-mono text-2xl font-bold text-[#292524]">
                  {activeMethod.waterTemp.split('-')[0].trim()}
                </div>
              </div>
            </div>

            {/* Parameters list */}
            <div className="space-y-2.5 text-xs text-[#57534E] pt-2 border-t border-[#EFE8DD]">
              <div className="flex items-start justify-between gap-3">
                <span className="text-[#78716C]">Tingkat Gilingan:</span>
                <span className="font-semibold text-right text-[#292524]">
                  {activeMethod.grindDescription}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#78716C]">Target Waktu Seduh:</span>
                <span className="font-semibold text-[#292524]">
                  ⏱️ {activeMethod.brewTime}
                </span>
              </div>
            </div>

          </div>

          {/* Right Column: Step-by-Step Pouring Instructions */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-7 border border-[#E7DFD5] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DD]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#C2410C]" />
                <h3 className="font-serif font-bold text-base text-[#292524]">
                  Langkah & Panduan Tuang Barista
                </h3>
              </div>
              <span className="text-xs text-[#78716C]">
                Total air: <strong className="text-[#292524]">{calculatedWater} ml</strong>
              </span>
            </div>

            <div className="space-y-3.5">
              {activeMethod.steps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-[#E7DFD5] bg-[#FAF7F2] flex items-start gap-3.5"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#451A03] text-[#FAF7F2] flex items-center justify-center font-mono text-xs font-bold flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs sm:text-sm font-bold text-[#292524]">
                        {step.action}
                      </h4>
                      <span className="font-mono text-xs font-semibold text-[#C2410C]">
                        {step.time}
                      </span>
                    </div>
                    <p className="text-xs text-[#57534E] mt-1 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-[#FFEDD5]/60 rounded-xl border border-[#FED7AA] flex items-center gap-2.5 text-xs text-[#78350F]">
              <Coffee className="w-4 h-4 flex-shrink-0 text-[#C2410C]" />
              <span>
                <strong>Tips Barista:</strong> Gunakan air mineral dengan TDS 80-150 ppm untuk cita rasa manis buah yang paling optimal.
              </span>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
