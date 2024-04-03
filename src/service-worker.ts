/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

const sw = self as unknown as ServiceWorkerGlobalScope;
import { build, files, version, } from '$service-worker';
import { getFromIndexDBsyncPosts, deleteRecordIndexDBsyncPost } from '../src/lib/utilities/db.ts';
import { writeNewSyncedPost } from '../src/lib/utilities/siteData.ts';

// Create a unique cache name for this deployment
const CACHE = `cache-${version}`;
const CACHEOFFLINE = `offline-${version}`;

const ASSETS = [
	...build, // the app itself
	...files, // everything in `static`
	'https://fonts.googleapis.com/css?family=Roboto:400,700',
	'https://code.getmdl.io/1.3.0/material.indigo-pink.min.css',
	'https://fonts.googleapis.com/icon?family=Material+Icons',
	'https://code.getmdl.io/1.3.0/material.min.js'
];

sw.addEventListener('install', function(event) {
    console.log('[Service Worker] Installing Service Worker ...');
    // Create a new cache and add all files to it
    async function addFilesToCache() {
		const cache = await caches.open(CACHE);
		await cache.addAll(ASSETS);
	}

	event.waitUntil(addFilesToCache());
});

sw.addEventListener('activate', function(event) {
    console.log('[Service Worker] Activating Service Worker ...');
    // Remove previous cached data from disk
	async function deleteOldCaches() {
		for (const key of await caches.keys()) {
			if (key !== CACHE) await caches.delete(key);
		}
		const cacheoff = await caches.open(CACHEOFFLINE);
		await cacheoff.addAll(['/offline']);
	}

	event.waitUntil(deleteOldCaches());
});

sw.addEventListener('fetch', (event) => {
	// ignore POST requests etc
	if (event.request.method !== 'GET') return;


	async function respond() {
		const url = new URL(event.request.url);
		const cache = await caches.open(CACHE);
		// `build`/`files` can always be served from the cache
		if (ASSETS.includes(url.pathname)) {
			const response = await cache.match(url.pathname);

			if (response) {
				return response;
			}
		}

		// for everything else, try the network first, but
		// fall back to the cache if we're offline
		try {
			const response = await fetch(event.request);

			// if we're offline, fetch can return a value that is not a Response
			// instead of throwing - and we can't pass this non-Response to respondWith
			if (!(response instanceof Response)) {
				throw new Error('invalid response from fetch');
			}

			if (response.status === 200) {
				const resp = response.url.split("/")[0];
				if (resp !== 'chrome-extension:') {
					cache.put(event.request, response.clone());
				}
			}
			return response;
		} catch (err) {
			const response = await cache.match(event.request);
			if (response) {
				return response;
			}

			// const cacheoff = await caches.open(CACHEOFFLINE);
			// const resp = await cacheoff.match(new Request('/offline'));
			// console.log('resp: ', resp);
			// if (resp) {
			// 	return resp;
			// }

			// if there's no cache, then just error out
			// as there is nothing we can do to respond to this request
			throw err;
		}
	}

	event.respondWith(respond());
});

sw.addEventListener('sync', (event) => {
	console.log('[Service Worker] Background syncing', event);
	if (event.tag === 'sync-new-posts') {
		console.log('[Service Worker] Syncing new Posts');
		event.waitUntil(
			getFromIndexDBsyncPosts()
				.then(function(postsSynced) {
					for (const syncedPost of postsSynced!) {
						writeNewSyncedPost(syncedPost)
							.then(function(res) {
								if (res === 200) {
									console.log(`Post ${syncedPost.title} sent.`);
									deleteRecordIndexDBsyncPost(syncedPost.id!);
								}
							})
							.catch(function(err) {
								console.log('Error while sending data', err);
							});
					}
				})
		);
	}
});

sw.addEventListener('notificationclick', (event) => {
	const notification = event.notification;
	const action = event.action;
  
	if (action === 'confirm') {
	  console.log('Confirm was chosen');
	  notification.close();
	} else {
	  console.log(action);
	  event.waitUntil(
		sw.clients.matchAll()
		  .then(function(clis) {
			const client = clis.find(function(c) {
			  return c.visibilityState === 'visible';
			});
  
			if (client !== undefined) {
			  client.navigate(notification.data.url);
			  client.focus();
			} else {
			  sw.clients.openWindow(notification.data.url);
			}
			notification.close();
		  })
	  );
	}
});

sw.addEventListener('notificationclose', (event) => {
	console.log('Notification was closed', event);
});

sw.addEventListener('push', (event) => {
	console.log('Push Notification received', event);

	let data = {title: 'New!', content: 'Something new happened!'};

	if (event.data) {
		data = JSON.parse(event.data.text());
	}

	const options = {
		body: data.content,
		icon: './images/icons/app-icon-96x96.png',
		badge: './images/icons/app-icon-96x96.png',
		data: {
		  url: data.openUrl
		}
	};

	event.waitUntil(
		sw.registration.showNotification(data.title, options)
	);
});
