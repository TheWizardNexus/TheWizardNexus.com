import {copyFile, mkdir, rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import releaseManifest from '../ARCANE_APP_RELEASE.json' with {type: 'json'};

console.info('Copying the prepared website for GitHub Pages…');

const root = fileURLToPath(new URL('..', import.meta.url));
const output = fileURLToPath(new URL('../output/pages/', import.meta.url));

// This fixed, ignored directory belongs only to the Pages upload operation.
await rm(output, {recursive: true, force: true});
await mkdir(output, {recursive: true});
await Promise.all([...releaseManifest.files, 'ARCANE_APP_RELEASE.json'].map(
    async function copyPublicFile(file) {
        const destination = path.join(output, file);
        await mkdir(path.dirname(destination), {recursive: true});
        await copyFile(path.join(root, file), destination);
    }
));

try {
    await copyFile(path.join(root, 'CNAME'), path.join(output, 'CNAME'));
} catch (error) {
    if (error.code !== 'ENOENT') throw error;
}

console.info('Prepared website copied to output/pages.');
