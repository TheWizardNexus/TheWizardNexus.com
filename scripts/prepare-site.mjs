import {copyFile, mkdir, readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createToolchain, projectPackageManifest} from 'arcane-os';
import appDescriptor from '../arcane-app.json' with {type: 'json'};

console.info('Refreshing The Wizard Nexus repository files for root and subdirectory hosting…');

const root = fileURLToPath(new URL('..', import.meta.url));
const toolchain = createToolchain(
    {
        workspaceRoot: root,
        appId: 'wizard-nexus',
        onEvent(event) {
            console.info(JSON.stringify(event));
        }
    }
);

await writeFile(
    new URL('../arcane-package.json', import.meta.url),
    `${JSON.stringify(projectPackageManifest(appDescriptor), null, 2)}\n`
);
await toolchain.importMap();
const {release} = await toolchain.package();
const releaseManifestPath = path.join(release.outputRoot, 'ARCANE_APP_RELEASE.json');
const releaseManifest = JSON.parse(await readFile(releaseManifestPath, 'utf8'));
const preparedFiles = new Set([
    ...appDescriptor.package.include.filter(function managedDocument(file) {
        return file.endsWith('.html');
    }),
    ...releaseManifest.files.filter(function generatedNavigation(file) {
        return file.startsWith(`apps/${appDescriptor.id}/`);
    }),
    'arcane.webmanifest',
    'arcane-pwa.mjs',
    'arcane-sw.js',
    'arcane-offline.json',
    'ARCANE_APP_RELEASE.json'
]);

// Publish the SDK's portable projections unchanged into the served checkout.
await Promise.all([...preparedFiles].map(async function publishPreparedFile(file) {
    const destination = path.join(root, file);
    await mkdir(path.dirname(destination), {recursive: true});
    await copyFile(path.join(release.outputRoot, file), destination);
}));

console.info('Repository offline files refreshed; include the generated changes in the source commit.');
