/* eslint-disable no-console */
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");

function mustGetKeyV1() {
  const b64 = process.env.MAILBOX_CRED_KEY_V1;
  if (!b64) throw new Error("MAILBOX_CRED_KEY_V1 is not set");
  const key = Buffer.from(b64, "base64");
  if (key.length !== 32) throw new Error("MAILBOX_CRED_KEY_V1 must be 32 bytes (base64 decoded)");
  return key;
}

function encryptV1(keyV1, plaintext) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", keyV1, iv);

  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return ["ENC", "v1", iv.toString("base64"), ciphertext.toString("base64"), tag.toString("base64")].join(":");
}

async function main() {
  const prisma = new PrismaClient();
  const keyV1 = mustGetKeyV1();

  // sadece PLAINTEXT: ile başlayanları al
  const rows = await prisma.mailboxCredential.findMany({
    where: {
      imapPasswordEnc: { startsWith: "PLAINTEXT:" },
    },
    select: {
      id: true,
      mailboxAccountId: true,
      imapPasswordEnc: true,
    },
  });

  console.log(`[migrate] found ${rows.length} plaintext IMAP passwords`);

  let updated = 0;

  for (const row of rows) {
    const raw = row.imapPasswordEnc;
    if (!raw || !raw.startsWith("PLAINTEXT:")) continue;

    const plain = raw.slice("PLAINTEXT:".length);
    const enc = encryptV1(keyV1, plain);

    await prisma.mailboxCredential.update({
      where: { id: row.id },
      data: { imapPasswordEnc: enc },
    });

    updated++;
    if (updated % 25 === 0) console.log(`[migrate] updated ${updated}/${rows.length}`);
  }

  console.log(`[migrate] done. updated=${updated}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});