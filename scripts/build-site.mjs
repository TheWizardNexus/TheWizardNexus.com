import {access, copyFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createToolchain} from 'arcane-os';

console.info('Packaging The Wizard Nexus for static hosting…');

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
