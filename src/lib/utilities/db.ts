import Dexie, { type Table } from 'dexie';
import { PostFb, PostFbSync, SubscrV } from '$lib/classes/swClasses.ts';

export interface Post {
    id?: string;
    title: string;
    location: string;
    image: string;
    owner: string;
    answerto: string[];
}

export interface PostSync {
    id?: string;
    title: string;
    location: string;
    owner: string;
    answerto: string[];
    image: string;
    picture: Blob;
}

export interface SubscrVer {
    id?: string;
    device: string;
    version: number;
}

class PostsDexie extends Dexie {
    posts!: Table<Post>; 
    syncposts!: Table<PostSync>; 
    subscrversion!: Table<SubscrVer>;
  
    constructor() {
      super('postsDatabase');
      this.version(1).stores({
        posts: 'id, fireid, title, color, location, image',
        syncposts: 'id, title, color, location, image',
        subscrversion: 'id, device, version'
    })
}}

export const db = new PostsDexie();

export const addToIndexDBposts = async (sdata:PostFb) => {
    try {
        await db.posts.add({
            id: sdata.id,
            title: sdata.title,
            location: sdata.location,
            image: sdata.image,
            owner: sdata.owner,
            answerto: sdata.answerto
        });
    } catch (error) {
        console.log(`Failed to add: ${error}`);
    }
}

export const getFromIndexDBposts = async () => {
    try {
        return await db.posts.toArray();
    } catch (error) {
        return null;
    }
}

export const clearIndexDBposts = async () => {
    try {
        return await db.posts.clear();
    } catch (error) {
        return null;
    }
}

export const addToIndexDBsyncPosts = async (sdata:PostFbSync) => {
    try {
        await db.syncposts.add({
            id: sdata.id,
            title: sdata.title,
            location: sdata.location,
            owner: sdata.owner,
            answerto: sdata.answerto,
            image: sdata.image,
            picture: sdata.picture,
        });
    } catch (error) {
        console.log(`Failed to add: ${error}`);
    }
}

export const getFromIndexDBsyncPosts = async () => {
    try {
        return await db.syncposts.toArray();
    } catch (error) {
        return null;
    }
}

export const deleteRecordIndexDBsyncPost = async (id:string) => {
    try {
        return await db.syncposts.where('id').equals(id).delete();
    } catch (error) {
        return null;
    }
}

export const addToIndexDBsubscr = async (sdata:SubscrV) => {
    try {
        await db.subscrversion.add({
            id: sdata.id,
            device: sdata.device,
            version: sdata.version
        });
    } catch (error) {
        console.log(`Failed to add: ${error}`);
    }
}

export const getFromIndexDBsubscr = async () => {
    try {
        return await db.subscrversion.toArray();
    } catch (error) {
        return null;
    }
}

export const clearIndexDBsubscr = async () => {
    try {
        return await db.subscrversion.clear();
    } catch (error) {
        return null;
    }
}
