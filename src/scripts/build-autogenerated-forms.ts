import fs from "fs";
import path from "path";
import { build } from "./common";
import { inlineSource } from "inline-source";
import { ArgumentParser } from "argparse";

function log(...args: any[]) {
    console.debug(...args);
}

function getArgs() {
    const parser = new ArgumentParser({
        description: "Build autogenerated data entry form for DHIS2 data sets",
    });

    parser.add_argument("--skip-build", {
        help: "Skip build process",
        dest: "skipBuild",
        action: "store_true",
    });

    return parser.parse_args() as { skipBuild: boolean };
}

export async function convertReactHtmlToInline() {
    const args = getArgs();

    if (!args.skipBuild) build("autogenerated-forms");

    log(`Read: build/index.html`);
    const html0 = fs.readFileSync("build/index.html", "utf8");
    const html1 = getHtmlBodyContents(html0);
    const html2 = setScriptsAndStylesheetsAsInline(html1);
    const sourceHtmlPath = "build/index-autogenerated-form.html";
    fs.writeFileSync(sourceHtmlPath, html2);

    log(`Inline script/style tags`);
    const html3 = await inlineSource(sourceHtmlPath, { compress: true, rootpath: path.resolve("build") });

    fs.mkdirSync("dist", { recursive: true });
    const dest = "dist/custom-data-form.html";
    log(`Write: ${dest}`);
    fs.writeFileSync(dest, html3);
}

function setScriptsAndStylesheetsAsInline(html: string) {
    return html
        .replaceAll('.js"></script>', '.js" inline></script>')
        .replaceAll('rel="stylesheet">', 'rel="stylesheet" inline>');
}

function getHtmlBodyContents(html: string) {
    const startTag = "<body>";
    const endTag = "</body>";
    return html.slice(html.indexOf(startTag) + startTag.length, html.indexOf(endTag));
}

function main() {
    convertReactHtmlToInline();
}

main();
