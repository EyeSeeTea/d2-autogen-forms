/* Browser stub for Node's `fs`, aliased in vite.config.ts for the browser bundle only.

   A few data-layer repositories and use cases import `fs` to write/read JSON files. Those code
   paths run only from the CLI scripts (ts-node, which uses the real `fs`), never in the browser
   form/configurator. CRA's webpack 4 silently provided an empty `fs` mock so the unused imports
   didn't break the browser build; this stub reproduces that, but throws a clear error if any of
   these methods are ever actually called in the browser. */

function notAvailable(method: string): never {
    throw new Error(`fs.${method} is not available in the browser build (CLI-only code path)`);
}

export function writeFileSync(): never {
    return notAvailable("writeFileSync");
}

export function readFileSync(): never {
    return notAvailable("readFileSync");
}

export function existsSync(): never {
    return notAvailable("existsSync");
}

export default { writeFileSync, readFileSync, existsSync };
