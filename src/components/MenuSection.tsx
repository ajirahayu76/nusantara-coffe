import React, { useState, useMemo } from 'react';
import { Search, Plus, Coffee } from 'lucide-react';
import { MenuItem, MenuCategory } from '../types';
import { MENU_ITEMS } from '../data/menuData';

interface MenuSectionProps {
  onSelectItem: (item: MenuItem) => void;
  onQuickAdd: (item: MenuItem) => void;
}

export const MenuSection: React.FC<MenuSectionProps> = ({
  onSelectItem,
  onQuickAdd,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [tempFilter, setTempFilter] = useState<'all' | 'iced' | 'hot'>('all');
  const [dietaryFilter, setDietaryFilter] = useState<'all' | 'vegan' | 'low-sugar'>('all');

  const categories: { id: MenuCategory; label: string; icon?: string }[] = [
    { id: 'all', label: 'Semua Menu' },
    { id: 'signature', label: 'Signature Kopi Susu', icon: '✨' },
    { id: 'manual-brew', label: 'Manual Brew Single Origin', icon: '☕' },
    { id: 'espresso', label: 'Espresso Bar', icon: '⚡' },
    { id: 'non-coffee', label: 'Non-Coffee & Teh', icon: '🍵' },
    { id: 'food', label: 'Kudapan & Makanan', icon: '🥐' },
    { id: 'beans', label: 'Biji Sangrai & Drip', icon: '📦' },
  ];

  const filteredItems = useMemo(() => {
    return MENU_ITEMS.filter((item) => {
      // Category match
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // Search match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesDesc = item.description.toLowerCase().includes(query);
        const matchesOrigin = item.origin?.toLowerCase().includes(query);
        const matchesNotes = item.tastingNotes?.some((n) => n.toLowerCase().includes(query));
        if (!matchesName && !matchesDesc && !matchesOrigin && !matchesNotes) {
          return false;
        }
      }

      // Temperature filter
      if (tempFilter === 'iced' && !item.isIcedAvailable) return false;
      if (tempFilter === 'hot' && !item.isHotAvailable) return false;

      // Dietary filter
      if (dietaryFilter !== 'all') {
        if (!item.dietary?.includes(dietaryFilter)) return false;
      }

      return true;
    });
  }, [selectedCategory, searchQuery, tempFilter, dietaryFilter]);

  return (
    <section id="menu" className="py-14 sm:py-20 bg-[#FAF7F2] border-t border-[#EFE8DD] scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-[#C2410C]">
            Menu Salam Kopi
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#292524] mt-1.5">
            Racikan Istimewa dari Nusantara
          </h2>
          <p className="text-xs sm:text-sm text-[#57534E] mt-2">
            Setiap cangkir diracik dari biji kopi grade 1 dengan takaran presisi barista. Pilih sesuai selera dan sesuaikan tingkat kemanisanmu.
          </p>
        </div>

        {/* Search & Secondary Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#A8A29E] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kopi, rasa gayo, matcha, croissant, aren..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D7C4B7] rounded-xl text-xs sm:text-sm text-[#292524] placeholder:text-[#A8A29E] focus:outline-hidden focus:border-[#C2410C] focus:ring-1 focus:ring-[#C2410C] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#78716C] hover:text-[#292524]"
              >
                Hapus
              </button>
            )}
          </div>

          {/* Quick Filter Toggles */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {/* Temperature Segmented */}
            <div className="flex items-center bg-[#EFE8DD] p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setTempFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  tempFilter === 'all' ? 'bg-white font-bold text-[#292524] shadow-xs' : 'text-[#78716C]'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setTempFilter('iced')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  tempFilter === 'iced' ? 'bg-white font-bold text-[#292524] shadow-xs' : 'text-[#78716C]'
                }`}
              >
                ❄️ Dingin
              </button>
              <button
                type="button"
                onClick={() => setTempFilter('hot')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  tempFilter === 'hot' ? 'bg-white font-bold text-[#292524] shadow-xs' : 'text-[#78716C]'
                }`}
              >
                ☕ Hangat
              </button>
            </div>

            {/* Dietary Filter */}
            <div className="flex items-center bg-[#EFE8DD] p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setDietaryFilter('all')}
                className={`px-2.5 py-1.5 rounded-lg transition-colors ${
                  dietaryFilter === 'all' ? 'bg-white font-bold text-[#292524] shadow-xs' : 'text-[#78716C]'
                }`}
              >
                Semua Diet
              </button>
              <button
                type="button"
                onClick={() => setDietaryFilter('low-sugar')}
                className={`px-2.5 py-1.5 rounded-lg transition-colors ${
                  dietaryFilter === 'low-sugar' ? 'bg-white font-bold text-[#292524] shadow-xs' : 'text-[#78716C]'
                }`}
              >
                Rendah Gula
              </button>
              <button
                type="button"
                onClick={() => setDietaryFilter('vegan')}
                className={`px-2.5 py-1.5 rounded-lg transition-colors ${
                  dietaryFilter === 'vegan' ? 'bg-white font-bold text-[#292524] shadow-xs' : 'text-[#78716C]'
                }`}
              >
                Plant Based
              </button>
            </div>
          </div>
        </div>

        {/* Primary Category Tabs (Anti-slop clean segmented button bar) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-8 border-b border-[#E7DFD5]">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#451A03] text-white shadow-sm'
                  : 'bg-white border border-[#E7DFD5] text-[#57534E] hover:border-[#C2410C] hover:text-[#C2410C]'
              }`}
            >
              {cat.icon && <span className="mr-1.5">{cat.icon}</span>}
              {cat.label}
            </button>
          ))}
        </div>

        {/* Status Count */}
        <div className="flex items-center justify-between mb-6 text-xs text-[#78716C]">
          <div>
            Menampilkan <span className="font-bold text-[#292524]">{filteredItems.length}</span> pilihan menu
          </div>
          <div className="text-[11px] text-[#A8A29E] hidden sm:block">
            *Harga sudah termasuk pajak restoran
          </div>
        </div>

        {/* Menu Items Grid */}
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-[#E7DFD5] hover:border-[#D7C4B7] shadow-xs hover:shadow-md transition-all flex flex-col overflow-hidden group"
              >
                {/* Image & Quick badge */}
                <div
                  className="relative h-44 w-full bg-[#EFE8DD] overflow-hidden cursor-pointer"
                  onClick={() => onSelectItem(item)}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.dataset.fallbackApplied) return;
                      target.dataset.fallbackApplied = 'true';
                      target.src = 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                  {item.tag && (
                    <span className="absolute top-2.5 left-2.5 bg-[#451A03]/90 backdrop-blur-xs text-[#FAF7F2] text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                      {item.tag}
                    </span>
                  )}
                  {item.origin && (
                    <span className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded">
                      📍 {item.origin}
                    </span>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Header title */}
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        onClick={() => onSelectItem(item)}
                        className="font-serif text-base font-bold text-[#292524] group-hover:text-[#C2410C] transition-colors cursor-pointer leading-snug line-clamp-1"
                      >
                        {item.name}
                      </h3>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-[#78716C] mt-1.5 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    {/* Tasting notes (clean unboxed text with typographic separators) */}
                    {item.tastingNotes && item.tastingNotes.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-[#F5EFE6] flex items-center gap-1.5 text-[11px] text-[#A8A29E] overflow-hidden text-ellipsis whitespace-nowrap">
                        <span className="text-[#C2410C] font-medium">Notes:</span>
                        <span>{item.tastingNotes.join(' · ')}</span>
                      </div>
                    )}
                  </div>

                  {/* Price & Action Button Footer */}
                  <div className="mt-4 pt-3 border-t border-[#EFE8DD] flex items-center justify-between">
                    <div>
                      <div className="font-mono text-sm sm:text-base font-bold text-[#451A03]">
                        Rp {item.price.toLocaleString('id-ID')}
                      </div>
                      <div className="text-[10px] text-[#A8A29E]">
                        ⭐ {item.rating} ({item.reviewCount})
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onQuickAdd(item)}
                        title="Tambah cepat dengan racikan standar"
                        className="w-8 h-8 rounded-xl bg-[#EFE8DD] hover:bg-[#D7C4B7] text-[#451A03] flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                        aria-label={`Tambah ${item.name} cepat`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectItem(item)}
                        className="px-3 py-1.5 rounded-xl bg-[#451A03] hover:bg-[#2A0E02] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer active:scale-95"
                      >
                        Pilih
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-[#D7C4B7] p-8">
            <Coffee className="w-10 h-10 text-[#A8A29E] mx-auto mb-3" />
            <h3 className="font-serif text-lg font-bold text-[#292524]">
              Menu Tidak Ditemukan
            </h3>
            <p className="text-xs text-[#78716C] mt-1 max-w-sm mx-auto">
              Tidak ada menu yang cocok dengan kata kunci "{searchQuery}". Coba reset filter atau cari kata kunci lain.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setTempFilter('all');
                setDietaryFilter('all');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-[#451A03] text-white text-xs font-semibold hover:bg-[#2A0E02] cursor-pointer"
            >
              Reset Semua Filter
            </button>
          </div>
        )}

      </div>
    </section>
  );
};
