import { BrewMethod } from '../types';

export const BREW_METHODS: BrewMethod[] = [
  {
    id: 'v60',
    name: 'V60 Pour Over',
    iconName: 'Filter',
    defaultDose: 15,
    defaultRatio: 15, // 1:15 -> 225ml
    waterTemp: '91°C - 93°C',
    grindDescription: 'Medium-Fine (seukuran garam meja berbutir)',
    brewTime: '2:30 - 3:00 menit',
    steps: [
      { time: '0:00 - 0:45', action: 'Blooming', desc: 'Tuang 45ml air melingkar perlahan untuk melepaskan gas CO2 alami kopi.' },
      { time: '0:45 - 1:30', action: 'Tuangan Pertama', desc: 'Tuang hingga mencapai 130ml dengan putaran spiral stabil dari tengah ke tepi.' },
      { time: '1:30 - 2:30', action: 'Tuangan Kedua & Akhir', desc: 'Tuang perlahan hingga total 225ml. Biarkan menetes tuntas.' }
    ]
  },
  {
    id: 'tubruk',
    name: 'Kopi Tubruk Nusantara',
    iconName: 'Coffee',
    defaultDose: 14,
    defaultRatio: 14, // 1:14 -> 196ml
    waterTemp: '93°C - 95°C',
    grindDescription: 'Medium to Fine (gilingan klasik aromatik)',
    brewTime: '4:00 menit',
    steps: [
      { time: '0:00 - 0:30', action: 'Tuangan Pertama', desc: 'Masukkan bubuk ke cangkir, tuang sepertiga air panas, aduk perlahan 5 kali.' },
      { time: '0:30 - 1:00', action: 'Penuhkan Cangkir', desc: 'Tuang sisa air panas hingga penuh, tutup cangkir agar aroma terjaga.' },
      { time: '4:00', action: 'Siap Dinikmati', desc: 'Buka tutup cangkir, seruput perlahan saat ampas telah mengendap di dasar.' }
    ]
  },
  {
    id: 'french-press',
    name: 'French Press Plunger',
    iconName: 'Layers',
    defaultDose: 18,
    defaultRatio: 13, // 1:13 -> 234ml
    waterTemp: '92°C - 94°C',
    grindDescription: 'Coarse kasar (seukuran garam laut kristal)',
    brewTime: '4:00 menit',
    steps: [
      { time: '0:00 - 0:30', action: 'Tuang Air Panas', desc: 'Masukkan bubuk kasar, tuang seluruh air panas secara merata.' },
      { time: '1:00', action: 'Aduk Kerak Kopi', desc: 'Aduk lembut bagian atas kerak kopi dengan sendok kayu.' },
      { time: '4:00', action: 'Tekan Plunger Perlahan', desc: 'Pasang saringan dan tekan tuas plunger ke bawah dengan lembut tanpa dipaksa.' }
    ]
  },
  {
    id: 'japanese-iced',
    name: 'Japanese Iced Drip V60',
    iconName: 'Sun',
    defaultDose: 16,
    defaultRatio: 10, // 1:10 air panas + es batu
    waterTemp: '92°C',
    grindDescription: 'Medium-Fine',
    brewTime: '2:15 menit',
    steps: [
      { time: '0:00', action: 'Siapkan Es Batu di Server', desc: 'Masukkan 80g bongkahan es batu langsung ke dalam teko server di bawah corong V60.' },
      { time: '0:00 - 0:40', action: 'Blooming', desc: 'Tuang 40ml air panas mendidih di atas bubuk kopi segar.' },
      { time: '0:40 - 2:15', action: 'Ekstraksi Cepat', desc: 'Tuang air hingga 160ml. Kopi panas yang menetes langsung membeku dingin mengunci aroma buah.' }
    ]
  }
];
