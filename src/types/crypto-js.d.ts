declare module 'crypto-js' {
  export interface WordArray {
    toString(encoder?: Encoder): string;
    sigBytes: number;
  }

  export interface Encoder {
    parse(str: string): WordArray;
    stringify(wordArray: WordArray): string;
  }

  export const enc: {
    Utf8: Encoder;
    Hex: Encoder;
    Base64: Encoder;
  };

  export const AES: {
    encrypt(message: string, key: string, cfg?: object): CipherParams;
    decrypt(ciphertext: string, key: string, cfg?: object): WordArray;
  };

  export const SHA256: {
    (message: string): string;
  };

  export const HmacSHA256: {
    (message: string, key: string): string;
  };

  export interface CipherParams {
    toString(): string;
  }

  export const mode: {
    GCM: object;
  };

  export const pad: {
    Pkcs7: object;
  };

  export function timingSafeEqual(a: WordArray, b: WordArray): boolean;
}
