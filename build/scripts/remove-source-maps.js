const bluebird = require('bluebird');
const glob = bluebird.promisify(require('glob').Glob);
const fs = bluebird.promisifyAll(require('fs-extra'));
const path = require('path');

async function removeSourceMappingCSS(rootDir) {
    var root = rootDir.split('/'),
        mapRe = /\/\*#\s*sourceMappingURL.*\*\//m;

    // remove mapping from css files.
    const matches = await glob(
        root
            .concat(['src', 'plugin', 'iframe_root', 'modules', 'vendor', '**', '*.css'])
            .join('/'),
        {
            nodir: true
        }
    );

    await Promise.all(
        matches.map(function (match) {
            return fs.readFileAsync(match, 'utf8').then(function (contents) {
                // replace the map line with an empty string
                if (!mapRe.test(contents)) {
                    return;
                }
                console.warn('Fixing up css file to remove mapping');
                console.warn(match);

                var fixed = contents.replace(mapRe, '');
                return fs.writeFileAsync(match, fixed);
            });
        })
    );
}

async function removeSourceMappingJS(rootDir) {
    var root = rootDir.split('/'),
        mapRe = /^\/\/#\s*sourceMappingURL.*$/m;

    // remove mapping from css files.
    const matches = await glob(
        root
            .concat(['src', 'plugin', 'iframe_root', 'modules', 'vendor', '**', '*.js'])
            .join('/'),
        {
            nodir: true
        }
    );

    await Promise.all(
        matches.map(function (match) {
            return fs.readFileAsync(match, 'utf8').then(function (contents) {
                // replace the map line with an empty string
                if (!mapRe.test(contents)) {
                    return;
                }
                console.warn('Fixing up css file to remove mapping');
                console.warn(match);

                var fixed = contents.replace(mapRe, '');
                return fs.writeFileAsync(match, fixed);
            });
        })
    );

}

// removeSourceMapping(process.cwd());

function main() {
    const cwd = process.cwd().split('/');
    cwd.push('..');
    const projectPath = path.normalize(cwd.join('/'));
    removeSourceMappingCSS(projectPath);
    removeSourceMappingJS(projectPath);
}

main();
