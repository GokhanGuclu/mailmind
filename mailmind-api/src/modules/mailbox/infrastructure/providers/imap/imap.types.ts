export type ImapCredentials = {
  host: string;
  port: number;
  secure: boolean;     // true => TLS
  username: string;
  password: string;
};