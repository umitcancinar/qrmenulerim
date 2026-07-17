declare module 'bcryptjs' {
  export function hash(value: string, rounds: number): Promise<string>;
  export function compare(value: string, hashed: string): Promise<boolean>;
}

declare module '@prisma/client' {
  export class PrismaClient {
    [key: string]: any;
    constructor(...args: any[]);
    $disconnect(): Promise<void>;
  }
}
