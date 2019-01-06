import solid from '@/solid/solid';
import $rdf from '@/solid/rdflib';

import { Folder } from '@/solid/types';
import { verifyStructure } from './registerSetup';

let store = $rdf.graph();
let fetcher = new $rdf.Fetcher(store);
let updater = new $rdf.UpdateManager(store);
let host: any = null;

solid.auth.currentSession().then((session: any) => {
  store = $rdf.graph();
  fetcher = new $rdf.Fetcher(store);
  updater = new $rdf.UpdateManager(store);
  verifyStructure();
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
  return new Folder(id);
}
export async function addSubFolder (path: string, subFolder: string) {
  const key = `${path}${path[path.length - 1] !== '/' ? '/' : ''}${subFolder}/.dummy`;

  await store.fetcher.webOperation('PUT', key);
  await store.fetcher.webOperation('DELETE', key);
}
export async function getDocument (path: string, document: string) {
  const key = `${path}${path[path.length - 1] !== '/' ? '/' : ''}${document}`;
  try {
    await store.fetcher.webOperation('GET', key);
  } catch(err) {
    if (err.response) {
      throw err.response
    } else {
      throw err
    }
  }
  
}
export async function addDocument (path: string, document: string) {
  const key = `${path}${path[path.length - 1] !== '/' ? '/' : ''}${document}`;
  await store.fetcher.webOperation('PUT', key);
}
export async function removeDocument (path: string, document: string) {
  const key = `${path}${path[path.length - 1] !== '/' ? '/' : ''}${document}`;
  await store.fetcher.webOperation('DELETE', key);
}
