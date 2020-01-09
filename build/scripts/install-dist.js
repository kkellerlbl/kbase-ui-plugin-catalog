/*eslint-env node */
/*eslint strict: ["error", "global"] */
'use strict';
const bluebird = require('bluebird');
const glob = bluebird.promisify(require('glob').Glob);
const fs = bluebird.promisifyAll(require('fs-extra'));
const Terser = require('terser');
const path = require('path');
const tar = require('tar');

async function copyFiles(rootDir) {
    const root = rootDir.split('/');
    const source = root.concat(['src', 'plugin']).join('/');
    const dest = root.concat(['dist', 'plugin']).join('/');
    try {
        await fs.removeAsync(dest);
    } catch (ex) {
        console.warn('WARNING removing dest', ex.message);
    }
    await fs.ensureDirAsync(dest);
    await fs.copyAsync(source, dest);
}

async function minify(rootDir) {
    const root = rootDir.split('/');

    // remove mapping from css files.
    const matches = await glob(
        root
            .concat(['dist', 'plugin', 'iframe_root', '**', '*.js'])
            .join('/'),
        {
            nodir: true
        }
    );
    console.log(`minifying ${matches.length} files...`);

    return Promise.all(
        matches.map(async (match) => {
            // console.log(`minifying ${match}...`);
            const contents = await fs.readFileAsync(match, 'utf8');
            const result = Terser.minify(contents, {
                output: {
                    beautify: false,
                    max_line_len: 80,
                    quote_style: 0
                },
                compress: {
                    // required in uglify-es 3.3.10 in order to work
                    // around a bug in the inline implementation.
                    // it should be fixed in an upcoming release.
                    inline: 1
                },
                safari10: true
            });
            if (result.error) {
                console.error('Error minifying file: ' + match, result);
                throw new Error('Error minifying file ' + match) + ':' + result.error;
            } else if (result.code.length === 0) {
                console.warn('Skipping empty file: ' + match);
            } else {
                return fs.writeFileAsync(match, result.code);
            }
        })
    );
}

async function taritup(rootDir) {
    const dir = 'dist';
    const dest = rootDir.concat(['dist.tgz']).join('/');
    console.log('tarring from ' + dir + ', to ' + dest);
    return tar.c({
        gzip: true,
        file: dest,
        portable: true,
        cwd: rootDir.join('/')
    }, [
        dir
    ]);
}

async function main() {
    const cwd = process.cwd().split('/');
    cwd.push('..');
    const projectPath = path.normalize(cwd.join('/'));
    console.log(`Project path: ${projectPath}`);
    console.log('Copying files to dist...');
    await copyFiles(projectPath);
    console.log('Minifying dist...');
    await minify(projectPath);
    console.log('tar-ing dist...');
    try {
        await taritup(projectPath.split('/'));
    } catch (ex) {
        console.error('Error tarring up dist! ' + ex.message);
    }
    console.log('done');
}



main();