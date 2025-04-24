// src/js/view/templates/story-item-template.js

// Pisahkan fungsi format tanggal agar bisa diimpor ke DetailPage
export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
      const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
      return new Date(dateString).toLocaleDateString('id-ID', options); // Gunakan locale ID
  } catch (e) {
      console.error("Failed to format date:", dateString, e);
      return dateString;
  }
}

// Modifikasi template untuk menjadi link
const createStoryItemTemplate = (story) => `
<a href="#/detail/${story.id}" class="story-item-link">
    <article class="story-item">
      <img src="${story.photoUrl}" alt="Story image from ${story.name}: ${story.description.substring(0, 30)}..." class="story-item__image">
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
    </article>
</a>
`;

export default createStoryItemTemplate;