// Cloudflare Calls Configuration
const CLOUDFLARE_ACCOUNT_ID = import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_APP_ID = import.meta.env.VITE_CLOUDFLARE_APP_ID;
const CLOUDFLARE_API_TOKEN = import.meta.env.VITE_CLOUDFLARE_API_TOKEN;

/**
 * Cloudflare Calls API Client
 */
export class CloudflareCallsClient {
  constructor() {
    this.accountId = CLOUDFLARE_ACCOUNT_ID;
    this.appId = CLOUDFLARE_APP_ID;
    this.apiToken = CLOUDFLARE_API_TOKEN;
    this.baseUrl = `https://rtc.live.cloudflare.com/v1/apps/${this.appId}`;
    this.sessionCache = new Map();
  }

  async createSession(offer) {
    console.log(`[Cloudflare] Creating session at ${this.baseUrl}/sessions/new`);

    // Ensure offer is provided
    if (!offer || !offer.sdp) {
      throw new Error('createSession require an SDP offer');
    }

    try {
      const response = await fetch(`${this.baseUrl}/sessions/new`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionDescription: {
            type: 'offer',
            sdp: offer.sdp
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Cloudflare] Create Session Failed: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`Cloudflare API Error: ${response.status} ${response.statusText} \nBody: ${errorText}`);
      }

      const data = await response.json();
      return data; // Returns { sessionId, sessionDescription }
    } catch (err) {
      console.error('[Cloudflare] Network/API Error:', err);
      throw err; // Propatage original error
    }
  }

  /**
   * Push tracks (Publish)
   * Returns answer SDP and list of published tracks (mid/name)
   */
  async pushTracks(sessionId, offer, tracks = []) {
    const body = {
      sessionDescription: {
        type: offer.type,
        sdp: offer.sdp,
      },
      tracks: tracks.length > 0 ? tracks : [{ location: 'local', mid: null, trackName: null }],
    };

    console.log('[Cloudflare] pushTracks request:', { sessionId, tracks: body.tracks });

    const response = await fetch(`${this.baseUrl}/sessions/${sessionId}/tracks/new`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Cloudflare] pushTracks Failed: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Cloudflare pushTracks Error: ${response.status} ${response.statusText} \nBody: ${errorText}`);
    }
    return await response.json();
  }

  /**
   * Pull tracks (Subscribe)
   * We request tracks from another session to be added to our session
   */
  async pullTracks(sessionId, offer, remoteTracks) {
    // remoteTracks = [{ location: 'remote', sessionId: 'other-session-id', trackName: 'video-1' }]
    const body = {
      sessionDescription: {
        type: offer.type,
        sdp: offer.sdp,
      },
      tracks: remoteTracks,
    };

    const response = await fetch(`${this.baseUrl}/sessions/${sessionId}/tracks/new`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Cloudflare] pullTracks Failed: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Cloudflare pullTracks Error: ${response.status} - ${errorText}`);
    }
    return await response.json();
  }

  async renegotiate(sessionId, offer) {
    const response = await fetch(`${this.baseUrl}/sessions/${sessionId}/renegotiate`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionDescription: {
          type: offer.type,
          sdp: offer.sdp,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Cloudflare] Renegotiate Failed: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Cloudflare Renegotiate Error: ${response.status} ${response.statusText} \nBody: ${errorText}`);
    }
    const data = await response.json();
    return data;
  }

  async closeSession(sessionId) {
    await fetch(`${this.baseUrl}/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
      },
    });
    return true;
  }
}

export const cloudflareClient = new CloudflareCallsClient();
