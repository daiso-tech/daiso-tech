import { nxViteTsPaths } from "@nx/vite/plugins/nx-tsconfig-paths.plugin";
import { defineConfig } from "vite";

export default defineConfig({
    root: __dirname,
    cacheDir: "../../node_modules/.vite/packages/file-system",

    plugins: [nxViteTsPaths()],

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
