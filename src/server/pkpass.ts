import { createHash } from "node:crypto";
import { crc32 } from "node:zlib";
import forge from "node-forge";

/** PEM files that sign a pass: the Pass Type ID certificate, its key and Apple's WWDR intermediate. */
export interface PassSigner {
  passTypeIdentifier: string;
  teamIdentifier: string;
  cert: string;
  key: string;
  keyPassphrase?: string;
  wwdr: string;
}

/**
 * A signed .pkpass: the files, manifest.json (SHA-1 of each) and a detached PKCS#7 signature of
 * the manifest, zipped. https://developer.apple.com/documentation/walletpasses/building-a-pass
 */
export function buildPkpass(files: Record<string, Buffer>, signer: PassSigner): Buffer {
  const manifest = Buffer.from(JSON.stringify(Object.fromEntries(Object.entries(files).map(([name, data]) => [name, createHash("sha1").update(data).digest("hex")]))));
  return zip({ ...files, "manifest.json": manifest, signature: sign(manifest, signer) });
}

function sign(manifest: Buffer, s: PassSigner): Buffer {
  const cert = forge.pki.certificateFromPem(s.cert);
  const key = s.keyPassphrase ? forge.pki.decryptRsaPrivateKey(s.key, s.keyPassphrase) : forge.pki.privateKeyFromPem(s.key);
  if (!key) throw new Error("Pass signing key can't be read (wrong passphrase?)");
  const p7 = forge.pkcs7.createSignedData();
  p7.content = forge.util.createBuffer(manifest.toString("binary"));
  p7.addCertificate(cert);
  p7.addCertificate(forge.pki.certificateFromPem(s.wwdr));
  p7.addSigner({
    key,
    certificate: cert,
    digestAlgorithm: forge.pki.oids.sha256,
    authenticatedAttributes: [
      { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
      { type: forge.pki.oids.messageDigest },
      // @types/node-forge says string; forge takes a Date.
      { type: forge.pki.oids.signingTime, value: new Date() as unknown as string },
    ],
  });
  p7.sign({ detached: true });
  return Buffer.from(forge.asn1.toDer(p7.toAsn1()).getBytes(), "binary");
}

/** Minimal zip, entries stored uncompressed (PNGs are compressed already). */
// ponytail: no zip64, fine while a pass stays far below 4 GB.
export function zip(files: Record<string, Buffer>): Buffer {
  const local: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;
  for (const [name, data] of Object.entries(files)) {
    const n = Buffer.from(name);
    const crc = crc32(data);
    const head = Buffer.alloc(30);
    head.writeUInt32LE(0x04034b50, 0);
    head.writeUInt16LE(20, 4);
    head.writeUInt16LE(33, 12); // 1980-01-01
    head.writeUInt32LE(crc, 14);
    head.writeUInt32LE(data.length, 18);
    head.writeUInt32LE(data.length, 22);
    head.writeUInt16LE(n.length, 26);
    const dir = Buffer.alloc(46);
    dir.writeUInt32LE(0x02014b50, 0);
    dir.writeUInt16LE(20, 4);
    dir.writeUInt16LE(20, 6);
    dir.writeUInt16LE(33, 14);
    dir.writeUInt32LE(crc, 16);
    dir.writeUInt32LE(data.length, 20);
    dir.writeUInt32LE(data.length, 24);
    dir.writeUInt16LE(n.length, 28);
    dir.writeUInt32LE(offset, 42);
    local.push(head, n, data);
    central.push(dir, n);
    offset += 30 + n.length + data.length;
  }
  const size = central.reduce((a, b) => a + b.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(central.length / 2, 8);
  end.writeUInt16LE(central.length / 2, 10);
  end.writeUInt32LE(size, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, ...central, end]);
}
