const BASE_URL = 'https://story-api.dicoding.dev/v1';

const API_ENDPOINT = {
  REGISTER: `${BASE_URL}/register`,
  LOGIN: `${BASE_URL}/login`,
  STORIES: `${BASE_URL}/stories`,
  STORIES_GUEST: `${BASE_URL}/stories/guest`,
  DETAIL_STORY: (id) => `${BASE_URL}/stories/${id}`,
  // Tambahkan endpoint notifikasi jika diperlukan
};

export default API_ENDPOINT;