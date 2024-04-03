<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import swStore from'$lib/stores/sw';
    import { sWclass, SubscrV } from '$lib/classes/swClasses.ts';
    import { urlBase64ToUint8Array } from '$lib/utilities/siteData.ts';
    import { addToIndexDBsubscr, getFromIndexDBsubscr, clearIndexDBsubscr } from '$lib/utilities/db.ts';

    import HeaderNav from './components/header-nav.svelte';
    import MobileNav from './components/mobile-nav.svelte';

    let onLine = false;
    let notificationOn = false;

    $: swStore.setVar(new sWclass('isOnline', onLine));
    $: swStore.setVar(new sWclass('typeImage', ''));
    $: swStore.setVar(new sWclass('scrollFrom', null));

    onMount( async () => {
        onLine = navigator.onLine;

        window.addEventListener('online', e => (onLine = true), false);
        window.addEventListener('offline', e => (onLine = false), false);

        if ('Notification' in window) {
            notificationOn = true;
        }

        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        swStore.setVar(new sWclass('isMobile', isMobile));
    })

    onDestroy(() => {
        if (typeof window !== 'undefined') {
            window.removeEventListener('online', null);
            window.removeEventListener('offline', null);
        }
    });

    const displayConfirmNotification = async () => {
        if ('serviceWorker' in navigator) {
            const options: NotificationOptions = {
                body: 'You successfully subscribed to our Notification service!',
                icon: './images/icons/app-icon-96x96.png',
                image: './images/sf-boat.jpg',
                dir: 'ltr',
                lang: 'en-US', // BCP 47,
                vibrate: [100, 50, 200],
                badge: './images/icons/app-icon-96x96.png',
                tag: 'confirm-notification',
                renotify: true,
                actions: [
                    { action: 'confirm', title: 'Okay', icon: './images/icons/app-icon-96x96.png' },
                    { action: 'cancel', title: 'Cancel', icon: './images/icons/app-icon-96x96.png' }
                ]
            };

            const swreg = await navigator.serviceWorker.ready;
            swreg.showNotification('Successfully subscribed!', options);
        }
    }

    const configurePushSub = async () => {
        if (!('serviceWorker' in navigator)) {
            return;
        }

        try {
            const swreg = await navigator.serviceWorker.ready;
            const sub = await swreg.pushManager.getSubscription();
            if (sub === null) {
                const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
                const convertedVapidPublicKey = urlBase64ToUint8Array(vapidPublicKey);
                const newSub = await swreg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: convertedVapidPublicKey
                });

                const subscrVer = await getFromIndexDBsubscr();
                let device = '';
                let version = 0;
                let newVersion = 0;
                if (subscrVer && subscrVer.length > 0) {
                    device = subscrVer[0].device;
                    version = subscrVer[0].version;
                    newVersion = version + 1;
                    await clearIndexDBsubscr();
                } else {
                    device = crypto.randomUUID();
                }

                const newSubscrV = new SubscrV($swStore.userId, device, newVersion);
                await addToIndexDBsubscr(newSubscrV);

                const newSubWithId = {
                    version: newSubscrV,
                    subscription: newSub
                }
                const url = import.meta.env.VITE_FIREBASE_SUBSCRIPTIONS_URL;

                const resp = await fetch(url);
                let subs = null;
                let subsToDel = [];
                if (resp.ok) {
                    subs = await resp.json();
                }
                if (subs) {
                    for (const key in subs) {
                        if (subs[key].version.id === $swStore.userId && subs[key].version.device === device) {
                            subsToDel.push(key);
                        }
                    }
                }
                if (subsToDel) {
                    const urlBase = import.meta.env.VITE_FIREBASE_URL;
                    subsToDel.forEach(async (key) => {
                        const urlDel = urlBase + '/subscriptions/' + key + '.json';
                        await fetch(urlDel, {
                            method: 'DELETE'
                        })
                    });
                }
                const res = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(newSubWithId)
                })
                if ((res.ok)) {
                    displayConfirmNotification();
                }
            } else {
                swStore.setVar(new sWclass('snackMsg', 'We have a subscription'));
                swStore.setVar(new sWclass('snackOpen', true));
            }
        } catch(err) {
            console.log('error: ', err);
        }
    }

    const enableNotification = async () => {
        if ('Notification' in window) {
            try {
                const permission = await Notification.requestPermission();
                console.log('User Choice', permission);
                if (permission !== 'granted') {
                    console.log('No notification permission granted!');
                } else {
                    configurePushSub();
                }
            } catch (error) {
                console.error("Error requesting permission:", error);
            }
        }
    }

</script>

<svelte:head>
    <link href="https://fonts.googleapis.com/css?family=Roboto:400,700" rel="stylesheet">
    <link rel="stylesheet" href="https://code.getmdl.io/1.3.0/material.indigo-pink.min.css">
    <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
    <script defer src="https://code.getmdl.io/1.3.0/material.min.js"></script>
    <link rel="manifest" href="/manifest.json">
</svelte:head>

<div id="app">
    <div class="mdl-layout mdl-js-layout mdl-layout--fixed-header">

        <HeaderNav 
            notificationOn={notificationOn}
            on:enableNotification={enableNotification}
        />

        <MobileNav 
            notificationOn 
            on:enableNotification={enableNotification}
        />

        <slot />

    </div>
</div>

<style>
    :global(.text-center) {
        text-align: center;
    }

    :global(.drawer-option) {
        padding: 16px;
    }
</style>