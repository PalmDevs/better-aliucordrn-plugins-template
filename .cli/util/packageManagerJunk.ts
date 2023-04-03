import { renameSync, existsSync, mkdirSync } from 'fs';

export function move(packageManager: string) {
    handleFolderCreation();
    if (packageManager in junkFiles)
        junkFiles[packageManager as keyof typeof junkFiles].forEach(
            moveJunkHandler
        );
}

export function restore(packageManager: string) {
    handleFolderCreation();
    if (packageManager in junkFiles)
        junkFiles[packageManager as keyof typeof junkFiles].forEach(
            restoreJunkHandler
        );
}

export const handleFolderCreation = () =>
    !existsSync('./.cli/.pm-junk') && mkdirSync('./.cli/.pm-junk');
export const moveJunkHandler = (file: string) =>
    existsSync(file) && renameSync(file, `./.cli/.pm-junk/${file}`);
export const restoreJunkHandler = (file: string) =>
    existsSync(`./.cli/.pm-junk/${file}`) &&
    renameSync(`./.cli/.pm-junk/${file}`, file);

export const junkFiles = {
    npm: ['package-lock.json'],
    yarn: ['yarn.lock'],
    pnpm: ['pnpm-lock.yaml', 'pnpm-workspace.yaml'],
} as const;
