import * as util from './util';
import solid from '@/solid/solid';
import $rdf from '@/solid/rdflib';
import $store from '@/store';
import { Profile, Simple } from '@/solid/types';

const keys = { prvkey: '', pubkey: '' };
const formatString = (input: string): string => {
  const parts1 = input.split('KEY-----');
  const header = parts1.splice(0, 1)[0] + 'KEY-----';
  const rest = parts1.join('KEY-----');
  const parts2 = rest.split('-----END');
  const body = parts2.splice(0, 1)[0];

  return body;
};

async function login (provider?: string) {
  console.log(' [*] SOLID LOGIN TO', provider);
  let session = await util.getSession();
  if (!session) {
    if (!provider) {
      session = await solid.auth.popupLogin({ popupUri: '/login-popup.html' });
    } else {
      await solid.auth.login(provider);
    }
  }

  return session;
}

async function logout () {
  return solid.auth.logout();
}

async function trackSession (cb: any) {
  solid.auth.trackSession(cb);
}

async function getProfile () {
  const session = await util.getSession();
  if (!session) {
    return null;
  }
  const webid = session.webId;
  await util.getFetcher().load(webid);
  return new Profile(util.getStore(), webid);
}

async function getKeys (strip: boolean) {
  if (keys.pubkey && keys.prvkey) {
    return {
      prvkey: strip ? formatString(keys.prvkey) : keys.prvkey,
      pubkey: strip ? formatString(keys.pubkey) : keys.pubkey,
    };
  }

  const session = await util.getSession();

  if (!session) {
    return null;
  }

  const host = session.webId.split('/profile')[0];

  const privateKeyId = host + '/public/keys/sigkey.ttl#this';
  const publicKeyId = host + '/public/keys/sigkey.pub.ttl#this';

  const localStore = $rdf.graph();
  const localFetcher = new $rdf.Fetcher(localStore);

  try {
    await Promise.all([
      localFetcher.load(privateKeyId),
      localFetcher.load(publicKeyId),
    ]);
  } catch (err) {
    if (err.status === 404) {
      $store.commit('setRegistering', true);
    }
    if (err.status === 401) {
      $store.dispatch('logout');
    }
    console.log('error', err.status, err.statusText, err.response);
  }

  const privkey = new Simple(localStore, privateKeyId);
  const pubkey = new Simple(localStore, publicKeyId);

  // console.log('got remote keys', strip, privkey.content, pubkey.content)

  if (privkey.content && pubkey.content) {
    keys.prvkey = privkey.content;
    keys.pubkey = pubkey.content;
    // console.log('keys', strip, keys)
    return {
      prvkey: strip ? formatString(keys.prvkey) : keys.prvkey,
      pubkey: strip ? formatString(keys.pubkey) : keys.pubkey,
    };
  }
  return null;
}

async function getUserProfile (username: string) {
  const id = `https://${username}/profile/card#me`;
  await util.getFetcher().load(id);
  // return new Profile(util.getStore(), id);
}

async function updateProfile (username: string) {
  const id = `https://${username}/profile/card#me`;
  await util.getFetcher().load(id);
  // return new Profile(util.getStore(), id);
}

export const getHost = util.gethost;

export default {
  getSession: util.getSession,
  getHost: util.gethost,
  login,
  logout,
  trackSession,
  getKeys,
  getProfile,
  getUserProfile,
};
