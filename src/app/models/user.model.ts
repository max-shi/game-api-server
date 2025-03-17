import { getPool } from "../../config/db";
import Logger from "../../config/logger";

/**
 * Retrieves a user by their ID.
 *
 * Queries the database for the user's first name, last name, and email.
 *
 * @param id - The user's ID.
 * @returns The user object if found, or null if not found.
 */
const getUserById = async (id: number): Promise<{ firstName: string, lastName: string, email: string } | null> => {
    try {
        const sql = `
            SELECT first_name AS firstName,
                   last_name AS lastName,
                   email
            FROM user
            WHERE id = ?
        `;
        const [rows] = await getPool().query(sql, [id]);

        if (rows.length === 0) {
            return null;
        }

        return rows[0] as { firstName: string, lastName: string, email: string };
    } catch (err: any) {
        Logger.error(err.sql);
        throw err;
    }
}

/**
 * Retrieves a user by their email.
 *
 * Queries the database for the user's details including id, first name, last name, email, and password.
 *
 * @param email - The user's email address.
 * @returns The user object if found, or null if not found.
 */
const getUserByEmail = async (email: string): Promise<{ id: number, firstName: string, lastName: string, email: string, password: string } | null> => {
    try {
        const sql = `
            SELECT id, first_name AS firstName, last_name AS lastName, email, password
            FROM user
            WHERE email = ?
        `;
        const [rows] = await getPool().query(sql, [email]);
        if (rows.length === 0) {
            return null;
        }
        return rows[0] as { id: number, firstName: string, lastName: string, email: string, password: string };
    } catch (err: any) {
        Logger.error(err.sql);
        throw err;
    }
}

/**
 * Creates a new user in the database.
 *
 * Inserts a new user record with the provided first name, last name, email, and password.
 *
 * @param user - An object containing the user's details.
 * @returns The ID of the newly created user.
 */
const createUser = async (user: { firstName: string; lastName: string; email: string; password: string }): Promise<number> => {
    try {
        const sql = `
            INSERT INTO user (first_name, last_name, email, password)
            VALUES (?, ?, ?, ?)
        `;
        const [result] = await getPool().query(sql, [user.firstName, user.lastName, user.email, user.password]);
        return result.insertId;
    } catch (err: any) {
        Logger.error(err.sql);
        throw err;
    }
}

/**
 * Updates the user's authentication token.
 *
 * Sets the auth_token for the user with the given ID.
 *
 * @param id - The user's ID.
 * @param token - The new authentication token.
 * @returns A promise that resolves when the token update is complete.
 */
const updateUserToken = async (id: number, token: string): Promise<void> => {
    try {
        const sql = `
            UPDATE user
            SET auth_token = ?
            WHERE id = ?
        `;
        await getPool().query(sql, [token, id]);
    } catch (err: any) {
        Logger.error(err.sql);
        throw err;
    }
}

/**
 * Retrieves a user by their authentication token.
 *
 * Queries the database for the user associated with the provided token.
 *
 * @param token - The authentication token.
 * @returns The user object with the ID if found, or null if not found.
 */
const getUserByToken = async (token: string): Promise<{ id: number } | null> => {
    try {
        const sql = `
            SELECT id
            FROM user
            WHERE auth_token = ?
        `;
        const [rows] = await getPool().query(sql, [token]);
        if (rows.length === 0) {
            return null;
        }
        return rows[0] as { id: number };
    } catch (err: any) {
        Logger.error(err.sql);
        throw err;
    }
}

/**
 * Retrieves a user's details for authentication.
 *
 * Queries the database for the user's id, first name, last name, email, and password.
 *
 * @param id - The user's ID.
 * @returns The user object if found, or null if not found.
 */
const getUserByIdAuth = async (id: number): Promise<{ id: number, firstName: string, lastName: string, email: string, password: string } | null> => {
    try {
        const sql = `
            SELECT id,
                   first_name AS firstName,
                   last_name AS lastName,
                   email,
                   password
            FROM user
            WHERE id = ?
        `;
        const [rows] = await getPool().query(sql, [id]);
        if (rows.length === 0) {
            return null;
        }
        return rows[0] as { id: number, firstName: string, lastName: string, email: string, password: string };
    } catch (err: any) {
        Logger.error(err.sql);
        throw err;
    }
}

/**
 * Updates user details.
 *
 * Dynamically constructs and executes an SQL update query based on the provided fields.
 *
 * @param id - The user's ID.
 * @param data - An object with optional fields: firstName, lastName, email, and password.
 * @returns A promise that resolves when the update is complete.
 */
const updateUserDetails = async (id: number, data: { firstName?: string, lastName?: string, email?: string, password?: string }): Promise<void> => {
    try {
        const updates: string[] = [];
        const params: any[] = [];
        if (data.firstName) {
            updates.push("first_name = ?");
            params.push(data.firstName);
        }
        if (data.lastName) {
            updates.push("last_name = ?");
            params.push(data.lastName);
        }
        if (data.email) {
            updates.push("email = ?");
            params.push(data.email);
        }
        if (data.password) {
            updates.push("password = ?");
            params.push(data.password);
        }
        if (updates.length === 0) {
            return;
        }
        const sql = `UPDATE user SET ${updates.join(", ")} WHERE id = ?`;
        params.push(id);
        await getPool().query(sql, params);
    } catch (err: any) {
        Logger.error(err.sql);
        throw err;
    }
}

export { getUserById, updateUserDetails, updateUserToken, getUserByToken, getUserByIdAuth, createUser, getUserByEmail }
