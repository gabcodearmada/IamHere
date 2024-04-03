<script lang='ts'>
    import { onMount } from 'svelte';
    import swStore from'$lib/stores/sw';
    import { sWclass } from '$lib/classes/swClasses.ts';
    import { dataURItoBlob } from '$lib/utilities/siteData';

    export let picture: Blob | null;
    export let clearContext: boolean;
    
    let videoHtmlPlayer: HTMLVideoElement;
    let canvasHtmlElement: HTMLCanvasElement;
    let inputHtmlElement: HTMLInputElement;
    let context: CanvasRenderingContext2D | null = null;

    $: clearContext ? contextClear() : null;
   
    onMount( async () => {
        swStore.setVar(new sWclass('videoPlayer', false));
        swStore.setVar(new sWclass('canvasElement', false));
        swStore.setVar(new sWclass('imagePickerArea', false));
        swStore.setVar(new sWclass('captureButton', true));
        swStore.setVar(new sWclass('videoHtmlPlayer', videoHtmlPlayer));
    })

    const captureVideo = () => {
        swStore.setVar(new sWclass('canvasElement', true));
        swStore.setVar(new sWclass('videoPlayer', false));
        swStore.setVar(new sWclass('captureButton', false));
        context = canvasHtmlElement.getContext('2d');
        context!.drawImage(videoHtmlPlayer, 0, 0, canvasHtmlElement.width, videoHtmlPlayer.videoHeight / (videoHtmlPlayer.videoWidth / canvasHtmlElement.width));
        videoHtmlPlayer.srcObject!.getVideoTracks().forEach(function(track) {
            track.stop();
        });
        picture = dataURItoBlob(canvasHtmlElement.toDataURL());
        swStore.setVar(new sWclass('typeImage', 'png'));
    }

    const contextClear = () => {
        if (clearContext) {
            clearContext = false;
            if (context) {
                context.clearRect(0, 0, canvasHtmlElement.width, canvasHtmlElement.height);
                context = null;
            }
            if (inputHtmlElement.value.length) {
                inputHtmlElement.value = '';
            }
        }
    }

    const handleFileSelect = (event: InputEvent) => {
        const input = event.target as HTMLInputElement;
        picture = input.files?.[0] as Blob;
        if (picture.type === 'image/jpeg') {
            swStore.setVar(new sWclass('typeImage', 'jpg'));
        } else if (picture.type === 'image/png') {
            swStore.setVar(new sWclass('typeImage', 'png'));
        }
    }

</script>

<!-- svelte-ignore a11y-media-has-caption -->
<video 
    id="player" 
    autoplay 
    bind:this="{videoHtmlPlayer}"
    style="display: {$swStore.videoPlayer ? 'block' : 'none'};"
></video>
<canvas 
    id="canvas" 
    bind:this="{canvasHtmlElement}"
    style="display: {$swStore.canvasElement ? 'block' : 'none'};"  
    width="320px" 
    height="240px"
></canvas>
<button 
    class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored" 
    id="capture-btn"
    style="display: {$swStore.captureButton ? 'block' : 'none'};"
    on:click={captureVideo}
>
    Capture
</button>
<div id="pick-image" style="display: {$swStore.imagePickerArea ? 'block' : 'none'};">
  <h6>Pick an Image instead</h6>
  <input 
    type="file" 
    accept="image/*" 
    on:change="{handleFileSelect}"
    bind:this="{inputHtmlElement}"
    id="image-picker"
>
</div>

<style lang="scss">
    video, canvas {
        width: 512px;
        max-width: 100%;
        display: none;
        margin: auto;
    }
    canvas {
        border: 5px solid rgb(179, 179, 179);
        border-radius: 5px;
    }

    #pick-image {
        display: none;
    }

    #capture-btn {
        margin: 10px auto;
    }
  </style>
  
