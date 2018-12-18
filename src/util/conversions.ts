export const b642hex = (base64: string) => {
  const raw = atob(base64);
  let HEX = '';
  for (let i = 0; i < raw.length; i++) {
    const hexChar = raw.charCodeAt(i).toString(16);
    HEX += (hexChar.length === 2 ? hexChar : '0' + hexChar);
  }
  return HEX.toUpperCase();
};
export const ab2b64 = (ab: ArrayBuffer) => {
  return btoa(String.fromCharCode(...new Uint8Array(ab)));
};
export const b642ab = (base64: string): ArrayBuffer => {
  const binaryString =  atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++)        {
      bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer as ArrayBuffer;
};

export const ab2hex = (buffer: ArrayBuffer) => {
  const hexCodes = [];
  const view = new DataView(buffer);
  for (let i = 0; i < view.byteLength; i += 4) {
    const value = view.getUint32(i);
    const stringValue = value.toString(16);
    const padding = '00000000';
    const paddedValue = (padding + stringValue).slice(-padding.length);
    hexCodes.push(paddedValue);
  }

  // Join all the hex strings into one
  return hexCodes.join('');
};
export const hex2ab = (hexStr: string): ArrayBuffer => {
  const matches = hexStr.match(/[\da-f]{2}/gi);
  if (!matches) {
    return new ArrayBuffer(0);
  }
  const typedArray = new Uint8Array(
    matches.map((h) => {
      return parseInt(h, 16);
    }),
  );

  return typedArray.buffer as ArrayBuffer;
};
