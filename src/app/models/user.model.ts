import { getPool } from "../../config/db";
import Logger from "../../config/logger";

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
export {getUserById, updateUserDetails, updateUserToken, getUserByToken, getUserByIdAuth, createUser, getUserByEmail}
