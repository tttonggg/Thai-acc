declare module 'speakeasy' {
  export interface GenerateSecretOptions {
    name?: string;
    issuer?: string;
    length?: number;
  }

  export interface GeneratedSecret {
    base32: string;
    hex: string;
    ascii: string;
    otpauth_url?: string;
  }

  export interface TotpVerifyOptions {
    secret: string;
    encoding: 'base32' | 'hex' | 'ascii';
    token: string;
    window?: number;
    step?: number;
  }

  export interface OtpauthURLOptions {
    secret: string;
    label: string;
    issuer?: string;
    encoding?: 'base32' | 'hex' | 'ascii';
    type?: 'totp' | 'hotp';
    counter?: number;
  }

  export function generateSecret(options?: GenerateSecretOptions): GeneratedSecret;
  export function totp: {
    verify(options: TotpVerifyOptions): boolean;
  };
  export function otpauthURL(options: OtpauthURLOptions): string;
}
