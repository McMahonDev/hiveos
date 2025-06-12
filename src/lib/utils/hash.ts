import crypto from 'crypto';
interface HashFunction {
	(a: string): string;
}
export const hash: HashFunction = (a) => {
	let hashed = crypto
		.pbkdf2Sync(a, process.env.VITE_INTERNAL_HASH as string, 1000, 64, `sha512`)
		.toString(`hex`);
	return hashed;
};
