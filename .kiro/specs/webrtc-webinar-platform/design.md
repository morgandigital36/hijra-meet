# Design Document - Hijra Meet Frontend

## Overview

Hijra Meet adalah platform webinar berbasis WebRTC dengan UI yang bersih, profesional, dan minimalis. Frontend dibangun menggunakan React dengan Tailwind CSS, mengintegrasikan Cloudflare Calls untuk WebRTC dan Supabase Realtime untuk interaksi.

**Tech Stack:**
- React 18+ (dengan Vite)
- Tailwind CSS (styling)
- React Router (routing)
- Cloudflare Calls SDK (WebRTC)
- Supabase Client (realtime & auth)
- Zustand (state management)

**Design Philosophy:**
- Clean & Professional UI seperti Google Meet
- Rich interaction sidebar seperti Zoom
- Responsive & accessible
- Real-time updates untuk semua interaksi

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser Client                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Pages      │  │  Components  │  │    Hooks     │      │
│  │              │  │              │  │              │      │
│  │ - Home       │  │ - Layout     │  │ - useWebRTC  │      │
│  │ - Setup      │  │ - Video      │  │ - useRealtime│      │
│  │ - Event      │  │ - Interaction│  │ - useMedia   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                   ┌────────▼────────┐                        │
│                   │  State Manager  │                        │
│                   │    (Zustand)    │                        │
│                   └────────┬────────┘                        │
│                            │                                 │
│         ┌──────────────────┴──────────────────┐              │
│         │                                     │              │
│    ┌────▼─────┐                      ┌───────▼──────┐       │
│    │Cloudflare│                      │   Supabase   │       │
│    │  Calls   │                      │   Realtime   │       │
│    └──────────┘                      └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Folder Structure

```
src/
├── pages/
│   ├── Home.jsx              # Landing page dengan input Event ID
│   ├── Setup.jsx             # Waiting room (device check)
│   └── Event.jsx             # Main webinar stage
├── components/
│   ├── layout/
│   │   ├── Navbar.jsx        # Top header (event name, timer, count)
│   │   ├── Sidebar.jsx       # Right sidebar wrapper
│   │   └── ControlBar.jsx    # Bottom control buttons
│   ├── video/
│   │   ├── VideoStage.jsx    # Dynamic grid layout
│   │   ├── VideoTile.jsx     # Individual video frame
│   │   ├── ScreenShare.jsx   # Screen share view
│   │   └── EmptyState.jsx    # Placeholder when no video
│   └── interaction/
│       ├── ChatBox.jsx       # Real-time chat
│       ├── QnAPanel.jsx      # Q&A with upvote
│       ├── PollView.jsx      # Voting interface
│       └── ParticipantList.jsx # List peserta
├── hooks/
│   ├── useWebRTC.js          # Cloudflare Calls integration
│   ├── useRealtime.js        # Supabase realtime channels
│   ├── useMedia.js           # Camera/mic access
│   └── useRecording.js       # Local recording
├── store/
│   ├── eventStore.js         # Event state (Zustand)
│   ├── participantStore.js   # Participants state
│   └── uiStore.js            # UI state (sidebar tabs, etc)
├── lib/
│   ├── supabase.js           # Supabase client config
│   ├── cloudflare.js         # Cloudflare Calls config
│   └── constants.js          # Colors, limits, etc
└── utils/
    ├── mediaHelpers.js       # Media stream utilities
    └── validators.js         # Input validation
```

## Components and Interfaces

### 1. Pages

#### Home.jsx
**Purpose:** Landing page untuk join atau create event

**Props:** None

**State:**
- `eventId` (string): Input dari user
- `isHost` (boolean): Toggle host/participant mode

**Key Functions:**
- `handleJoinEvent()`: Navigate ke /setup/:id
- `handleCreateEvent()`: Create event via Supabase, navigate ke /setup/:id

---

#### Setup.jsx
**Purpose:** Waiting room untuk device check dan display name

**Props:**
- `eventId` (from URL params)

**State:**
- `displayName` (string)
- `videoEnabled` (boolean)
- `audioEnabled` (boolean)
- `devices` (array): Available cameras/mics

**Key Functions:**
- `requestMediaAccess()`: Call getUserMedia()
- `handleJoinRoom()`: Navigate ke /event/:id dengan state

---

#### Event.jsx
**Purpose:** Main webinar stage

**Props:**
- `eventId` (from URL params)

**State:**
- Managed by Zustand stores

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ Navbar (Event Name | LIVE | 👥 125)                     │
├──────────────────────────────────┬──────────────────────┤
│                                  │                      │
│                                  │   Sidebar            │
│         VideoStage               │   ┌──────────────┐   │
│         (Dynamic Grid)           │   │ Tabs:        │   │
│                                  │   │ - Chat       │   │
│                                  │   │ - Q&A        │   │
│                                  │   │ - Polls      │   │
│                                  │   │ - People     │   │
│                                  │   └──────────────┘   │
├──────────────────────────────────┴──────────────────────┤
│         ControlBar (Mic | Cam | Hand | Leave)           │
└─────────────────────────────────────────────────────────┘
```

**Key Functions:**
- `useEffect()`: Initialize WebRTC & Realtime connections
- `handleLeave()`: Cleanup and navigate to home

---

### 2. Layout Components

#### Navbar.jsx
**Props:**
- `eventName` (string)
- `isLive` (boolean)
- `participantCount` (number)
- `duration` (number): Seconds since start

**UI Elements:**
- Event title (left)
- LIVE badge (center-left)
- Timer (center)
- Participant count (right)
- Recording indicator (top bar, conditional)

---

#### Sidebar.jsx
**Props:**
- `activeTab` (string): 'chat' | 'qna' | 'polls' | 'people'
- `onTabChange` (function)

**UI Elements:**
- Tab navigation
- Content area (renders active tab component)

---

#### ControlBar.jsx
**Props:**
- `role` (string): 'host' | 'participant'
- `audioEnabled` (boolean)
- `videoEnabled` (boolean)
- `handRaised` (boolean)
- `onToggleAudio` (function)
- `onToggleVideo` (function)
- `onRaiseHand` (function)
- `onLeave` (function)

**UI Elements:**
- Mic button (with mute indicator)
- Camera button
- Raise Hand button (participants only)
- Screen Share button (host only)
- Record button (host only)
- Leave button (red)

---

### 3. Video Components

#### VideoStage.jsx
**Props:**
- `streams` (array): Active media streams
- `screenShare` (object | null): Screen share stream

**State:**
- `gridLayout` (string): Computed based on stream count

**Key Functions:**
- `getGridClass()`: Returns Tailwind grid class
- `renderStreams()`: Map streams to VideoTile components

**Grid Logic:**
- 1 stream: `grid-cols-1` (full screen)
- 2-4 streams: `grid-cols-2` (2x2)
- 5-9 streams: `grid-cols-3` (3x3)
- 10-20 streams: `grid-cols-4` (4x5)

---

#### VideoTile.jsx
**Props:**
- `stream` (MediaStream)
- `participant` (object): { id, name, role, isMuted, isSpeaking }
- `isScreenShare` (boolean)

**UI Elements:**
- Video element (ref to stream)
- Name label (bottom-left)
- Role badge (top-left): "Host" | "Speaker"
- Mute indicator (bottom-right)
- Speaking indicator (border animation)

**Key Functions:**
- `useEffect()`: Attach stream to video element
- `handleVideoError()`: Show placeholder on error

---

#### ScreenShare.jsx
**Props:**
- `stream` (MediaStream)
- `hostName` (string)

**UI Elements:**
- Full-width video element
- Small host camera (picture-in-picture, bottom-right)

---

#### EmptyState.jsx
**Props:**
- `message` (string): Custom message

**UI Elements:**
- Hijra Meet logo
- Message text: "Menunggu Host memulai siaran..."

---

### 4. Interaction Components

#### ChatBox.jsx
**Props:**
- `eventId` (string)
- `userId` (string)

**State:**
- `messages` (array): { id, sender, text, timestamp }
- `inputText` (string)

**Key Functions:**
- `sendMessage()`: Insert to Supabase, broadcast via Realtime
- `useEffect()`: Subscribe to chat channel

**UI Elements:**
- Message list (scrollable)
- Input field + Send button

---

#### QnAPanel.jsx
**Props:**
- `eventId` (string)
- `isHost` (boolean)

**State:**
- `questions` (array): { id, text, upvotes, isPinned, isApproved }
- `inputText` (string)

**Key Functions:**
- `submitQuestion()`: Insert to Supabase
- `upvoteQuestion()`: Update upvote count
- `approveQuestion()`: Host only, set isApproved = true
- `pinQuestion()`: Host only, set isPinned = true

**UI Elements:**
- Question list (sorted by pinned, then upvotes)
- Input field (participants)
- Approve/Pin buttons (host only)

---

#### PollView.jsx
**Props:**
- `eventId` (string)
- `poll` (object): { id, question, options, results }

**State:**
- `selectedOption` (string | null)
- `hasVoted` (boolean)

**Key Functions:**
- `submitVote()`: Insert to Supabase with rate limit check
- `useEffect()`: Subscribe to poll results channel

**UI Elements:**
- Poll question
- Option buttons (disabled after vote)
- Results bar chart (real-time)

---

#### ParticipantList.jsx
**Props:**
- `participants` (array): { id, name, role, handRaised, cameraOn }
- `isHost` (boolean)

**Key Functions:**
- `approveHandRaise()`: Host only, enable camera for participant
- `muteParticipant()`: Host only, mute participant

**UI Elements:**
- Participant list with status icons
- Hand raise indicator
- Approve button (host only)

---

## Data Models

### Zustand Stores

#### eventStore.js
```javascript
{
  eventId: string,
  eventName: string,
  isLive: boolean,
  startTime: Date,
  maxCameras: number,
  activeCameraCount: number,
  isRecording: boolean
}
```

#### participantStore.js
```javascript
{
  participants: [
    {
      id: string,
      name: string,
      role: 'host' | 'participant',
      cameraOn: boolean,
      micOn: boolean,
      handRaised: boolean,
      isSpeaking: boolean,
      stream: MediaStream | null
    }
  ],
  localParticipant: { ... }
}
```

#### uiStore.js
```javascript
{
  sidebarTab: 'chat' | 'qna' | 'polls' | 'people',
  sidebarOpen: boolean,
  notifications: []
}
```

---

## Correctness Properties

### WebRTC Connection
- **Property:** All participants must receive streams within 3 seconds of joining
- **Verification:** Monitor connection state and track time-to-first-frame
- **Error Handling:** Show reconnection UI if connection fails

### Camera Limit
- **Property:** Maximum 20 active cameras at any time
- **Verification:** Check `activeCameraCount` before approving hand raise
- **Error Handling:** Show "Camera limit reached" notification

### Realtime Sync
- **Property:** All interactions (chat, votes, Q&A) must sync within 500ms
- **Verification:** Timestamp comparison between send and receive
- **Error Handling:** Show "Connection slow" warning if latency > 1s

### Audio/Video Quality
- **Property:** Video must be at least 480p, audio at 48kHz
- **Verification:** Check MediaStreamTrack settings
- **Error Handling:** Fallback to lower quality if bandwidth insufficient

---

## Error Handling

### Media Access Errors
```javascript
try {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
} catch (error) {
  if (error.name === 'NotAllowedError') {
    // Show permission denied message
  } else if (error.name === 'NotFoundError') {
    // Show no device found message
  }
}
```

### WebRTC Connection Errors
- **ICE Connection Failed:** Show reconnection dialog
- **Peer Connection Closed:** Auto-reconnect with exponential backoff
- **Stream Ended:** Remove participant from grid

### Supabase Realtime Errors
- **Channel Subscription Failed:** Retry 3 times with 2s delay
- **Message Send Failed:** Queue message and retry
- **Connection Lost:** Show offline indicator

### Rate Limiting
- **Vote Spam:** Block votes for 5 seconds after submission
- **Chat Spam:** Limit to 1 message per second
- **Hand Raise Spam:** Disable button for 10 seconds after raise

---

## Testing Strategy

### Unit Tests (Vitest)
- Component rendering tests
- Hook logic tests (useWebRTC, useRealtime)
- Utility function tests (grid layout calculation)

### Integration Tests
- WebRTC connection flow
- Supabase realtime subscription
- Media device access

### E2E Tests (Playwright)
- Complete user journey: Home → Setup → Event
- Host creates event, participant joins
- Chat, Q&A, voting interactions
- Screen share and recording

### Manual Testing Checklist
- [ ] Test on Chrome, Firefox, Safari
- [ ] Test on mobile (responsive)
- [ ] Test with 20 active cameras
- [ ] Test with poor network (throttling)
- [ ] Test permission denied scenarios
- [ ] Test with multiple tabs (same user)

---

## Performance Considerations

### Optimization Strategies
1. **Lazy Loading:** Code-split routes with React.lazy()
2. **Memoization:** Use React.memo for VideoTile components
3. **Virtual Scrolling:** For participant list (if > 100 participants)
4. **Debouncing:** Chat input and Q&A submission
5. **WebRTC Optimization:** Use SFU (Cloudflare Calls) instead of mesh

### Monitoring
- Track FPS for video rendering
- Monitor memory usage (especially with 20 streams)
- Log WebRTC stats (packet loss, jitter, RTT)

---

## Security Considerations

### Client-Side Security
- Validate all user inputs (event ID, display name)
- Sanitize chat messages (prevent XSS)
- Use HTTPS only for media access
- Implement CORS properly for Supabase

### Privacy
- No PII stored without consent
- Anonymous participants use generated IDs
- Local recording stays on device (no auto-upload)

---

## Accessibility

### WCAG 2.1 AA Compliance
- Keyboard navigation for all controls
- ARIA labels for buttons and status indicators
- Screen reader announcements for participant join/leave
- High contrast mode support
- Focus indicators on all interactive elements

### Specific Implementations
- `aria-label` on icon-only buttons
- `role="status"` for live participant count
- `aria-live="polite"` for chat messages
- Keyboard shortcuts: M (mute), V (video), H (hand raise)
