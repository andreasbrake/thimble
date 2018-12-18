import { b642ab, ab2hex, hex2ab, ab2b64, b642hex } from '@/util/conversions';
import solidAPI from '@/solid';

let solidKeys: any = null;
const getKeys = async (): Promise<{ prvkey: string, pubkey: string }> => {
  if (!solidKeys || !solidKeys.prvkey) {
    solidKeys = await solidAPI.getKeys(true);
  }
  return solidKeys;
};

export const hash = async (msg: string) => {
  return await crypto.subtle.digest('SHA-256', new TextEncoder().encode(msg));
};

export const signJSON = async (msg: any, b64key?: any) => {
  // const msgStr = Object.keys(msg).map((k) =>
  //   k + '=' + msg[k]
  // ).join(',')
  const msgStr = JSON.stringify(msg);
  return sign(msgStr, b64key);
};
export const sign = async (msg: string, b64key?: any) => {
  if (!b64key) {
    const keys = await getKeys();

    if (!keys) {
      throw new Error('Could not resolve keys');
    }

    b64key = keys.prvkey;
  }

  const prvKey = await crypto.subtle.importKey(
    'pkcs8',
    b642ab(b64key),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );

  const hashValue = await hash(msg);
  const signature = await crypto.subtle.sign(
    {
      name: 'ECDSA',
      hash: { name: 'SHA-256' },
    },
    prvKey,
    hashValue,
  );

  const hexSig = ab2hex(signature);

  const verified = await verify(hexSig, msg);

  return hexSig;
};

export const verify = async (signature: string, msg: string, pubKeyPem?: string) => {
  const b64key = (await getKeys()).pubkey;
  const pubKey = await crypto.subtle.importKey(
    'spki',
    b642ab(pubKeyPem || b64key),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['verify'],
  );

  return crypto.subtle.verify(
    {
      name: 'ECDSA',
      hash: { name: 'SHA-256' },
    },
    pubKey,
    hex2ab(signature),
    await hash(msg),
  );
};

export const getPubKey = async () => {
  return (await getKeys()).pubkey;
};

export const genKeys = async () => {
  return crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true,
    ['sign', 'verify'],
  ).then((keypair) => {
    return Promise.all([
      crypto.subtle.exportKey('pkcs8', keypair.privateKey),
      crypto.subtle.exportKey('spki', keypair.publicKey),
    ]);
  }).then(([prvKey, pubKey]: any) => {
    return {
      prvkey: '-----BEGIN EC PRIVATE KEY-----' + ab2b64(prvKey) + '-----END EC PRIVATE KEY-----',
      pubkey: '-----BEGIN PUBLIC KEY-----' + ab2b64(pubKey) + '-----END PUBLIC KEY-----',
    };
  });
};
