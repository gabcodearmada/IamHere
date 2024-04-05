<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { enhance } from '$app/forms';
  import type { ActionData } from '../$types';
  import swStore from'$lib/stores/sw';
  import { PostFbSync, FromForm } from '$lib/classes/swClasses.ts';
  import { addToIndexDBsyncPosts } from '$lib/utilities/db.ts';
  import { writeImage } from '$lib/utilities/siteData';
  
  const dispatch = createEventDispatcher();

  export let form: ActionData;
  export let gotPicture: Blob | null = null;
  export let displayNoPicture: boolean;
  export let geolocRunning: boolean;
  export let elementLoading: boolean;
  let geolocAccessible = false;
  let locationHtmlElement: HTMLDivElement;
  let pubnames: string[] = [];
  let answerToName = '';

  $: form?.response && form?.response?.from === 'posts' ? fromPosts(form?.response) : null;
  $: title = form?.title ?? '';
  $: location = form?.location ?? '';
  $: imageType = $swStore.typeImage;
  $: elementLoading ? divLoading() : null;

  onMount( async () => {
    if ('geolocation' in navigator) {
      geolocAccessible = true;
    }
  })

  const divLoading = () => {
    elementLoading = false;
    if ($swStore.answerTo === '') {
      pubnames = [];
      answerToName = '';
    } else {
      pubnames = [$swStore.answerTo];
      $swStore.userFriends.forEach(frnd => {
        if (frnd.id === $swStore.answerTo) {
          answerToName = frnd.pubname;
        }
      });
    }
  }

  const fromPosts = (postsResp:FromForm) => {
    if (postsResp.status === 200) {
      postSavedUploadImage();
    } else {
      postNotSent();
    }
  }

  const createPostClose = (isCreated: boolean, thePost: string = '') => {
      pubnames = [];
      dispatch('openClosePostModal', {
        what: false,
        created: isCreated,
        post: thePost
      });
  }

  const postSavedUploadImage = async () => {
    if (!$swStore.isAnswer) {
      const postWritten = await JSON.parse(form?.response?.postuserid!);
      const uploadPath = `${postWritten.id}.${$swStore.typeImage}`;
      if (gotPicture) {
        await writeImage(gotPicture, uploadPath);
      }
/*
      const postWritten = await JSON.parse(form?.response?.postuserid!);
      const uploadPath = `static/moments/${postWritten.id}.${$swStore.typeImage}`;
      if (gotPicture) {
        await writeImage(gotPicture, uploadPath);
      }
*/
    }
    createPostClose(true, form?.response?.postuserid);
  }

  const postNotSent = async () => {
    if ('serviceWorker' in navigator && 'SyncManager' in window && gotPicture) {
      const typeImage = imageType.trim();
      const postId = crypto.randomUUID();
      const newPost = new PostFbSync(postId, title, location, $swStore.userId, pubnames, `/moments/${postId}.${typeImage}`, gotPicture);

      const sw = await navigator.serviceWorker.ready;
      let msg = '';
      try {
        await addToIndexDBsyncPosts(newPost);
        await sw.sync.register("sync-new-posts");
        msg = 'Your Post was saved for syncing!';
      } catch {
        msg = "Background Sync could not be registered!";
      }
      return msg;
    } else {
      return ' is not supported OR ther is no picture';
    }
  }

  const handleSubmit = async (event: { target: any; preventDefault: () => void; }) => {
    if (!gotPicture && !$swStore.isAnswer) {
      event.preventDefault();
      displayNoPicture = true;
      return
    }
    if (!$swStore.isOnline) {
      event.preventDefault();
      const ret = await postNotSent();
      console.log(ret);
      createPostClose(false);
      return; 
    }
  };

  interface GeolocationPosition {
    coords: {
      latitude: number;
      longitude: number;
      accuracy: number;
      altitude?: number;
      altitudeAccuracy?: number;
      heading?: number;
      speed?: number;
      timestamp: number;
    };
  }

  const getLocation = async () => {
    if (!('geolocation' in navigator)) {
      return;
    }

    geolocRunning = true;
    let position: unknown;

    const getPosition = () => {
      return new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {timeout: 7000});
      });
    };

    try {
      const geoPosition = await getPosition();
      position = {lat: geoPosition.coords.latitude, lng: geoPosition.coords.longitude};
      const googleKey = import.meta.env.VITE_GOOGLE_API;
      const getAddress = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${position.lat},${position.lng}&key=${googleKey}`);
      if (getAddress.ok) {
        const data = await getAddress.json();
        const address = data.results[0]?.formatted_address || '';
        if (address.length) {
          const lastComma = address.lastIndexOf(',');
          location = address.substring(0, lastComma);;
          locationHtmlElement.classList.remove('is-invalid');
          locationHtmlElement.classList.add('is-focused', 'is-dirty', 'is-valid');
        } else {
          alert('Couldn\'t fetch location, please enter manually!');
          locationHtmlElement.querySelector('input')?.focus();
        }
      } else {
        alert('Couldn\'t fetch location, please enter manually!');
        locationHtmlElement.querySelector('input')?.focus();
      }
      geolocRunning = false;
    } catch (error) {
      console.error("Error getting location:", error);
      geolocRunning = false;
      position = {lat: null, lng: null};
      alert('Couldn\'t fetch location, please enter manually!');
    }
  }
</script>

    {#if form?.error}
      <p class="error">{form.error}</p>
    {/if}
    {#if displayNoPicture}
      <p class="error">Δεν έχει ληφθεί φωτογραφία ούτε έχει επιλεγεί εικόνα. Η διαδικασία υποβολής ΔΕΝ μπορεί να προχωρήσει.</p>
    {/if}
    {#if $swStore.isAnswer}
      <h2 class="is-answer">Answer to: {answerToName}</h2>
    {/if}

    <form method="POST" action="?/savepost" on:submit={handleSubmit} use:enhance={handleSubmit}>
      <div class="input-section mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
        <input 
          class="mdl-textfield__input"
          type="text" 
          bind:value={title}
          name="title" 
          autocomplete="off" 
          required
        >
        <label class="mdl-textfield__label" for="title">Title</label>
      </div>
      
      <div 
        class="input-section mdl-textfield mdl-js-textfield mdl-textfield--floating-label" 
        id="manual-location"
        bind:this="{locationHtmlElement}"
      >
        <input 
          class="mdl-textfield__input" 
          type="text" 
          bind:value={location}
          name="location" 
          autocomplete="off" 
          required
        >
        <label class="mdl-textfield__label" for="location">Location</label>
      </div>

      <div class="mdl-textfield" id="set-answer-to">
        {#if $swStore.userFriends}
          {#each $swStore.userFriends as frn (frn.id)}
            <label for="answerto">
              <input type="checkbox" bind:group={pubnames} value={frn.id} name="answerto" />
              To be sent to: {frn.pubname}
            </label>
          {/each}
        {:else}
          <label for="location">
            <input type="checkbox" bind:group={pubnames} value="no" />
            To be sent to: No friends
          </label>
        {/if}
      </div>

      <div class="input-section mdl-textfield mdl-js-textfield mdl-textfield--floating-label" id="got-image">
        <input 
          class="mdl-textfield__input" 
          type="text" 
          bind:value={imageType}
          name="image" 
          autocomplete="off" 
          required
        >
        <label class="mdl-textfield__label" for="location">Image</label>
      </div>

      <div class="input-section mdl-textfield mdl-js-textfield mdl-textfield--floating-label" id="set-owner">
        <input 
          class="mdl-textfield__input" 
          type="text" 
          value={$swStore.userId}
          name="owner" 
          autocomplete="off" 
          required
        >
        <label class="mdl-textfield__label" for="location">Owner</label>
      </div>

      <div class="input-section geo-button" style="display: {geolocAccessible ? 'block' : 'none'};">
        <button 
          class="mdl-button mdl-js-button mdl-button--colored" 
          style="display: {geolocRunning ? 'none' : 'inline-block'};"
          type="button" 
          id="location-btn"
          on:click={getLocation}
        >
        Get Location
        </button>
        <div 
          class="mdl-spinner mdl-js-spinner is-active" 
          id="location-loader"
          style="display: {geolocRunning ? 'block' : 'none'};"
        >
        </div>
      </div>
      <br>
      
      <div>
        <button 
          class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored mdl-color--accent"
          type="submit" 
          id="post-btn"
        >
        Post!
        </button>
      </div>
      <br>
      
    </form>

<style lang="scss">
  .error {
    color: tomato;
    max-width: 320px;
    margin: 10px auto;
  }

  .is-answer {
    color: navy;
    max-width: 320px;
    margin: 10px auto;
    font-size: 22px;
    text-decoration: underline;
  }

  .mdl-spinner {
    margin: auto;
  }

  .geo-button {
    button {
      margin-top: -15px;;
    }
    #location-loader {
      display: none;
    }
  }

  .input-section {
    display: block;
    margin: 10px auto;
  }

  #got-image,
  #set-owner {
    display: none;
  }

  #set-answer-to {
    padding-top: 0;
    label {
      display: block;
      text-align: left;
      margin-bottom: 10px;
    }
  }
</style>
