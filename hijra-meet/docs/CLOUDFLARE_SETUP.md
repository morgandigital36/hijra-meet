# Cloudflare Calls Setup Guide

This guide will help you set up Cloudflare Calls for WebRTC functionality in Hijra Meet.

## 📋 Prerequisites

- Cloudflare account (https://cloudflare.com)
- Cloudflare Calls enabled on your account

## 🔧 Setup Steps

### 1. Create a Cloudflare Calls Application

1. Go to Cloudflare Dashboard
2. Navigate to **Stream** > **Calls**
3. Click **Create Application**
4. Note down your **App ID**

### 2. Get Your Account ID

1. In Cloudflare Dashboard, go to any domain
2. Look at the URL: `https://dash.cloudflare.com/{account_id}/...`
3. Copy the **Account ID** from the URL

Your Account ID: `a4d9550cb46ebfefb4a826597ae8fb89`

### 3. Generate API Token

1. Go to **My Profile** > **API Tokens**
2. Click **Create Token**
3. Use the **Edit Cloudflare Stream** template
4. Or create a custom token with these permissions:
   - **Account** > **Stream** > **Edit**
5. Click **Continue to Summary** > **Create Token**
6. Copy the generated token (you won't see it again!)

## 🔑 Environment Variables

Add the following to your `.env.local`:

```env
VITE_CLOUDFLARE_ACCOUNT_ID=a4d9550cb46ebfefb4a826597ae8fb89
VITE_CLOUDFLARE_APP_ID=your-app-id-here
VITE_CLOUDFLARE_API_TOKEN=your-api-token-here
```

## 📡 Cloudflare Calls API

Hijra Meet uses the Cloudflare Calls API for WebRTC signaling:

### Create Session

```javascript
POST https://rtc.live.cloudflare.com/v1/apps/{app_id}/sessions/new
Authorization: Bearer {api_token}
Content-Type: application/json

{
  "sessionDescription": {
    "type": "offer",
    "sdp": "..."
  }
}
```

### Join Session

```javascript
POST https://rtc.live.cloudflare.com/v1/apps/{app_id}/sessions/{session_id}/tracks/new
Authorization: Bearer {api_token}
Content-Type: application/json

{
  "sessionDescription": {
    "type": "offer",
    "sdp": "..."
  }
}
```

### Renegotiate

```javascript
PUT https://rtc.live.cloudflare.com/v1/apps/{app_id}/sessions/{session_id}/renegotiate
Authorization: Bearer {api_token}
Content-Type: application/json

{
  "sessionDescription": {
    "type": "offer",
    "sdp": "..."
  }
}
```

### Close Session

```javascript
DELETE https://rtc.live.cloudflare.com/v1/apps/{app_id}/sessions/{session_id}
Authorization: Bearer {api_token}
```

## 🎥 WebRTC Configuration

The app uses the following WebRTC configuration:

```javascript
{
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ]
}
```

Cloudflare Calls handles the TURN servers automatically.

## 🔍 Testing

To test your Cloudflare Calls setup:

1. Start the development server: `npm run dev`
2. Create an event as a host
3. Join the event
4. Check browser console for WebRTC connection logs
5. Verify connection state changes to "connected"

## 📊 Monitoring

Monitor your Cloudflare Calls usage:

1. Go to Cloudflare Dashboard > **Stream** > **Calls**
2. View **Analytics** tab for:
   - Active sessions
   - Total minutes
   - Bandwidth usage

## 💰 Pricing

Cloudflare Calls pricing (as of 2024):

- **Free Tier**: 1,000 minutes/month
- **Pay-as-you-go**: $0.05 per 1,000 minutes

For Hijra Meet with 20 active cameras:
- 1 hour webinar = 20 participants × 60 minutes = 1,200 minutes
- Cost: ~$0.06 per hour

## 🐛 Troubleshooting

### Connection Failed

- Verify API token has correct permissions
- Check Account ID and App ID are correct
- Ensure CORS is configured (Cloudflare handles this automatically)

### No Video/Audio

- Check browser permissions for camera/microphone
- Verify getUserMedia is working in Setup page
- Check WebRTC connection state in console

### High Latency

- Cloudflare Calls uses global edge network
- Latency should be < 100ms for most users
- Check network conditions with browser DevTools

## 📚 Additional Resources

- [Cloudflare Calls Documentation](https://developers.cloudflare.com/calls/)
- [WebRTC API Reference](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [Cloudflare Stream Dashboard](https://dash.cloudflare.com/?to=/:account/stream/calls)

## 🔐 Security Best Practices

1. **Never commit API tokens** to version control
2. Use environment variables for all credentials
3. Rotate API tokens regularly
4. Monitor usage for unusual activity
5. Implement rate limiting on client side

## ✅ Verification Checklist

- [ ] Cloudflare Calls application created
- [ ] Account ID obtained
- [ ] API token generated with correct permissions
- [ ] Environment variables configured
- [ ] Test connection successful
- [ ] Video/audio working in browser
- [ ] Multiple participants can join

## 🚀 Next Steps

After completing the Cloudflare setup:

1. Test with multiple browser tabs
2. Test with different networks
3. Monitor connection quality
4. Implement error handling for connection failures
5. Add reconnection logic for dropped connections
