import { execSync } from "child_process";

export function build(variant: string): void {
    Object.assign(process.env, {
        REACT_APP_REPORT_VARIANT: variant,
        NODE_OPTIONS: "--openssl-legacy-provider",
    });
    const cmd = `yarn --silent build`;
    console.debug(`Run: ${cmd}`);
    execSync(cmd, { stdio: [0, 1, 2] });
}

export const defaultOptions = {
    autogenFormOutput: "dist/custom-data-form.html",
};
