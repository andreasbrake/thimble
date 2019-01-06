import solid from '@/solid/solid';
import $rdf from '@/solid/rdflib';

import * as util from './util';
import { Folder } from './types';

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

  try {
    await util.getFolder(host + '/public/app_data/thimble/river');
  } catch (err) {
    if (err.status === 404) {
      await util.addSubFolder(host + '/public/app_data/thimble', 'river');
    }
  }
  try {
    await util.getFolder(host + '/public/app_data/thimble/river/last7days');
  } catch (err) {
    if (err.status === 404) {
      await util.addSubFolder(host + '/public/app_data/thimble/river', 'last7days');
    }
  }
  try {
    await util.getFolder(host + '/public/app_data/thimble/river/thisMonth');
  } catch (err) {
    if (err.status === 404) {
      await util.addSubFolder(host + '/public/app_data/thimble/river', 'thisMonth');
    }
  }
  try {
    await util.getFolder(host + '/public/app_data/thimble/river/lastMonth');
  } catch (err) {
    if (err.status === 404) {
      await util.addSubFolder(host + '/public/app_data/thimble/river', 'lastMonth');
    }
  }
  try {
    await util.getFolder(host + '/public/app_data/thimble/river/archive');
  } catch (err) {
    if (err.status === 404) {
      await util.addSubFolder(host + '/public/app_data/thimble/river', 'archive');
    }
  }
  try {
    await util.getFolder(host + '/public/app_data/thimble/keys');
  } catch (err) {
    if (err.status === 404) {
      await util.addSubFolder(host + '/public/app_data/thimble', 'keys');
    }
  }
  try {
    await util.getDocument(host + '/public/app_data/thimble', 'friends.ttl');
  } catch (err) {
    if (err.status === 404) {
      await util.getFetcher().webOperation(
        'PUT',
        `${host}/public/app_data/thimble/friends.ttl`,
        {
          contentType: 'text/turtle',
          data: `
              @prefix : <#>.
              @prefix el: <http://purl.org/dc/elements/1.1/>.

              :this
                  el:friends .
          `
        }
      );
    }
  }
}

export async function formatFolders () {
  const session = await util.getSession();
  const host = session.webId.split('/profile')[0];

  const thisWeekFolder = new Folder(host + '/public/app_data/thimble/river/last7days', util.getStore(), util.getFetcher());
  await thisWeekFolder.load()
  const thisMonthFolder = new Folder(host + '/public/app_data/thimble/river/thisMonth', util.getStore(), util.getFetcher());
  await thisMonthFolder.load()
  const lastMonthFolder = new Folder(host + '/public/app_data/thimble/river/lastMonth', util.getStore(), util.getFetcher());
  await lastMonthFolder.load()
  const archiveFolder = new Folder(host + '/public/app_data/thimble/river/archive', util.getStore(), util.getFetcher());
  await archiveFolder.load()

  const now = new Date()

  const weekStart = new Date(new Date().getDate() - 7)
  for(const f in thisWeekFolder.contents) {
    const fdate = new Date(f)
    if (fdate < weekStart) {
      try {
        await util.getFetcher().load(`${host}/public/app_data/thimble/river/thisMonth/${f}/`)
      } catch (err) {
        if (err.status === 404) {
          await util.addSubFolder(host + '/public/app_data/thimble/river/thisMonth', f);
        }
      }
      const contentFolder = new Folder(host + '/public/app_data/thimble/river/lastMonth/' + f, util.getStore(), util.getFetcher());
      contentFolder.load()
      const oldData = await util.getFetcher().load(`${host}/public/app_data/thimble/river/last7days/${f}/`);
      await util.getFetcher().webOperation(
        'PUT',
        `${host}/public/app_data/thimble/river/thisMonth/${f}/`,
        {
          contentType: 'text/turtle',
          data: oldData
        }
      );
      await util.getFetcher().webOperation('DELETE', `${host}/public/app_data/thimble/river/last7days/${f}/`);
    }
  }

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  for(const f in thisMonthFolder.contents) {
    const fdate = new Date(f)
    if (fdate < monthStart) {
      try {
        await util.getFetcher().load(`${host}/public/app_data/thimble/river/lastMonth/${f}/`)
      } catch (err) {
        if (err.status === 404) {
          await util.addSubFolder(host + '/public/app_data/thimble/river/lastMonth', f);
        }
      }
      const contentFolder = new Folder(host + '/public/app_data/thimble/river/lastMonth/' + f, util.getStore(), util.getFetcher());
      contentFolder.load()
      // TODO: move to last month
    }
  }

  const lastMonthStart = new Date(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)
  for(const f in lastMonthFolder.contents) {
    const fdate = new Date(f)
    if (fdate < lastMonthStart) {
      const year = fdate.getUTCFullYear()
      const month = fdate.getUTCMonth()
      try {
        await util.getFetcher().load(`${host}/public/app_data/thimble/river/archive/${year}-${month}/`)
      } catch (err) {
        if (err.status === 404) {
          await util.addSubFolder(host + '/public/app_data/thimble/river/archive', `${year}-${month}`);
        }
      }
      try {
        await util.getFetcher().load(`${host}/public/app_data/thimble/river/lastMonth/${year}-${month}/${f}`)
      } catch (err) {
        if (err.status === 404) {
          await util.addSubFolder(`${host}/public/app_data/thimble/river/lastMonth/${year}-${month}/`, f);
        }
      }
      const contentFolder = new Folder(host + '/public/app_data/thimble/river/lastMonth/' + f, util.getStore(), util.getFetcher());
      contentFolder.load()
      // TODO: move to archive
    }
  }
  
  const currentYear = new Date().getUTCFullYear()
  const currentMonth = new Date().getUTCMonth()
  const currentDay = new Date().getUTCDate()
  const todayFolder = `${currentYear}-${(currentMonth < 10 ? '0' : '') + currentMonth}-${(currentDay < 10 ? '0' : '') + currentDay}`
  try {
    await util.getFolder(host + '/public/app_data/thimble/river/' + todayFolder);
  } catch (err) {
    if (err.status === 404) {
      await util.addSubFolder(host + '/public/app_data/thimble/river', todayFolder);
    }
  }
}

formatFolders()

export async function purgeKeys () {
  const session = await util.getSession();
  const host = session.webId.split('/profile')[0];

  try {
    await Promise.all([
      util.removeDocument(host + '/public/app_data/thimble/keys', 'sigkey.ttl'),
      util.removeDocument(host + '/public/app_data/thimble/keys', 'sigkey.pub.ttl'),
    ]);
  } catch (err) {
    console.log(err);
  }
}

export async function registerKeys (keys: { prvkey: string, pubkey: string }) {
  const session = await util.getSession();

  const host = session.webId.split('/profile')[0];

  await verifyStructure()

  try {
    await Promise.all([
      util.removeDocument(host + '/public/app_data/thimble/keys', 'sigkey.ttl'),
      util.removeDocument(host + '/public/app_data/thimble/keys', 'sigkey.pub.ttl'),
    ]);
  } catch (err) {
    console.log(err);
  }

  await Promise.all([
    util.addDocument(host + '/public/app_data/thimble/keys', 'sigkey.ttl'),
    util.addDocument(host + '/public/app_data/thimble/keys', 'sigkey.pub.ttl'),
  ]);

  await Promise.all([
    setkey(host, host + '/public/app_data/thimble/keys/sigkey.ttl', 'private key', keys.prvkey),
    setkey(host, host + '/public/app_data/thimble/keys/sigkey.pub.ttl', 'public key', keys.pubkey),
  ]);
}
