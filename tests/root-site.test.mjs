import test from 'node:test';
import assert from 'node:assert/strict';
import {access, readFile} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {Server} from 'node-http-server';

const root = fileURLToPath(new URL('..', import.meta.url));
const pwaFiles = [
    'arcane.webmanifest',
    'arcane-pwa.mjs',
    'arcane-sw.js',
    'arcane-offline.json'
];

test(
    'Git delivers the root PWA and every non-SDK offline and Pages resource without generation',
    async function inspectRootDelivery() {
        const [inventoryText, releaseText, trackedResult] = await Promise.all([
            readFile(path.join(root, 'arcane-offline.json'), 'utf8'),
            readFile(path.join(root, 'ARCANE_APP_RELEASE.json'), 'utf8'),
            promisify(execFile)('git', ['ls-files', '-z'], {cwd: root})
        ]);
        const inventory = JSON.parse(inventoryText);
        const releaseManifest = JSON.parse(releaseText);
        const tracked = new Set(trackedResult.stdout.split('\0'));
        const required = new Set([
            ...pwaFiles,
            'ARCANE_APP_RELEASE.json',
            ...releaseManifest.files,
            'apps/wizard-nexus/arcane-offline.json',
            'apps/wizard-nexus/arcane-sw.js',
            ...inventory.assets.map(function localAssetPath(asset) {
                const url = new URL(asset, 'http://localhost/');
                return decodeURIComponent(url.pathname).replace(/^\//, '');
            })
        ]);
        const missing = [];
        const runtimeFiles = [];
        for (const resource of required) {
            if (resource.startsWith('node_modules/arcane-os/')) {
                runtimeFiles.push(resource);
            } else if (!tracked.has(resource)) {
                missing.push(resource);
            }
        }
        if (missing.length > 0) {
            assert.fail(`Git does not deliver these required files:\n${missing.join('\n')}`);
        }
        const runtimeResults = await Promise.allSettled(
            runtimeFiles.map(function inspectInstalledRuntime(resource) {
                return access(path.join(root, resource));
            })
        );
        const missingRuntime = runtimeFiles.filter(function unavailableRuntime(resource, index) {
            return runtimeResults[index].status === 'rejected';
        });
        if (missingRuntime.length > 0) {
            assert.fail(`The installed Arcane SDK does not supply these offline files:\n${missingRuntime.join('\n')}`);
        }
    }
);

test(
    'the repository root serves its PWA files directly over HTTP without generation',
    async function inspectRootHttp() {
        const server = new Server({root, host: '127.0.0.1', port: 0});
        try {
            await new Promise(function listen(resolve, reject) {
                server.deploy(undefined, resolve);
                server.server.once('error', reject);
            });
            const origin = `http://127.0.0.1:${server.address().port}`;
            const responses = await Promise.all(
                pwaFiles.map(async function fetchPwaFile(resource) {
                    const response = await fetch(`${origin}/${resource}`);
                    const content = await response.text();
                    return {resource, response, content};
                })
            );
            for (const {resource, response, content} of responses) {
                assert.equal(response.status, 200, `${resource}: ${content}`);
                const contentType = response.headers.get('content-type');
                if (resource === 'arcane.webmanifest') {
                    assert.match(contentType, /^application\/manifest\+json\b/);
                    assert.equal(JSON.parse(content).name, 'The Wizard Nexus');
                } else if (resource === 'arcane-offline.json') {
                    assert.match(contentType, /^application\/json\b/);
                    assert.equal(JSON.parse(content).appId, 'wizard-nexus');
                } else {
                    assert.match(contentType, /^(?:text|application)\/javascript\b/);
                    assert.match(content, resource === 'arcane-pwa.mjs'
                        ? /registerPwa/
                        : /addEventListener\('install'/);
                }
            }
        } finally {
            await server.close();
        }
    }
);
