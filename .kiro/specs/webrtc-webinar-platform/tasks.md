# Implementation Tasks - Hijra Meet Frontend

## Task 1: Project Setup & Configuration

**Description:** Initialize React project dengan Vite, install dependencies, dan setup konfigurasi dasar.

**Dependencies:** None

**Acceptance Criteria:**
- [ ] Project initialized dengan `npm create vite@latest hijra-meet -- --template react`
- [ ] Dependencies installed: `react-router-dom`, `@supabase/supabase-js`, `zustand`, `tailwindcss`
- [ ] Tailwind CSS configured dengan custom colors (#0F172A, #10B981, #EF4444)
- [ ] Folder structure created sesuai design.md
- [ ] Environment variables setup (.env.local dengan VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- [ ] ESLint dan Prettier configured

**Files to Create:**
- `package.json`
- `vite.config.js`
- `tailwind.config.js`
- `.env.local`
- `src/main.jsx`
- `src/App.jsx`

**Estimated Time:** 1 hour

---

## Task 2: Setup Routing & Basic Layout

**Description:** Implement React Router dengan 3 routes utama dan basic layout structure.

**Dependencies:** Task 1

**Acceptance Criteria:**
- [ ] React Router configured dengan routes: `/`, `/setup/:id`, `/event/:id`
- [ ] Basic page components created (Home, Setup, Event)
- [ ] Navigation works correctly between pages
- [ ] 404 page implemented

**Files to Create:**
- `src/pages/Home.jsx`
- `src/pages/Setup.jsx`
- `src/pages/Event.jsx`
- `src/pages/NotFound.jsx`

**Estimated Time:** 1 hour

---

## Task 3: Supabase Client Configuration

**Description:** Setup Supabase client dan create helper functions untuk auth dan realtime.

**Dependencies:** Task 1

**Acceptance Criteria:**
- [ ] Supabase client initialized dengan environment variables
- [ ] Auth helper functions created (signIn, signOut, getUser)
- [ ] Realtime channel helper functions created
- [ ] Error handling implemented

**Files to Create:**
- `src/lib/supabase.js`
- `src/lib/constants.js`

**Estimated Time:** 1 hour

---

## Task 4: State Management Setup (Zustand)

**Description:** Create Zustand stores untuk event, participant, dan UI state.

**Dependencies:** Task 1

**Acceptance Criteria:**
- [ ] eventStore created dengan actions (setEvent, updateLiveStatus, etc.)
- [ ] participantStore created dengan actions (addParticipant, removeParticipant, etc.)
- [ ] uiStore created dengan actions (setSidebarTab, toggleSidebar, etc.)
- [ ] Store persistence configured (optional, untuk local participant info)

**Files to Create:**
- `src/store/eventStore.js`
- `src/store/participantStore.js`
- `src/store/uiStore.js`

**Estimated Time:** 2 hours

---

## Task 5: Home Page Implementation

**Description:** Build landing page dengan input Event ID dan create event button.

**Dependencies:** Task 2, Task 3, Task 4

**Acceptance Criteria:**
- [ ] UI matches design: centered form dengan Hijra Meet branding
- [ ] Input field untuk Event ID dengan validation
- [ ] Toggle untuk Host/Participant mode
- [ ] "Join Event" button navigates ke /setup/:id
- [ ] "Create Event" button (host only) creates event di Supabase dan navigates
- [ ] Error handling untuk invalid Event ID
- [ ] Loading state saat create event

**Files to Create:**
- `src/pages/Home.jsx` (update)
- `src/utils/validators.js`

**Estimated Time:** 2 hours

---

## Task 6: Media Access Hook (useMedia)

**Description:** Create custom hook untuk handle camera dan microphone access.

**Dependencies:** Task 1

**Acceptance Criteria:**
- [ ] `useMedia()` hook returns { stream, devices, error, requestAccess, stopStream }
- [ ] `requestAccess()` calls getUserMedia dengan video dan audio constraints
- [ ] `getDevices()` returns list of available cameras dan microphones
- [ ] Error handling untuk permission denied, device not found
- [ ] Cleanup function stops all tracks on unmount

**Files to Create:**
- `src/hooks/useMedia.js`
- `src/utils/mediaHelpers.js`

**Estimated Time:** 2 hours

---

## Task 7: Setup Page (Waiting Room)

**Description:** Build waiting room untuk device check dan display name input.

**Dependencies:** Task 2, Task 6

**Acceptance Criteria:**
- [ ] Video preview shows local camera stream
- [ ] Audio level indicator shows microphone input
- [ ] Device selector dropdowns (camera, microphone)
- [ ] Display name input field dengan validation
- [ ] Toggle buttons untuk enable/disable camera dan mic
- [ ] "Join Room" button navigates ke /event/:id dengan state
- [ ] Permission request UI jika belum granted
- [ ] Error messages untuk device access failures

**Files to Create:**
- `src/pages/Setup.jsx` (update)
- `src/components/video/VideoPreview.jsx`
- `src/components/DeviceSelector.jsx`

**Estimated Time:** 3 hours

---

## Task 8: Layout Components (Navbar, Sidebar, ControlBar)

**Description:** Build reusable layout components untuk Event page.

**Dependencies:** Task 2, Task 4

**Acceptance Criteria:**
- [ ] **Navbar:** Shows event name, LIVE badge, participant count, timer
- [ ] **Navbar:** Recording indicator bar (conditional)
- [ ] **Sidebar:** Tab navigation (Chat, Q&A, Polls, People)
- [ ] **Sidebar:** Content area renders active tab component
- [ ] **ControlBar:** Buttons untuk Mic, Camera, Hand Raise, Leave
- [ ] **ControlBar:** Screen Share dan Record buttons (host only)
- [ ] All buttons have proper icons dan tooltips
- [ ] Responsive design (sidebar collapses on mobile)

**Files to Create:**
- `src/components/layout/Navbar.jsx`
- `src/components/layout/Sidebar.jsx`
- `src/components/layout/ControlBar.jsx`

**Estimated Time:** 4 hours

---

## Task 9: Video Components (VideoStage, VideoTile)

**Description:** Build video grid system dengan dynamic layout.

**Dependencies:** Task 4

**Acceptance Criteria:**
- [ ] **VideoStage:** Dynamic grid layout based on stream count (1, 2-4, 5-9, 10-20)
- [ ] **VideoStage:** Smooth transitions saat layout berubah
- [ ] **VideoTile:** Video element dengan proper stream attachment
- [ ] **VideoTile:** Name label, role badge, mute indicator
- [ ] **VideoTile:** Speaking indicator (border animation)
- [ ] **VideoTile:** Placeholder image jika video error
- [ ] **EmptyState:** Shows logo dan message saat no active cameras
- [ ] Responsive grid (adjusts on mobile)

**Files to Create:**
- `src/components/video/VideoStage.jsx`
- `src/components/video/VideoTile.jsx`
- `src/components/video/EmptyState.jsx`

**Estimated Time:** 4 hours

---

## Task 10: WebRTC Hook (useWebRTC) - Cloudflare Calls Integration

**Description:** Create custom hook untuk handle WebRTC connections via Cloudflare Calls.

**Dependencies:** Task 4, Task 6

**Acceptance Criteria:**
- [ ] `useWebRTC()` hook initializes Cloudflare Calls client
- [ ] `publishStream()` publishes local media stream
- [ ] `subscribeToStreams()` subscribes to remote streams
- [ ] `unpublishStream()` stops publishing
- [ ] Track connection state (connecting, connected, disconnected)
- [ ] Handle ICE connection failures dengan auto-reconnect
- [ ] Cleanup function closes all connections

**Files to Create:**
- `src/hooks/useWebRTC.js`
- `src/lib/cloudflare.js`

**Estimated Time:** 5 hours

**Note:** Requires Cloudflare Calls API documentation review

---

## Task 11: Realtime Hook (useRealtime) - Supabase Channels

**Description:** Create custom hook untuk handle Supabase Realtime subscriptions.

**Dependencies:** Task 3, Task 4

**Acceptance Criteria:**
- [ ] `useRealtime()` hook subscribes to event channel
- [ ] `sendMessage()` broadcasts message to channel
- [ ] `onMessage()` callback receives realtime updates
- [ ] Handle presence tracking (join/leave events)
- [ ] Handle channel subscription errors dengan retry logic
- [ ] Cleanup function unsubscribes from channels

**Files to Create:**
- `src/hooks/useRealtime.js`

**Estimated Time:** 3 hours

---

## Task 12: Chat Component

**Description:** Build real-time chat interface.

**Dependencies:** Task 8, Task 11

**Acceptance Criteria:**
- [ ] Message list dengan auto-scroll to bottom
- [ ] Message bubbles show sender name dan timestamp
- [ ] Input field dengan send button
- [ ] Enter key sends message
- [ ] Rate limiting (1 message per second)
- [ ] Message sanitization (prevent XSS)
- [ ] Loading state saat sending
- [ ] Error handling untuk failed sends

**Files to Create:**
- `src/components/interaction/ChatBox.jsx`
- `src/components/interaction/MessageBubble.jsx`

**Estimated Time:** 3 hours

---

## Task 13: Q&A Panel Component

**Description:** Build Q&A interface dengan upvote dan moderation.

**Dependencies:** Task 8, Task 11

**Acceptance Criteria:**
- [ ] Question list sorted by pinned, then upvotes
- [ ] Submit question form (participants)
- [ ] Upvote button dengan count
- [ ] Approve button (host only)
- [ ] Pin button (host only)
- [ ] Pinned questions show at top dengan indicator
- [ ] Unapproved questions hidden dari participants
- [ ] Real-time updates untuk new questions dan upvotes

**Files to Create:**
- `src/components/interaction/QnAPanel.jsx`
- `src/components/interaction/QuestionCard.jsx`

**Estimated Time:** 4 hours

---

## Task 14: Poll Component

**Description:** Build voting interface dengan real-time results.

**Dependencies:** Task 8, Task 11

**Acceptance Criteria:**
- [ ] Poll question display
- [ ] Option buttons (radio style)
- [ ] Submit vote button
- [ ] Results bar chart dengan percentages
- [ ] Rate limiting (1 vote per 5 seconds)
- [ ] Disable voting after submission
- [ ] Real-time result updates
- [ ] Visual feedback saat voting

**Files to Create:**
- `src/components/interaction/PollView.jsx`
- `src/components/interaction/PollResults.jsx`

**Estimated Time:** 3 hours

---

## Task 15: Participant List Component

**Description:** Build participant list dengan hand raise management.

**Dependencies:** Task 8, Task 11

**Acceptance Criteria:**
- [ ] Participant list dengan name, role, status icons
- [ ] Hand raise indicator (animated)
- [ ] Approve hand raise button (host only)
- [ ] Mute participant button (host only)
- [ ] Real-time updates untuk participant join/leave
- [ ] Search/filter participants (if > 50)
- [ ] Show camera/mic status icons

**Files to Create:**
- `src/components/interaction/ParticipantList.jsx`
- `src/components/interaction/ParticipantItem.jsx`

**Estimated Time:** 3 hours

---

## Task 16: Screen Share Feature

**Description:** Implement screen sharing untuk host.

**Dependencies:** Task 9, Task 10

**Acceptance Criteria:**
- [ ] Screen share button di ControlBar (host only)
- [ ] `getDisplayMedia()` request saat button clicked
- [ ] Screen share stream published ke WebRTC
- [ ] **ScreenShare component** shows full-width screen share
- [ ] Host camera shows as picture-in-picture (bottom-right)
- [ ] Stop screen share button
- [ ] Handle screen share ended by user (browser UI)
- [ ] Fallback to camera view saat screen share stops

**Files to Create:**
- `src/components/video/ScreenShare.jsx` (update)
- `src/hooks/useScreenShare.js`

**Estimated Time:** 3 hours

---

## Task 17: Recording Feature

**Description:** Implement local recording menggunakan MediaRecorder API.

**Dependencies:** Task 9, Task 10

**Acceptance Criteria:**
- [ ] Record button di ControlBar (host only)
- [ ] `useRecording()` hook initializes MediaRecorder
- [ ] Recording captures video stage dan audio
- [ ] Recording indicator shows di Navbar (red bar)
- [ ] Stop recording button
- [ ] Download recorded file (.webm) saat stopped
- [ ] Handle recording errors (codec not supported, etc.)
- [ ] Show recording duration timer

**Files to Create:**
- `src/hooks/useRecording.js`

**Estimated Time:** 3 hours

---

## Task 18: Event Page Integration

**Description:** Integrate semua components di Event page dan implement main logic.

**Dependencies:** Task 8, 9, 10, 11

**Acceptance Criteria:**
- [ ] Event page layout complete (Navbar + VideoStage + Sidebar + ControlBar)
- [ ] WebRTC connection initialized on mount
- [ ] Realtime channels subscribed on mount
- [ ] Local stream published after join
- [ ] Remote streams rendered di VideoStage
- [ ] Sidebar tabs switch correctly
- [ ] ControlBar buttons work (mute, camera, hand raise)
- [ ] Leave button shows confirmation dialog
- [ ] Cleanup all connections on unmount
- [ ] Handle page refresh (reconnect logic)

**Files to Create:**
- `src/pages/Event.jsx` (update)

**Estimated Time:** 4 hours

---

## Task 19: Hand Raise Flow Implementation

**Description:** Implement complete hand raise flow (participant request → host approve → camera enable).

**Dependencies:** Task 10, Task 11, Task 15

**Acceptance Criteria:**
- [ ] Participant clicks "Raise Hand" button
- [ ] Request sent via Supabase Realtime
- [ ] Host sees notification di ParticipantList
- [ ] Host clicks "Approve" button
- [ ] System validates camera limit (< 20)
- [ ] If approved, participant receives permission
- [ ] Participant's camera automatically enabled
- [ ] Participant's stream published to WebRTC
- [ ] If rejected (limit reached), participant sees error message
- [ ] Hand raise indicator removed after approval/rejection

**Files to Modify:**
- `src/components/layout/ControlBar.jsx`
- `src/components/interaction/ParticipantList.jsx`
- `src/hooks/useWebRTC.js`
- `src/hooks/useRealtime.js`

**Estimated Time:** 4 hours

---

## Task 20: Active Speaker Detection

**Description:** Implement audio level detection untuk highlight active speaker.

**Dependencies:** Task 9, Task 10

**Acceptance Criteria:**
- [ ] Audio level monitoring untuk each stream
- [ ] Detect speaker when audio level > threshold
- [ ] Update `isSpeaking` state di participantStore
- [ ] VideoTile shows speaking indicator (border animation)
- [ ] VideoStage prioritizes active speaker (larger tile or center position)
- [ ] Smooth transitions between speakers
- [ ] Fallback to host jika no one speaking

**Files to Modify:**
- `src/hooks/useWebRTC.js`
- `src/components/video/VideoTile.jsx`
- `src/components/video/VideoStage.jsx`

**Estimated Time:** 3 hours

---

## Task 21: Error Handling & User Feedback

**Description:** Implement comprehensive error handling dan user notifications.

**Dependencies:** All previous tasks

**Acceptance Criteria:**
- [ ] Toast notification system implemented
- [ ] Error messages untuk media access failures
- [ ] Error messages untuk WebRTC connection failures
- [ ] Error messages untuk Supabase errors
- [ ] Loading states untuk async operations
- [ ] Reconnection UI saat connection lost
- [ ] Offline indicator
- [ ] Rate limit warnings

**Files to Create:**
- `src/components/ui/Toast.jsx`
- `src/components/ui/LoadingSpinner.jsx`
- `src/hooks/useToast.js`

**Estimated Time:** 3 hours

---

## Task 22: Responsive Design & Mobile Optimization

**Description:** Ensure UI works well on mobile devices.

**Dependencies:** All component tasks

**Acceptance Criteria:**
- [ ] Sidebar collapses to bottom sheet on mobile
- [ ] Video grid adjusts untuk portrait orientation
- [ ] ControlBar buttons sized appropriately untuk touch
- [ ] Font sizes readable on small screens
- [ ] Test on iOS Safari dan Android Chrome
- [ ] Handle mobile keyboard (input fields)
- [ ] Landscape mode optimization

**Files to Modify:**
- All component files (add responsive Tailwind classes)

**Estimated Time:** 4 hours

---

## Task 23: Accessibility Implementation

**Description:** Implement WCAG 2.1 AA compliance.

**Dependencies:** All component tasks

**Acceptance Criteria:**
- [ ] All buttons have `aria-label`
- [ ] Keyboard navigation works (Tab, Enter, Space)
- [ ] Focus indicators visible
- [ ] Screen reader announcements untuk participant join/leave
- [ ] `aria-live` regions untuk chat dan notifications
- [ ] Keyboard shortcuts implemented (M, V, H)
- [ ] High contrast mode tested
- [ ] Color contrast ratios meet AA standard

**Files to Modify:**
- All component files (add ARIA attributes)

**Estimated Time:** 3 hours

---

## Task 24: Performance Optimization

**Description:** Optimize rendering dan memory usage.

**Dependencies:** All previous tasks

**Acceptance Criteria:**
- [ ] React.memo applied to VideoTile components
- [ ] Code splitting dengan React.lazy untuk routes
- [ ] Debouncing applied to chat input
- [ ] Virtual scrolling untuk participant list (if > 100)
- [ ] WebRTC stats monitoring (packet loss, jitter)
- [ ] Memory leak testing dengan 20 streams
- [ ] FPS monitoring untuk video rendering
- [ ] Bundle size optimization (< 500KB gzipped)

**Files to Modify:**
- Various component files
- `src/App.jsx` (lazy loading)

**Estimated Time:** 4 hours

---

## Task 25: Testing - Unit Tests

**Description:** Write unit tests untuk components dan hooks.

**Dependencies:** All previous tasks

**Acceptance Criteria:**
- [ ] Test setup dengan Vitest dan React Testing Library
- [ ] Component rendering tests (all major components)
- [ ] Hook logic tests (useWebRTC, useRealtime, useMedia)
- [ ] Utility function tests (validators, mediaHelpers)
- [ ] Store tests (Zustand actions)
- [ ] Mock Supabase client
- [ ] Mock WebRTC APIs
- [ ] Coverage > 70%

**Files to Create:**
- `src/__tests__/components/*.test.jsx`
- `src/__tests__/hooks/*.test.js`
- `src/__tests__/utils/*.test.js`
- `vitest.config.js`

**Estimated Time:** 6 hours

---

## Task 26: Testing - Integration Tests

**Description:** Write integration tests untuk critical flows.

**Dependencies:** Task 25

**Acceptance Criteria:**
- [ ] Test: Home → Setup → Event flow
- [ ] Test: WebRTC connection establishment
- [ ] Test: Supabase realtime subscription
- [ ] Test: Hand raise approval flow
- [ ] Test: Chat message send/receive
- [ ] Test: Vote submission dan results update
- [ ] Mock external services (Cloudflare, Supabase)

**Files to Create:**
- `src/__tests__/integration/*.test.jsx`

**Estimated Time:** 4 hours

---

## Task 27: Testing - E2E Tests

**Description:** Write end-to-end tests dengan Playwright.

**Dependencies:** Task 26

**Acceptance Criteria:**
- [ ] Playwright setup
- [ ] Test: Host creates event dan starts webinar
- [ ] Test: Participant joins event
- [ ] Test: Multi-user scenario (host + 2 participants)
- [ ] Test: Screen share flow
- [ ] Test: Recording flow
- [ ] Test: Chat interaction
- [ ] Test on Chrome, Firefox, Safari

**Files to Create:**
- `e2e/*.spec.js`
- `playwright.config.js`

**Estimated Time:** 6 hours

---

## Task 28: Documentation

**Description:** Write comprehensive documentation.

**Dependencies:** All previous tasks

**Acceptance Criteria:**
- [ ] README.md dengan setup instructions
- [ ] Component documentation (JSDoc comments)
- [ ] Hook documentation dengan usage examples
- [ ] Environment variables documentation
- [ ] Deployment guide
- [ ] Troubleshooting guide
- [ ] API integration guide (Cloudflare Calls, Supabase)

**Files to Create:**
- `README.md` (update)
- `docs/SETUP.md`
- `docs/DEPLOYMENT.md`
- `docs/TROUBLESHOOTING.md`

**Estimated Time:** 3 hours

---

## Task 29: Production Build & Deployment

**Description:** Prepare production build dan deploy.

**Dependencies:** All previous tasks

**Acceptance Criteria:**
- [ ] Production build optimized (`npm run build`)
- [ ] Environment variables configured untuk production
- [ ] Deploy to Vercel/Netlify
- [ ] Custom domain configured
- [ ] HTTPS enabled
- [ ] Error tracking setup (Sentry)
- [ ] Analytics setup (optional)
- [ ] Performance monitoring

**Files to Create:**
- `vercel.json` or `netlify.toml`
- `.env.production`

**Estimated Time:** 2 hours

---

## Task 30: Final Testing & Bug Fixes

**Description:** Comprehensive testing dan bug fixing.

**Dependencies:** Task 29

**Acceptance Criteria:**
- [ ] Manual testing checklist completed
- [ ] Test dengan 20 active cameras
- [ ] Test dengan poor network (throttling)
- [ ] Test permission denied scenarios
- [ ] Test on multiple browsers
- [ ] Test on mobile devices
- [ ] Fix all critical bugs
- [ ] Performance profiling

**Estimated Time:** 6 hours

---

## Summary

**Total Tasks:** 30
**Estimated Total Time:** 95 hours (~12 working days)

**Critical Path:**
1. Setup (Tasks 1-4)
2. Core Pages (Tasks 5, 7, 18)
3. WebRTC Integration (Tasks 6, 10, 16, 17)
4. Realtime Features (Tasks 11-15, 19)
5. Polish & Testing (Tasks 21-30)

**Priority Order:**
- **Phase 1 (MVP):** Tasks 1-11, 18 (Basic webinar functionality)
- **Phase 2 (Interactions):** Tasks 12-15, 19 (Chat, Q&A, Polls, Hand Raise)
- **Phase 3 (Advanced):** Tasks 16-17, 20 (Screen Share, Recording, Speaker Detection)
- **Phase 4 (Polish):** Tasks 21-24 (Error Handling, Responsive, A11y, Performance)
- **Phase 5 (Quality):** Tasks 25-30 (Testing, Docs, Deployment)
