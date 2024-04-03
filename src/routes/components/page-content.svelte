<script lang='ts'>
    import { onMount, tick } from 'svelte';
    import swStore from'$lib/stores/sw';
    import { sWclass } from '$lib/classes/swClasses.ts';

    export let title: string = '';
    export let location: string = '';
    export let image: string = '';
    export let owner: string = '';
    export let postid: string = '';
    export let triggerMainImage = false;
    export let mainImage: HTMLDivElement;

    let podtDiv: HTMLDivElement;
    let isMine = false;
    let ownerName = '';

    onMount( async () => {
        owner === $swStore.userId ? isMine = true : isMine = false;
        if (!isMine) {
            $swStore.userFriends.forEach(frnd => {
                if (frnd.id === owner) {
                    ownerName = frnd.pubname;
                }
            });

        }
    })

    const surveyPost = () => {
        const theStyle = podtDiv.children[0].style.cssText;
        if (theStyle) {
            const openingIndex = theStyle.indexOf('(');
            const closingIndex = theStyle.indexOf(')');
            const imgUrl = theStyle.substring(openingIndex + 1, closingIndex);
            const children = mainImage.children;
            children[0]!.src = imgUrl;
            children[1].firstChild!.textContent = title;
            children[2].firstChild!.textContent = location;
            children[3].textContent = owner;
            $swStore.userFriends.forEach((frnd) => {
                if (frnd.id === owner) {
                    children[4].textContent = frnd.pubname;
                }
            });
            mainImage.dataset.postid = podtDiv.children[0].dataset.postid;
            swStore.setVar(new sWclass('scrollFrom', podtDiv));
            const elMainImage = document.querySelector('.main-image-div') as HTMLDivElement;
            elMainImage.scrollIntoView({
                behavior: 'smooth'
            });
            triggerMainImage = true;
            tick();
        }
    }

</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div 
    class="shared-moment-card mdl-card mdl-shadow--2dp" 
    on:click={surveyPost}
    bind:this={podtDiv}
>
    <div 
        class="mdl-card__title card__title" 
        class:mine-post={isMine}
        style="--image: url({image})"
        data-postid={postid}
    >
        <h2 class="mdl-card__title-text">
            {location}
        </h2>
    </div>
    <div class="mdl-card__supporting-text supporting-text">
        {title}
    </div>
    <div class="mdl-card__supporting-text supporting-text" id="post-owner">
        {owner}
    </div>
    <p class="sender-name" class:mine-post={!isMine}>{ownerName}</p>
</div>

<style lang="scss">
    .mdl-card {
        margin: 1rem auto 0 auto;
    
        .card__title {
            height: 180px;
            background-image: var(--image);
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;

            &.mine-post {
                border-right: #40c740 solid 10px;
            }

            .mdl-card__title-text {
                color: white;
                background-color: #00000070;
                padding: 0 0.4rem;
                border-radius: 0.4rem;
                text-align: center;
                margin: 0 auto;
                font-size: 16px;
                font-weight: 500;
            }
        }

        .supporting-text {
            text-align: center;
            font-size: 18px;
            color: rgba(0, 0, 0, .70);
            background-color: rgba(0, 0, 0, .05);
        }

        #post-owner {
            display: none;
        }

        .sender-name {
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
            }
        }
    }
</style>
