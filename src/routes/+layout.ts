import swStore from'$lib/stores/sw';
import { sWclass } from '$lib/classes/swClasses.ts';

export async function load() {
    if (typeof window !== 'undefined') { // Assuming browser environment
        window.addEventListener('beforeinstallprompt', function(event) {
            console.log('beforeinstallprompt fired');
            event.preventDefault();
            swStore.setVar(new sWclass('deferredPrompt', event));
            return false;
        });
    }
}

