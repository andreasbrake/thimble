import solid from '@/solid/solid';
import $rdf from '@/solid/rdflib';

import * as util from './util';

const XML = $rdf.Namespace('http://www.w3.org/2001/XMLSchema#');
const ELEMENTS = $rdf.Namespace('http://purl.org/dc/elements/1.1/');
const SIOC = $rdf.Namespace('http://rdfs.org/sioc/ns#');

async function setkey (host: string, path: string, name: string, key: string) {
  const store = $rdf.graph();
  const fetcher = new $rdf.Fetcher(store);
  await fetcher.load(path + '#this');

  const sigkey = store.sym(path);
  const selfObj = $rdf.sym(path + '#this');

  const CARD = $rdf.Namespace(host + '/profile/card#');

  const del: any[] = [];
  del.concat(store.statementsMatching(selfObj, SIOC('content'), null, sigkey.doc()));
  del.concat(store.statementsMatching(selfObj, ELEMENTS('author'), null, sigkey.doc()));
  del.concat(store.statementsMatching(selfObj, ELEMENTS('title'), null, sigkey.doc()));
  del.concat(store.statementsMatching(selfObj, ELEMENTS('created'), null, sigkey.doc()));

  const ins = [
    new $rdf.Statement(selfObj, SIOC('content'), key, sigkey.doc()),
    new $rdf.Statement(selfObj, ELEMENTS('author'), CARD('me'), sigkey.doc()),
    new $rdf.Statement(selfObj, ELEMENTS('title'), name, sigkey.doc()),
    new $rdf.Statement(selfObj, ELEMENTS('created'), XML(new Date().toISOString()), sigkey.doc()),
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

export async function verifyStructure () {
  const session = await util.getSession();

  const host = session.webId.split('/profile')[0];

  try {
    await util.getFolder(host + '/public/app_data');
  } catch (err) {
    if (err.status === 404) {
      await util.addSubFolder(host + '/public', 'app_data');
    }
  }

  try {
    await util.getFolder(host + '/public/app_data/thimble');
  } catch (err) {
    if (err.status === 404) {
      await util.addSubFolder(host + '/public/app_data', 'thimble');
    }
  }
}

export async function purgeKeys () {
  const session = await util.getSession();
  const host = session.webId.split('/profile')[0];

  try {
    await Promise.all([
      util.removeDocument(host + '/public/keys', 'sigkey.ttl'),
      util.removeDocument(host + '/public/keys', 'sigkey.pub.ttl'),
    ]);
  } catch (err) {
    console.log(err);
  }
}

export async function registerKeys (keys: { prvkey: string, pubkey: string }) {
  const session = await util.getSession();

  const host = session.webId.split('/profile')[0];

  try {
    await util.getFolder(host + '/public/keys');
  } catch (err) {
    if (err.status === 404) {
      await util.addSubFolder(host + '/public', 'keys');
    }
  }

  try {
    await Promise.all([
      util.removeDocument(host + '/public/keys', 'sigkey.ttl'),
      util.removeDocument(host + '/public/keys', 'sigkey.pub.ttl'),
    ]);
  } catch (err) {
    console.log(err);
  }

  await Promise.all([
    util.addDocument(host + '/public/keys', 'sigkey.ttl'),
    util.addDocument(host + '/public/keys', 'sigkey.pub.ttl'),
  ]);

  await Promise.all([
    setkey(host, host + '/public/keys/sigkey.ttl', 'private key', keys.prvkey),
    setkey(host, host + '/public/keys/sigkey.pub.ttl', 'public key', keys.pubkey),
  ]);
}
