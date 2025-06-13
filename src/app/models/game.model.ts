import { getPool } from "../../config/db";
import Logger from "../../config/logger";

interface Game {
    gameId: number;
    title: string;
    genreId: number;
    creationDate: string;
    creatorId: number;
    price: number;
    creatorFirstName: string;
    creatorLastName: string;
    rating: number;
    platformIds: number[];
}

interface GetGamesParams {
    startIndex: number;
    count: number;
    q?: string;
    genreIds?: number[] | null;
    platformIds?: number[] | null;
    price?: number;
    creatorId?: number | null;
    reviewerId?: number | null;
    sortBy: string;
    ownedByMe?: boolean;
    wishlistedByMe?: boolean;
    userId?: number;
}

interface DetailedGame extends Game {
    description: string;
    rating: number;
    platformIds: number[];
    numberOfOwners: number;
    numberOfWishlists: number;
}

interface PostGame {
    title: string;
    description: string;
    genreId: number;
    price: number;
    platformIds: number[];
}

const getGames = async (
    params: GetGamesParams
): Promise<{ games: Game[]; count: number }> => {
    // Build dynamic WHERE clause and parameters for filters.
    const conditions: string[] = [];
    const queryParams: any[] = [];
    if (params.q) {
        conditions.push("(game.title LIKE ? OR game.description LIKE ?)");
        queryParams.push(`%${params.q}%`, `%${params.q}%`);
        Logger.info("parameter q", params.q);
    }

    if (params.genreIds && params.genreIds.length > 0) {
        const placeholders = params.genreIds.map(() => "?").join(",");
        conditions.push(`game.genre_id IN (${placeholders})`);
        queryParams.push(...params.genreIds);
        Logger.info("parameter genreIds", params.genreIds);
    }

    if (params.price !== null) {
        if (params.price === 0) {
            conditions.push("game.price = 0");
            Logger.info("filtering for free games (price = 0)");
        } else {
            conditions.push("game.price <= ?");
            Logger.info("parameter price LESS THAN", params.price);
            queryParams.push(params.price);
        }
    }

    if (params.creatorId !== null && params.creatorId !== undefined) {
        conditions.push("game.creator_id = ?");
        queryParams.push(params.creatorId);
        Logger.info("parameter creatorId", params.creatorId);
    }

    // Platform filtering: Only include games that have at least one matching platform.
    if (params.platformIds && params.platformIds.length > 0) {
        const placeholders = params.platformIds.map(() => "?").join(",");
        conditions.push(`game.id IN (
            SELECT gp.game_id FROM game_platforms gp
            WHERE gp.platform_id IN (${placeholders})
        )`);
        queryParams.push(...params.platformIds);
        Logger.info("parameter platformIds", params.platformIds);
    }

    // Filter games by reviewerId (i.e. where that user has left a review).
    if (params.reviewerId !== null && params.reviewerId !== undefined) {
        conditions.push(`game.id IN (
            SELECT gr.game_id FROM game_review gr
            WHERE gr.user_id = ?
        )`);
        queryParams.push(params.reviewerId);
        Logger.info("parameter reviewerId", params.reviewerId);
    }

    // Filter by games owned by the logged-in user.
    if (params.ownedByMe) {
        if (!params.userId) {
            throw new Error("User ID is required for ownedByMe filter");
        }
        conditions.push(`game.id IN (
            SELECT o.game_id FROM owned o
            WHERE o.user_id = ?
        )`);
        queryParams.push(params.userId);
        Logger.info("filtering for games owned by user", params.userId);
    }

    // Filter by games wishlisted by the logged-in user.
    if (params.wishlistedByMe) {
        if (!params.userId) {
            throw new Error("User ID is required for wishlistedByMe filter");
        }
        conditions.push(`game.id IN (
            SELECT w.game_id FROM wishlist w
            WHERE w.user_id = ?
        )`);
        queryParams.push(params.userId);
        Logger.info("filtering for games wishlisted by user", params.userId);
    }

    const whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";
    Logger.info("whereClause = " + whereClause);
    // TODO this is horrible
    const allowedSortBys = new Set([
        "ALPHABETICAL_ASC",
        "ALPHABETICAL_DESC",
        "PRICE_ASC",
        "PRICE_DESC",
        "CREATED_ASC",
        "CREATED_DESC",
        "RATING_ASC",
        "RATING_DESC"
    ]);

    let orderByClause = "";
    const sortBy = params.sortBy.trim().toUpperCase();

    if (!allowedSortBys.has(sortBy)) {
        throw new Error(`Invalid sortBy parameter: ${params.sortBy}`);
    }

    switch (sortBy) {
        case "ALPHABETICAL_ASC":
            orderByClause = "ORDER BY game.title ASC, game.id ASC";
            break;
        case "ALPHABETICAL_DESC":
            orderByClause = "ORDER BY game.title DESC, game.id ASC";
            break;
        case "PRICE_ASC":
            orderByClause = "ORDER BY game.price ASC, game.id ASC";
            break;
        case "PRICE_DESC":
            orderByClause = "ORDER BY game.price DESC, game.id ASC";
            break;
        case "CREATED_ASC":
            orderByClause = "ORDER BY game.creation_date ASC, game.id ASC";
            break;
        case "CREATED_DESC":
            orderByClause = "ORDER BY game.creation_date DESC, game.id ASC";
            break;
        case "RATING_ASC":
            orderByClause = "ORDER BY rating ASC, game.id ASC";
            break;
        case "RATING_DESC":
            orderByClause = "ORDER BY rating DESC, game.id ASC";
            break;
        default:
            orderByClause = "ORDER BY game.creation_date ASC, game.id ASC";
            Logger.info("ordering by creation date");
    }

    // Get a connection pool
    const pool = getPool();

    // Count query to get the total matching games (ignoring pagination)
    const countQuery = `SELECT COUNT(*) as total FROM game ${whereClause}`;
    const [countResult] = await pool.query(countQuery, queryParams);
    const totalCount = countResult[0].total;
    // Build the SELECT for average rating for each game.
    const ratingSelect = "(SELECT IFNULL(AVG(r.rating), 0) FROM game_review r WHERE r.game_id = game.id) AS rating";
    // https://www.w3schools.com/sql/func_mysql_ifnull.asp
    // for info on GROUP_CONCAT see https://www.geeksforgeeks.org/mysql-group_concat-function/
    // Main query to get the game records.
    const mainQuery = `
    SELECT
      game.id AS gameId,
      game.title,
      game.genre_id AS genreId,
      game.creation_date AS creationDate,
      game.creator_id AS creatorId,
      game.price,
      u.first_name AS creatorFirstName,
      u.last_name AS creatorLastName,
      ${ratingSelect},
      (SELECT GROUP_CONCAT(gp.platform_id)
       FROM game_platforms gp
       WHERE gp.game_id = game.id) AS platformIds
    FROM game
    JOIN user u ON game.creator_id = u.id
    ${whereClause}
    ${orderByClause}
    LIMIT ? OFFSET ?
    `;
    const mainQueryParams = [...queryParams, params.count, params.startIndex];
    const [rows] = await pool.query(mainQuery, mainQueryParams);
    const games: Game[] = rows.map((row: any) => ({
        gameId: row.gameId,
        title: row.title,
        genreId: row.genreId,
        creationDate: new Date(row.creationDate).toISOString(),
        creatorId: row.creatorId,
        price: row.price,
        creatorFirstName: row.creatorFirstName,
        creatorLastName: row.creatorLastName,
        rating: parseFloat(row.rating),
        platformIds: row.platformIds
            ? row.platformIds.split(",").map((id: string) => parseInt(id, 10))
            : []
    }));
    Logger.info("totalCount = " + totalCount);
    if (totalCount === 0) {
        throw new Error(`Invalid, no count`);
    }
    return {
        games,
        count: totalCount
    };
};

const editGame = async (
    gameId: number,
    updatedData: { title?: string; description?: string; genreId?: number; price?: number; platforms?: number[] },
    userId: number
): Promise<void> => {
    const pool = getPool();
    const game = await getGameById(gameId);
    if (!game) {
        throw new Error("No game found");
    }
    if (game.creatorId !== userId) {
        throw new Error("Only the creator of a game may change it");
    }
    if (updatedData.title && updatedData.title !== game.title) {
        const [rows] = await pool.query("SELECT id FROM game WHERE title = ? AND id != ?", [updatedData.title, gameId]);
        if ((rows as any[]).length > 0) {
            throw new Error("Game title already exists");
        }
    }
    if (updatedData.genreId !== undefined) {
        const [genreRows] = await pool.query("SELECT id FROM genre WHERE id = ?", [updatedData.genreId]);
        if ((genreRows as any[]).length === 0) {
            throw new Error("Invalid genreId: genre does not exist");
        }
    }
    if (
        !updatedData.platforms ||
        !Array.isArray(updatedData.platforms) ||
        updatedData.platforms.length === 0
    ) {
        throw new Error("platformIds must be a non-empty array");
    }
    const placeholders = updatedData.platforms.map(() => "?").join(",");
    const [platformRows] = await pool.query(
        `SELECT id FROM platform WHERE id IN (${placeholders})`,
        updatedData.platforms
    );
    if ((platformRows as any[]).length !== updatedData.platforms.length) {
        throw new Error("One or more platformIds are invalid");
    }

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (updatedData.title !== undefined) {
        updateFields.push("title = ?");
        updateValues.push(updatedData.title);
    }
    if (updatedData.description !== undefined) {
        updateFields.push("description = ?");
        updateValues.push(updatedData.description);
    }
    if (updatedData.genreId !== undefined) {
        updateFields.push("genre_id = ?");
        updateValues.push(updatedData.genreId);
    }
    if (updatedData.price !== undefined) {
        updateFields.push("price = ?");
        updateValues.push(updatedData.price);
    }

    if (updateFields.length > 0) {
        const updateQuery = `UPDATE game SET ${updateFields.join(", ")} WHERE id = ?`;
        updateValues.push(gameId);
        await pool.query(updateQuery, updateValues);
    }
    if (updatedData.platforms !== undefined) {
        await pool.query("DELETE FROM game_platforms WHERE game_id = ?", [gameId]);

        // Handle differently based on database type
        if (pool.dbType === 'sqlite') {
            // For SQLite, insert rows one by one
            for (const platformId of updatedData.platforms) {
                const insertPlatformQuery = "INSERT INTO game_platforms (game_id, platform_id) VALUES (?, ?)";
                await pool.query(insertPlatformQuery, [gameId, platformId]);
            }
        } else {
            // For MySQL, use batch insert
            const insertPlatformQuery = "INSERT INTO game_platforms (game_id, platform_id) VALUES ?";
            const platformValues = updatedData.platforms.map((platformId) => [gameId, platformId]);
            await pool.query(insertPlatformQuery, [platformValues]);
        }
    }
};


const getGameById = async (gameId: number): Promise<DetailedGame | null> => {
    const pool = getPool();
    const query = `
        SELECT
            game.id AS gameId,
            game.title,
            game.description,
            game.genre_id AS genreId,
            game.creation_date AS creationDate,
            game.creator_id AS creatorId,
            game.price,
            u.first_name AS creatorFirstName,
            u.last_name AS creatorLastName,
            (SELECT IFNULL(AVG(r.rating), 0) FROM game_review r WHERE r.game_id = game.id) AS rating,
            (SELECT GROUP_CONCAT(gp.platform_id) FROM game_platforms gp WHERE gp.game_id = game.id) AS platformIds,
            (SELECT COUNT(*) FROM owned WHERE game_id = game.id) AS numberOfOwners,
            (SELECT COUNT(*) FROM wishlist WHERE game_id = game.id) AS numberOfWishlists
        FROM game
        JOIN user u ON game.creator_id = u.id
        WHERE game.id = ?
    `;

    const [rows] = await pool.query(query, [gameId]);
    if ((rows as any[]).length === 0) {
        return null;
    }

    const row = (rows as any[])[0];
    const detailedGame: DetailedGame = {
        gameId: row.gameId,
        title: row.title,
        description: row.description,
        genreId: row.genreId,
        creationDate: new Date(row.creationDate).toISOString(),
        creatorId: row.creatorId,
        price: row.price,
        creatorFirstName: row.creatorFirstName,
        creatorLastName: row.creatorLastName,
        rating: parseFloat(row.rating),
        platformIds: row.platformIds
            ? row.platformIds.split(",").map((id: string) => parseInt(id, 10))
            : [],
        numberOfOwners: row.numberOfOwners,
        numberOfWishlists: row.numberOfWishlists
    };

    return detailedGame;
};


const createGame = async (
    gameData: PostGame,
    creatorId: number
): Promise<number> => {
    const pool = getPool();
    // TODO put this error checking in controller
    // Validate that the provided genre exists.
    const [genreRows] = await pool.query("SELECT id FROM genre WHERE id = ?", [gameData.genreId]);
    if ((genreRows as any[]).length === 0) {
        throw new Error("Invalid genreId: genre does not exist");
    }

    // Validate that at least one platform is provided.
    if (!gameData.platformIds || gameData.platformIds.length === 0) {
        throw new Error("At least one platform is required");
    }
    // Validate that each provided platform exists.
    const placeholders = gameData.platformIds.map(() => "?").join(",");
    const [platformRows] = await pool.query(
        `SELECT id FROM platform WHERE id IN (${placeholders})`,
        gameData.platformIds
    );
    if ((platformRows as any[]).length !== gameData.platformIds.length) {
        throw new Error("One or more platformIds are invalid");
    }

    // Insert into game table.
    // Use a database-agnostic approach for the current timestamp
    const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const insertGameQuery = `
        INSERT INTO game (title, description, creation_date, creator_id, genre_id, price)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    let result;
    try {
        [result] = await pool.query(insertGameQuery, [
            gameData.title,
            gameData.description,
            currentDate,
            creatorId,
            gameData.genreId,
            gameData.price,
        ]);
    } catch (err: any) {
        // If duplicate entry for title occurs, throw an error to be handled by the controller.
        if (err.code === "ER_DUP_ENTRY") {
            throw new Error("Game title already exists");
        } else {
            throw err;
        }
    }
    const gameId = result.insertId;

    // Insert into game_platforms table for each platform id.
    // Handle differently based on database type
    if (pool.dbType === 'sqlite') {
        // For SQLite, insert rows one by one
        for (const platformId of gameData.platformIds) {
            const insertPlatformQuery = `
                INSERT INTO game_platforms (game_id, platform_id)
                VALUES (?, ?)
            `;
            await pool.query(insertPlatformQuery, [gameId, platformId]);
        }
    } else {
        // For MySQL, use batch insert
        const insertPlatformQuery = `
            INSERT INTO game_platforms (game_id, platform_id)
            VALUES ?
        `;
        const platformValues = gameData.platformIds.map((platformId) => [gameId, platformId]);
        await pool.query(insertPlatformQuery, [platformValues]);
    }

    return gameId;
};

const getAllGenres = async (): Promise<{ genreId: number; name: string }[]> => {
    const pool = getPool();
    const query = "SELECT id AS genreId, name FROM genre";
    const [rows] = await pool.query(query);
    return (rows as any[]).map(row => ({
        genreId: row.genreId,
        name: row.name
    }));
};

const getAllPlatforms = async (): Promise<{ platformId: number; name: string }[]> => {
    const pool = getPool();
    const query = "SELECT id AS platformId, name FROM platform";
    const [rows] = await pool.query(query);
    return (rows as any[]).map(row => ({
        platformId: row.platformId,
        name: row.name
    }));
};

const deleteGameById = async (gameId: number): Promise<void> => {
    const pool = getPool();

    try {
        await pool.query('START TRANSACTION');
        const reviewQuery = "SELECT COUNT(*) AS reviewCount FROM game_review WHERE game_id = ?";
        const [reviewRows] = await pool.query(reviewQuery, [gameId]);
        const reviewCount = (reviewRows as any[])[0].reviewCount;
        if (reviewCount > 0) {
            await pool.query('ROLLBACK');
            throw new Error("Game has reviews");
        }
        await pool.query("DELETE FROM wishlist WHERE game_id = ?", [gameId]);
        await pool.query("DELETE FROM owned WHERE game_id = ?", [gameId]);
        await pool.query("DELETE FROM game_platforms WHERE game_id = ?", [gameId]);
        const deleteQuery = "DELETE FROM game WHERE id = ?";
        const [deleteResult] = await pool.query(deleteQuery, [gameId]);
        if ((deleteResult as any).affectedRows === 0) {
            await pool.query('ROLLBACK');
            throw new Error("No game found");
        }
        await pool.query('COMMIT');
    } catch (error) {
        await pool.query('ROLLBACK');
        throw error;
    }
}

export {Game, GetGamesParams, DetailedGame, PostGame, getGames, getGameById, createGame, getAllGenres, getAllPlatforms, deleteGameById, editGame};

