import createStoryItemTemplate from '../templates/story-item-template.js';
import AuthModel from '../../model/auth-model.js';

const HomePage = {
    render(stories = [], favoriteStatus = {}, isLoggedIn = false) {
        const userName = AuthModel.getUserName() || 'User';
        const greeting = isLoggedIn ? `Welcome back, ${userName}!` : 'Welcome, Guest!';
        return `
            <div class="container home-container">
                <header class="page-header">
                    <h2>${greeting}</h2>
                </header>
                <h3>Latest Stories</h3>
                <section id="storiesList" class="stories-list" aria-live="polite">
                    ${stories.length > 0
                        ? stories.map(story => createStoryItemTemplate(story, isLoggedIn ? favoriteStatus[story.id] : false)).join('')
                        : `<p class="empty-state">No stories available yet. ${isLoggedIn ? '<a href="#/add-story">Add one!</a>' : 'Login to add stories or browse as guest (if supported).'}</p>`
                    }
                </section>
                <hr>
                <h3>Stories Location</h3>
                <section id="storiesMapContainer" aria-label="Map showing story locations" style="position: relative;">
                    <div id="storiesMap" class="map-display"></div>
                    <div class="map-overlay" aria-hidden="true"></div> <!-- Optional: for loading state or if map fails -->
                </section>
            </div>
        `;
    }
};

export default HomePage;