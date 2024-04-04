import type { Load, LoadEvent } from '@sveltejs/kit';
import { getSiteData } from '$lib/utilities/siteData.ts';
import { PostFb } from '$lib/classes/swClasses.ts';

export const load: Load = async (event: LoadEvent) => {
    let gotPosts: PostFb[] | null = null;
    let username = '';
    let userid = '';
    let friends = JSON.stringify([]);
    try {
        gotPosts = event.data!.props.gotPosts;
        // gotPosts = [];
        // if (data && data.length > 0) {
        //     const postsStr = data.split(',,');
        //     for ( let i = 0; i < (postsStr.length-1); i++ ) {
        //         gotPosts[i] = JSON.parse(postsStr[i]);
        //     }
        // }

        userid = event.data!.props.userid;
        username = event.data!.props.username;
        friends = event.data!.props.friends;
    } catch(err) {
        console.log('Reading posts.json: ', err);
        gotPosts = null;
    }

    const postsLocalData = await getSiteData(gotPosts);
	return {
		posts: postsLocalData,
        userid,
        username,
        friends
	};
}

