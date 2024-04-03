<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let notificationOn = false;

  const dispatch = createEventDispatcher();
  
  const enableNotification = () => {
      dispatch('enableNotification');
  }
</script>

<div class="mdl-layout__drawer">
    <span class="mdl-layout-title">IamHere</span>
    <nav class="mdl-navigation">
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

<style lang='scss'>
  button.enable-notifications {
      display: none;

      &.onoff {
          display: inline-block;
      }
  }
</style>
