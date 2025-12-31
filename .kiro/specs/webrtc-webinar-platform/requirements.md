# Requirements Document

## Introduction

WebRTC Webinar Platform adalah sistem webinar interaktif berbasis browser yang memungkinkan host menyelenggarakan sesi webinar untuk hingga 250 peserta tanpa memerlukan login peserta. Platform ini menggunakan WebRTC untuk streaming video real-time dengan maksimal 20 kamera aktif secara bersamaan, dan menyediakan fitur interaksi seperti voting, Q&A, dan raise hand. Host dapat merekam sesi secara lokal di device mereka.

## Glossary

- **Host**: Pengguna yang login dan menyelenggarakan webinar, memiliki kontrol penuh atas event
- **Peserta**: Pengguna yang mengikuti webinar tanpa login, default dalam mode view-only
- **Event**: Sesi webinar dengan ID unik yang dapat diakses melalui URL
- **Active Camera**: Kamera peserta atau host yang sedang publish stream video
- **View-Only Mode**: Mode default peserta dimana mereka hanya dapat melihat stream tanpa publish media
- **Raise Hand**: Fitur permintaan peserta untuk mengaktifkan kamera mereka
- **Moderator**: Host atau pengguna dengan hak untuk approve/reject permintaan peserta
- **WebRTC SFU**: Selective Forwarding Unit untuk routing stream video
- **Cloudflare Calls**: Layanan WebRTC infrastructure dari Cloudflare
- **Supabase Realtime**: Database realtime dengan WebSocket untuk sinkronisasi data
- **MediaRecorder API**: Browser API untuk merekam media stream
- **Anonymous Access**: Akses tanpa autentikasi untuk peserta
- **Event ID**: Identifier unik untuk setiap sesi webinar
- **Session ID**: Identifier untuk tracking presence peserta individual

## Requirements

### Requirement 1

**User Story:** Sebagai admin, saya ingin membuat event webinar dengan konfigurasi tertentu, sehingga saya dapat mengatur batasan dan mode default untuk sesi webinar.

#### Acceptance Criteria

1. WHEN admin membuat event baru, THEN the System SHALL generate Event ID yang unik
2. WHEN admin mengkonfigurasi event, THEN the System SHALL menyimpan maksimal kamera aktif (default 20)
3. WHEN admin mengkonfigurasi event, THEN the System SHALL menyimpan mode default peserta sebagai view-only
4. WHEN Event ID dibuat, THEN the System SHALL generate URL event dalam format /event/{event_id}
5. WHEN event dibuat, THEN the System SHALL menyimpan konfigurasi event ke Supabase dengan status initial

### Requirement 2

**User Story:** Sebagai host, saya ingin login dan memulai webinar dengan kamera dan mikrofon aktif, sehingga peserta dapat melihat dan mendengar saya.

#### Acceptance Criteria

1. WHEN Host melakukan login, THEN the System SHALL autentikasi Host menggunakan Supabase Auth
2. WHEN Host join event, THEN the System SHALL request akses kamera dan mikrofon melalui getUserMedia()
3. WHEN akses media diberikan, THEN the System SHALL publish stream Host ke Cloudflare Calls
4. WHEN Host publish stream, THEN the System SHALL set status kamera Host sebagai ON
5. WHEN Host publish stream, THEN the System SHALL set status mikrofon Host sebagai ON
6. WHEN Host join event, THEN the System SHALL enable opsi recording untuk Host

### Requirement 3

**User Story:** Sebagai peserta, saya ingin join webinar tanpa login dan melihat stream host, sehingga saya dapat mengikuti webinar dengan mudah.

#### Acceptance Criteria

1. WHEN Peserta membuka URL event, THEN the System SHALL memberikan akses tanpa memerlukan autentikasi
2. WHEN Peserta join event, THEN the System SHALL subscribe Peserta ke stream Host dari Cloudflare Calls
3. WHEN Peserta join event, THEN the System SHALL set status kamera Peserta sebagai OFF
4. WHEN Peserta join event, THEN the System SHALL set status mikrofon Peserta sebagai OFF
5. WHEN Peserta join event, THEN the System SHALL set mode Peserta sebagai view-only
6. WHEN Peserta join event, THEN the System SHALL TIDAK request akses media dari browser Peserta

### Requirement 4

**User Story:** Sebagai peserta, saya ingin mengajukan permintaan untuk mengaktifkan kamera saya, sehingga saya dapat berpartisipasi secara visual dalam webinar.

#### Acceptance Criteria

1. WHEN Peserta klik tombol Raise Hand, THEN the System SHALL mengirim permintaan ke Supabase Realtime
2. WHEN permintaan diterima, THEN the System SHALL menampilkan notifikasi ke Moderator
3. WHEN Moderator approve permintaan, THEN the System SHALL validasi jumlah active camera saat ini
4. IF jumlah active camera kurang dari 20, THEN the System SHALL mengaktifkan kamera Peserta
5. IF jumlah active camera sudah mencapai 20, THEN the System SHALL reject permintaan dan mengirim notifikasi ke Peserta
6. WHEN kamera Peserta diaktifkan, THEN the System SHALL request akses media dari browser Peserta
7. WHEN akses media diberikan, THEN the System SHALL publish stream Peserta ke Cloudflare Calls
8. WHEN Peserta selesai berbicara, THEN the System SHALL mengembalikan Peserta ke mode view-only

### Requirement 5

**User Story:** Sebagai peserta, saya ingin melakukan voting secara realtime, sehingga saya dapat memberikan feedback atau pilihan saya dalam webinar.

#### Acceptance Criteria

1. WHEN Peserta submit vote, THEN the System SHALL insert vote ke Supabase dengan anonymous client_id
2. WHEN vote disubmit, THEN the System SHALL broadcast update ke semua Peserta melalui Supabase Realtime channel
3. WHEN Peserta submit vote, THEN the System SHALL apply rate limit untuk mencegah spam voting
4. WHEN vote diterima, THEN the System SHALL update tampilan hasil voting secara realtime untuk semua Peserta
5. WHEN Peserta sudah vote, THEN the System SHALL mencegah Peserta vote ulang untuk opsi yang sama

### Requirement 6

**User Story:** Sebagai peserta, saya ingin mengajukan pertanyaan melalui Q&A, sehingga saya dapat berinteraksi dengan host tanpa mengganggu alur webinar.

#### Acceptance Criteria

1. WHEN Peserta submit pertanyaan, THEN the System SHALL menyimpan pertanyaan ke Supabase dengan status unapproved
2. WHEN pertanyaan tersimpan, THEN the System SHALL menampilkan pertanyaan ke panel Moderator
3. WHEN Moderator approve pertanyaan, THEN the System SHALL update status pertanyaan menjadi approved
4. WHEN pertanyaan diapprove, THEN the System SHALL broadcast pertanyaan ke semua Peserta melalui Supabase Realtime
5. WHEN Moderator pin pertanyaan, THEN the System SHALL menampilkan pertanyaan di posisi teratas panel Q&A

### Requirement 7

**User Story:** Sebagai host, saya ingin merekam sesi webinar secara lokal, sehingga saya dapat menyimpan rekaman untuk keperluan dokumentasi atau distribusi.

#### Acceptance Criteria

1. WHEN Host klik tombol Start Recording, THEN the System SHALL inisialisasi MediaRecorder API dengan stream video stage
2. WHEN recording dimulai, THEN the System SHALL merekam video dari semua active camera
3. WHEN recording dimulai, THEN the System SHALL merekam audio dari Host dan active speakers
4. WHEN Host klik tombol Stop Recording, THEN the System SHALL menghentikan MediaRecorder dan finalisasi file
5. WHEN recording selesai, THEN the System SHALL menyimpan file dalam format .webm ke device Host
6. WHEN recording aktif, THEN the System SHALL menampilkan indikator recording kepada semua Peserta

### Requirement 8

**User Story:** Sebagai sistem, saya ingin menampilkan presence counter secara realtime, sehingga host dan peserta dapat melihat jumlah peserta yang sedang join.

#### Acceptance Criteria

1. WHEN Peserta join event, THEN the System SHALL insert record presence ke Supabase dengan session_id unik
2. WHEN presence berubah, THEN the System SHALL broadcast update jumlah peserta melalui Supabase Realtime
3. WHEN Peserta leave event, THEN the System SHALL remove record presence dari Supabase
4. WHEN koneksi Peserta terputus, THEN the System SHALL otomatis remove presence setelah timeout
5. WHEN presence update, THEN the System SHALL menampilkan jumlah peserta aktif di UI untuk semua pengguna

### Requirement 9

**User Story:** Sebagai moderator, saya ingin mengontrol audio peserta, sehingga saya dapat menjaga kualitas audio webinar.

#### Acceptance Criteria

1. WHEN Peserta join event, THEN the System SHALL set mikrofon Peserta dalam status mute secara default
2. WHEN Moderator unmute Peserta, THEN the System SHALL mengaktifkan mikrofon Peserta
3. WHEN Moderator mute Peserta, THEN the System SHALL menonaktifkan mikrofon Peserta
4. WHEN audio diaktifkan, THEN the System SHALL apply echo cancellation pada audio stream
5. WHEN Peserta berbicara, THEN the System SHALL menampilkan indikator audio level

### Requirement 10

**User Story:** Sebagai host, saya ingin membagikan layar saya, sehingga saya dapat menampilkan presentasi atau konten lain kepada peserta.

#### Acceptance Criteria

1. WHEN Host klik tombol Share Screen, THEN the System SHALL request akses screen share melalui getDisplayMedia()
2. WHEN akses screen share diberikan, THEN the System SHALL publish screen share stream ke Cloudflare Calls
3. WHEN screen share aktif, THEN the System SHALL menampilkan screen share sebagai video utama di stage
4. WHEN Host stop screen share, THEN the System SHALL menghentikan screen share stream dan kembali ke kamera Host
5. WHILE screen share aktif, THEN the System SHALL tetap menampilkan kamera Host dalam ukuran kecil

### Requirement 11

**User Story:** Sebagai sistem, saya ingin menerapkan kontrol keamanan dan batasan, sehingga platform dapat beroperasi dengan aman dan stabil.

#### Acceptance Criteria

1. WHEN event dibuat, THEN the System SHALL generate token-based URL yang unik untuk event
2. WHEN Peserta submit vote, THEN the System SHALL apply rate limit maksimal 1 vote per 5 detik per client
3. WHEN permintaan kamera diterima, THEN the System SHALL validasi bahwa jumlah active camera tidak melebihi 20
4. WHEN Peserta mengakses event, THEN the System SHALL apply Row Level Security (RLS) untuk anonymous insert only
5. WHEN event berakhir, THEN the System SHALL menutup semua Supabase Realtime channel

### Requirement 12

**User Story:** Sebagai host, saya ingin mengakhiri webinar dengan bersih, sehingga semua resource dilepaskan dengan benar.

#### Acceptance Criteria

1. WHEN Host klik End Event, THEN the System SHALL menghentikan recording jika masih aktif
2. WHEN event berakhir, THEN the System SHALL disconnect semua koneksi Cloudflare Calls
3. WHEN event berakhir, THEN the System SHALL menutup semua Supabase Realtime channel
4. WHEN event berakhir, THEN the System SHALL update status event menjadi ended di Supabase
5. WHEN event berakhir, THEN the System SHALL menampilkan notifikasi ke semua Peserta bahwa event telah selesai

### Requirement 13

**User Story:** Sebagai sistem, saya ingin menangani dynamic speaker switching, sehingga video stage dapat menampilkan speaker yang sedang aktif.

#### Acceptance Criteria

1. WHEN Peserta berbicara, THEN the System SHALL detect audio level dari stream Peserta
2. WHEN audio level melebihi threshold, THEN the System SHALL identify Peserta sebagai active speaker
3. WHEN active speaker berubah, THEN the System SHALL update layout video stage untuk highlight active speaker
4. WHEN tidak ada yang berbicara, THEN the System SHALL menampilkan Host sebagai video utama
5. WHILE multiple Peserta berbicara bersamaan, THEN the System SHALL prioritize speaker dengan audio level tertinggi
