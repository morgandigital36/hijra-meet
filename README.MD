Nama konsep: WebRTC Webinar Platform (Google Meet–like, Gratis)
Skala: 250 peserta
Mode: Webinar interaktif
Kamera aktif: max 20
Login peserta: ❌ tidak perlu
Rekaman: ✅ lokal device (host)


🧱 TECHNOLOGY STACK (FINAL)
🎥 Video & Realtime Media
Cloudflare Call
WebRTC SFu
Kamera langsung browser
Free tier (1 TB / bulan)







🧠 Backend (Interaksi & State)
Supabase
Realtime DB (WebSocket)
Anonymous access
Voting, Q&A, presence


🧑‍💻 Frontend
React
Vite

💻 Client
Browser (Chrome / Edge / Firefox
MediaRecorder API (rekaman lokal)

🧠 ARSITEKTUR GLOBAL

HOST (Login)

 ├─ Camera & Mic (Browser)

 ├─ Cloudflare Calls (Publish)

 └─ Local Recording (MediaRecorder)



PESERTA (No Login)

 ├─ View Video (Subscribe)

 ├─ Voting

 ├─ Q&A

 └─ Presence



DATA

 ├─ Supabase Realtime

 └─ Anonymous Access





---



🔄 DETAIL WORKFLOW (END-TO-END)



1️⃣ Pre-Event (Persiapan)



Admin buat Event ID



Set:



Max camera = 20



Mode default = view-only





Generate URL:





/event/{event_id}





---



2️⃣ Host Join (Login)



Host login (Supabase Auth)



Browser:



getUserMedia()



Publish stream ke Cloudflare Calls





Host otomatis:



Kamera ON



Mic ON



Recording available









---



3️⃣ Peserta Join (Tanpa Login)



Buka link event



Browser:



TIDAK publish media



Subscribe stream host





Status:



Kamera OFF



Mic OFF



View-only









---



4️⃣ Raise Hand → ON CAM (Peserta Terbatas)



Peserta klik Raise Hand



Request masuk Supabase



Moderator approve



Sistem cek:





if (active_camera < 20) allow

else reject



Kamera peserta aktif



Setelah selesai → kembali view-only







---



5️⃣ Interaksi Realtime



Voting



Insert vote (anonymous)



Realtime update via Supabase channel





Q&A



Peserta submit pertanyaan



Moderator approve / pin







---



6️⃣ Recording (Host Only)



MediaRecorder aktif



Rekam:



Video stage



Audio host & active speakers





File .webm tersimpan ke device host







---



7️⃣ End Event



Stop recording



Cloudflare Calls disconnect



Supabase channel close







---



🧩 CORE FEATURES (WAJIB)



🎥 Video



[x] WebRTC browser camera



[x] Max 20 active camera



[x] Dynamic speaker switch



[x] Screen share (host only)





🔊 Audio



[x] Default mute peserta



[x] Moderator unmute



[x] Echo cancellation





🗳️ Interaksi



[x] Voting realtime



[x] Q&A moderation



[x] Raise hand



[x] Presence counter





📼 Recording



[x] Local recording



[x] Manual start/stop



[x] Split per session





🔐 Control & Safety



[x] No login peserta



[x] Token-based event URL



[x] Rate limit voting



[x] Max publisher guard







---



🗂️ STRUKTUR PROJECT (REACT + VITE)



src/

 ├─ components/

 │   ├─ VideoStage.jsx

 │   ├─ RaiseHand.jsx

 │   ├─ VotePanel.jsx

 │   ├─ QnA.jsx

 │   ├─ Recorder.jsx

 │   └─ ParticipantCount.jsx

 │

 ├─ pages/

 │   ├─ Event.jsx

 │   └─ Host.jsx

 │

 ├─ lib/

 │   ├─ cloudflareCalls.js

 │   ├─ supabaseClient.js

 │   └─ webrtcUtils.js

 │

 └─ App.jsx





---



🗃️ SUPABASE DATA MODEL (MINIMAL)



events



id



title



max_camera



status





presence



event_id



session_id



joined_at





votes



event_id



option_id



client_id





questions



event_id



text



approved (bool)





> Semua table pakai RLS anonymous insert only









---



📅 DEVELOPMENT PLANNER (REALISTIS)



🟢 PHASE 1 — Core (5–7 hari)



React + Vite setup



Cloudflare Calls basic



View-only peserta



Host publish camera





🟡 PHASE 2 — Interaksi (5 hari)



Supabase realtime



Voting



Q&A



Presence





🟠 PHASE 3 — Advanced (4–6 hari)



Raise hand



Camera limit logic



Recording local



UI polish





🔵 PHASE 4 — Stabilization (3 hari)



Load test



Error handling



SOP host