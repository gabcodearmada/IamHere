import { writable } from 'svelte/store';
import { thisSWclass, sWclass } from '$lib/classes/swClasses.ts';

const thisSW = new thisSWclass(null, false);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const theSW: any = writable(thisSW);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const swStore: any = {
    subscribe: theSW.subscribe,
    setVar: ( value: sWclass ) => {
        theSW.update((items: thisSWclass) => {
            const {propName, propValue} = value;
            const theSWnew: thisSWclass = { ...items, ...{[propName]: propValue} };
            items = { ...theSWnew };
            return items;
        });
    }
}

export default swStore;
