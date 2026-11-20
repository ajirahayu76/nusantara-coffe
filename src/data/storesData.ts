import { StoreLocation } from '../types';

export const STORES: StoreLocation[] = [
  {
    id: 'salam-senopati',
    name: 'Salam Kopi Roastery & Bar Senopati',
    city: 'Jakarta Selatan',
    address: 'Jl. Senopati No. 42B, Kebayoran Baru, Jakarta Selatan 12190',
    hours: 'Setiap Hari · 07:00 - 23:00 WIB',
    phone: '+62 812-8822-7711',
    wifiSpeed: '120 Mbps (Dedicated Fiber)',
    features: ['Slow Bar Manual Brew', 'Working Space & Colokan Banyak', 'Outdoor Smoker Area Sejuk', 'Musholla Ber-AC', 'Valet Parking'],
    mapsUrl: 'https://maps.google.com/?q=Senopati+Jakarta',
  },
  {
    id: 'salam-dago',
    name: 'Salam Kopi Paviliun Dago',
    city: 'Bandung',
    address: 'Jl. Ir. H. Juanda (Dago Atas) No. 185, Coblong, Bandung 40135',
    hours: 'Setiap Hari · 07:30 - 22:30 WIB',
    phone: '+62 813-4411-9922',
    wifiSpeed: '100 Mbps',
    features: ['Suasana Udara Sejuk Dago', 'Bean Roasting Showcase', 'Garden Seating', 'Live Akustik Weekend', 'Pet Friendly Outdoor'],
    mapsUrl: 'https://maps.google.com/?q=Dago+Bandung',
  },
  {
    id: 'salam-prawirotaman',
    name: 'Salam Kopi Rumah Seduh Prawirotaman',
    city: 'Yogyakarta',
    address: 'Jl. Prawirotaman II No. 18, Brontokusuman, Mergangsan, Yogyakarta 55153',
    hours: 'Setiap Hari · 08:00 - 00:00 WIB',
    phone: '+62 817-2233-8844',
    wifiSpeed: '95 Mbps',
    features: ['Arsitektur Joglo Modern', 'Koleksi Buku Kopi & Sastra', 'Artisan Pastry Kitchen', 'Cold Brew Tasting Flights'],
    mapsUrl: 'https://maps.google.com/?q=Prawirotaman+Yogyakarta',
  },
  {
    id: 'salam-canggu',
    name: 'Salam Kopi Sanctum Canggu',
    city: 'Bali',
    address: 'Jl. Pantai Batu Bolong No. 58, Canggu, Kuta Utara, Badung, Bali 80351',
    hours: 'Setiap Hari · 06:30 - 22:00 WITA',
    phone: '+62 821-9988-1122',
    wifiSpeed: '150 Mbps (Digital Nomad Hub)',
    features: ['Pemandangan Sawah Canggu', 'Oat Milk Barista Station', 'Matcha & Cascara Bar', 'Shower & Locker for Surfers'],
    mapsUrl: 'https://maps.google.com/?q=Canggu+Bali',
  }
];
