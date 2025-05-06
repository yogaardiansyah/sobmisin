export const runViewTransition = (updateCallback) => {
    if (!document.startViewTransition) {
        console.warn('View Transitions API not supported, updating DOM directly.');
        updateCallback();
        return;
    }

    document.startViewTransition(() => {
         try {
            updateCallback();
         } catch (error) {
            console.error("Error during view transition update:", error);
         }
    });
};