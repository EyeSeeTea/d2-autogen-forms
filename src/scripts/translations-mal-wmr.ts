import _ from "lodash";
import { ArgumentParser } from "argparse";

import { getCompositionRoot } from "../compositionRoot";
import { D2Api } from "../types/d2-api";

/*
  npx ts-node src/scripts/translations-mal-wmr.ts -u username:password \
  --url http://localhost:8080 \
  --path=./translations.json \
  --post true
  --export true
  --autogenform ./autogenform.json
 */

async function main() {
    const parser = new ArgumentParser();

    parser.add_argument("-u", "--user-auth", {
        help: "DHIS2 authentication",
        metavar: "USERNAME:PASSWORD",
    });

    parser.add_argument("--url", {
        help: "DHIS2 base URL",
        metavar: "URL",
    });

    parser.add_argument("--path", { help: "path to the json file with all the translations to import" });
    parser.add_argument("--post", { help: "save changes to the server" });
    parser.add_argument("--export", { help: "generate metadata file" });
    parser.add_argument("--autogenform", { help: "path for the dataElements autogenform config" });

    const args = parser.parse_args();

    const [username, password] = args.user_auth.split(":", 2);
    if (!username || !password) return;
    if (!args.path) throw Error(`Invalid value for argument --path`);

    const api = new D2Api({ baseUrl: args.url, auth: { username, password } });
    const compositionRoot = getCompositionRoot(api);
    await compositionRoot.constants.import({
        path: args.path,
        post: !_.isEmpty(args.post) || false,
        export: !_.isEmpty(args.export) || false,
        autogenform: args.autogenform || "",
    });
}

main();
