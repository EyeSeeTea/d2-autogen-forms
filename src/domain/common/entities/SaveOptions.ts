export type SaveOptions = { post: boolean; export: boolean };

export function getImportModeFromOptions(post: boolean): "COMMIT" | "VALIDATE" {
    return post ? "COMMIT" : "VALIDATE";
}
