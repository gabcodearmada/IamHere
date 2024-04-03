import type { RequestHandler } from './$types';
import { promises as fs } from 'fs';
import { PostFb } from '$lib/classes/swClasses.ts';
import { pushNewPost } from '$lib/utilities/siteData';

const readPosts = async (): Promise<PostFb[]> => {
  const gotPosts: PostFb[] = [];
  const postsData = await fs.readFile('/posts-data/posts.json', 'utf-8');
  if (postsData) {
      const postStr = postsData.split(',,');
      for ( let i = 0; i < (postStr.length-1); i++ ) {
        gotPosts[i] = JSON.parse(postStr[i]) as PostFb;
      }
  }
  return gotPosts;
}

const writePosts = async (newPosts:PostFb[]): Promise<void> => {
  let jsonString = '';
  newPosts.forEach((post) => {
    jsonString += JSON.stringify(post, null, 2) + ',,';
  });
  await fs.writeFile('/posts-data/posts.json', jsonString);
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const formData = await request.formData();
    const what = formData.get('what') as string;

    if (what === 'delete') {
      const postid = formData.get('postid') as string;
      const image = formData.get('image') as string;
      if (postid) {
        const imagePath = 'static/moments/' + image.slice(image.lastIndexOf('/') + 1);
        const gotPosts = await readPosts();
        const newGotPosts = gotPosts.filter((post) => post.id !== postid);
        await writePosts(newGotPosts);

        await fs.unlink(imagePath);

        return new Response('200');
      }
    } else if (what === 'forward') {
      const postid = formData.get('postid') as string;
      let targets = formData.get('targets') as string;
      targets = JSON.parse(targets);

      if (targets && targets.length > 0) {
        const existingPosts = await readPosts();

        if (existingPosts && existingPosts.length > 0) {
          let k = -1;
          const targetsToPush: string[] = [];
          for( let i = 0; i < existingPosts.length; i++ ) {
            if (existingPosts[i].id === postid) {
              k = i;
              i = existingPosts.length + 10;
            }
          }
          if ( k >= 0 ) {
            const newPushPost = new PostFb(existingPosts[k].id, existingPosts[k].title, existingPosts[k].location, existingPosts[k].image, existingPosts[k].owner, []);
            let targetFound = false;
            for ( let j = 0; j < targets.length; j++ ) {
              if (!existingPosts[k].answerto.includes(targets[j])) {
                existingPosts[k].answerto.push(targets[j]);
                targetsToPush.push(targets[j]);
                newPushPost.answerto.push(targets[j]);
                targetFound = true;
              }
            }

            if (targetFound) {
              await writePosts(existingPosts);
              await pushNewPost(newPushPost);

              return new Response('200');
            } else {
              return new Response('401');
            }
          } else {
            return new Response('500');
          }
        } else {
          return new Response('500');
        }
      } else {
        console.log('targets-targets: ', targets);
        return new Response('402');
      }
      
    } else {
      const newPost = formData.get('newpost') as string;
      const postToAdd = JSON.parse(newPost) as PostFb;

      await fs.appendFile('/posts-data/posts.json', JSON.stringify(postToAdd, null, 2) + ',,');

      return new Response('200');
    }

  } catch (error) {
    return new Response('500');
  }
}

