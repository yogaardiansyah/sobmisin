import { formatDate } from '../templates/story-item-template.js';

const DetailPage = {
    render(story) {
        if (!story) {
            return `<div class="container error-container"><h2>Error</h2><p>Story data not found.</p><a href="#/home">Go Home</a></div>`;
        }

        return `
            <div class="container detail-container">
                <a href="#/home" class="back-link"><i class="fas fa-arrow-left"></i> Back to Home</a>
                <article class="story-detail">
                    <h2>${story.name}'s Story</h2>
                    <img src="${story.photoUrl}" alt="Story from ${story.name}: ${story.description.substring(0, 50)}..." class="story-detail__image">
                    <div class="story-detail__content">
                        <p class="story-detail__description">${story.description || 'No description.'}</p>
                        <p class="story-detail__date">
                            <i class="fas fa-calendar-alt" aria-hidden="true"></i> Posted on: ${formatDate(story.createdAt)}
                        </p>
                        <hr>
                        <section id="detailStoryMapContainer" aria-labelledby="locationHeader">
                            <h3 id="locationHeader">Location</h3>
                            ${story.lat && story.lon ? `
                                <div id="detailStoryMap" class="map-display"></div>
                                <p class="coordinates-info">Coordinates: ${story.lat.toFixed(5)}, ${story.lon.toFixed(5)}</p>
                            ` : `
                                <p class="no-location-info">Location data is not available for this story.</p>
                            `}
                        </section>
                    </div>
                </article>
            </div>
        `;
    }
};

export default DetailPage;