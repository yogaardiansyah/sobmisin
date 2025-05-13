import createStoryItemTemplate from '../templates/story-item-template.js';

const FavoriteStoriesPage = {
    render(favoriteStories = [], favoriteStatus = {}) {
        return `
            <div class="container favorite-stories-container">
                <header class="page-header">
                    <h2>My Favorite Stories</h2>
                    <a href="#/home" class="back-link"><i class="fas fa-arrow-left"></i> Back to Home</a>
                </header>
                <section id="favoriteStoriesList" class="stories-list" aria-live="polite">
                    ${favoriteStories.length > 0
                        ? favoriteStories.map(story => createStoryItemTemplate(story, favoriteStatus[story.id] || true )).join('')
                        : '<p class="empty-state">You have no favorite stories yet. Find stories on the <a href="#/home">home page</a> and save them!</p>'
                    }
                </section>
            </div>
        `;
    }
};
export default FavoriteStoriesPage;