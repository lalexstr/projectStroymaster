import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
    apps: [
        {
            name: 'backend',
            script: 'server.js',
            cwd: __dirname,
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '500M',
            env: {
                NODE_ENV: 'production',
                PORT: 3000
            },
            error_file: path.join(__dirname, 'logs/backend-error.log'),
            out_file: path.join(__dirname, 'logs/backend-out.log'),
            log_file: path.join(__dirname, 'logs/backend-combined.log'),
            time: true
        },
        {
            name: 'frontend',
            cwd: path.join(__dirname, 'front'),
            script: 'node_modules/.bin/vite',
            args: 'preview --port 5173 --host',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '300M',
            env: {
                NODE_ENV: 'production'
            },
            error_file: path.join(__dirname, 'logs/frontend-error.log'),
            out_file: path.join(__dirname, 'logs/frontend-out.log'),
            log_file: path.join(__dirname, 'logs/frontend-combined.log'),
            time: true
        }
    ]
};