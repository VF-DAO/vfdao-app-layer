// Empty module stub for Node.js modules that aren't available in the browser
// Used by Turbopack to resolve fs, path, os, crypto, stream, http, tls
export default {};
export const readFileSync = () => '';
export const writeFileSync = () => {};
export const existsSync = () => false;
export const mkdirSync = () => {};
export const readdirSync = () => [];
export const statSync = () => ({});
export const unlinkSync = () => {};
export const createReadStream = () => ({});
export const createWriteStream = () => {};
