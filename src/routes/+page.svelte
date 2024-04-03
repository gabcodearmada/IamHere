<script lang="ts">
    import { onMount, tick } from 'svelte';
    import type { PageData, ActionData } from './$types';
    import CreatePost from './components/create-post.svelte';
    import PageContent from './components/page-content.svelte';
    import PageButtons from './components/page-buttons.svelte';
    import Snackbar from './components/confirm-toast.svelte';
    import PickImage from './components/pick-image.svelte';
    import Login from './components/log-in.svelte';
    import ForwardPost from './components/forward-post.svelte';
    import swStore from'$lib/stores/sw';
    import { sWclass, FromForm, PostFb, FriendsFull } from '$lib/classes/swClasses.ts';
    import { initializeMedia, deleteExistingPost, forwardExistingPost } from '$lib/utilities/siteData.ts';
    
    export let data: PageData;
    export let form: ActionData;

    let closeOpenPost: boolean;
    let gotPosts: PostFb[] = [];
    let gotAllPosts: PostFb[] = [];
    let snackOpen = false;
    let snackTimeout = 4000;
    let snackTimer: unknown;
    let gotPicture: Blob | null = null;
    let clearContext = false;
    let displayNoPicture = false;
    let geolocRunning = false;
    let userid = '';
    let username = '';
    let friends: FriendsFull[] = [];
    let forwnames: string[] = [];
    let mainImage: HTMLDivElement;
    let divHide = false;
    let isMine = 0;
    let triggerMainImage = false;
    let beDeleted = false;
    let beForward = false;
    let elementLoading = false;

    onMount( async () => {
        data ? gotAllPosts = data.posts as PostFb[] : gotPosts = [];
        userid = data.userid;
        gotPosts = gotAllPosts.filter(post => post.owner===userid || post.answerto.includes(userid));
        gotPosts = gotPosts.reverse();
        username = data.username;
        friends = JSON.parse(data.friends) as FriendsFull[];
        swStore.setVar(new sWclass('userId', userid));
        swStore.setVar(new sWclass('userName', username));
        swStore.setVar(new sWclass('userFriends', friends));
        swStore.setVar(new sWclass('snackOpen', false));
        swStore.setVar(new sWclass('snackMsg', ''));
        swStore.setVar(new sWclass('isAnswer', false));
        swStore.setVar(new sWclass('answerTo', ''));
    })

    $:  gotPicture ? displayNoPicture = false : null;
    $:  if (!snackOpen) {clearTimeout(snackTimer)}
    $:  if ( $swStore.snackOpen ) {
          openSnackbar();
        }
    $: form?.response?.from === 'login' ? fromLogin(form?.response) : null;
    $: triggerMainImage === true ? mainImageTriggered() : null;

    const mainImageTriggered = () => {
      triggerMainImage = false;
      divHide = false;
      beDeleted = false;
      beForward = false;
      const children = mainImage.children;
      if (children[3].textContent === userid) {
        isMine = 1;
      } else {
        isMine = 2;
      }
    }

    const fromLogin = (loginResp:FromForm) => {
        if (loginResp.postuserid.length) {
          swStore.setVar(new sWclass('userId', loginResp.postuserid));
          swStore.setVar(new sWclass('userName', username));
          swStore.setVar(new sWclass('userFriends', JSON.parse(loginResp.friends)));
        }
    }

    const closeSnackbar = () => {
        snackOpen = false;
        clearTimeout(snackTimer);
    }

    const openSnackbar = () => {
        snackOpen = true;
        snackTimer = setTimeout(closeSnackbar, snackTimeout);
    }

    const newPostClose = () => {
      const customEvent = new CustomEvent('myCustomEvent', {
        detail: {
          what: false,
          created: false,
          post: null
        }
      });
      closeOpenPostModal(customEvent);
    }

    const closeOpenPostModal = async (event) => {
      closeOpenPost = event.detail.what;
      const created = event.detail.created;
      let thePost = null;
      if (event.detail.post) {
        thePost = JSON.parse(event.detail.post);
      }

      console.log($swStore);
      
      if (closeOpenPost) {
        elementLoading = true;
        if ($swStore.isAnswer) {
          swStore.setVar(new sWclass('typeImage', '/images/answer.jpg'));
        } else {
          if ($swStore.deferredPrompt) {
            $swStore.deferredPrompt.prompt();

            $swStore.deferredPrompt.userChoice.then(function(choiceResult) {
              if (choiceResult.outcome === 'dismissed') {
                console.log('User cancelled installation');
              } else {
                console.log('User added to home screen');
              }
            });

            swStore.setVar(new sWclass('deferredPrompt', null));
          }
          await initializeMedia();
        }
      } else {
        form = null;
        gotPicture = null;
        displayNoPicture = false;
        geolocRunning = false;
        $swStore.isAnswer ? null : clearContext = true;
        elementLoading = false;
        tick();
        
        swStore.setVar(new sWclass('videoPlayer', false));
        swStore.setVar(new sWclass('canvasElement', false));
        swStore.setVar(new sWclass('imagePickerArea', false));
        swStore.setVar(new sWclass('captureButton', false));
        swStore.setVar(new sWclass('isAnswer', false));
        swStore.setVar(new sWclass('answerTo', ''));
        if (!$swStore.isAnswer) {
          if ($swStore.videoHtmlPlayer.srcObject) {
            $swStore.videoHtmlPlayer.srcObject.getVideoTracks().forEach(function (track: { stop: () => void; }) {
              track.stop();
            });
          }
        }

        if (created) {
          swStore.setVar(new sWclass('snackMsg', 'Το νέο Post δημιουργήθηκε.'));
          gotPosts = [ thePost, ...gotPosts ];
        } else {
          swStore.setVar(new sWclass('snackMsg', 'Η δημιουργία Post ακυρώθηκε.'));
        }
        swStore.setVar(new sWclass('snackOpen', true));
        swStore.setVar(new sWclass('typeImage', ''));
      }
    }
    
    const toggleOpacity = () => {
        divHide = !divHide;
    }

    const resetPost = () => {
        divHide = false;
        const children = mainImage.children;
        children[0]!.src = '/images/main-image.jpg';
        children[1].firstChild!.textContent = '';
        children[2].firstChild!.textContent = '';
        children[3].firstChild!.textContent = '';
        mainImage.dataset.postid = '';
        $swStore.scrollFrom.scrollIntoView({
            behavior: 'smooth'
        });
        isMine = 0;
        beDeleted = false;
        beForward = false;
    }

    const deletePost = async (postId:string) => {
      const newGotPosts = gotPosts.filter((post) => post.id !== postId);
      gotPosts = newGotPosts;
      const resp = await deleteExistingPost(postId, mainImage.children[0].src);
      if (resp === 200) {
        resetPost();
        swStore.setVar(new sWclass('snackMsg', 'Το post διαγράφτηκε'));
        swStore.setVar(new sWclass('snackOpen', true));
      }
    }

    const askForDeletion = async () => {
      if (beDeleted) {
        beDeleted = false;
        if (mainImage.dataset.postid) {
          await deletePost(mainImage.dataset.postid);
        }
      } else {
        beDeleted = true;
      }
    }

    const askForAnswer = async () => {
      if (beDeleted) {
        beDeleted = false;
        swStore.setVar(new sWclass('isAnswer', true));
        const children = mainImage.children;
        swStore.setVar(new sWclass('answerTo', children[3].textContent));

        const customEvent = new CustomEvent('myCustomEvent', {
        detail: {
          what: true,
          created: false,
          post: null
        }
      });
      closeOpenPostModal(customEvent);
      } else {
        beDeleted = true;
      }
    }

    const askForForword = async () => {
      if (beForward) {
        beForward = false;
        const forwResp = await forwardExistingPost(mainImage.getAttribute('data-postid') as string, forwnames);
        if (forwResp.status === 200) {
          switch (await forwResp.json()) {
            case 200:
              swStore.setVar(new sWclass('snackMsg', 'Η προώθηση του Post ολοκληρώθηκε.'));
              break;
            case 401:
              swStore.setVar(new sWclass('snackMsg', 'Ο παραλήπτης έχει ήδη λάβει το Post.'));
              break;
            case 402:
              swStore.setVar(new sWclass('snackMsg', 'Δεν έχει ορισθεί παραλήπτης για το Post.'));
              break;
            case 500:
              swStore.setVar(new sWclass('snackMsg', 'Υπήρξε λάθος κατά την προώθηση του Post.'));
              break;
          }
        } else {
          swStore.setVar(new sWclass('snackMsg', 'Υπήρξε λάθος κατά την προώθηση του Post.'));
        }
        swStore.setVar(new sWclass('snackOpen', true));
      } else {
        beForward = true;
      }
    }

    const cancelDeletion = () => {
      beDeleted = false;
      beForward = false;
    }

</script>

<svelte:head>
    <title>IamHere</title>
</svelte:head>

<main class="mdl-layout__content mat-typography">

  {#if $swStore.userName===''}
    <div>
      <Login bind:username={username} form={form} />
    </div>
  {:else}

  <div id="create-post" style="display: {closeOpenPost ? 'block' : 'none'};">

    {#if !$swStore.isAnswer}
      <PickImage 
        bind:picture={gotPicture} 
        bind:clearContext={clearContext} 
      />
    {/if}
    
    <CreatePost 
      on:openClosePostModal={closeOpenPostModal} 
      form={form}
      bind:gotPicture = {gotPicture}
      bind:displayNoPicture = {displayNoPicture}
      bind:geolocRunning = {geolocRunning}
      bind:elementLoading = {elementLoading}
    />

    <div>
      <button 
        class="mdl-button mdl-js-button mdl-button--fab" 
        id="close-create-post-modal-btn" 
        on:click="{newPostClose}"
        type="button"
      >
        <i class="material-icons">close</i>
      </button>
    </div>
  </div>

    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div 
      bind:this={mainImage} 
      on:dblclick={resetPost} 
      class="main-image-div" 
      class:mine-post={isMine===1}
      data-postid=""
    >
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
        <img src="/images/main-image.jpg" alt="Explore the City" class="main-image" on:click={cancelDeletion}>
        <div class="main-content" class:hide-div={divHide}>
            
            <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
            <!-- svelte-ignore a11y-missing-content -->
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <h2 on:click={toggleOpacity}></h2>
        </div>
        <div class="main-location" class:hide-div={divHide}>
          <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
          <!-- svelte-ignore a11y-missing-content -->
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <h2 on:click={toggleOpacity}></h2>
        </div>
        <p></p>
        <p class="sender-name" class:mine-post={isMine===2} class:hide-div={divHide}></p>
        <div class="floating-button" class:mine-post={isMine===1} class:hide-div={divHide}  class:del-div={beDeleted}>
          <button 
              class="mdl-button mdl-js-button mdl-button--fab mdl-button--colored"
              class:del-div={beDeleted}
              on:click={askForDeletion}
          >
              <i class="material-icons">delete_forever</i>
          </button>
          <p class:del-div={beDeleted}>Για επιβεβαίωση της διαγραφής, πατάμε πάλι το κουμπί</p>
        </div>
        <div class="floating-button" class:mine-post={isMine===2} class:hide-div={divHide}  class:del-div={beDeleted}>
          <button 
              class="mdl-button mdl-js-button mdl-button--fab mdl-button--colored"
              class:del-div={beDeleted}
              on:click={askForAnswer}
          >
              <i class="material-icons">thumb_up_alt</i>
          </button>
          <p class:del-div={beDeleted}>Για αποστολή απάντησης, πατάμε πάλι το κουμπί</p>
        </div>


        <div class="floating-button forward-div" class:mine-post={isMine===2} class:hide-div={divHide}  class:forw-div={beForward}>
          <button 
              class="mdl-button mdl-js-button mdl-button--fab mdl-button--colored"
              class:forw-div={beForward}
              on:click={askForForword}
          >
              <i class="material-icons">forward_to_inbox</i>
          </button>
          <p id="forw-para" class:forw-div={beForward}>Για προώθηση στους επιλεγμένους χρήστες, πατάμε πάλι το κουμπί</p>
        </div>

        <ForwardPost 
          beForw={beForward} 
          divHide={divHide} 
          mainImage={mainImage}
          bind:forwnames={forwnames}
        />

    </div>

    <div class="pt-5 page-content">
      <h5 class="text-xl font-semibold text-center mdl-color-text--primary">Share your whereabouts</h5>
      <div id="shared-moments">

        {#if gotPosts}
            {#each gotPosts as post (post.id)}
                <PageContent
                    title={post.title}
                    location={post.location}
                    image={post.image}
                    mainImage={mainImage}
                    owner={post.owner}
                    postid={post.id}
                    bind:triggerMainImage={triggerMainImage}
                />
            {/each}
        {/if}
      </div>
    </div>

    <PageButtons on:openClosePostModal={closeOpenPostModal} />

    <Snackbar 
        message={$swStore.snackMsg} 
        isOpen={snackOpen} 
        on:closeSnackbar={closeSnackbar}
    />

  {/if}

</main>

<style lang="scss">
  #create-post {
    z-index: 1001;
    position: fixed;
    width: 100%;
    min-height: calc(100vh - 56px);
    overflow-y: scroll;
    bottom: 0;
    top: 56px;
    background: white;
    text-align: center;
    display: none;
  }

  .main-image {
    max-width: 100%;
    width: 600px;
    margin: auto;
    display: block;
  }

  .main-image-div {
    position: relative;
    width: 600px;
    max-width: 100%;
    margin: auto;
    overflow: hidden;

    .floating-button {
      display: none;
      top: calc(50% - 28px);
      width: 60px;
      text-align: left;
      margin-left: 6px;
      transition: opacity 0.4s ease-in-out, transform 0.5s ease-in-out;
      &.del-div {
        p{
          display: inline-block;
        }
      }
      &.forw-div {
        p{
          display: inline-block;
        }
      }
      
      p{
        position: absolute;
        display: none;
        color: #ffff99;
        width: 130px;
        line-height: 15px;
        margin: 0;
        top: 5px;
        left: 60px;
        background-color: #00000060;
        border-radius: 8px;
      }


      button {
        background-color: #40c740;
        &.del-div,
        &.forw-div {
          background-color: #ff4081;
        }
      }

      &.mine-post {
        display: inline-block;
        &.hide-div {
          opacity: 0.2;
          transform: translateX(-200px);
          &.forward-div {
            opacity: 0.2;
            transform: translateX(200px);
          }
        }
      }
      &.forward-div {
        right: 0;
        p {
          display: inline-block;
          right: 8px;
          top: 60px;
          left: auto;
          text-align: right;
          width: 150px;
          opacity: 0.2;
          transition: opacity 0.6s ease-in-out, transform 0.75s ease-in-out;
          transform: translateX(200px);
          &.forw-div {
            opacity: 1;
            transform: translateX(0);
          }
        }
      }
    }

    &.mine-post {
      border-top: #40c740 solid 10px;
    }

    p {
      display: none;
      &.sender-name {
        display: none;
        position: absolute;
        top: 0;
        right: 0;
        color: #ffffff;
        margin: 0;
        padding: 2px 8px;
        background-color: #00000080;
        border-bottom-left-radius: 6px;
        &.mine-post {
          display: block;
          transition: opacity 0.4s ease-in-out, transform 0.5s ease-in-out;
          &.hide-div {
            opacity: 0.3;
            transform: translateY(-40px);
          }
        }
      }
    }

    div {
      position: absolute;
      display: block;
      text-align: center;
      width: 100%;
      opacity: 0.8;
      transition: opacity 0.8s ease-in-out, transform 0.5s ease-in-out;
      cursor: pointer;

      &.main-content {
        top: 2em;

        &.hide-div {
          opacity: 0.3;
          transform: translateY(-150px);
        }

        h2 {
          color: #ffffa6;
        }
      }
      &.main-location {
        bottom: 1em;
        h2 {
          font-size: 18px;
        }
      }
      &.hide-div {
        opacity: 0.3;
      }

      h2 {
          display: inline-block;
          font-size: 16px;
          font-weight: 500;
          padding: 0 0.4rem;
          margin: 0 1em;
          border-radius: 0.4rem;
          color: white;
          line-height: 1.4em;
          text-align: left;
          background-color: rgba(0, 0, 0, 0.6);
          text-shadow: 2px 2px 5px rgba(0, 0, 0, 0.5);
      }
    }
  }
</style>
