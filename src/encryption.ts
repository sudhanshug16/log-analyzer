export type EncData = {
  cipher: string; // base64
  iv: string; // base64
  salt: string; // base64
  iter: number;
};

const PBKDF2_ITERATIONS = 100_000;

function bufToB64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function b64ToBuf(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

async function deriveKey(passphrase: string, salt: ArrayBuffer, iter: number) {
  const passKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: iter,
      hash: "SHA-256",
    },
    passKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptApiKey(
  key: string,
  passphrase: string
): Promise<EncData> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cryptoKey = await deriveKey(passphrase, salt.buffer, PBKDF2_ITERATIONS);
  const cipherBuf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    new TextEncoder().encode(key)
  );
  return {
    cipher: bufToB64(cipherBuf),
    iv: bufToB64(iv.buffer),
    salt: bufToB64(salt.buffer),
    iter: PBKDF2_ITERATIONS,
  };
}

export async function decryptApiKey(
  data: EncData,
  passphrase: string
): Promise<string | null> {
  try {
    const iv = new Uint8Array(b64ToBuf(data.iv));
    const salt = new Uint8Array(b64ToBuf(data.salt));
    const cryptoKey = await deriveKey(passphrase, salt.buffer, data.iter);
    const plainBuf = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      cryptoKey,
      b64ToBuf(data.cipher)
    );
    return new TextDecoder().decode(plainBuf);
  } catch {
    return null;
  }
}
