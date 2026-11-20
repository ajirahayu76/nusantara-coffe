import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Check } from 'lucide-react';
import { MenuItem, CustomizationOptions } from '../types';

interface ItemCustomizeModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: MenuItem, customization: CustomizationOptions, quantity: number) => void;
}

export const ItemCustomizeModal: React.FC<ItemCustomizeModalProps> = ({
  item,
  isOpen,
  onClose,
  onAddToCart,
}) => {
  if (!isOpen || !item) return null;

  const isBeanCategory = item.category === 'beans';
  const isFoodCategory = item.category === 'food';
  const isCoffeeOrDrink = !isBeanCategory && !isFoodCategory;

  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState<'reguler' | 'large'>('reguler');
  const [temperature, setTemperature] = useState<'iced' | 'hot'>(
    item.defaultTemp || (item.isIcedAvailable ? 'iced' : 'hot')
  );
  const [sugarLevel, setSugarLevel] = useState<'normal' | '50%' | '25%' | '0%' | 'stevia'>('normal');
  const [iceLevel, setIceLevel] = useState<'normal' | 'less' | 'no-ice'>('normal');
  const [milkChoice, setMilkChoice] = useState<'fresh-milk' | 'oat' | 'almond' | 'soy' | 'none'>('fresh-milk');
  const [grindSize, setGrindSize] = useState<'whole-bean' | 'v60' | 'french-press' | 'espresso' | 'tubruk'>('whole-bean');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  // Reset states on item open
  useEffect(() => {
    setQuantity(1);
    setSize('reguler');
    setTemperature(item.defaultTemp || (item.isIcedAvailable ? 'iced' : 'hot'));
    setSugarLevel('normal');
    setIceLevel('normal');
    setMilkChoice(item.category === 'manual-brew' ? 'none' : 'fresh-milk');
    setGrindSize('whole-bean');
    setSelectedAddons([]);
    setNotes('');
  }, [item]);

  const addonPrices: Record<string, number> = {
    'Extra Shot Espresso': 5000,
    'Grass Jelly Segar': 4000,
    'Boba Aren Kenyal': 5000,
    'Sea Salt Cream Foam': 5000,
  };

  const calculateUnitPrice = () => {
    let unit = item.price;
    if (size === 'large') unit += 4000;
    if (milkChoice === 'oat') unit += 6000;
    if (milkChoice === 'almond') unit += 7000;
    if (milkChoice === 'soy') unit += 4000;
    if (sugarLevel === 'stevia') unit += 2000;

    selectedAddons.forEach((addon) => {
      unit += addonPrices[addon] || 0;
    });

    return unit;
  };

  const unitPrice = calculateUnitPrice();
  const totalPrice = unitPrice * quantity;

  const toggleAddon = (name: string) => {
    if (selectedAddons.includes(name)) {
      setSelectedAddons(selectedAddons.filter((a) => a !== name));
    } else {
      setSelectedAddons([...selectedAddons, name]);
    }
  };

  const handleConfirm = () => {
    onAddToCart(
      item,
      {
        size,
        temperature,
        sugarLevel,
        iceLevel,
        milkChoice,
        grindSize: isBeanCategory ? grindSize : undefined,
        extraShots: selectedAddons.filter((a) => a === 'Extra Shot Espresso').length,
        addons: selectedAddons,
        notes,
      },
      quantity
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#FAF7F2] rounded-2xl shadow-2xl border border-[#E7DFD5] overflow-hidden my-8 max-h-[90vh] flex flex-col">
        
        {/* Header with image banner */}
        <div className="relative h-44 sm:h-52 w-full flex-shrink-0 bg-[#EFE8DD]">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.currentTarget;
              if (target.dataset.fallbackApplied) return;
              target.dataset.fallbackApplied = 'true';
              target.src = 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80';
            }}
          />
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-[#292524] flex items-center justify-center shadow-md backdrop-blur-xs transition-colors cursor-pointer"
            aria-label="Tutup kustomisasi"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 text-white">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-[#FDE68A]">
              {item.category.replace('-', ' ')}
            </span>
            <h2 className="font-serif text-xl sm:text-2xl font-bold leading-tight">
              {item.name}
            </h2>
            <div className="flex items-center gap-2 text-xs text-[#E7DFD5] mt-0.5">
              <span>Rp {item.price.toLocaleString('id-ID')}</span>
              {item.origin && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{item.origin}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Customization Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-[#292524] flex-1">
          {/* Description */}
          <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed">
            {item.description}
          </p>

          {/* Tasting notes if available */}
          {item.tastingNotes && item.tastingNotes.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-[#78716C] bg-white p-2.5 rounded-xl border border-[#E7DFD5]">
              <span className="font-semibold text-[#44403C]">Catatan Rasa:</span>
              <div className="flex flex-wrap gap-1.5">
                {item.tastingNotes.map((note, i) => (
                  <span key={i} className="text-[#C2410C]">
                    {note}{i < item.tastingNotes!.length - 1 ? ',' : ''}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Size Selector (Drinks) */}
          {isCoffeeOrDrink && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#78716C] mb-2">
                Pilih Ukuran Cangkir
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setSize('reguler')}
                  className={`p-3 rounded-xl border text-left text-xs transition-all ${
                    size === 'reguler'
                      ? 'border-[#C2410C] bg-[#FFEDD5]/40 text-[#292524] font-semibold shadow-xs'
                      : 'border-[#E7DFD5] bg-white text-[#57534E] hover:border-[#D7C4B7]'
                  }`}
                >
                  <div className="font-bold">Reguler (12 oz)</div>
                  <div className="text-[11px] text-[#78716C]">Standar rasa pas</div>
                </button>
                <button
                  type="button"
                  onClick={() => setSize('large')}
                  className={`p-3 rounded-xl border text-left text-xs transition-all ${
                    size === 'large'
                      ? 'border-[#C2410C] bg-[#FFEDD5]/40 text-[#292524] font-semibold shadow-xs'
                      : 'border-[#E7DFD5] bg-white text-[#57534E] hover:border-[#D7C4B7]'
                  }`}
                >
                  <div className="font-bold">Large (16 oz) <span className="text-[#C2410C]">+Rp 4.000</span></div>
                  <div className="text-[11px] text-[#78716C]">Puas untuk seharian</div>
                </button>
              </div>
            </div>
          )}

          {/* Temperature Selector */}
          {isCoffeeOrDrink && (item.isHotAvailable && item.isIcedAvailable) && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#78716C] mb-2">
                Suhu Penyajian
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setTemperature('iced')}
                  className={`p-2.5 rounded-xl border text-xs font-medium transition-all ${
                    temperature === 'iced'
                      ? 'border-[#C2410C] bg-[#FFEDD5]/40 text-[#292524] font-bold shadow-xs'
                      : 'border-[#E7DFD5] bg-white text-[#57534E]'
                  }`}
                >
                  ❄️ Dingin (Dengan Es)
                </button>
                <button
                  type="button"
                  onClick={() => setTemperature('hot')}
                  className={`p-2.5 rounded-xl border text-xs font-medium transition-all ${
                    temperature === 'hot'
                      ? 'border-[#C2410C] bg-[#FFEDD5]/40 text-[#292524] font-bold shadow-xs'
                      : 'border-[#E7DFD5] bg-white text-[#57534E]'
                  }`}
                >
                  ☕ Hangat (Panas)
                </button>
              </div>
            </div>
          )}

          {/* Sugar Level */}
          {isCoffeeOrDrink && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#78716C] mb-2">
                Tingkat Kemanisan (Gula Aren / Sirup)
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-xs">
                {[
                  { id: 'normal', label: '100% Normal' },
                  { id: '50%', label: '50% Sedang' },
                  { id: '25%', label: '25% Sedikit' },
                  { id: '0%', label: '0% Tanpa Gula' },
                  { id: 'stevia', label: 'Stevia (+Rp 2k)' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSugarLevel(s.id as any)}
                    className={`py-2 px-1 text-center rounded-lg border transition-all ${
                      sugarLevel === s.id
                        ? 'border-[#C2410C] bg-[#451A03] text-white font-bold'
                        : 'border-[#E7DFD5] bg-white text-[#57534E] hover:border-[#D7C4B7]'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Ice Level (if iced) */}
          {isCoffeeOrDrink && temperature === 'iced' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#78716C] mb-2">
                Porsi Es Batu
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                  { id: 'normal', label: 'Normal Es' },
                  { id: 'less', label: 'Sedikit Es (Less)' },
                  { id: 'no-ice', label: 'Tanpa Es' },
                ].map((ice) => (
                  <button
                    key={ice.id}
                    type="button"
                    onClick={() => setIceLevel(ice.id as any)}
                    className={`py-2 rounded-lg border text-center transition-all ${
                      iceLevel === ice.id
                        ? 'border-[#C2410C] bg-[#FFEDD5]/40 text-[#292524] font-bold'
                        : 'border-[#E7DFD5] bg-white text-[#57534E]'
                    }`}
                  >
                    {ice.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Milk Options for Signature / Espresso */}
          {(item.category === 'signature' || item.category === 'espresso') && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#78716C] mb-2">
                Pilihan Susu
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'fresh-milk', label: 'Fresh Milk Sapi (Default)', price: 0 },
                  { id: 'oat', label: 'Oat Milk Barista (+Rp 6.000)', price: 6000 },
                  { id: 'almond', label: 'Almond Milk (+Rp 7.000)', price: 7000 },
                  { id: 'soy', label: 'Soy Milk (+Rp 4.000)', price: 4000 },
                ].map((milk) => (
                  <button
                    key={milk.id}
                    type="button"
                    onClick={() => setMilkChoice(milk.id as any)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      milkChoice === milk.id
                        ? 'border-[#C2410C] bg-[#FFEDD5]/40 text-[#292524] font-bold'
                        : 'border-[#E7DFD5] bg-white text-[#57534E]'
                    }`}
                  >
                    {milk.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Grind Size for Beans */}
          {isBeanCategory && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#78716C] mb-2">
                Pilihan Bentuk & Gilingan Kopi
              </label>
              <div className="space-y-1.5 text-xs">
                {[
                  { id: 'whole-bean', label: 'Biji Utuh (Whole Bean)', desc: 'Cocok jika punya grinder sendiri di rumah' },
                  { id: 'v60', label: 'Giling Medium (V60 / Filter / Kalita)', desc: 'Ekstraksi jernih dan manis buah' },
                  { id: 'espresso', label: 'Giling Halus (Espresso / Mokapot / Rok Presso)', desc: 'Ekstraksi padat kental pekat' },
                  { id: 'tubruk', label: 'Giling Tubruk Klasik', desc: 'Sangat cocok untuk seduh tubruk tubruk harian' },
                  { id: 'french-press', label: 'Giling Kasar (French Press / Cold Brew)', desc: 'Rendaman dingin atau plunger' },
                ].map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGrindSize(g.id as any)}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                      grindSize === g.id
                        ? 'border-[#C2410C] bg-[#FFEDD5]/40 text-[#292524] font-semibold'
                        : 'border-[#E7DFD5] bg-white text-[#57534E]'
                    }`}
                  >
                    <div>
                      <div className="font-bold">{g.label}</div>
                      <div className="text-[11px] text-[#78716C]">{g.desc}</div>
                    </div>
                    {grindSize === g.id && <Check className="w-4 h-4 text-[#C2410C]" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add-ons (Drinks) */}
          {isCoffeeOrDrink && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#78716C] mb-2">
                Tambahan Topping / Ekstra
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(addonPrices).map(([name, price]) => {
                  const isChecked = selectedAddons.includes(name);
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => toggleAddon(name)}
                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                        isChecked
                          ? 'border-[#C2410C] bg-[#FFEDD5]/40 text-[#292524] font-bold'
                          : 'border-[#E7DFD5] bg-white text-[#57534E]'
                      }`}
                    >
                      <div>
                        <div>{name}</div>
                        <div className="text-[11px] text-[#C2410C] font-mono">+Rp {price.toLocaleString('id-ID')}</div>
                      </div>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        isChecked ? 'bg-[#C2410C] border-[#C2410C] text-white' : 'border-[#D7C4B7]'
                      }`}>
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Barista Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#78716C] mb-1">
              Catatan untuk Barista (Opsional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: jangan terlalu manis ya kak, sedotan kertas, atau pisahkan gula..."
              className="w-full p-2.5 rounded-xl border border-[#D7C4B7] bg-white text-xs focus:outline-hidden focus:border-[#C2410C] transition-colors"
            />
          </div>
        </div>

        {/* Footer with quantity and add to cart button */}
        <div className="p-4 bg-white border-t border-[#E7DFD5] flex items-center justify-between gap-4 flex-shrink-0">
          {/* Quantity Counter */}
          <div className="flex items-center border border-[#D7C4B7] rounded-xl bg-[#FAF7F2] p-1">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#57534E] hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
              aria-label="Kurangi jumlah"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-8 text-center text-xs font-bold font-mono">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#57534E] hover:bg-white cursor-pointer"
              aria-label="Tambah jumlah"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Add Button */}
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-3 px-4 rounded-xl bg-[#451A03] hover:bg-[#2A0E02] text-white text-xs sm:text-sm font-semibold flex items-center justify-between shadow-md active:scale-98 transition-all cursor-pointer"
          >
            <span>Tambah ke Pesanan</span>
            <span className="font-mono font-bold text-[#FDE68A]">
              Rp {totalPrice.toLocaleString('id-ID')}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};
