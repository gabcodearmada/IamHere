export class sWclass  {
    propName: string;
    propValue: unknown;

    constructor ( 
        prName: string,
        prValue: unknown
    ) {
        this.propName = prName;
        this.propValue = prValue;
    }
};

export class thisSWclass  {
    deferredPrompt: BeforeInstallPromptEvent | null;
    isOnline: boolean;

    constructor ( 
        dp:BeforeInstallPromptEvent | null,
        online: boolean
    ) {
        this.deferredPrompt = dp;
        this.isOnline = online;
    }
};

export class PostFb {
    id: string;
    title: string;
    location: string;
    image: string;
    owner: string;
    answerto: string[];

    constructor (
        id: string,
        title: string,
        location: string,
        image: string,
        owner: string,
        answerto: string[]
    ) {
        this.id = id;
        this.title = title;
        this.location = location;
        this.image = image;
        this.owner = owner;
        this.answerto = answerto;
    }
}

export class PostFbSync {
    id: string;
    title: string;
    location: string;
    owner: string;
    answerto: string[];
    image: string;
    picture: Blob;
   
    constructor(
        id: string,
        title: string,
        location: string,
        owner: string,
        answerto: string[],
        image: string,
        picture: Blob
    ) {
        this.id = id;
        this.title = title;
        this.location = location;
        this.owner = owner;
        this.answerto = answerto;
        this.image = image;
        this.picture = picture;
    }
}

export class UsersApp {
    id: string;
    username: string;
    password: string;
    friends: string[];
    pubname: string;
   
    constructor(
        id: string,
        username: string,
        password: string,
        friends: string[],
        pubname: string
    ) {
        this.id = id;
        this.username = username;
        this.password = password;
        this.friends = friends;
        this.pubname = pubname;
    }
}

export class FriendsFull {
    id: string;
    pubname: string;

    constructor(
        id: string,
        pubname: string
    ) {
        this.id = id;
        this.pubname = pubname;
    }
}

export class FromForm {
    status: number;
    postuserid: string;
    friends: string;
    from: string;
   
    constructor(
        status: number,
        postuserid: string,
        friends: string,
        from: string
    ) {
        this.status = status;
        this.postuserid = postuserid;
        this.friends = friends;
        this.from = from;
    }
}

export class SubscrV {
    id: string;
    device: string;
    version: number;
   
    constructor(
        id: string,
        device: string,
        version: number
    ) {
        this.id = id;
        this.device = device;
        this.version = version;
    }
}

