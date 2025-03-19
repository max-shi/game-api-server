import { getPool } from "../../config/db";
import Logger from "../../config/logger";

/**
 * Helper: Returns the creator id of a game given its id.
 * Returns null if no such game exists.
 */
export const getGameCreatorId = async (gameId: number): Promise<number | null> => {
    const pool = getPool();
    const query = "SELECT creator_id FROM game WHERE id = ?";
    const [rows] = await pool.query(query, [gameId]);
    if ((rows as any[]).length === 0) return null;
    return (rows as any[])[0].creator_id;
};

/**
 * Helper: Checks if the user has already marked the game as owned.
 */
export const isGameOwnedByUser = async (userId: number, gameId: number): Promise<boolean> => {
    const pool = getPool();
    const query = "SELECT 1 FROM owned WHERE user_id = ? AND game_id = ?";
    const [rows] = await pool.query(query, [userId, gameId]);
    return (rows as any[]).length > 0;
};

/**
 * Helper: Checks if the user has already wishlisted the game.
 */
export const isGameWishlistedByUser = async (userId: number, gameId: number): Promise<boolean> => {
    const pool = getPool();
    const query = "SELECT 1 FROM wishlist WHERE user_id = ? AND game_id = ?";
    const [rows] = await pool.query(query, [userId, gameId]);
    return (rows as any[]).length > 0;
};

/**
 * Marks a game as wishlisted for the given user.
 * Validates that the game exists, that the user is not its creator,
 * and that the game is not already owned by the user.
 */
export const addGameToWishlistModel = async (userId: number, gameId: number): Promise<void> => {
    const pool = getPool();

    const creatorId = await getGameCreatorId(gameId);
    if (creatorId === null) {
        throw new Error("No game with id");
    }
    if (creatorId === userId) {
        throw new Error("Cannot wishlist a game you created");
    }
    if (await isGameOwnedByUser(userId, gameId)) {
        throw new Error("Cannot wishlist a game you have marked as owned");
    }
    if (await isGameWishlistedByUser(userId, gameId)) {
        // Already wishlisted – silently succeed (or you may choose to return an error)
        return;
    }
    const insertQuery = "INSERT INTO wishlist (game_id, user_id) VALUES (?, ?)";
    await pool.query(insertQuery, [gameId, userId]);
};

/**
 * Removes a game from the user's wishlist.
 */
export const removeGameFromWishlistModel = async (userId: number, gameId: number): Promise<void> => {
    const pool = getPool();
    if (!(await isGameWishlistedByUser(userId, gameId))) {
        throw new Error("Game is not wishlisted by the user");
    }
    const deleteQuery = "DELETE FROM wishlist WHERE game_id = ? AND user_id = ?";
    await pool.query(deleteQuery, [gameId, userId]);
};

/**
 * Marks a game as owned for the given user.
 * Validates that the game exists and that the user is not its creator.
 * If the game is currently wishlisted by the user, it is removed from wishlist.
 */
export const addGameToOwnedModel = async (userId: number, gameId: number): Promise<void> => {
    const pool = getPool();

    const creatorId = await getGameCreatorId(gameId);
    if (creatorId === null) {
        throw new Error("No game with id");
    }
    if (creatorId === userId) {
        throw new Error("Cannot mark a game you created as owned");
    }
    if (await isGameOwnedByUser(userId, gameId)) {
        // Already owned; do nothing.
        return;
    }
    // Remove from wishlist if present.
    if (await isGameWishlistedByUser(userId, gameId)) {
        const deleteQuery = "DELETE FROM wishlist WHERE game_id = ? AND user_id = ?";
        await pool.query(deleteQuery, [gameId, userId]);
    }
    const insertQuery = "INSERT INTO owned (game_id, user_id) VALUES (?, ?)";
    await pool.query(insertQuery, [gameId, userId]);
};

/**
 * Unmarks a game as owned for the given user.
 */
export const removeGameFromOwnedModel = async (userId: number, gameId: number): Promise<void> => {
    const pool = getPool();
    if (!(await isGameOwnedByUser(userId, gameId))) {
        throw new Error("Game is not marked as owned by the user");
    }
    const deleteQuery = "DELETE FROM owned WHERE game_id = ? AND user_id = ?";
    await pool.query(deleteQuery, [gameId, userId]);
};
