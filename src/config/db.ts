import mysql from 'mysql2/promise';
import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import Logger from './logger';
dotenv.config();

// Database type - can be 'mysql' or 'sqlite'
const DB_TYPE = process.env.DB_TYPE || 'sqlite';

// SQLite database file path
const SQLITE_DB_PATH = process.env.SQLITE_DB_PATH || './storage/game_api.db';

// State to hold database connection
const state: any = {
    pool: null,
    dbType: DB_TYPE
};

const connect = async (): Promise<void> => {
    if (DB_TYPE === 'sqlite') {
        // Ensure the directory exists
        const dbDir = path.dirname(SQLITE_DB_PATH);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }

        // Create SQLite database connection
        try {
            // We'll use mysql2 compatible wrapper for SQLite
            // This is a simplified implementation that provides the same interface
            const db = new sqlite3.Database(SQLITE_DB_PATH);

            // Create a promise-based wrapper for SQLite that mimics mysql2's interface
            state.pool = {
                dbType: 'sqlite', // Expose database type
                query: (sql: string, params?: any[]) => {
                    return new Promise((resolve, reject) => {
                        // For SQLite, we need to handle parameterized queries differently
                        // MySQL uses ? as placeholders, but SQLite needs explicit parameter handling

                        // Remove any MySQL-specific parameter placeholders if no params provided
                        let processedSql = sql;
                        if (!params || params.length === 0) {
                            // Replace any ? placeholders with NULL for SQLite compatibility when no params
                            processedSql = sql.replace(/\?/g, 'NULL');
                        }

                        // Handle multiple statements by splitting them
                        const statements = processedSql.split(';').filter(stmt => stmt.trim().length > 0);

                        if (statements.length === 1) {
                            // Single statement
                            if (processedSql.trim().toLowerCase().startsWith('select')) {
                                db.all(processedSql, params || [], (err, rows) => {
                                    if (err) reject(err);
                                    else resolve([rows, null]);
                                });
                            } else {
                                db.run(processedSql, params || [], function(err) {
                                    if (err) reject(err);
                                    else resolve([{affectedRows: this.changes, insertId: this.lastID}, null]);
                                });
                            }
                        } else {
                            // Multiple statements - execute in sequence
                            const results: any[] = [];
                            const executeNext = (index: number) => {
                                if (index >= statements.length) {
                                    resolve([results, null]);
                                    return;
                                }

                                const stmt = statements[index];
                                if (!stmt.trim()) {
                                    executeNext(index + 1);
                                    return;
                                }

                                if (stmt.trim().toLowerCase().startsWith('select')) {
                                    db.all(stmt, [], (err, rows) => { // No params for multi-statements
                                        if (err) reject(err);
                                        else {
                                            results.push(rows);
                                            executeNext(index + 1);
                                        }
                                    });
                                } else {
                                    db.run(stmt, [], function(err) { // No params for multi-statements
                                        if (err) reject(err);
                                        else {
                                            results.push({affectedRows: this.changes, insertId: this.lastID});
                                            executeNext(index + 1);
                                        }
                                    });
                                }
                            };

                            executeNext(0);
                        }
                    });
                },
                getConnection: () => Promise.resolve<any>({
                    release: () => { /* No action needed for SQLite */ }
                }),
                end: () => {
                    return new Promise<void>((resolve, reject) => {
                        db.close(err => {
                            if (err) reject(err);
                            else resolve();
                        });
                    });
                }
            };

            Logger.info(`Successfully connected to SQLite database at ${SQLITE_DB_PATH}`);
            return;
        } catch (err) {
            Logger.error(`Failed to connect to SQLite database: ${err.message}`);
            throw err;
        }
    } else {
        // MySQL connection logic
        const poolConfig: any = {
            connectionLimit: 100,
            multipleStatements: true,
            host: process.env.SENG365_MYSQL_HOST,
            user: process.env.SENG365_MYSQL_USER,
            password: process.env.SENG365_MYSQL_PASSWORD,
            database: process.env.SENG365_MYSQL_DATABASE,
            port: parseInt(process.env.SENG365_MYSQL_PORT,10) || 3306
        };

        // Only add SSL configuration if not connecting to localhost
        if (process.env.SENG365_MYSQL_HOST !== 'localhost' &&
            process.env.SENG365_MYSQL_HOST !== '127.0.0.1') {
            poolConfig.ssl = {
                rejectUnauthorized: false
            };
        }

        // Create MySQL connection pool
        state.pool = mysql.createPool(poolConfig);

        // Add dbType property to the pool object for consistency with SQLite
        state.pool.dbType = 'mysql';

        try {
            await state.pool.getConnection(); // Check connection
            Logger.info(`Successfully connected to MySQL database at ${process.env.SENG365_MYSQL_HOST}:${process.env.SENG365_MYSQL_PORT}`);
            return;
        } catch (err) {
            Logger.error(`Failed to connect to MySQL database: ${err.message}`);
            throw err;
        }
    }
};

// technically typed : () => mysql.Pool
const getPool = () => {
    return state.pool;
};

export {connect, getPool}
