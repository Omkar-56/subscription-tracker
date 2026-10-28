// Web-standard stub for iconv-lite to run on Cloudflare Workers edge runtime
export function decode(buf, encoding = 'utf-8') {
  try {
    return new TextDecoder(encoding).decode(buf);
  } catch {
    return new TextDecoder('utf-8').decode(buf);
  }
}

export function encode(str, encoding = 'utf-8') {
  return new TextEncoder().encode(str);
}

export function encodingExists(enc) {
  try {
    new TextDecoder(enc);
    return true;
  } catch {
    return false;
  }
}

export function getDecoder(encoding = 'utf-8') {
  let td;
  try {
    td = new TextDecoder(encoding);
  } catch {
    td = new TextDecoder('utf-8');
  }
  return {
    write(buf) {
      return td.decode(buf, { stream: true });
    },
    end() {
      return td.decode();
    },
  };
}

export function getEncoder(encoding = 'utf-8') {
  return {
    write(str) {
      return new TextEncoder().encode(str);
    },
    end() {
      return new Uint8Array(0);
    },
  };
}

const iconv = {
  decode,
  encode,
  encodingExists,
  getDecoder,
  getEncoder,
};

export default iconv;
