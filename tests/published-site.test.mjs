import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import appDescriptor from '../arcane-app.json' with {type: 'json'};

const root = fileURLToPath(new URL('..', import.meta.url));

test(
    'publishing includes public pages and offline runtime while excluding design previews and source tooling',
    async function inspectPublishedSite() {
        const output = path.join(root, 'output/pages');
        const entries = await readdir(output);
        const expectedPages = appDescriptor.package.include.filter(
            function rootHtmlPage(file) {
                return path.posix.dirname(file) === '.' && file.endsWith('.html');
            }
        );
        const publishedPages = entries.filter(
            function isHtmlPage(name) {
                return name.endsWith('.html');
            }
        );
        assert.deepEqual(publishedPages.sort(), expectedPages.sort());
        for (const name of ['assets', 'data', 'app.js', 'styles.css', 'ecosystem-diagram.css', 'contact.js', 'contact-policy.js', 'contact.css', 'robots.txt', 'sitemap.xml', '.nojekyll', 'node_modules', 'ARCANE_APP_RELEASE.json', 'arcane.webmanifest', 'arcane-offline.json', 'arcane-sw.js', 'arcane-pwa.mjs']) {
            assert.ok(entries.includes(name), `missing published dependency: ${name}`);
        }
        for (const name of ['.git', '.github', 'tests', 'scripts', 'README.md', 'apps', 'arcane']) {
            assert.ok(!entries.includes(name));
        }
        for (const page of expectedPages) {
            const [published, source] = await Promise.all([
                readFile(path.join(output, page), 'utf8'),
                readFile(path.join(root, page), 'utf8')
            ]);
            assert.match(published, /The Wizard Nexus/);
            const sourceMain = source.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1];
            assert.ok(sourceMain, `${page} should provide its main content`);
            for (const [, content] of sourceMain.matchAll(/>([^<>]+)</g)) {
                if (/\S/.test(content)) {
                    assert.ok(published.includes(content), `${page} omitted authored content: ${content}`);
                }
            }
        }
    }
);
