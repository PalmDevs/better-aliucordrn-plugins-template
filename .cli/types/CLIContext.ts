export default interface CLIContext {
    packageManager: string;
    plugins: CLIPlugin[];
}

export interface CLIPlugin {
    name: string;
    available: boolean;
}
