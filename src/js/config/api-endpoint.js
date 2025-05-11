const BASE_URL = 'https://story-api.dicoding.dev/v1';

const API_ENDPOINT = {
  REGISTER: `${BASE_URL}/register`,
  LOGIN: `${BASE_URL}/login`,
  STORIES: `${BASE_URL}/stories`,
  STORIES_GUEST: `${BASE_URL}/stories/guest`,
  DETAIL_STORY: (id) => `${BASE_URL}/stories/${id}`,
  NOTIFICATIONS_SUBSCRIBE: `${BASE_URL}/notifications/subscribe`,
  NOTIFICATIONS_UNSUBSCRIBE: `${BASE_URL}/notifications/unsubscribe`,
};

export default API_ENDPOINT;
