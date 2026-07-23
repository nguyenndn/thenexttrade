import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { realpathSync } from 'fs';

const projectRoot = realpathSync(process.cwd());

export default defineConfig({
    root: projectRoot,
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        // The current test suite does not use jest-dom matchers. Keeping this
        // empty avoids resolving the setup file through the host path when the
        // repository is mounted through the sandbox runner.
        setupFiles: [],
        include: ['src/**/*.test.{ts,tsx}'],
        exclude: ['node_modules', '.next', '.agents', 'prisma'],
    },
    resolve: {
        alias: {
            '@': path.resolve(projectRoot, './src'),
        },
    },
});
