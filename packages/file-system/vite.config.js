"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nx_tsconfig_paths_plugin_1 = require("@nx/vite/plugins/nx-tsconfig-paths.plugin");
const vite_1 = require("vite");
exports.default = (0, vite_1.defineConfig)({
    root: __dirname,
    cacheDir: "../../node_modules/.vite/packages/file-system",
    plugins: [(0, nx_tsconfig_paths_plugin_1.nxViteTsPaths)()],
    // Uncomment this if you are using workers.
    // worker: {
    //  plugins: [ nxViteTsPaths() ],
    // },
    test: {
        watch: false,
        globals: true,
        cache: { dir: "../../node_modules/.vitest/packages/file-system" },
        environment: "node",
        include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
        reporters: ["default"],
        coverage: {
            reportsDirectory: "../../coverage/packages/file-system",
            provider: "v8",
        },
    },
});
