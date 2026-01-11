declare module "bcryptjs" {
  interface Bcrypt {
    compare(data: string, encrypted: string): Promise<boolean>;
    hash(data: string, saltOrRounds: number): Promise<string>;
  }

  const bcrypt: Bcrypt;
  export default bcrypt;
}
