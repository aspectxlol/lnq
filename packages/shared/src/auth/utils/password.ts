// import crypto from "crypto";

// const ITERATIONS = 100000;
// const KEYLEN = 64;
// const DIGEST = "sha512";

// export function hashPassword(password: string): string {
//   const salt = crypto.randomBytes(16).toString("hex");
//   const derived = crypto
//     .pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST)
//     .toString("hex");
//   return `${ITERATIONS}.${salt}.${derived}`;
// }

// export function verifyPassword(password: string, stored: string): boolean {
//   const parts = stored.split(".");
//   if (parts.length !== 3) return false;
//   const [iterStr, salt, hash] = parts;
//   const iter = Number(iterStr) || ITERATIONS;
//   const derived = crypto
//     .pbkdf2Sync(password, salt, iter, KEYLEN, DIGEST)
//     .toString("hex");
//   try {
//     return crypto.timingSafeEqual(
//       Buffer.from(hash, "hex"),
//       Buffer.from(derived, "hex"),
//     );
//   } catch (e) {
//     return false;
//   }
// }

export const TEMPORARY = "DO NOT USE";
