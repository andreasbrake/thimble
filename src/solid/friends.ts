import * as util from './util';
import solid from '@/solid/solid';
import $rdf from '@/solid/rdflib';
import $store from '@/store';
import { Node, Folder, Content, Profile } from '@/solid/types';

export interface IFriend {
  card: string,
  name: string,
}

const SELF = $rdf.Namespace('#');
const ELEMENTS = $rdf.Namespace('http://purl.org/dc/elements/1.1/');
export class Friend extends Node {
  get card () { return this.value(ELEMENTS, 'card'); }
  get name () { return this.value(ELEMENTS, 'name'); }
  public async toJSON(): Promise<IFriend> {
    return {
      card: this.card,
      name: this.name,
    }
  }
}
export class Friends extends Node {
  constructor (id: string, store?: any, fetcher?: any) {
    super(id + '#this', store, fetcher)
  }
  get friends () { return this.values(ELEMENTS, 'friends'); }
  public async toJSON(): Promise<IFriend[]> {
    console.log('loading friends', this.friends)
    return Promise.all(
      this.friends.map((f: string) =>
        new Friend(f, this.store, this.fetcher).toJSON()
      ) as Array<Promise<IFriend>>
    )
  }
}

export async function loadAll () {
  const session = await util.getSession();
  const host = session.webId.split('/profile')[0];

  const friendsList = new Friends(`${host}/public/app_data/thimble/friends.ttl#this`, util.getStore(), util.getFetcher())
  await friendsList.load()
  return friendsList.toJSON()
}

export async function addFriend (webid: string) {
  const session = await util.getSession();
  const host = session.webId.split('/profile')[0];

  const doc = `${host}/public/app_data/thimble/friends.ttl`
  const friendsList = new Friends(`${doc}#this`, util.getStore(), util.getFetcher())
  await friendsList.load(true)
  const friendCount = friendsList.friends.length

  const sigkey = util.getStore().sym(doc);
  const thisObj = $rdf.sym(`${doc}#this`);
  const friendObj = $rdf.sym(`${doc}#f${friendCount}`);

  const profile = new Profile(webid, util.getStore(), util.getFetcher())
  await profile.load()

  const del: any[] = [];
  const ins = [
    new $rdf.Statement(friendObj, ELEMENTS('card'), webid, sigkey.doc()),
    new $rdf.Statement(friendObj, ELEMENTS('name'), profile.fn, sigkey.doc()),
    new $rdf.Statement(thisObj, ELEMENTS('friends'), SELF(`f${friendCount}`), sigkey.doc()),
  ];

  return new Promise((resolve, reject) => {
    util.getUpdater().update(del, ins, (uri: any, ok: any, msg: any, res: any) => {
      console.log('response', uri, ok, msg, res);
      if (ok) {
        resolve(msg);
      } else {
        reject(msg);
      }
    });
  });
}