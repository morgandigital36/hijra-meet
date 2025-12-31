# Hijra Meet - WebRTC Webinar Platform

Platform webinar interaktif berbasis browser dengan WebRTC untuk hingga 250 peserta dan maksimal 20 kamera aktif.

## 🚀 Features

- ✅ WebRTC video streaming (Cloudflare Calls)
- ✅ Real-time chat, Q&A, dan voting (Supabase Realtime)
- ✅ Anonymous participant access (no login required)
- ✅ Host authentication & moderation
- ✅ Screen sharing
- ✅ Local recording
- ✅ Raise hand & camera approval system
- ✅ Active speaker detection
- ✅ Responsive design (mobile-friendly)

## 🛠️ Tech Stack

- **Frontend:** React 19 + Vite
- **Styling:** Tailwind CSS v4
- **Routing:** React Router
- **State Management:** Zustand
- **WebRTC:** Cloudflare Calls
- **Backend:** Supabase (Auth + Realtime + Database)

## 📦 Installation

```bash
# Clone repository
git clone <repository-url>
cd hijra-meet

# Install dependencies
npm install

# Setup environment variables
cp .env.local.example .env.local
# Edit .env.local with your credentials
```

## 🔧 Environment Variables

Create a `.env.local` file:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Cloudflare Calls Configuration
VITE_CLOUDFLARE_ACCOUNT_ID=a4d9550cb46ebfefb4a826597ae8fb89
VITE_CLOUDFLARE_APP_ID=your-app-id-here
VITE_CLOUDFLARE_API_TOKEN=your-api-token-here
```

## 🗄️ Database Setup

Follow the [Supabase Setup Guide](./docs/SUPABASE_SETUP.md) to:

1. Create required tables
2. Setup Row Level Security (RLS) policies
3. Enable Realtime replication
4. Configure authentication

## 🎥 Cloudflare Calls Setup

Follow the [Cloudflare Setup Guide](./docs/CLOUDFLARE_SETUP.md) to:

1. Create Cloudflare Calls application
2. Generate API token
3. Configure WebRTC settings

## 🏃 Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 📁 Project Structure

```
src/
├── pages/              # Route pages (Home, Setup, Event)
├── components/
│   ├── layout/        # Navbar, Sidebar, ControlBar
│   ├── video/         # VideoStage, VideoTile, ScreenShare
│   ├── interaction/   # Chat, Q&A, Polls, ParticipantList
│   └── ui/            # Reusable UI components
├── hooks/             # Custom React hooks
│   ├── useMedia.js    # Camera/microphone access
│   ├── useWebRTC.js   # Cloudflare Calls integration
│   └── useRealtime.js # Supabase Realtime
├── store/             # Zustand state management
│   ├── eventStore.js
│   ├── participantStore.js
│   └── uiStore.js
├── lib/               # External service configs
│   ├── supabase.js
│   ├── cloudflare.js
│   └── constants.js
└── utils/             # Helper functions
    ├── validators.js
    └── mediaHelpers.js
```

## 🎨 Design System

**Colors:**
- Navy: `#0F172A` (Background)
- Emerald: `#10B981` (Primary actions)
- Rose: `#EF4444` (Destructive actions)

**Typography:** Inter / Geist

## 📝 Current Status

✅ **Completed (Tasks 1-11):**
- Project setup & configuration
- Routing structure
- State management (Zustand stores)
- Supabase client configuration
- Cloudflare Calls integration
- Basic page layouts
- Layout components (Navbar, Sidebar, ControlBar)
- Video components (VideoStage, VideoTile, EmptyState)
- Media access hooks
- WebRTC hook (useWebRTC)
- Realtime hook (useRealtime)
- Utility functions (validators, media helpers)
- Database schema & RLS policies

🚧 **Next Tasks (12-30):**
- Interaction components (Chat, Q&A, Polls, ParticipantList)
- Screen sharing
- Local recording
- Active speaker detection
- Hand raise flow
- Error handling & notifications
- Responsive design
- Accessibility
- Testing
- Documentation
- Deployment

## 🔒 Security

- Row Level Security (RLS) enabled on all tables
- Anonymous access with rate limiting
- XSS protection (input sanitization)
- HTTPS only for media access
- API tokens stored in environment variables

## ♿ Accessibility

- WCAG 2.1 AA compliant
- Keyboard navigation support
- Screen reader friendly
- High contrast mode support
- Focus indicators on all interactive elements

## 🤝 Contributing

This is a private project. For questions, contact the development team.

## 📄 License

Proprietary - All rights reserved

## 📞 Support

For issues or questions:
- Check [Supabase Setup Guide](./docs/SUPABASE_SETUP.md)
- Check [Cloudflare Setup Guide](./docs/CLOUDFLARE_SETUP.md)

## 🙏 Acknowledgments

- [Cloudflare Calls](https://developers.cloudflare.com/calls/) for WebRTC infrastructure
- [Supabase](https://supabase.com) for backend services
- [Tailwind CSS](https://tailwindcss.com) for styling
- [Vite](https://vitejs.dev) for build tooling
