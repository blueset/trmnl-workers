declare module "base92" {
  class Base92 {
    encode(data: Uint8Array | number[]): string;
    decode(data: string): Uint8Array;
  }
  export default Base92;
}
