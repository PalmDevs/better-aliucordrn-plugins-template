# ⬆️ Better AliucordRN Plugins Template
This is an improved version of the AliucordRN plugin template that offers support for multiple package managers, an easy-to-use CLI, and seamless integration with existing tools.

## ✨ Features
  - 👥 **Multiple package manager support**  
You're no longer limited to PNPM, use your preferred package manager!

  - 😄 **Better development environment**  
By integrating existing tools into your development process, you can significantly improve the speed and quality of your programming.  
Paired with the new CLI, which provides a better way to manage your development environment. It makes for an easier way for you to produce high-quality code that is error-free and consistently formatted.

  - 🤖 **Better workflow**  
Forgot to bump versions? No need to worry! Workflows will do this automatically for you. The version bumping follows the [Semantic Versioning specifications](https://semver.org), you'll need to be following the [Conventional Commits specifications](https://www.conventionalcommits.org) to use this feature. Don't want to follow that? Learn how to disable it [here](#-semantic-release).

## 🛑 Requirements
  - Node.js 18 or 19
  - One of these package managers: [**NPM**](https://npmjs.com/package/npm), [**Yarn**](https://npmjs.com/package/yarn), or [**PNPM**](https://npmjs.com/package/pnpm)  
*If you want more to be supported, please open an issue [here](https://github.com/PalmDevs/better-aliucordrn-plugin-template).*

## 👀 Differences
  - All plugins must be in the [**plugins**](./plugins/) directory, otherwise they'll not be recognized.
  - The **baseManifest.json** file has been renamed to [**manifest.json**](./manifest.json).
  - and probably more..?

## ⚒️ Setting up
  - Install the dependencies
```sh
npm install
# or if you use yarn
yarn install
# or if you use pnpm
pnpm install
```
This usually takes a bit of time. Please be patient as this template includes a lot of dependencies. If you know what you're doing, you can modify the [**package.json**](./package.json) file to remove some of the dependencies.

  - Check out the template!
  - Build the example plugin and test
```sh
npm run build ExamplePlugin
```

If you encounter any issues, please consider opening an issue in this GitHub repository.

### 👤 Setting up your package manager
The only thing you'll need to do is modify the preferred package manager in the [**.github/workflows/publish.yml**](./.github/workflows/publish.yml) workflow file. Other things are automatically managed by the CLI when you install the dependencies in the first step.

### 😁 Optional changes
  - Edit the `license` field in the **manifest.json** file to include your preferred license.  
You may also want to add a **LICENSE** file in your repository and change **package.json**'s `license` field.
  - Edit **package.json**'s `name` field to match your repository name.

### ⚠️ WARNING
It is not recommended to mess with any files in the **.cli** and the **.husky** directory as these should only be configured by their respective CLIs. Some things may not work correctly if you mess things up!  
Husky can be configured via `npx husky` and the CLI can be configured via `npm run cli` (see below for CLI examples).

## 📄 CLI Examples
All the examples use NPM, but you can use any package manager you'd like!

> **Warning**  
> When passing arguments into commands, package managers will likely parse those arguments and not actually pass them into the CLI scripts.
> If you need to pass an argument or a flag, it's recommended to include the `--` before any of them. This tells package managers to stop parsing the arguments for their own use.

### List all plugins
```sh
npm run list
```

### Build a plugin
```sh
npm run build ExamplePlugin
```

### Build all plugins
```sh
npm run build:all
```

### Watch for changes, compile, and deploy to Aliucord 
This will require you to have ADB installed on the system and your device connected.
```sh
npm run watch ExamplePlugin
```

### Use the CLI manually
Using a CLI manually is not recommended, only use it when you need it.
```sh
# npm run cli -- [options] [command]
npm run cli -- help
# build all plugins
npm run cli -- build --all
```

## 🚫 Disabling functionalities

### 🤖 Semantic Release
If you don't want the workflows to automatically bump versions for you for any reasons, you can remove the **Build and release** step in the **[publish.yml](./.github/workflows/publish.yml)** workflow. After that, you may want to delete the configurations, which are **.multi-releaserc** and **.releaserc**.  

If you wish, you can also uninstall the semantic-release packages as well, there's a CLI command to do that.
```sh
npm run cli -- --remove-semrel-packages
# or if you use yarn
yarn run cli -- --remove-semrel-packages
# or if you use pnpm
pnpm run cli -- --remove-semrel-packages
```

### 🪝 Git Hooks (Husky and Lint Staged)
If you don't want Git hooks to be automatically ran when you make a commit, there are three choices.

#### 💥 Unregister the hooks via Husky
This is the easiest.
  - Unregister the hooks
```sh
npm exec husky uninstall
# or if you use yarn
yarn exec husky uninstall
# or if you use pnpm
pnpm exec husky uninstall
```
  - Modify the **postinstall** script in **[package.json](./package.json)** to no longer install the hooks
```diff
- "postinstall": "NODE_NO_WARNINGS=1 ts-node-esm .cli/index.ts -- --remove-pm-junk; husky install"
+ "postinstall": "NODE_NO_WARNINGS=1 ts-node-esm .cli/index.ts -- --remove-pm-junk"
```

#### 🙅‍♂️ Commit with the `--no-verify` flag
Do this only if you'll be disabling it temporarily.
```sh
git commit -m 'this is a commit message' --no-verify
```

#### 🗑️ Uninstall everything altogether
Permanent solution, no more wasted space.
  - [**Follow the first method**](#-unregister-the-hooks-via-husky)
  - Then you need to uninstall the packages
```sh
npm uninstall husky lint-staged
# or if you use yarn
yarn uninstall husky lint-staged
# or if you use pnpm
pnpm uninstall husky lint-staged
```

  - **(Optional)** Remove the configuration files
```sh
# windows
del /f /s /q .husky .lintstagedrc
# unix-based operating systems
rm -rf .husky .lintstagedrc
```

### ✨ Prettier
  - Remove the **.prettierrc** and the **.prettierignore** file.
  - Uninstall Prettier
```sh
npm uninstall prettier
# or if you use yarn
yarn uninstall prettier
# or if you use pnpm
pnpm uninstall prettier
```