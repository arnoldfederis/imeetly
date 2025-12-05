/** biome-ignore-all lint/suspicious/noExplicitAny: not applicable, will remove this once bun 1.3.3 is dropped */
import { Readable, Writable } from "node:stream";
import zlib from "node:zlib";

const transformMap = {
  deflate: zlib.createDeflate,
  "deflate-raw": zlib.createDeflateRaw,
  gzip: zlib.createGzip,
};

globalThis.CompressionStream ??= class CompressionStream {
  readable;
  writable;
  constructor(format: "deflate" | "deflate-raw" | "gzip") {
    const handle = transformMap[format]();
    this.readable = Readable.toWeb(handle);
    this.writable = Writable.toWeb(handle);
  }
} as any;
