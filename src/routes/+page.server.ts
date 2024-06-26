import { fail, type Load  } from '@sveltejs/kit';
import type { Actions } from './$types';
import { kv } from '@vercel/kv';
import { put } from '@vercel/blob';
import { PostFb, UsersApp, FriendsFull } from '$lib/classes/swClasses.ts';
import { pushNewPost } from '$lib/utilities/siteData';
import pkg from 'bcryptjs';
const {hash, genSalt, compare} = pkg;


const readUsers = async (): Promise<UsersApp[]> => {
    let  gotUsers: UsersApp[] = [];
    try {
        gotUsers = await kv.json.get('users') as UsersApp[];
    } catch (error) {
        console.log('error reading users: ', error);
    }

    return gotUsers;
}

const readPosts = async (): Promise<PostFb[]> => {
    let gotPosts: PostFb[] = [];
    try {
        gotPosts = await kv.json.get('posts') as PostFb[];
    } catch (error) {
        console.log('error reading posts: ', error);
    }
    return gotPosts;
}

const appendPost = async (newPost:PostFb): Promise<void> => {
    try {
        await kv.json.arrappend('posts', '$', newPost);
    } catch (error) {
        console.log('error appending post: ', error);
    }
}
/*
const writePosts = async (newPosts:PostFb[]): Promise<void> => {
    let jsonString = '';
    newPosts.forEach((post) => {
      jsonString += JSON.stringify(post, null, 2) + ',,';
    });
    await fs.writeFile('/posts-data/posts.json', jsonString);
}
*/
export const load: Load = async ({ cookies }) => {
    const userid = cookies.get('userid');

    let username = '';
    let gotPosts: PostFb[] = [];
    let friends: string[] = [];
    const fullFriends: FriendsFull[] = [];
    try {
        if (userid) {
            const gotUsers = await readUsers();
            if (gotUsers.length) {
                gotUsers.forEach((gotUser) => {
                    if (gotUser.id === userid) {
                        username = gotUser.username;
                        friends = gotUser.friends;
                    }
                });

                gotUsers.forEach((gotUser) => {
                    if (friends.includes(gotUser.id)) {
                        fullFriends.push(new FriendsFull(gotUser.id, gotUser.pubname));
                    }
                });
            }

            gotPosts = await readPosts();

            console.log('gotPosts at +page.server.ts: ', gotPosts);
        }

        return {
            props: {
                gotPosts,
                userid,
                username,
                friends: JSON.stringify(fullFriends)
            }
        };
    } catch(err) {
        console.log('error on loading: ', err);
        return {
            props: {
                gotPosts: [],
                userid: '',
                username: '',
                friends: JSON.stringify(fullFriends)
            }
        };
    }
};

export const actions = {
	savepost: async ({ request }) => {
		const data = await request.formData();

console.log('data: ', data);

        let title = data.get('title') as string;
        title = title.trim();
        let location = data.get('location') as string;
        location = location.trim();
        let imageType = data.get('image') as string;
        imageType = imageType.trim();
        let owner = data.get('owner') as string;
        owner = owner.trim();
        const answerto = data.getAll('answerto') as string[];
        let err = '';
        if ( title.length < 4 ) {
            err = 'Ο τίτλος πρέπει να έχει μήκος τουλάχιστον 4άρων γραμμάτων. ';
        }
        if ( location.length < 4 ) {
            if (err.length) {
                err += 'Επίσης και η τοποθεσία πάνω από 4 γράμματα.';
            } else {
                err = 'Η τοποθεσία πρέπει να έχει μήκος τουλάχιστον 4άρων γραμμάτων. ';
            }
        }
        if ( answerto.length === 0 ) {
            if (err.length) {
                err += 'Τέλος πρέπει οπωσδήποτε να ορισθεί παραλήπτης.';
            } else {
                err = 'Πρέπει οπωσδήποτε να ορισθεί παραλήπτης. Η αποστολή ακυρώνεται.';
            }
        }

        if (err.length) {
            return fail(422, {
                title: title,
                location: location,
                error: err
            });
        }

        const postId = crypto.randomUUID();
        let newPost: PostFb;
        if (imageType.length > 5) {
            newPost = new PostFb(postId, title, location, imageType, owner, answerto);
        } else {
            newPost = new PostFb(postId, title, location, `${postId}.${imageType}`, owner, answerto);
        }

        await appendPost(newPost);
        
        pushNewPost(newPost);

        const maxPostsNum = import.meta.env.VITE_VAPID_MAX_POSTS;
        const existingPosts = await readPosts() as PostFb[];
        const postsToBeDeleted: string[] = [];
        const imagesToBeDeleted: string[] = [];

        let k = 0;
        for (let i = (existingPosts.length - 1); i >= 0; i--) {
            if (existingPosts[i].owner === owner) {
                k++;
                if (k > maxPostsNum) {
                    postsToBeDeleted.push(existingPosts[i].id);
                    const imagePath = 'static/moments/' + existingPosts[i].image.slice(existingPosts[i].image.lastIndexOf('/') + 1);
                    imagesToBeDeleted.push(imagePath);
                }
            }
        }

        console.log( 'postsToBeDeleted: ', postsToBeDeleted);

        if (postsToBeDeleted.length) {
            const newPostsFromDel = existingPosts.filter((post) => !postsToBeDeleted.includes(post.id));
            // await writePosts(newPostsFromDel);

            // imagesToBeDeleted.forEach(async (img) => {
            //     await fs.unlink(img);
            // });
        }
        return { 
            response: {
                status: 200,
                postuserid: JSON.stringify(newPost, null, 2),
                friends: '',
                from: 'posts'
            }
        };
	},

    login: async ({ cookies, request }) => {
		const data = await request.formData();
        let username = data.get('username') as string;
        username = username.trim();
        let password = data.get('password') as string;
        password = password.trim();
        let err = '';

        // const salt = await genSalt(10);
        // const hashedPassword = await hash(password, salt);
        // console.log('hashedPassword: ', hashedPassword);

        let gotUsers: UsersApp[] | null = null;
        try {
            gotUsers = await readUsers();

            if (gotUsers.length) {
                let userId = '';
                let hashedPass = '';
                let friends: string[] = [];
                gotUsers.forEach((gotUser) => {
                    if (gotUser.username === username) {
                        hashedPass = gotUser.password;
                        userId = gotUser.id;
                        friends = gotUser.friends;
                    }
                });

                if (hashedPass !== '') {
                    const isPasswordValid = await compare(password, hashedPass);
                    if (isPasswordValid) {
                        const expires = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
                        cookies.set('userid', userId, { path: '/', expires: expires });

                        const fullFriends: FriendsFull[] = [];
                        gotUsers.forEach((gotUser) => {
                            if (friends.includes(gotUser.id)) {
                                fullFriends.push(new FriendsFull(gotUser.id, gotUser.pubname));
                            }
                        });


                        return {
                            response: {
                                status: 200,
                                postuserid: userId,
                                friends: JSON.stringify(fullFriends),
                                from: 'login'
                            }
                        };
                    } else {
                        err = 'The user\'s password is not valid';
                        return fail(422, {
                            status: 422,
                            postuserid: '',
                            friends: JSON.stringify([]),
                            from: 'login',
                            error: err
                        });
                    }
                } else {
                    err = 'The username is not valid';
                    return fail(422, {
                        status: 422,
                        postuserid: '',
                        friends: JSON.stringify([]),
                        from: 'login',
                        error: err
                    });
                }
            }
        } catch(error) {
            console.log('Read users error: ', error);
            // const jsonString = JSON.stringify(error, null, 2);
            err = 'The following error occurred: ' + error;
            return fail(500, {
                status: 500,
                postuserid: '',
                friends: '',
                from: 'login',
                error: err
            });
}
    }
} satisfies Actions;
