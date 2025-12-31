# Cloudflare Calls Setup Guide - Hijra Meet

## 🎥 Cloudflare Calls Integration

Hijra Meet uses Cloudflare Calls for WebRTC video streaming infrastructure.

---

## 🔑 Credentials

Your Cloudflare Calls credentials have been configured:

```
App ID: 5dd481dd7e730a9ce33dd198a4ab4f0a
API Token: 08af5e9f7eb0e0902ba65051d314d2ceac8e58884f6d80b3852c6f1125b55b97
```

These are already added to `.env.local`.

---

## 🏗️ Architecture

### Session-Based Approach

1. **Create Session**: Each event creates a unique Cloudflare Calls session
2. **Publish Stream**: Host and participants publish their media streams
3. **Subscribe**: All participants receive remote streams automatically
4. **SFU Routing**: Cloudflare handles stream routing (Selective Forwarding Unit)

### Flow Diagram

```
┌─────────────┐
│    Host     │
│  (Browser)  │
└──────┬──────┘
       │ 1. Create Session
       ▼
┌─────────────────────┐
│ Cloudflare Calls    │
│   Session Server    │
└──────┬──────────────┘
       │ 2. Session ID
       ▼
┌──────────────────────┐
│   WebRTC Connection  │
│  (Peer Connection)   │
└──────┬───────────────┘
       │ 3. Publish Stream
       ▼
┌─────────────────────┐
│  Cloudflare SFU     │
│  (Stream Router)    │
└──────┬──────────────┘
       │ 4. Forward to Participants
       ▼
┌─────────────┐
│ Participants│
│  (Browsers) │
└─────────────┘
```

---

## 📡 API Endpoints

### 1. Create Session
```
POST https://rtc.live.cloudflare.com/v1/apps/{appId}/sessions/new
Authorization: Bearer {apiToken}

Body:
{
  "sessionDescription": {
    "sessionId": "event-123"
  }
}
```

### 2. Publish Tracks
```
POST https://rtc.live.cloudflare.com/v1/apps/{appId}/sessions/{sessionId}/tracks/new
Authorization: Bearer {apiToken}

Body:
{
  "sessionDescription": {
    "type": "offer",
    "sdp": "..."
  },
  "tracks": [...]
}
```

---

## 🔧 Implementation

### Client Class: `CloudflareCallsClient`

Located in `src/lib/cloudflare.js`

**Key Methods:**
- `createSession(sessionName)`: Create new session
- `initialize(sessionId)`: Initialize WebRTC connection
- `publishStream(stream)`: Publish local media stream
- `unpublishStream()`: Stop publishing
- `subscribeToStreams(callback)`: Listen for remote streams
- `close()`: Cleanup connection

### React Hook: `useWebRTC`

Located in `src/hooks/useWebRTC.js`

**Usage:**
```javascript
const {
  connectionState,
  remoteStreams,
  error,
  sessionId,
  initialize,
  publishStream,
  unpublishStream,
  reconnect,
} = useWebRTC(eventId);

// Initialize
await initialize(true); // true = create new session

// Publish local stream
await publishStream(localMediaStream);

// Remote streams are automatically added to remoteStreams array
```

---

## 🎯 Features

### ✅ Implemented
- Session creation
- WebRTC peer connection setup
- Local stream publishing
- Remote stream subscription
- Connection state monitoring
- Auto-reconnect on failure
- TURN server configuration

### 🚧 To Be Enhanced
- Simulcast support
- Bandwidth adaptation
- Network quality monitoring
- Recording integration
- Screen share optimization

---

## 🔐 Security

### TURN Servers
Cloudflare provides TURN servers for NAT traversal:
```javascript
{
  urls: 'turn:turn.cloudflare.com:3478?transport=udp',
  username: 'cloudflare',
  credential: apiToken,
}
```

### Authentication
- API Token is used for all API calls
- Token should be kept secure (server-side in production)
- Consider using Edge Functions for token management

---

## 📊 Monitoring

### Connection States
- `disconnected`: Not connected
- `connecting`: Establishing connection
- `connected`: Successfully connected
- `failed`: Connection failed (auto-reconnect triggered)

### Logs
Check browser console for:
- Session creation
- ICE candidates
- Track events
- Connection state changes

---

## 🐛 Troubleshooting

### Issue: Connection fails
**Solution:**
- Check API credentials
- Verify network connectivity
- Check browser console for errors
- Ensure HTTPS (required for getUserMedia)

### Issue: No remote streams
**Solution:**
- Verify session ID is shared correctly
- Check if remote participants published streams
- Monitor `ontrack` events in console

### Issue: Poor video quality
**Solution:**
- Check network bandwidth
- Reduce video constraints
- Enable simulcast (future enhancement)

---

## 🚀 Production Considerations

1. **Token Security**
   - Move API token to server-side
   - Use Edge Functions for session creation
   - Implement token rotation

2. **Scalability**
   - Cloudflare Calls handles up to 20 active cameras
   - Consider pagination for large participant lists
   - Implement bandwidth management

3. **Monitoring**
   - Track connection success rate
   - Monitor stream quality metrics
   - Log errors to external service (e.g., Sentry)

4. **Cost Optimization**
   - Monitor usage in Cloudflare dashboard
   - Implement session cleanup
   - Set appropriate timeouts

---

## 📚 Resources

- [Cloudflare Calls Documentation](https://developers.cloudflare.com/calls/)
- [WebRTC API Reference](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [RTCPeerConnection](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection)

---

## ✅ Status

- ✅ Credentials configured
- ✅ Client implementation complete
- ✅ React hook ready
- ✅ TURN servers configured
- ✅ Auto-reconnect implemented
- 🚧 Integration with Event page (in progress)
