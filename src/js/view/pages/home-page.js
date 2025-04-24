// src/js/view/pages/home-page.js
import createStoryItemTemplate from '../templates/story-item-template.js';
import AuthModel from '../../model/auth-model.js'; // To greet the user

const HomePage = {
    render(stories = []) {
        const userName = AuthModel.getUserName() || 'User';
        return `
            <div class="container home-container">
                <h2>Welcome, ${userName}!</h2>
                <h3>Latest Stories</h3>
                <section id="storiesList" class="stories-list" aria-live="polite">
                    ${stories.length > 0
                        ? stories.map(story => createStoryItemTemplate(story)).join('')
                        : '<p>No stories available yet. <a href="#/add-story">Add one!</a></p>'
                    }
                </section>
                <hr>
                <h3>Stories Location</h3>
                 <section id="storiesMapContainer" aria-label="Map showing story locations">
                     <div id="storiesMap" class="map-display"></div>
                 </section>
            </div>
        `;
    }
    // Setup logic (like map initialization) is handled by the StoryPresenter
    // after this render function is called by the MainView.
};

export default HomePage;