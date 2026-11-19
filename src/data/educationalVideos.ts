import { ADVENTURE_WORLD_ZONES, type AdventureZoneDef } from '../utils/almahyra';

export const SISI_TERANG_CHANNEL_NAME = 'SISI TERANG';
export const SISI_TERANG_CHANNEL_HANDLE = '@SISITERANG';
export const SISI_TERANG_CHANNEL_URL = 'https://www.youtube.com/@SISITERANG';

export interface EducationalChannel {
  id: string;
  name: string;
  shortName: string;
  topic: string;
  level: string;
  url: string;
  accentColor: string;
}

export const EDUCATIONAL_CHANNELS: EducationalChannel[] = [
  {
    id: 'kok-bisa',
    name: 'Kok Bisa?',
    shortName: 'Kok Bisa?',
    topic: 'Pengetahuan Umum, Sains, & Ekonomi',
    level: 'SD Atas – SMA',
    url: 'https://www.youtube.com/@KokBisa',
    accentColor: '#EA580C',
  },
  {
    id: 'hujan-tanda-tanya',
    name: 'Hujan Tanda Tanya',
    shortName: 'Hujan Tanda Tanya',
    topic: 'Sains Populer, Teknologi, & Psikologi',
    level: 'SMP – SMA',
    url: 'https://www.youtube.com/channel/UC5dn6JdeSgWzcNL7NuvMEKQ',
    accentColor: '#0284C7',
  },
  {
    id: 'neuron',
    name: 'Neuron',
    shortName: 'Neuron',
    topic: 'Biologi, Medis, & Kesehatan Tubuh Manusia',
    level: 'SMP – SMA',
    url: 'https://www.youtube.com/@Neuronmedia',
    accentColor: '#DC2626',
  },
  {
    id: 'sepulang-sekolah',
    name: 'Sepulang Sekolah',
    shortName: 'Sepulang Sekolah',
    topic: 'Sejarah Dunia, Sejarah Indonesia, & Budaya Populer',
    level: 'SMP – SMA',
    url: 'https://www.youtube.com/channel/UCfQHaUbD0oEBH_FRYHE5qIg',
    accentColor: '#7C3AED',
  },
  {
    id: 'kejarcita',
    name: 'Kejarcita',
    shortName: 'Kejarcita',
    topic: 'Materi Pelajaran Sekolah Sesuai Kurikulum',
    level: 'SD – SMA',
    url: 'https://www.youtube.com/@kejarcita',
    accentColor: '#087C3B',
  },
  {
    id: 'ruangguru',
    name: 'Ruangguru',
    shortName: 'Ruangguru',
    topic: 'Pembahasan Mata Pelajaran & Konsep Dasar Sekolah',
    level: 'SD – SMA',
    url: 'https://www.youtube.com/channel/UCbc1RY0McnikiEMD8Box5Ig',
    accentColor: '#0891B2',
  },
  {
    id: 'marbel',
    name: 'Marbel - Learning Together Everyday',
    shortName: 'Marbel',
    topic: 'Edukasi Dasar, Lagu Anak, & Tata Surya',
    level: 'TK – SD',
    url: 'https://www.youtube.com/channel/UC1dSphyIWaZCMQcOhplPwJg',
    accentColor: '#D97706',
  },
  {
    id: 'nussa-official',
    name: 'Nussa Official',
    shortName: 'Nussa Official',
    topic: 'Animasi Budi Pekerti & Adab Sehari-hari',
    level: 'TK – SD',
    url: 'https://www.youtube.com/channel/UCV2jNjJEtO0Hr3b1Es3xPJg',
    accentColor: '#15803D',
  },
  {
    id: 'riri',
    name: 'Riri - Magic Tales Everywhere',
    shortName: 'Riri Magic Tales',
    topic: 'Dongeng Nusantara, Fabel, & Cerita Rakyat',
    level: 'TK – SD',
    url: 'https://www.youtube.com/@RiriEducaStudio',
    accentColor: '#C026D3',
  },
  {
    id: 'sisi-terang',
    name: SISI_TERANG_CHANNEL_NAME,
    shortName: SISI_TERANG_CHANNEL_NAME,
    topic: 'Animasi Sains Populer, Teka-teki, & Fakta Unik',
    level: 'SD – Umum',
    url: SISI_TERANG_CHANNEL_URL,
    accentColor: '#2563EB',
  },
];

const CHANNEL_MAP = new Map(EDUCATIONAL_CHANNELS.map((c) => [c.id, c]));

function getChannelMeta(channelId: string): EducationalChannel {
  return CHANNEL_MAP.get(channelId) ?? EDUCATIONAL_CHANNELS[0];
}

export interface EducationalVideo {
  id: string;
  youtubeId: string;
  title: string;
  zoneId: string;
  zoneName: string;
  summary: string;
  learningHighlight: string;
  targetAge: string;
  channelId: string;
  channelName: string;
  channelUrl: string;
}

interface RawVideoSeed {
  id: string;
  youtubeId: string;
  title: string;
  zoneId: string;
  zoneName: string;
  summary: string;
  learningHighlight: string;
  targetAge: string;
  channelId: string;
}

const RAW_EDUCATIONAL_VIDEOS: RawVideoSeed[] = [
  // =========================================================================
  // 1. ZONA IMAJINASI — Dongeng Nusantara, Daya Khayal, Teka-teki & Bacaan
  // =========================================================================
  {
    id: 'vid-imajinasi-riri-toba',
    youtubeId: 'qsrKzbumyuM',
    title: 'Asal Usul Danau Toba dan Daerah Lainnya di Nusantara | Dongeng Cerita Rakyat',
    zoneId: 'zona-imajinasi',
    zoneName: 'Zona Imajinasi',
    summary:
      'Kisah dongeng nusantara tentang asal usul Danau Toba dan berbagai legenda daerah di Indonesia yang kaya pesan moral.',
    learningHighlight: 'Menghidupkan imajinasi anak lewat cerita rakyat nusantara sekaligus menanamkan sikap menepati janji.',
    targetAge: 'TK – SD',
    channelId: 'riri',
  },
  {
    id: 'vid-imajinasi-riri-mimpi',
    youtubeId: 'pTihoDwcIHo',
    title: 'Riri di Negeri Penjaga Mimpi! Bertemu Dengan Kucing Penjaga Bulan',
    zoneId: 'zona-imajinasi',
    zoneName: 'Zona Imajinasi',
    summary:
      'Petualangan fantasi Riri menjelajahi negeri mimpi bersama Kucing Penjaga Bulan dalam animasi penuh warna.',
    learningHighlight: 'Mengembangkan daya khayal positif, keberanian menghadapi rasa takut, dan empati terhadap teman.',
    targetAge: 'TK – SD',
    channelId: 'riri',
  },
  {
    id: 'vid-imajinasi-nussa-tidur',
    youtubeId: 'Cxdx5vibsTg',
    title: 'NUSSA : TIDUR SENDIRI, GAK TAKUT!',
    zoneId: 'zona-imajinasi',
    zoneName: 'Zona Imajinasi',
    summary:
      'Nussa mengajak Rarra mengubah rasa takut gelap di malam hari menjadi keberanian dengan doa dan imajinasi yang menenangkan.',
    learningHighlight: 'Melatih kemandirian anak saat tidur sendiri dan mengelola imajinasi rasa takut secara sehat.',
    targetAge: 'TK – SD',
    channelId: 'nussa-official',
  },
  {
    id: 'vid-imajinasi-sisiterang-tekateki',
    youtubeId: 'hROF909Tfq4',
    title: '15 Teka-teki yang Akan Membuat Otakmu Berputar Sebelum Berhasil Memecahkannya',
    zoneId: 'zona-imajinasi',
    zoneName: 'Zona Imajinasi',
    summary:
      'Kumpulan teka-teki cerita penuh imajinasi yang mengajak anak berpikir kreatif dan jeli menangkap petunjuk.',
    learningHighlight: 'Melatih imajinasi aktif, ketelitian mendengar detail cerita, dan pemecahan masalah.',
    targetAge: 'SD Awal – SD Lanjut',
    channelId: 'sisi-terang',
  },
  {
    id: 'vid-imajinasi-sisiterang-1000tahun',
    youtubeId: 'jJdJ3544pms',
    title: 'Bagaimana Jika Semua Orang Tidur selama 1.000 Tahun Lalu Kembali Bangun',
    zoneId: 'zona-imajinasi',
    zoneName: 'Zona Imajinasi',
    summary:
      'Kisah pengandaian seru tentang perubahan kota, alam, dan kehidupan manusia setelah tidur panjang seribu tahun.',
    learningHighlight: 'Memantik daya khayal fiksi ilmiah sekaligus membandingkan peran manusia dan alam.',
    targetAge: 'SD Lanjut – SMP',
    channelId: 'sisi-terang',
  },
  {
    id: 'vid-imajinasi-htt-buku',
    youtubeId: '7AxODhYoUsk',
    title: '7 Rekomendasi Buku untuk Mempercantik Pikiran',
    zoneId: 'zona-imajinasi',
    zoneName: 'Zona Imajinasi',
    summary:
      'Ulasan inspiratif tujuh buku pilihan yang membuka wawasan, memperkaya imajinasi, dan menumbuhkan cinta membaca.',
    learningHighlight: 'Menginspirasi remaja dan keluarga memperluas daftar bacaan berkualitas di Rumah Baca.',
    targetAge: 'SMP – SMA',
    channelId: 'hujan-tanda-tanya',
  },

  // =========================================================================
  // 2. ZONA PENGETAHUAN — Sains, Biologi, Kurikulum IPA & Matematika
  // =========================================================================
  {
    id: 'vid-pengetahuan-kokbisa-langit',
    youtubeId: 'RZJdvL2ofkc',
    title: 'Mengapa Langit Berwarna Biru?',
    zoneId: 'zona-pengetahuan',
    zoneName: 'Zona Pengetahuan',
    summary:
      'Penjelasan animasi ringan khas Kok Bisa? tentang pembiasan cahaya matahari di atmosfer yang membuat langit tampak biru.',
    learningHighlight: 'Memahami konsep spektrum cahaya dan fisika atmosfer dari fenomena sehari-hari.',
    targetAge: 'SD Atas – SMA',
    channelId: 'kok-bisa',
  },
  {
    id: 'vid-pengetahuan-neuron-demam',
    youtubeId: '_3LAeMDM34U',
    title: 'Kenapa Kita Demam?',
    zoneId: 'zona-pengetahuan',
    zoneName: 'Zona Pengetahuan',
    summary:
      'Visualisasi medis dari Neuron yang menjelaskan cara sistem imun tubuh menaikkan suhu untuk melawan kuman dan virus.',
    learningHighlight: 'Mengenal mekanisme pertahanan tubuh manusia dan dasar biologi kesehatan.',
    targetAge: 'SMP – SMA',
    channelId: 'neuron',
  },
  {
    id: 'vid-pengetahuan-neuron-bersin',
    youtubeId: 'oeazPROr3jw',
    title: 'Kenapa Kita Bersin?',
    zoneId: 'zona-pengetahuan',
    zoneName: 'Zona Pengetahuan',
    summary:
      'Ulasan singkat nan jelas tentang refleks bersin sebagai tameng alami hidung dan saluran napas dari debu serta partikel asing.',
    learningHighlight: 'Memahami refleks sistem saraf dan pentingnya menjaga kebersihan saluran pernapasan.',
    targetAge: 'SMP – SMA',
    channelId: 'neuron',
  },
  {
    id: 'vid-pengetahuan-kejarcita-pesawat',
    youtubeId: 'DbafwQCnue0',
    title: 'Pesawat Sederhana | IPA SMP',
    zoneId: 'zona-pengetahuan',
    zoneName: 'Zona Pengetahuan',
    summary:
      'Materi kurikulum tentang tuas, katrol, bidang miring, dan roda berporos yang membantu pekerjaan manusia sehari-hari.',
    learningHighlight: 'Menguasai konsep fisika dasar pesawat sederhana beserta contoh aplikasinya di sekitar kita.',
    targetAge: 'SD Atas – SMP',
    channelId: 'kejarcita',
  },
  {
    id: 'vid-pengetahuan-ruangguru-garis',
    youtubeId: '3aJMVzHl6w8',
    title: 'Pengertian dan Jenis-Jenis Garis | Belajar Matematika Bersama Dafa dan Lulu - 4 SD',
    zoneId: 'zona-pengetahuan',
    zoneName: 'Zona Pengetahuan',
    summary:
      'Belajar mengenal garis lurus, sejajar, berpotongan, dan berimpit lewat petualangan seru Dafa dan Lulu dari Ruangguru.',
    learningHighlight: 'Memahami dasar geometri garis secara visual dan mudah dipraktikkan di kelas maupun rumah.',
    targetAge: 'SD',
    channelId: 'ruangguru',
  },
  {
    id: 'vid-pengetahuan-sisiterang-makanan',
    youtubeId: 'g9LvjUavRMg',
    title: 'Perjalanan Makanan di Dalam Tubuh',
    zoneId: 'zona-pengetahuan',
    zoneName: 'Zona Pengetahuan',
    summary:
      'Animasi edukatif yang menelusuri perjalanan setiap gigitan makanan dari mulut hingga menjadi energi tubuh.',
    learningHighlight: 'Memahami sistem pencernaan manusia secara visual dan pentingnya makan bergizi.',
    targetAge: 'SD – SMP',
    channelId: 'sisi-terang',
  },

  // =========================================================================
  // 3. ZONA KREATIVITAS — Eksperimen Warna, Origami, Logika & Cara Belajar
  // =========================================================================
  {
    id: 'vid-kreativitas-marbel-warna',
    youtubeId: 'V_ftrWIkmtU',
    title: 'SERUNYA! Ayo Ikut Aku MENCAMPUR WARNA!',
    zoneId: 'zona-kreativitas',
    zoneName: 'Zona Kreativitas',
    summary:
      'Eksperimen mencampur warna primer menjadi warna-warna baru yang ceria bersama karakter animasi Marbel.',
    learningHighlight: 'Mengenalkan dasar seni rupa, pencampuran warna, dan keberanian bereksperimen sejak usia dini.',
    targetAge: 'TK – SD',
    channelId: 'marbel',
  },
  {
    id: 'vid-kreativitas-sisiterang-origami',
    youtubeId: 'tVR9PnUcs5A',
    title: 'Beneran Bisa Lompat! || Panduan Membuat Origami Gurita',
    zoneId: 'zona-kreativitas',
    zoneName: 'Zona Kreativitas',
    summary:
      'Panduan langkah demi langkah melipat kertas menjadi origami gurita lucu yang benar-benar bisa melompat.',
    learningHighlight: 'Melatih motorik halus, kesabaran mengikuti instruksi, dan kreasi kertas mandiri.',
    targetAge: 'TK – SD',
    channelId: 'sisi-terang',
  },
  {
    id: 'vid-kreativitas-htt-kritis',
    youtubeId: 'SLx24Eeux8E',
    title: 'Tips Supaya Kita Terbiasa Berpikir Kritis',
    zoneId: 'zona-kreativitas',
    zoneName: 'Zona Kreativitas',
    summary:
      'Strategi praktis melatih rasa ingin tahu, mempertanyakan informasi secara sehat, dan menyusun ide kreatif berbasis bukti.',
    learningHighlight: 'Membentuk kebiasaan berpikir kritis dan kreatif dalam memecahkan persoalan belajar.',
    targetAge: 'SMP – SMA',
    channelId: 'hujan-tanda-tanya',
  },
  {
    id: 'vid-kreativitas-htt-belajar',
    youtubeId: 'E0YbTynpAtM',
    title: 'Mengapa Kita Harus Belajar Cara Belajar?',
    zoneId: 'zona-kreativitas',
    zoneName: 'Zona Kreativitas',
    summary:
      'Pengantar seri Learning How to Learn yang membantu pelajar menemukan metode belajar efektif, fokus, dan menyenangkan.',
    learningHighlight: 'Menyusun strategi belajar mandiri yang kreatif agar materi lebih cepat dipahami.',
    targetAge: 'SMP – SMA',
    channelId: 'hujan-tanda-tanya',
  },
  {
    id: 'vid-kreativitas-kejarcita-kpk',
    youtubeId: 'XIXpBQffCMc',
    title: 'Kelipatan Persekutuan terKecil (KPK) | Matematika SD',
    zoneId: 'zona-kreativitas',
    zoneName: 'Zona Kreativitas',
    summary:
      'Cara mudah dan sistematis menemukan KPK menggunakan kelipatan dan pohon faktor untuk melatih logika bilangan.',
    learningHighlight: 'Mengasah ketangkasan berhitung dan pola berpikir terstruktur dalam matematika dasar.',
    targetAge: 'SD',
    channelId: 'kejarcita',
  },
  {
    id: 'vid-kreativitas-ruangguru-relasi',
    youtubeId: 'FuutOwoQIRU',
    title: 'Relasi | Video Belajar Kelas VIII Matematika',
    zoneId: 'zona-kreativitas',
    zoneName: 'Zona Kreativitas',
    summary:
      'Pembahasan visual konsep relasi, diagram panah, dan pasangan berurutan dari Ruangguru agar mudah dipahami pelajar SMP.',
    learningHighlight: 'Memetakan hubungan antarhimpunan secara logis dengan ilustrasi kehidupan sehari-hari.',
    targetAge: 'SMP',
    channelId: 'ruangguru',
  },

  // =========================================================================
  // 4. ZONA EKSPLORASI — Tata Surya, Luar Angkasa & Sejarah Nusantara
  // =========================================================================
  {
    id: 'vid-eksplorasi-marbel-tatasurya',
    youtubeId: '2EgP_zSOKN4',
    title: 'Ayo Menjelajah Angkasa! Belajar Tata Surya Bersama Marbel',
    zoneId: 'zona-eksplorasi',
    zoneName: 'Zona Eksplorasi',
    summary:
      'Petualangan roket animasi bersama Marbel mengenal matahari, planet-planet, dan keunikan ruang angkasa untuk anak.',
    learningHighlight: 'Mengenalkan urutan planet dan rasa takjub pada astronomi untuk usia TK hingga SD.',
    targetAge: 'TK – SD',
    channelId: 'marbel',
  },
  {
    id: 'vid-eksplorasi-kokbisa-blackhole',
    youtubeId: 'uMxQI5DuGGk',
    title: 'Ada Apa di Dalam Lubang Hitam?',
    zoneId: 'zona-eksplorasi',
    zoneName: 'Zona Eksplorasi',
    summary:
      'Eksplorasi sains antariksa dari Kok Bisa? tentang gravitasi ekstrem, cakrawala peristiwa, dan misteri lubang hitam.',
    learningHighlight: 'Memperluas wawasan astrofisika populer melalui animasi yang mudah dicerna.',
    targetAge: 'SD Atas – SMA',
    channelId: 'kok-bisa',
  },
  {
    id: 'vid-eksplorasi-ruangguru-gerhana',
    youtubeId: 'FA3P7KqM3Zk',
    title: 'Gerhana Matahari | Belajar IPA Bersama Dafa dan Lulu - 6 SD',
    zoneId: 'zona-eksplorasi',
    zoneName: 'Zona Eksplorasi',
    summary:
      'Simulasi posisi Matahari, Bulan, dan Bumi yang menyebabkan gerhana matahari total, sebagian, dan cincin.',
    learningHighlight: 'Memahami fenomena gerhana dan bayangan umbra-penumbra sesuai materi IPA SD.',
    targetAge: 'SD – SMP',
    channelId: 'ruangguru',
  },
  {
    id: 'vid-eksplorasi-sepulang-majapahit',
    youtubeId: 'VKVyuTa00ss',
    title: 'Sriwijaya & Majapahit GAK PERNAH Menguasai Thailand? Begini Penjelasannya!',
    zoneId: 'zona-eksplorasi',
    zoneName: 'Zona Eksplorasi',
    summary:
      'Penelusuran sejarah maritim Sriwijaya dan Majapahit di Asia Tenggara dengan gaya bertutur santai khas Sepulang Sekolah.',
    learningHighlight: 'Menambah pemahaman sejarah Nusantara, jalur perdagangan laut, dan jejak peradaban.',
    targetAge: 'SMP – SMA',
    channelId: 'sepulang-sekolah',
  },
  {
    id: 'vid-eksplorasi-sepulang-lanfang',
    youtubeId: 'AWsqR_YvIsA',
    title: 'Republik Pertama Di Nusantara! Mengenal Sejarah Republik Lanfang',
    zoneId: 'zona-eksplorasi',
    zoneName: 'Zona Eksplorasi',
    summary:
      'Kisah sejarah unik dari Kalimantan Barat tentang tata kelola komunitas dan warisan budaya multikultural di Nusantara.',
    learningHighlight: 'Menggali sejarah lokal Indonesia yang jarang dibahas untuk memperkaya perspektif sejarah.',
    targetAge: 'SMP – SMA',
    channelId: 'sepulang-sekolah',
  },
  {
    id: 'vid-eksplorasi-sisiterang-planet3d',
    youtubeId: 'cLgO2qUL8cI',
    title: 'Perjalanan ke Seluruh Planet di Tata Surya 3D',
    zoneId: 'zona-eksplorasi',
    zoneName: 'Zona Eksplorasi',
    summary:
      'Tur antariksa 3D mengunjungi Merkurius hingga Neptunus sambil mengamati keunikan permukaan setiap planet.',
    learningHighlight: 'Mengenal ciri khas planet-planet tata surya secara imersif dalam tampilan 3D.',
    targetAge: 'TK – SD',
    channelId: 'sisi-terang',
  },

  // =========================================================================
  // 5. ZONA SAHABAT BUMI — Kebersihan, Ekosistem, Fotosintesis & Iklim
  // =========================================================================
  {
    id: 'vid-sahabat-bumi-nussa-bersih',
    youtubeId: 'LboKlAG5cek',
    title: 'NUSSA : VIRAL!!! - BERSIH KOTA KITA BERSIH INDONESIA',
    zoneId: 'zona-sahabat-bumi',
    zoneName: 'Zona Sahabat Bumi',
    summary:
      'Nussa dan sahabat-sahabatnya bergotong royong menjaga kebersihan lingkungan sekitar agar kota tetap asri dan sehat.',
    learningHighlight: 'Menanamkan kebiasaan membuang sampah pada tempatnya dan kepedulian sosial sejak kecil.',
    targetAge: 'TK – SD',
    channelId: 'nussa-official',
  },
  {
    id: 'vid-sahabat-bumi-kokbisa-plastik',
    youtubeId: 'pnuiEGuThsI',
    title: 'Seberapa Banyak Sampah Plastik di Dunia?',
    zoneId: 'zona-sahabat-bumi',
    zoneName: 'Zona Sahabat Bumi',
    summary:
      'Data dan fakta animatif dari Kok Bisa? mengenai dampak sampah plastik bagi lautan serta langkah sederhana menguranginya.',
    learningHighlight: 'Membangun kesadaran bijak plastik, daur ulang, dan gaya hidup ramah lingkungan.',
    targetAge: 'SD Atas – SMA',
    channelId: 'kok-bisa',
  },
  {
    id: 'vid-sahabat-bumi-kokbisa-iklim',
    youtubeId: 'qtibq5NRUmE',
    title: 'Bisakah Kita Menghentikan Pemanasan Global?',
    zoneId: 'zona-sahabat-bumi',
    zoneName: 'Zona Sahabat Bumi',
    summary:
      'Penjelasan jernih tentang efek rumah kaca, perubahan iklim, dan peran energi bersih serta aksi kolektif menjaga bumi.',
    learningHighlight: 'Memahami penyebab pemanasan global dan kontribusi nyata pelajar sebagai Sahabat Bumi.',
    targetAge: 'SD Atas – SMA',
    channelId: 'kok-bisa',
  },
  {
    id: 'vid-sahabat-bumi-kejarcita-ekosistem',
    youtubeId: 'ThxJOMUCYds',
    title: 'Ekosistem | IPA SD',
    zoneId: 'zona-sahabat-bumi',
    zoneName: 'Zona Sahabat Bumi',
    summary:
      'Materi IPA tentang hubungan timbal balik antara komponen biotik dan abiotik serta rantai makanan di alam.',
    learningHighlight: 'Mengerti keseimbangan ekosistem darat dan air sesuai kurikulum sekolah dasar.',
    targetAge: 'SD – SMP',
    channelId: 'kejarcita',
  },
  {
    id: 'vid-sahabat-bumi-kejarcita-fotosintesis',
    youtubeId: '1QrapamASx0',
    title: 'Energi: Proses Fotosintesis',
    zoneId: 'zona-sahabat-bumi',
    zoneName: 'Zona Sahabat Bumi',
    summary:
      'Bagaimana tumbuhan hijau memanfaatkan cahaya matahari, air, dan karbon dioksida untuk menghasilkan oksigen bagi bumi.',
    learningHighlight: 'Menyadari betapa vitalnya peran tumbuhan dan menanam pohon bagi kehidupan.',
    targetAge: 'SD – SMP',
    channelId: 'kejarcita',
  },
  {
    id: 'vid-sahabat-bumi-sisiterang-amazon',
    youtubeId: 'qi5HOvCtKew',
    title: 'Akankah Kita Bertahan Jika Hutan Hujan Amazon Musnah?',
    zoneId: 'zona-sahabat-bumi',
    zoneName: 'Zona Sahabat Bumi',
    summary:
      'Ulasan ilmiah mengapa hutan hujan tropis sangat vital bagi hujan, oksigen, dan keanekaragaman hayati bumi.',
    learningHighlight: 'Menumbuhkan kesadaran menjaga hutan dan melestarikan keanekaragaman hayati.',
    targetAge: 'SD Lanjut – SMA',
    channelId: 'sisi-terang',
  },

  // =========================================================================
  // 6. ZONA PANGGUNG CERITA — Adab, Cerita Rakyat, Kebiasaan Baik & Komunikasi
  // =========================================================================
  {
    id: 'vid-panggung-cerita-nussa-makan',
    youtubeId: 'QxbF-tXyLd4',
    title: 'NUSSA : MAKAN JANGAN ASAL MAKAN',
    zoneId: 'zona-panggung-cerita',
    zoneName: 'Zona Panggung Cerita',
    summary:
      'Kisah hangat Nussa dan Rarra yang mengajarkan adab makan dengan tangan kanan, berdoa, dan bersyukur atas rezeki.',
    learningHighlight: 'Membiasakan budi pekerti dan adab sehari-hari di meja makan bersama keluarga.',
    targetAge: 'TK – SD',
    channelId: 'nussa-official',
  },
  {
    id: 'vid-panggung-cerita-riri-ikan',
    youtubeId: 'FCgUonLaT-M',
    title: 'Toba Mengingkari Janji Putri Ikan | Dongeng Cerita Rakyat Nusantara',
    zoneId: 'zona-panggung-cerita',
    zoneName: 'Zona Panggung Cerita',
    summary:
      'Dongeng klasik dari Sumatra Utara yang cocok dijadikan bahan mendongeng ulang dan diskusi nilai kejujuran.',
    learningHighlight: 'Melatih kemampuan menyimak alur dongeng dan menceritakannya kembali di Panggung Cerita.',
    targetAge: 'TK – SD',
    channelId: 'riri',
  },
  {
    id: 'vid-panggung-cerita-marbel-lagu',
    youtubeId: 'QOjnElcv3Hw',
    title: 'Badanku Bersih, Badanku Sehat - Kebiasaan Baik | Lagu Anak Marbel',
    zoneId: 'zona-panggung-cerita',
    zoneName: 'Zona Panggung Cerita',
    summary:
      'Lagu anak ceria dari Marbel yang mengajak balita dan siswa TK bernyanyi sambil membiasakan hidup bersih dan sehat.',
    learningHighlight: 'Meningkatkan keberanian bernyanyi, bergerak ritmis, dan menerapkan kebiasaan baik.',
    targetAge: 'PAUD – TK',
    channelId: 'marbel',
  },
  {
    id: 'vid-panggung-cerita-sepulang-nusantara',
    youtubeId: 'ouUuiTc2O64',
    title: 'Dari Mana Asal Moyang Nusantara? Menelusuri Jejak Sejarah Indonesia',
    zoneId: 'zona-panggung-cerita',
    zoneName: 'Zona Panggung Cerita',
    summary:
      'Cerita sejarah migrasi leluhur bangsa Indonesia yang memperkaya wawasan budaya dan keberagaman Nusantara.',
    learningHighlight: 'Menumbuhkan rasa bangga pada keberagaman budaya serta bahan presentasi sejarah.',
    targetAge: 'SMP – SMA',
    channelId: 'sepulang-sekolah',
  },
  {
    id: 'vid-panggung-cerita-htt-otak',
    youtubeId: 'KyVFGXdyaos',
    title: 'Otak Kita Seperti Plastik? | Belajar Cara Kerja Pikiran',
    zoneId: 'zona-panggung-cerita',
    zoneName: 'Zona Panggung Cerita',
    summary:
      'Kisah sains psikologi tentang neuroplastisitas yang membuktikan setiap orang bisa terus bertumbuh lewat latihan.',
    learningHighlight: 'Menumbuhkan pola pikir bertumbuh (growth mindset) dan percaya diri saat tampil belajar.',
    targetAge: 'SMP – SMA',
    channelId: 'hujan-tanda-tanya',
  },
  {
    id: 'vid-panggung-cerita-sisiterang-komunikasi',
    youtubeId: 'b2_FjKE4vhw',
    title: '18 Ciri Bahasa Tubuh yang Menunjukkan Kamu Bisa Memercayai Orang Lain',
    zoneId: 'zona-panggung-cerita',
    zoneName: 'Zona Panggung Cerita',
    summary:
      'Panduan mengenali ekspresi wajah, kontak mata, dan gestur terbuka saat berbicara dan berinteraksi dengan orang lain.',
    learningHighlight: 'Meningkatkan keterampilan komunikasi santun dan percaya diri di depan umum.',
    targetAge: 'SD Lanjut – SMA',
    channelId: 'sisi-terang',
  },
];

export const EDUCATIONAL_VIDEOS: EducationalVideo[] = RAW_EDUCATIONAL_VIDEOS.map((seed) => {
  const ch = getChannelMeta(seed.channelId);
  return {
    ...seed,
    channelName: ch.name,
    channelUrl: ch.url,
  };
});

export function getYouTubeThumbnailUrl(youtubeId: string): string {
  return `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
}

export function getYouTubeEmbedUrl(youtubeId: string): string {
  return `https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1`;
}

export function getYouTubeWatchUrl(youtubeId: string): string {
  return `https://www.youtube.com/watch?v=${youtubeId}`;
}

export function filterEducationalVideos(
  videos: EducationalVideo[],
  zoneId: string = 'all',
  query: string = '',
  channelId: string = 'all',
): EducationalVideo[] {
  const normalizedZone = zoneId.trim().toLowerCase();
  const normalizedQuery = query.trim().toLowerCase();
  const normalizedChannel = channelId.trim().toLowerCase();

  return videos.filter((video) => {
    const matchesZone =
      !normalizedZone ||
      normalizedZone === 'all' ||
      normalizedZone === 'semua' ||
      video.zoneId.toLowerCase() === normalizedZone ||
      video.zoneName.toLowerCase() === normalizedZone;

    if (!matchesZone) return false;

    const matchesChannel =
      !normalizedChannel ||
      normalizedChannel === 'all' ||
      normalizedChannel === 'semua' ||
      video.channelId.toLowerCase() === normalizedChannel ||
      video.channelName.toLowerCase() === normalizedChannel;

    if (!matchesChannel) return false;
    if (!normalizedQuery) return true;

    const haystack = [
      video.title,
      video.zoneName,
      video.summary,
      video.learningHighlight,
      video.targetAge,
      video.channelName,
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export interface ZoneVideoGroup {
  zone: AdventureZoneDef;
  videos: EducationalVideo[];
  count: number;
}

export function groupEducationalVideosByZone(
  videos: EducationalVideo[] = EDUCATIONAL_VIDEOS,
): ZoneVideoGroup[] {
  return ADVENTURE_WORLD_ZONES.map((zone) => {
    const zoneVideos = videos.filter((v) => v.zoneId === zone.id);
    return {
      zone,
      videos: zoneVideos,
      count: zoneVideos.length,
    };
  });
}

export interface ChannelVideoGroup {
  channel: EducationalChannel;
  videos: EducationalVideo[];
  count: number;
}

export function groupEducationalVideosByChannel(
  videos: EducationalVideo[] = EDUCATIONAL_VIDEOS,
): ChannelVideoGroup[] {
  return EDUCATIONAL_CHANNELS.map((channel) => {
    const channelVideos = videos.filter((v) => v.channelId === channel.id);
    return {
      channel,
      videos: channelVideos,
      count: channelVideos.length,
    };
  });
}
