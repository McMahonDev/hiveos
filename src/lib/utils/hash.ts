import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const hashSalt = import.meta.env.INTERNAL_HASH || process.env.INTERNAL_HASH;
if (!hashSalt) throw new Error('INTERNAL_HASH is not set');

interface HashFunction {
	(a: string): string;
}
export const hash: HashFunction = (a) => {
	let hashed = crypto.pbkdf2Sync(a, hashSalt, 1000, 64, `sha512`).toString(`hex`);
	return hashed;
};
