import solid from '@/solid/solid';
import $rdf from '@/solid/rdflib';

import { Folder, Data } from '@/solid/types';
import { verifyStructure } from './registerSetup';

let verified = false;
let store = $rdf.graph();
let fetcher = new $rdf.Fetcher(store);
let updater = new $rdf.UpdateManager(store);
let host: any = null;

solid.auth.currentSession().then((session: any) => {
  store = $rdf.graph();
  fetcher = new $rdf.Fetcher(store);
  updater = new $rdf.UpdateManager(store);
  verifyStructure();
  verified = true;
  host = session.webId.split('/profile')[0];
});

export function getFetcher () {
  return fetcher;
}
export function getFreshFetcher () {
  return new $rdf.Fetcher(store);
}
export function getStore () {
  return store;
}
export function getUpdater () {
  return updater;
}
export async function getSession () {
  const session = await solid.auth.currentSession();
  return session;
}
export function gethost () {
  return host;
}

export async function getFolder (path: string) {
  const id = `${path}`;
  await fetcher.load($rdf.sym(id));
  return new Folder(store, id);
}
export async function addSubFolder (path: string, subFolder: string) {
  const key = `${path}${path[path.length - 1] !== '/' ? '/' : ''}${subFolder}/.dummy`;

  await store.fetcher.webOperation('PUT', key);
  await store.fetcher.webOperation('DELETE', key);
}
export async function getDocument (path: string, document: string) {
  const key = `${path}${path[path.length - 1] !== '/' ? '/' : ''}${document}`;
  await store.fetcher.webOperation('GET', key);
}
export async function addDocument (path: string, document: string) {
  const key = `${path}${path[path.length - 1] !== '/' ? '/' : ''}${document}`;
  await store.fetcher.webOperation('PUT', key);
}
export async function removeDocument (path: string, document: string) {
  const key = `${path}${path[path.length - 1] !== '/' ? '/' : ''}${document}`;
  await store.fetcher.webOperation('DELETE', key);
}


export async function createData (path: string, name: string, content: string) {
  const key = `${path}${path[path.length - 1] !== '/' ? '/' : ''}${name}.ttl`;

  const now = new Date().toISOString();
  const ttl = `
    @prefix : <#>.
    @prefix n0: <http://purl.org/dc/elements/1.1/>.
    @prefix c: </profile/card#>.
    @prefix XML: <http://www.w3.org/2001/XMLSchema#>.
    @prefix n: <http://rdfs.org/sioc/ns#>.

    :this
        n0:author c:me;
        n0:created "${now}"^^XML:dateTime;
        n0:modified "${now}"^^XML:dateTime.
    :content
        n:content "${content.replace(/"/g, '\\"')}".
  `;
  await fetcher.webOperation(
    'PUT',
    key,
    {
      contentType: 'text/turtle',
      data: ttl,
    },
  );
}
export async function updateData (path: string, name: string, content: string) {
  const key = `${path}${path[path.length - 1] !== '/' ? '/' : ''}${name}.ttl`;
  await fetcher.webOperation(
    'DELETE',
    key,
  );
  await createData(path, name, content);
}
