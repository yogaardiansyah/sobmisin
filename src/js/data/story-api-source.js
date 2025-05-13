import API_ENDPOINT from '../config/api-endpoint.js';
import Auth from '../utils/auth.js';

class StoryApiSource {
  static async _fetchWithAuth(url, options = {}) {
    const token = Auth.getToken();
    const requiresAuth = options.isGuest !== true;

    if (requiresAuth && !token) {
      console.error('No auth token found for protected route:', url);
      throw new Error('User not logged in or token missing');
    }

    const headers = {
      ...options.headers,
    };

    if (requiresAuth && token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    if (options.body instanceof FormData) {
      delete headers['Content-Type'];
    }

    try {
      console.log(`Fetching ${options.method || 'GET'} ${url} with headers:`, headers);
      const response = await fetch(url, {
        ...options,
        headers,
      });

      let responseData = null;
      const contentType = response.headers.get("content-type");

      try {
        if (contentType && contentType.includes("application/json")) {
            responseData = await response.json();
        } else if (response.body && response.status !== 204) {
            const textBody = await response.clone().text();
            if (textBody && textBody.trim().startsWith('{')) {
                 try {
                     responseData = JSON.parse(textBody);
                 } catch (parseError) {
                     console.warn('Received non-JSON response that looked like JSON (parse failed):', textBody.substring(0, 100));
                     responseData = { message: `Received non-JSON response starting with: ${textBody.substring(0,50)}` };
                 }
            } else if (response.ok && textBody) {
                 console.log('Received non-JSON text response:', textBody.substring(0, 100));
                 responseData = { message: 'Operation successful, non-JSON response received.' };
            } else if (textBody) {
                responseData = { message: textBody.substring(0, 200) };
            }
        }
      } catch (jsonError) {
          console.error("Failed to parse or read response body:", jsonError);
          responseData = { message: `Error processing response (Status: ${response.status}) ${response.statusText || ''}`.trim() };
      }


      if (!response.ok) {
        const errorMessage = responseData?.message || response.statusText || `API request failed with status ${response.status}`;
        console.error('API Error:', errorMessage, 'Status:', response.status, 'Response Data:', responseData);
        throw new Error(errorMessage);
      }

      if (response.status === 204) {
        return { message: 'Operation successful (No Content)' };
      }

      return responseData;

    } catch (error) {
      console.error(`Fetch operation error during request to ${url}:`, error.message, error);
      throw new Error(error.message || 'Network error or failed to fetch resource.');
    }
  }

  static async register({ name, email, password }) { 
    return this._fetchWithAuth(API_ENDPOINT.REGISTER, {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
      isGuest: true,
    });
  }
  static async login({ email, password }) {
    return this._fetchWithAuth(API_ENDPOINT.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      isGuest: true,
    });
  }
  static async getAllStories({ page = 1, size = 10, location = 0 } = {}) {
      const queryParams = new URLSearchParams({
          page: page.toString(),
          size: size.toString(),
          location: location.toString(),
      });
      return this._fetchWithAuth(`${API_ENDPOINT.STORIES}?${queryParams.toString()}`, {
          method: 'GET',
      });
  }
  static async addNewStory({ description, photo, lat, lon }) {
    const formData = new FormData();
    formData.append('description', description);
    formData.append('photo', photo);
    if (lat !== undefined && lon !== undefined && lat !== null && lon !== null) {
      formData.append('lat', parseFloat(lat));
      formData.append('lon', parseFloat(lon));
    }
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
        formData.append('lat', parseFloat(lat));
        formData.append('lon', parseFloat(lon));
      }
    return this._fetchWithAuth(API_ENDPOINT.STORIES_GUEST, {
        method: 'POST',
        body: formData,
        isGuest: true,
    });
  }
  static async getStoryDetail(id) {
    return this._fetchWithAuth(API_ENDPOINT.DETAIL_STORY(id), {
      method: 'GET',
    });
  }

  /**
   * Subscribe to web push notifications.
   * @param {PushSubscription} subscription - The PushSubscription object from the browser's Push API.
   */
  static async subscribeNotification(subscription) {
    const subscriptionJson = subscription.toJSON();

    const bodyData = {
        endpoint: subscriptionJson.endpoint,
        keys: {
            p256dh: subscriptionJson.keys.p256dh,
            auth: subscriptionJson.keys.auth,
        }
    };

    console.log('StoryApiSource: Subscribing notification with body (Corrected based on errors):', JSON.stringify(bodyData));

    return this._fetchWithAuth(API_ENDPOINT.NOTIFICATIONS_SUBSCRIBE, {
        method: 'POST',
        body: JSON.stringify(bodyData),
    });
  }

  /**
   * Unsubscribe from web push notifications.
   * @param {string} endpoint - The unique endpoint URL of the subscription to remove.
   */
  static async unsubscribeNotification(endpoint) {
       if (!endpoint) {
           console.error("StoryApiSource: Subscription endpoint is required to unsubscribe.");
           throw new Error("Subscription endpoint is required to unsubscribe.");
       }
       const bodyData = { endpoint };
       console.log('StoryApiSource: Unsubscribing notification for endpoint:', endpoint, 'with body:', JSON.stringify(bodyData));

       const unsubscribeUrl = API_ENDPOINT.NOTIFICATIONS_UNSUBSCRIBE;

       return this._fetchWithAuth(unsubscribeUrl, {
           method: 'DELETE',
           body: JSON.stringify(bodyData),
       });
   }
}

export default StoryApiSource;