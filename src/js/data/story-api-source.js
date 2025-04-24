import API_ENDPOINT from '../config/api-endpoint.js';
import Auth from '../utils/auth.js'; // Untuk ambil token

class StoryApiSource {
  static async _fetchWithAuth(url, options = {}) {
    const token = Auth.getToken();
    if (!token && !options.isGuest) { // Allow guest calls explicitly
        console.error('No auth token found for protected route');
        throw new Error('User not logged in or token missing');
    }

    const headers = {
      ...options.headers, // Allow overriding headers
    };

    // Don't add Authorization for guest or if Content-Type is multipart/form-data
    if (token && !options.isGuest && !(options.body instanceof FormData)) {
      headers['Authorization'] = `Bearer ${token}`;
    }
     // Add Authorization header for FormData requests too if not guest
    if (token && !options.isGuest && (options.body instanceof FormData)) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Set default Content-Type if not FormData and not already set
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    // Browser sets Content-Type for FormData automatically, including boundary
    if (options.body instanceof FormData) {
        delete headers['Content-Type']; // Let browser handle it
    }


    try {
        const response = await fetch(url, {
            ...options,
            headers,
        });

        const responseJson = await response.json();

        if (!response.ok || responseJson.error) {
             console.error('API Error:', responseJson.message || response.statusText);
             throw new Error(responseJson.message || `API request failed with status ${response.status}`);
        }

        return responseJson; // Return the parsed JSON directly if successful

    } catch (error) {
      console.error('Fetch error:', error);
      // Re-throw the error to be caught by the presenter/caller
      throw error;
    }
  }

  static async register({ name, email, password }) {
    return this._fetchWithAuth(API_ENDPOINT.REGISTER, {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
      isGuest: true, // Registration doesn't need prior auth
    });
  }

  static async login({ email, password }) {
    return this._fetchWithAuth(API_ENDPOINT.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      isGuest: true, // Login doesn't need prior auth
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
    formData.append('photo', photo); // photo should be a File/Blob object
    if (lat !== undefined && lon !== undefined && lat !== null && lon !== null) {
      formData.append('lat', lat);
      formData.append('lon', lon);
    }

    return this._fetchWithAuth(API_ENDPOINT.STORIES, {
      method: 'POST',
      body: formData,
      // Headers handled automatically for FormData by fetch and _fetchWithAuth
    });
  }

  static async addNewStoryGuest({ description, photo, lat, lon }) {
    const formData = new FormData();
    formData.append('description', description);
    formData.append('photo', photo);
    if (lat !== undefined && lon !== undefined && lat !== null && lon !== null) {
      formData.append('lat', lat);
      formData.append('lon', lon);
    }
    return this._fetchWithAuth(API_ENDPOINT.STORIES_GUEST, {
        method: 'POST',
        body: formData,
        isGuest: true, // Explicitly mark as guest call
    });
  }

  static async getStoryDetail(id) {
    return this._fetchWithAuth(API_ENDPOINT.DETAIL_STORY(id), {
      method: 'GET',
    });
  }
}

export default StoryApiSource;