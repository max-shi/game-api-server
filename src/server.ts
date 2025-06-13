import express from './config/express'
import { connect } from './config/db';
import Logger from './config/logger'
import fs from 'fs/promises';
import path from 'path';
import * as Backdoor from './app/models/backdoor.model';

const app = express();
const port = process.env.PORT || 4941;

// Check if database needs initialization
async function checkDatabaseInitialization() {
    const dbPath = process.env.SQLITE_DB_PATH || './storage/game_api.db';

    try {
        // Check if the database file exists and has content
        try {
            const stats = await fs.stat(dbPath);
            if (stats.size > 0) {
                Logger.info('Database already exists, skipping initialization');
                return;
            }
        } catch (err) {
            // File doesn't exist, we'll initialize it
            Logger.info('Database file not found, will initialize');
        }

        // Initialize the database
        Logger.info('Initializing database...');
        await Backdoor.resetDb();
        await Backdoor.loadData();
        Logger.info('Database initialization complete!');
    } catch (err) {
        Logger.error('Error initializing database:');
        Logger.error(err);
    }
}

// Connect to database and start server
async function main() {
    try {
        // Connect to database
        await connect();

        // Initialize database if needed
        await checkDatabaseInitialization();

        // Start the server
        app.listen(port, () => {
            Logger.info('Listening on port: ' + port)
        });
    } catch (err) {
        Logger.error('Unable to connect to database.')
        Logger.error(err)
        process.exit(1);
    }
}

main().catch(err => Logger.error(err));
