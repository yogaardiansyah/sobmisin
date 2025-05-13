
import Swal from 'sweetalert2';
import CONFIG from '../config/config.js';
import StoryApiSource from '../data/story-api-source.js';
import AuthModel from '../model/auth-model.js';

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) { outputArray[i] = rawData.charCodeAt(i); }
    return outputArray;
}

const detectBrowser = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.indexOf('chrome') > -1 && userAgent.indexOf('edge') === -1 && userAgent.indexOf('opr') === -1) return 'Chrome';
    if (userAgent.indexOf('firefox') > -1) return 'Firefox';
    if (userAgent.indexOf('safari') > -1 && userAgent.indexOf('chrome') === -1) return 'Safari';
    if (userAgent.indexOf('edge') > -1) return 'Edge';
    if (userAgent.indexOf('opr') > -1 || userAgent.indexOf('opera') > -1) return 'Opera';
    return 'your browser';
};


const initPushNotifications = () => {
    const pushNavItem = document.getElementById('push-notification-nav-item');
    const subscribeButton = document.getElementById('subscribePushBtn');

    if (!pushNavItem || !subscribeButton) { console.warn("Push Nav Item or Button not found"); return; }
    pushNavItem.style.display = 'none';

    if (!('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window)) {
        console.warn('Push Notifications or SW not supported.');
        if (AuthModel.isLoggedIn()) {
            subscribeButton.textContent = 'Push Not Supported';
            subscribeButton.disabled = true;
            pushNavItem.style.display = 'list-item';
        }
        return;
    }

    navigator.serviceWorker.ready
        .then(registration => {
            if (!registration.pushManager) {
                console.warn('PushManager not available on this SW registration.');
                if (AuthModel.isLoggedIn()) {
                    subscribeButton.textContent = 'Push Not Available';
                    subscribeButton.disabled = true;
                    pushNavItem.style.display = 'list-item';
                }
                return;
            }

            if (!AuthModel.isLoggedIn()) {
                pushNavItem.style.display = 'none';
                return;
            }
            pushNavItem.style.display = 'list-item';

            subscribeButton.removeEventListener('click', handleSubscriptionToggle);
            subscribeButton.addEventListener('click', handleSubscriptionToggle);

            registration.pushManager.getSubscription().then(updateSubscriptionButtonUI);
        })
        .catch(swError => {
            console.error("Service Worker not ready for Push:", swError);
            if (AuthModel.isLoggedIn()) {
                subscribeButton.textContent = 'SW Error';
                subscribeButton.disabled = true;
                pushNavItem.style.display = 'list-item';
            }
        });
};

const handleSubscriptionToggle = async () => {
    const subscribeButton = document.getElementById('subscribePushBtn');
    subscribeButton.disabled = true;

    try {
        const registration = await navigator.serviceWorker.ready;
        const currentPushSubscription = await registration.pushManager.getSubscription();

        if (currentPushSubscription) {
            await processUnsubscription(currentPushSubscription);
        } else {
            await processNewSubscription(registration);
        }
    } catch (error) {
        console.error('Error in handleSubscriptionToggle:', error);
        if (!Swal.isVisible() && !error.message.toLowerCase().includes('permission')) {
            Swal.fire('Operation Error', `An error occurred: ${error.message}`, 'error');
        }
        const subCheck = await navigator.serviceWorker.ready.then(reg => reg.pushManager.getSubscription()).catch(() => null);
        updateSubscriptionButtonUI(subCheck);
    }
};

async function processNewSubscription(registration) {
    const currentPermission = Notification.permission;
    console.log('processNewSubscription - Initial permission state:', currentPermission);

    if (currentPermission === 'denied') {
        Swal.fire({
            title: 'Notifications Blocked',
            html: `You have previously blocked notifications for this site.<br><br>To subscribe, please change the notification permission in ${detectBrowser()}'s settings to "Allow" or "Ask". After changing the setting, please try subscribing again.`,
            icon: 'warning',
            confirmButtonText: 'OK'
        });
        updateSubscriptionButtonUI(null);
        document.getElementById('subscribePushBtn').disabled = false;
        return;
    }

    
    let browserPermissionResult = currentPermission;
    if (currentPermission === 'default') {
        console.log('Permission is default, requesting browser permission...');
        try {
            browserPermissionResult = await Notification.requestPermission();
            console.log('Browser permission request result:', browserPermissionResult);
        } catch (requestPermissionError) {
            console.error("Error during Notification.requestPermission():", requestPermissionError);
            Swal.fire('Permission Error', 'Could not request browser notification permission. Your browser might be blocking it. Please try again or check settings.', 'error');
            updateSubscriptionButtonUI(null);
            document.getElementById('subscribePushBtn').disabled = false;
            return;
        }
    }

    if (browserPermissionResult === 'granted') {
        await subscribeToPushManagerAndServer(registration);
    } else {
        let message = 'Browser did not grant notification permission.';
        if (browserPermissionResult === 'denied') {
            message = `You denied notification permission in the browser prompt. If you change your mind, you can enable it in ${detectBrowser()}'s site settings.`;
        } else {
            message = `You dismissed ${detectBrowser()}'s notification permission prompt. You can try subscribing again if you'd like to enable notifications.`;
        }
        Swal.fire('Permission Not Granted', message, 'info');
        updateSubscriptionButtonUI(null);
        document.getElementById('subscribePushBtn').disabled = false;
    }
}

async function subscribeToPushManagerAndServer(registration) {
    let clientSideSubscription;
    try {
        if (!CONFIG.VAPID_PUBLIC_KEY) {
            throw new Error('VAPID Public Key is not configured in CONFIG.js.');
        }
        const applicationServerKey = urlBase64ToUint8Array(CONFIG.VAPID_PUBLIC_KEY);
        const options = { userVisibleOnly: true, applicationServerKey };

        console.log('Subscribing to Push Manager with options:', options);
        clientSideSubscription = await registration.pushManager.subscribe(options);
        console.log('Successfully subscribed to Push Manager:', clientSideSubscription);

        await sendSubscriptionToBackend(clientSideSubscription, false);
        updateSubscriptionButtonUI(clientSideSubscription);

    } catch (error) {
        console.error('Failed to subscribe to Push Manager or send to server:', error);
        if (!Swal.isVisible() && !error.message.toLowerCase().includes('permission')) {
            Swal.fire('Subscription Error', `Could not complete subscription: ${error.message}`, 'error');
        }
        if (clientSideSubscription) {
            console.log('Rolling back client-side Push Manager subscription...');
            await clientSideSubscription.unsubscribe();
        }
        updateSubscriptionButtonUI(null);
        document.getElementById('subscribePushBtn').disabled = false;
    }
}

async function sendSubscriptionToBackend(subscription, isResync = false) {
    try {
        await StoryApiSource.subscribeNotification(subscription);
        console.log('Subscription successfully sent/updated on the server.');
        if (!isResync) {
            Swal.fire('Subscribed!', 'You will now receive notifications.', 'success');
        }
    } catch (serverError) {
        console.error('Failed to send subscription to server:', serverError);
        Swal.fire('Server Error', `Could not save subscription: ${serverError.message}. Please try again.`, 'error');
        if (subscription && !isResync) {
            console.log('Rolling back client-side subscription due to server error...');
            await subscription.unsubscribe();
        }
        throw serverError;
    }
}

async function processUnsubscription(subscription) {
    try {
        await StoryApiSource.unsubscribeNotification(subscription.endpoint);
        console.log('Unsubscription reported to server successfully.');

        const clientUnsubscribed = await subscription.unsubscribe();
        if (clientUnsubscribed) {
            console.log('User unsubscribed successfully from browser.');
            Swal.fire('Unsubscribed', 'You will no longer receive push notifications.', 'info');
            updateSubscriptionButtonUI(null);
        } else {
            console.error('Browser unsubscribe() call returned false or failed.');
            Swal.fire('Partial Unsubscription', 'Server confirmed unsubscription, but browser failed. This is unusual.', 'warning');
            updateSubscriptionButtonUI(subscription);
        }
    } catch (err) {
        console.error('Failed to unsubscribe:', err);
        Swal.fire('Unsubscription Failed', `Could not unsubscribe: ${err.message}.`, 'error');
        updateSubscriptionButtonUI(subscription);
    } finally {
        document.getElementById('subscribePushBtn').disabled = false;
    }
}

const updateSubscriptionButtonUI = (subscription) => {
    const subscribeButton = document.getElementById('subscribePushBtn');
    const pushNavItem = document.getElementById('push-notification-nav-item');
    if (!subscribeButton || !pushNavItem) { console.warn("Push UI elements not found for update."); return; }

    if (!AuthModel.isLoggedIn()) { pushNavItem.style.display = 'none'; return; }
    pushNavItem.style.display = 'list-item';

    const errorStates = ['Push Not Supported', 'Push Not Available', 'SW Error'];
    if (errorStates.includes(subscribeButton.textContent) && !subscribeButton.disabled) {
        if(!subscription) { subscribeButton.disabled = true; return; }
    }

    if (subscription) {
        subscribeButton.textContent = 'Unsubscribe';
        subscribeButton.classList.remove('button-primary'); subscribeButton.classList.add('button-secondary');
        subscribeButton.title = 'Unsubscribe from Push Notifications';
    } else {
        subscribeButton.textContent = 'Subscribe';
        subscribeButton.classList.remove('button-secondary'); subscribeButton.classList.add('button-primary');
        subscribeButton.title = 'Subscribe to Push Notifications';
    }
    subscribeButton.disabled = false;
};

document.addEventListener('auth-change', (event) => {
    initPushNotifications();
});

export default initPushNotifications;