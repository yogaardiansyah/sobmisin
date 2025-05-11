import Swal from 'sweetalert2';
import CONFIG from '../config/config.js';
import StoryApiSource from '../data/story-api-source.js';
import AuthModel from '../model/auth-model.js';

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

const initPushNotifications = () => {
    let subscribeButtonContainer = document.getElementById('push-notification-container');
    if (!subscribeButtonContainer) {
        subscribeButtonContainer = document.createElement('div');
        subscribeButtonContainer.id = 'push-notification-container';
        subscribeButtonContainer.style.textAlign = 'center';
        subscribeButtonContainer.style.padding = '1rem 0';
        const footer = document.querySelector('footer, .app-footer');
        if (footer && footer.parentNode) {
            footer.parentNode.insertBefore(subscribeButtonContainer, footer);
        } else {
            document.body.appendChild(subscribeButtonContainer);
        }
    }

    let subscribeButton = document.getElementById('subscribePushBtn');
    if (!subscribeButton) {
        subscribeButton = document.createElement('button');
        subscribeButton.id = 'subscribePushBtn';
        subscribeButton.className = 'button';
        subscribeButton.style.display = 'none';
        subscribeButtonContainer.appendChild(subscribeButton);
    }

    if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
        navigator.serviceWorker.ready.then(registration => {
            if (!AuthModel.isLoggedIn()) {
                console.log("Push notifications require user to be logged in.");
                subscribeButton.textContent = 'Login to Subscribe';
                subscribeButton.disabled = true;
                subscribeButton.style.display = 'inline-block';
                return;
            }

            subscribeButton.style.display = 'inline-block';

            registration.pushManager.getSubscription()
                .then(subscription => {
                    updateSubscriptionButton(subscription);
                })
                .catch(err => {
                     console.error('Error getting push subscription:', err);
                     subscribeButton.textContent = 'Error Checking Status';
                     subscribeButton.disabled = true;
                 });

            subscribeButton.addEventListener('click', () => {
                subscribeButton.disabled = true;
                registration.pushManager.getSubscription()
                    .then(subscription => {
                        if (subscription) {
                            return unsubscribeUser(subscription);
                        } else {
                            return subscribeUser(registration);
                        }
                    })
                    .catch(error => {
                        console.error('Error handling push subscription toggle:', error);
                        Swal.fire('Error', `Failed to manage subscription: ${error.message}`, 'error');
                        registration.pushManager.getSubscription().then(updateSubscriptionButton);
                    })
                    .finally(() => {
                        if (subscribeButton.textContent !== 'Error Checking Status') {
                           subscribeButton.disabled = false;
                        }
                    });
            });

        }).catch(swError => {
            console.error("Service Worker registration failed:", swError);
             subscribeButton.textContent = 'Service Worker Error';
             subscribeButton.disabled = true;
             subscribeButton.style.display = 'inline-block';
        });
    } else {
        console.warn('Push messaging, Notifications, or Service Workers are not supported in this browser.');
        subscribeButton.textContent = 'Push Not Supported';
        subscribeButton.disabled = true;
        subscribeButton.style.display = 'inline-block';
    }
};


const subscribeUser = async (registration) => {
    try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            throw new Error('Notification permission was not granted.');
        }

        const applicationServerKey = urlBase64ToUint8Array(CONFIG.VAPID_PUBLIC_KEY);
        const options = {
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey
        };

        const subscription = await registration.pushManager.subscribe(options);
        console.log('User is subscribed:', subscription);
        console.log('Sub JSON:', JSON.stringify(subscription));

        await StoryApiSource.subscribeNotification(subscription);
        console.log('Subscription successfully sent to the server.');

        Swal.fire('Subscribed!', 'You will now receive push notifications.', 'success');
        updateSubscriptionButton(subscription);

    } catch (err) {
        console.error('Failed to subscribe the user:', err);
        Swal.fire('Subscription Failed', `Could not subscribe: ${err.message}`, 'error');
        updateSubscriptionButton(null);
    }
};


const unsubscribeUser = async (subscription) => {
    try {
        const endpoint = subscription.endpoint;
        const successful = await subscription.unsubscribe();

        if (successful) {
            console.log('User unsubscribed successfully from browser.');

            try {
                 await StoryApiSource.unsubscribeNotification(endpoint);
                 console.log('Unsubscription reported to server successfully.');
                 Swal.fire('Unsubscribed', 'You will no longer receive push notifications.', 'info');
            } catch (serverError) {
                 console.error('Failed to report unsubscription to server:', serverError);
                 Swal.fire('Unsubscribed (Locally)', `You've unsubscribed from this browser, but we couldn't update the server: ${serverError.message}. You might need to clear site data if issues persist.`, 'warning');
            }

            updateSubscriptionButton(null);
        } else {
            throw new Error('Browser unsubscribe() call returned false.');
        }
    } catch (err) {
        console.error('Failed to unsubscribe the user:', err);
        Swal.fire('Unsubscription Failed', `Could not unsubscribe: ${err.message}`, 'error');
        updateSubscriptionButton(subscription);
    }
};


const updateSubscriptionButton = (subscription) => {
    const subscribeButton = document.getElementById('subscribePushBtn');
    if (!subscribeButton) {
        console.error("Could not find subscribe button element.");
        return;
    }

    if (subscription) {
        subscribeButton.textContent = 'Unsubscribe Notifications';
        subscribeButton.classList.remove('button-primary');
        subscribeButton.classList.add('button-secondary');
    } else {
        subscribeButton.textContent = 'Subscribe to Notifications';
        subscribeButton.classList.remove('button-secondary');
        subscribeButton.classList.add('button-primary');
    }
    if (subscribeButton.textContent !== 'Error Checking Status' && subscribeButton.textContent !== 'Service Worker Error' && subscribeButton.textContent !== 'Push Not Supported' && subscribeButton.textContent !== 'Login to Subscribe') {
        subscribeButton.disabled = false;
    }
};

export default initPushNotifications;