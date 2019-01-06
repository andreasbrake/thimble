import * as util from './util';
import solid from '@/solid/solid';
import $rdf from '@/solid/rdflib';
import $store from '@/store';
import { Node, Folder, Content, Profile } from '@/solid/types';

export interface IStone {
  author: string;
  created: string;
  createdDate: string;
  content: string;
  mediaContent: string;
}

const XML = $rdf.Namespace('http://www.w3.org/2001/XMLSchema#');
const ELEMENTS = $rdf.Namespace('http://purl.org/dc/elements/1.1/');
const SIOC = $rdf.Namespace('http://rdfs.org/sioc/ns#');
export class Stone extends Node {
  constructor (id: string, store?: any, fetcher?: any) {
    super(id + '#this', store, fetcher)
  }
  get author () { return this.value(ELEMENTS, 'author'); }
  get created () { return this.value(ELEMENTS, 'created'); }
  get content () { return this.value(ELEMENTS, 'content'); }
  public async toJSON(): Promise<IStone> {
    console.log('loading author', this.author)
    const authorProfile = new Profile(this.author, this.store, this.fetcher);
    await authorProfile.load();
    return {
      author: authorProfile.fn,
      created: this.created,
      createdDate: new Date(this.created).toISOString().split('T')[0],
      content: new Content(this.baseId, this.store, this.fetcher).text,
      mediaContent: new Content(this.baseId, this.store, this.fetcher).media
    }
  }
}

export async function postItem (content: string, mediaB64: string) {
  const session = await util.getSession();
  const host = session.webId.split('/profile')[0];
  const now = new Date();

  const stoneData = `
    @prefix : <#>.
    @prefix card: </profile/card#>.
    @prefix dc: <http://purl.org/dc/elements/1.1/>.
    @prefix ns: <http://rdfs.org/sioc/ns#>.
    @prefix XML: <http://www.w3.org/2001/XMLSchema#>.

    :media
        dc:b64 "${mediaB64}".
    :content
        dc:d "${content.replace(/"/g, '\\"')}";
        dc:m ${mediaB64 ? ':media' : '""'}.
    :this
        dc:author card:me;
        dc:created "${now.toISOString()}"^^XML:dateTime;
        dc:content :content.
   `

   const nowDate = now.toISOString().split('T')[0];
   const id = now.toISOString().split('T')[1].slice(0, -1);
   await util.getFetcher().webOperation(
    'PUT',
    `${host}/public/app_data/thimble/river/last7days/${nowDate}/${id}.ttl`,
    {
      contentType: 'text/turtle',
      data: stoneData
    }
  );
}

export async function loadToday(host: string) {
  const today = new Date().toISOString().split('T')[0]
  const contentFolder = new Folder(`${host}/public/app_data/thimble/river/last7days/${today}`, util.getStore(), util.getFetcher());
  try {
    await contentFolder.load(true)
  } catch (err) {
    if (err.response.status === 404) {
      return []
    }
  }
  const itemList = [] as Array<Promise<IStone>>;
  console.log('found items', contentFolder.contents)
  for(const s of contentFolder.contents) {
    itemList.unshift(
      new Promise<IStone>(async (res, rej) => {
        const stoneContent = new Stone(`${s}`, util.getStore(), util.getFetcher());
        await stoneContent.load();
        const stoneJSON = await stoneContent.toJSON();
        res(stoneJSON);
      })
    )
  }
  return Promise.all(itemList);
}
export async function loadWeek (host: string) {
  const weekdayList = []
  for(let i=1; i <= 7; i++) {
    const date = new Date(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate() - i);
    weekdayList.push(date.toISOString().split('T')[0]);
  }
  
  const contentFolder = new Folder(`${host}/public/app_data/thimble/river/last7days`, util.getStore(), util.getFetcher());
  try {
    await contentFolder.load(true)
  } catch (err) {
    if (err.response.status === 404) {
      return []
    }
  }

  let itemList = [] as Array<Promise<IStone>>;
  for(const d of contentFolder.subfolders) {
    const folderName = d.split('/').slice(-1)[0]
    const i = weekdayList.indexOf(folderName);
    if (i < 0) {
      continue;
    }
    const contentFolder = new Folder(`${d}`, util.getStore(), util.getFetcher());
    await contentFolder.load(true);
    const dayStones = [] as Array<Promise<IStone>>;
    for(const s of contentFolder.contents) {
      dayStones.unshift(
        new Promise<IStone>(async (res, rej) => {
          const stoneContent = new Stone(`${s}`, util.getStore(), util.getFetcher());
          await stoneContent.load();
          const stoneJSON = await stoneContent.toJSON();
          res(stoneJSON);
        })
      )
    }
    itemList = itemList.concat(dayStones)
  }

  return Promise.all(itemList);
}

export function loadAll () {

}