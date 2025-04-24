// src/js/data/story-api-source.js
import API_ENDPOINT from '../config/api-endpoint.js';
import Auth from '../utils/auth.js'; // Untuk ambil token

class StoryApiSource {
  static async _fetchWithAuth(url, options = {}) {
    const token = Auth.getToken();
    // Pengecualian: register dan login tidak butuh token awal
    const requiresAuth = !options.isGuest;

    if (requiresAuth && !token) {
        console.error('No auth token found for protected route:', url);
        throw new Error('User not logged in or token missing');
    }

    const headers = {
      ...options.headers,
    };

    // Tambahkan Authorization jika diperlukan dan bukan FormData (browser handle)
    if (requiresAuth && token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Set default Content-Type jika bukan FormData dan belum diatur
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    // Hapus Content-Type eksplisit untuk FormData, biarkan browser menanganinya
    if (options.body instanceof FormData) {
        delete headers['Content-Type'];
    }


    try {
        const response = await fetch(url, {
            ...options,
            headers,
        });

        // Coba parse JSON, tapi tangani jika response kosong (misal 204 No Content)
        let responseJson = {};
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
             responseJson = await response.json();
        } else if (response.ok && response.status !== 204) {
            // Jika response OK tapi bukan JSON (misal text), log saja
             console.log('Received non-JSON response:', await response.text());
        }


        if (!response.ok) {
             const errorMessage = responseJson.message || response.statusText || `API request failed with status ${response.status}`;
             console.error('API Error:', errorMessage, 'Response:', responseJson);
             throw new Error(errorMessage);
        }

        // Kembalikan JSON jika ada, atau objek kosong jika tidak
        return responseJson;

    } catch (error) {
      // Log error asli sebelum melempar ulang
      console.error(`Fetch error during request to ${url}:`, error);
      // Melempar ulang error agar bisa ditangkap oleh pemanggil (presenter)
      // Pastikan message error informatif
      throw new Error(error.message || 'Network error or failed to fetch resource.');
    }
  }

  static async register({ name, email, password }) {
    return this._fetchWithAuth(API_ENDPOINT.REGISTER, {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
      isGuest: true, // Registration doesn't need prior auth token
    });
  }

  static async login({ email, password }) {
    return this._fetchWithAuth(API_ENDPOINT.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      isGuest: true, // Login doesn't need prior auth token
    });
  }

  static async getAllStories({ page = 1, size = 10, location = 0 } = {}) {
      const queryParams = new URLSearchParams({
          page: page.toString(),
          size: size.toString(),
          location: location.toString(),
      });
      // Default isGuest adalah false, jadi perlu auth
      return this._fetchWithAuth(`${API_ENDPOINT.STORIES}?${queryParams.toString()}`, {
          method: 'GET',
      });
  }

  static async addNewStory({ description, photo, lat, lon }) {
    const formData = new FormData();
    formData.append('description', description);
    formData.append('photo', photo); // photo should be a File/Blob object
    if (lat !== undefined && lon !== undefined && lat !== null && lon !== null) {
      formData.append('lat', parseFloat(lat)); // Pastikan float
      formData.append('lon', parseFloat(lon)); // Pastikan float
    }

    // Default isGuest adalah false, jadi perlu auth
    return this._fetchWithAuth(API_ENDPOINT.STORIES, {
      method: 'POST',
      body: formData,
    });
  }

  static async addNewStoryGuest({ description, photo, lat, lon }) {
    const formData = new FormData();
    formData.append('description', description);
    formData.append('photo', photo);
    if (lat !== undefined && lon !== undefined && lat !== null && lon !== null) {
      formData.append('lat', parseFloat(lat)); // Pastikan float
      formData.append('lon', parseFloat(lon)); // Pastikan float
    }
    return this._fetchWithAuth(API_ENDPOINT.STORIES_GUEST, {
        method: 'POST',
        body: formData,
        isGuest: true, // Explicitly mark as guest call (no auth needed)
    });
  }

  static async getStoryDetail(id) {
    // Default isGuest adalah false, jadi perlu auth
    return this._fetchWithAuth(API_ENDPOINT.DETAIL_STORY(id), {
      method: 'GET',
    });
  }

  // --- Endpoint Push Notification ---

  /**
   * Subscribe to web push notifications.
   * @param {PushSubscription} subscription - The PushSubscription object from the browser's Push API.
   */
  static async subscribeNotification(subscription) {
      // Ekstrak data yang diperlukan dari objek PushSubscription
      const subscriptionJson = subscription.toJSON();
      const bodyData = {
          endpoint: subscription.endpoint,
          // Dokumen API meminta keys, p256dh, auth di root, tapi response menunjukkan keys nested.
          // Kita ikuti struktur umum PushSubscription dan apa yang biasanya dibutuhkan server.
          // Server mungkin perlu menyesuaikan cara membacanya.
          keys: subscriptionJson.keys,
          p256dh: subscriptionJson.keys?.p256dh, // Kirim juga di root jika API butuh
          auth: subscriptionJson.keys?.auth,     // Kirim juga di root jika API butuh
      };

      console.log('Subscribing notification with data:', bodyData);

      // Perlu auth token untuk subscribe
      return this._fetchWithAuth(API_ENDPOINT.NOTIFICATIONS_SUBSCRIBE, { // Pastikan endpoint ini ada di api-endpoint.js
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }, // Wajib JSON
          body: JSON.stringify(bodyData),
          // isGuest: false (default)
      });
  }

  /**
   * Unsubscribe from web push notifications.
   * @param {string} endpoint - The unique endpoint URL of the subscription to remove.
   */
  static async unsubscribeNotification(endpoint) {
       if (!endpoint) {
           throw new Error("Subscription endpoint is required to unsubscribe.");
       }
       const bodyData = { endpoint };
       console.log('Unsubscribing notification for endpoint:', endpoint);

       // Perlu auth token untuk unsubscribe
       return this._fetchWithAuth(API_ENDPOINT.NOTIFICATIONS_UNSUBSCRIBE, { // Pastikan endpoint ini ada di api-endpoint.js
           method: 'DELETE',
           headers: { 'Content-Type': 'application/json' }, // Wajib JSON
           body: JSON.stringify(bodyData),
            // isGuest: false (default)
       });
   }
}

export default StoryApiSource;