<script lang="ts">
  import { onMount, createEventDispatcher, tick } from 'svelte';
  import swStore from'$lib/stores/sw';

  export let notificationOn = false;

  let divHtmlHeader: HTMLHeadElement;
  let loginDiv: HTMLDivElement;

  const dispatch = createEventDispatcher();

  onMount(async () => {
    componentHandler.upgradeAllRegistered();

    tick();

    if (divHtmlHeader.querySelector('.mdl-layout__drawer-button')){
      loginDiv = divHtmlHeader.querySelector('.mdl-layout__drawer-button') as HTMLDivElement;
      $swStore.userName==='' ? loginDiv.classList.add('no-login') : null;
    }

  });

  const enableNotification = () => {
      dispatch('enableNotification');
  }
</script>

<header class="mdl-layout__header" bind:this={divHtmlHeader}>
    <div class="mdl-layout__header-row">
      <!-- Title -->
      <span class="mdl-layout-title">IamHere</span>
      <!-- Add spacer, to align navigation to the right -->
      <div class="mdl-layout-spacer"></div>
      <!-- Navigation. We hide it in small screens. -->
      <nav class="mdl-navigation mdl-layout--large-screen-only">
        <a class="mdl-navigation__link" href="/">Feed</a>
        <a class="mdl-navigation__link" href="/help">Help</a>
        <div class="drawer-option">
          <button 
            class="enable-notifications mdl-button mdl-js-button mdl-button--raised mdl-button--colored mdl-color--accent"
            class:onoff={notificationOn}
            on:click={enableNotification}
          >
            Enable Notifications
          </button>
        </div>
      </nav>
    </div>
</header>

<style lang='scss'>
    button.enable-notifications {
        display: none;

        &.onoff {
            display: inline-block;
        }
    }

    :global(.mdl-layout__drawer-button.no-login) {
      display: none;
    }
</style>
