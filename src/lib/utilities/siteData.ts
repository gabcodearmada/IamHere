import { get } from 'svelte/store';
import { addToIndexDBposts, getFromIndexDBposts, clearIndexDBposts } from '$lib/utilities/db.ts';
import { PostFb, PostFbSync } from '$lib/classes/swClasses.ts';
import swStore from'$lib/stores/sw';
import { sWclass } from '$lib/classes/swClasses.ts';

export const getSiteData = async (readPosts: PostFb[] | null) => {
    if ( readPosts ) {
        try {
            await clearIndexDBposts();

            readPosts.forEach(async (post: PostFb) => {
                await addToIndexDBposts(post);
            })
            return readPosts;
        } catch (error) {
            return null;
        }
    } else {
        try {
            const postsAll = await getFromIndexDBposts();
            console.log('postsAll from IDB: ', postsAll);
            if (postsAll && postsAll.length)  {
                const postsArray: PostFb[] = [];

                postsAll.forEach(post => {
                    postsArray.push(new PostFb(post.id, post.title, post.location, post.image, post.owner, post.answerto));
                });

                return postsArray;
            } else {
                return null;
            }
        } catch (error) {
            return null;
        }
    }
}

export const pushNewPost = async (newPost:PostFb) => {
    try {
        const url = import.meta.env.VITE_FIREBASE_STORE_POST_DATA_URL;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify( newPost )
        })
        return response.status;
    } catch (error) {
        return '500';
    }
}

export const deleteExistingPost = async (postId:string, image:string) => {
    try {
        const postData = new FormData();
        postData.append('what', 'delete');
        postData.append('postid', postId);
        postData.append('image', image);

        const request = new Request('http://localhost:5173/api/post', {
            method: 'POST',
            body: postData
        });

        const response = await fetch(request);

        return response.status;
    } catch (error) {
        return '500';
    }
}

export const writeNewSyncedPost = async (newSyncedPost: PostFbSync) => {
    try {
        const newPost = new PostFb(newSyncedPost.id, newSyncedPost.title, newSyncedPost.location, newSyncedPost.image, newSyncedPost.owner, newSyncedPost.answerto);
        const postData = new FormData();
        postData.append('what', 'append');
        postData.append('newpost', JSON.stringify(newPost));

        const request = new Request('http://localhost:5173/api/post', {
            method: 'POST',
            body: postData
        });

        const response = await fetch(request);

        if (response.status === 200) {
            const postData = new FormData();
            const fileExt = newSyncedPost.image.split('.')[1];
            const uploadPath = `static/moments/${newSyncedPost.id}.${fileExt}`;
            postData.append('file', newSyncedPost.picture, uploadPath);

            const req = new Request('http://localhost:5173/api/image', {
                method: 'POST',
                body: postData
            });
            await fetch(req);

            pushNewPost(newPost);
        }
        return response.status;
    } catch (error) {
        return '500';
    }
}

export const forwardExistingPost = async (postId:string, targets:string[]) => {
    try {
        const postData = new FormData();
        postData.append('what', 'forward');
        postData.append('postid', postId);
        postData.append('targets', JSON.stringify(targets));

        const request = new Request('http://localhost:5173/api/post', {
            method: 'POST',
            body: postData
        });

        const response = await fetch(request);

        return response;
    } catch (error) {
        return '500';
    }
}


export const writeImage = async (picture:Blob, name:string) => {
    try {
        const postData = new FormData();
        postData.append('file', picture, name);
        
        const request = new Request('http://localhost:5173/api/image', {
            method: 'POST',
            body: postData
        });

        const response = await fetch(request);

        return response.status;
    } catch (error) {
        return '500';
    }
}

export const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
  
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
  
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export const initializeMedia = async () => {
    if (!('mediaDevices' in navigator)) {
        navigator.mediaDevices = {};
    }

    if (!('getUserMedia' in navigator.mediaDevices)) {
        navigator.mediaDevices.getUserMedia = function(constraints) {
          const getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    
          if (!getUserMedia) {
            return Promise.reject(new Error('getUserMedia is not implemented!'));
          }
    
          return new Promise(function(resolve, reject) {
            getUserMedia.call(navigator, constraints, resolve, reject);
          });
        }
    }

    const storeSW = get(swStore);
    let stream = null;
    let constraints: unknown;

    try {
        if (storeSW.isMobile) {
            constraints = { video: { facingMode: "environment" } };
        } else {
            constraints = {video: true};
        }
        stream = await navigator.mediaDevices.getUserMedia( constraints );
        storeSW.videoHtmlPlayer.srcObject = stream;
        swStore.setVar(new sWclass('videoPlayer', true));
        swStore.setVar(new sWclass('captureButton', true));
      } catch (err) {
        swStore.setVar(new sWclass('imagePickerArea', true));
        swStore.setVar(new sWclass('captureButton', false));
    }
}

export const dataURItoBlob: (dataURI: string) => Blob = (dataURI) => {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], {type: mimeString});
    return blob;
}

