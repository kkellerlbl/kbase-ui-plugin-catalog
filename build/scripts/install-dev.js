/*eslint-env node */
/*eslint strict: ["error", "global"] */
'use strict';
const bluebird = require('bluebird');
const glob = bluebird.promisify(require('glob').Glob);
const fs = bluebird.promisifyAll(require('fs-extra'));
const Terser = require('terser');
const path = require('path');
const tar = require('tar');

async function updateFiles(rootDir) {
    const root = rootDir.split('/');
    const source = root.concat(['src', 'plugin']).join('/');
    const dest = root.concat(['dist', 'plugin']).join('/');
    await fs.copyAsync(source, dest);
}


async function main() {
    const cwd = process.cwd().split('/');
    cwd.push('..');
    const projectPath = path.normalize(cwd.join('/'));
    console.log(`Project path: ${projectPath}`);
    console.log('Copying files to dist...');
    await updateFiles(projectPath);
    console.log('done');
}

main();