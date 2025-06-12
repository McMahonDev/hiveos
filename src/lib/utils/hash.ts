import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();
interface HashFunction {
	(a: string): string;
}
export const hash: HashFunction = (a) => {
	let hashed = crypto
		.pbkdf2Sync(a, process.env.INTERNAL_HASH as string, 1000, 64, `sha512`)
		.toString(`hex`);
	return hashed;
};
