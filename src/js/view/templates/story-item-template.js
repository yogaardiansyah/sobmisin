
export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
      const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
      return new Date(dateString).toLocaleDateString('id-ID', options);
  } catch (e) {
      console.error("Failed to format date:", dateString, e);
      return dateString;
  }
}

const createStoryItemTemplate = (story, isFavorite = false) => `
<article class="story-item" id="story-item-${story.id}">
    <a href="#/detail/${story.id}" class="story-item-main-link" aria-label="View details for story by ${story.name || 'Anonymous'}">
      <img 
        src="${story.photoUrl}" 
        alt="Story image from ${story.name}: ${story.description ? story.description.substring(0, 30) : 'No description'}..." 
        class="story-item__image" 
        loading="lazy">
      <div class="story-item__content">
        <h4 class="story-item__name">${story.name || 'Anonymous'}</h4>
        <p class="story-item__date">
          <i class="fas fa-calendar-alt" aria-hidden="true"></i> ${formatDate(story.createdAt)}
        </p>
        <p class="story-item__description">${story.description || 'No description.'}</p>
        ${story.lat && story.lon ? `
          <p class="story-item__location">
              <i class="fas fa-map-marker-alt" aria-hidden="true"></i> Location Available
              <span class="sr-only"> (Latitude: ${story.lat}, Longitude: ${story.lon})</span>
          </p>
        ` : '<p class="story-item__location"><i class="fas fa-map-marker-alt" aria-hidden="true"></i> No Location</p>'}
      </div>
    </a>
    <div class="story-item__actions">
        <button 
            class="button button-small button-favorite ${isFavorite ? 'favorited' : ''}" 
            data-story-id="${story.id}" 
            aria-pressed="${isFavorite ? 'true' : 'false'}" 
            aria-label="${isFavorite ? `Remove ${story.name}'s story from favorites` : `Save ${story.name}'s story to favorites`}">
            <i class="${isFavorite ? 'fas' : 'far'} fa-heart" aria-hidden="true"></i> 
            <span>${isFavorite ? 'Unsave' : 'Save'}</span>
        </button>
    </div>
</article>
`;

export default createStoryItemTemplate;