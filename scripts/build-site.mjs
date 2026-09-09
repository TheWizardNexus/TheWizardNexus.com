import {access, copyFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createToolchain, projectPackageManifest} from 'arcane-os';
import appDescriptor from '../arcane-app.json' with {type: 'json'};

console.info('Preparing The Wizard Nexus installation and offline package…');

const repositoryUrl = new URL('..', import.meta.url);
const root = fileURLToPath(repositoryUrl);
const toolchain = createToolchain(
    {
        workspaceRoot: root,
        appId: 'wizard-nexus',
        onEvent(event) {
            const record = JSON.stringify(event);
            console.info(record);
        }
    }
);

await writeFile(
    new URL('../arcane-package.json', import.meta.url),
    `${JSON.stringify(projectPackageManifest(appDescriptor), null, 2)}\n`
);
await toolchain.importMap();
const {release} = await toolchain.package();

const cnamePath = path.join(root, 'CNAME');
let hasCname = true;
try {
    await access(cnamePath);
} catch (error) {
    if (error.code !== 'ENOENT') throw error;
    hasCname = false;
}
if (hasCname) {
    const publishedCnamePath = path.join(release.outputRoot, 'CNAME');
    await copyFile(cnamePath, publishedCnamePath);
}

console.info(`Built The Wizard Nexus in ${release.output}.`);
