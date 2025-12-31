Hijra Meet, kita akan mengusung tema UI yang bersih (clean), tenang, dan profesional (menggunakan palet warna Deep Navy dan Emerald agar sesuai dengan branding "Hijra").Berikut adalah rancangan Frontend yang mencakup Arsitektur Komponen, UI Flow, dan Mockup Layout.🎨 1. Identitas Visual (UI Style Guide)Warna Utama: #0F172A (Slate/Navy - Background Utama), #10B981 (Emerald - Aksi Positif), #EF4444 (Rose - End Call/Error).Tipografi: Inter atau Geist (Modern & Sangat Terbaca).Feel: Minimalis seperti Google Meet, tapi dengan sidebar interaksi yang lebih kaya seperti Zoom/Webinar.🗺️ 2. User Flow & RoutingRouteNama HalamanFungsi/HomeInput Event ID atau Button "Mulai Webinar" (Host)./setup/:idWaiting RoomCek Kamera/Mic, isi Nama Display sebelum masuk./event/:idMain StageRuang webinar utama (Video Grid + Sidebar).🏗️ 3. Arsitektur Komponen (React)Plaintextsrc/
 ├─ components/
 │   ├─ layout/
 │   │   ├─ Navbar.jsx          // Judul Event & Timer
 │   │   ├─ Sidebar.jsx         // Wrapper Tabs (Chat, Q&A, Polls)
 │   │   └─ ControlBar.jsx      // Tombol Mic, Cam, Leave, Hand
 │   ├─ video/
 │   │   ├─ VideoStage.jsx      // Grid sistem (1-20 orang)
 │   │   ├─ VideoTile.jsx       // Frame individu (Nama, Mute Status)
 │   │   └─ ScreenShare.jsx     // Full width view jika host share screen
 │   └─ interaction/
 │       ├─ ChatBox.jsx         // Realtime chat
 │       ├─ QnAPanel.jsx        // Upvote questions
 │       └─ PollView.jsx        // Tampilan hasil voting
 └─ hooks/
     └─ useWebRTC.js            // Semua logika Cloudflare Calls
🖼️ 4. Mockup Layout Halaman Utama (/event/:id)Hijra Meet akan menggunakan Layout 3-Bagian:Top Header: Nama Event + Status "LIVE" + Jumlah Peserta.Center Stage: Area video dengan sistem Dynamic Grid.1 Peserta: Full screen.2-4 Peserta: 2x2 Grid.4 Peserta: Grid dengan pagination atau scrolling sidebar video.Right Sidebar (Interaksi): Tab sistem untuk Chat, Q&A, dan Voting.Bottom Floating Bar: Tombol kontrol transparan di tengah bawah.💻 5. Logika UI Responsif (Tailwind CSS)Berikut adalah potongan kode rancangan untuk Video Grid agar otomatis menyesuaikan jumlah kamera yang aktif (Max 20):JavaScript// components/video/VideoStage.jsx
const VideoStage = ({ activeStreams }) => {
  // Logika grid dinamis berdasarkan jumlah stream
  const getGridClass = () => {
    const count = activeStreams.length;
    if (count === 1) return 'grid-cols-1';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 9) return 'grid-cols-3';
    return 'grid-cols-4'; // Sesuai limit 20 kamera
  };

  return (
    <div className={`grid ${getGridClass()} gap-4 p-4 h-full w-full bg-slate-900 transition-all`}>
      {activeStreams.map((stream) => (
        <VideoTile key={stream.id} stream={stream} />
      ))}
    </div>
  );
};
🛠️ 6. Fitur Unggulan di FrontendIndicator "Host" & "Speaker": Label kecil pada Video Tile untuk menandai peran.Recording Status Bar: Bar merah tipis di bagian paling atas jika Host sedang merekam secara lokal.Push-to-Talk / Mute Visual: Animasi gelombang suara pada frame peserta yang sedang bicara (Active Speaker Detection).Empty State: Jika belum ada kamera aktif, tampilkan Logo "Hijra Meet" yang elegan dengan teks "Menunggu Host memulai siaran...".