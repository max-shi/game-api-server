import { getPool } from "../../config/db";
import Logger from "../../config/logger";

export const getReviewsByGameId = async (gameId: number): Promise<any[]> => {
    const pool = getPool();

    // Check if the game exists.
    const gameQuery = "SELECT id FROM game WHERE id = ?";
    const [gameRows] = await pool.query(gameQuery, [gameId]);
    if (!gameRows || (gameRows as any[]).length === 0) {
        throw new Error("No game found with id");
    }

    // Retrieve reviews with reviewer details.
    const reviewQuery = `
        SELECT
            gr.user_id AS reviewerId,
            gr.rating,
            gr.review,
            gr.timestamp,
            u.first_name AS reviewerFirstName,
            u.last_name AS reviewerLastName
        FROM game_review gr
        JOIN user u ON gr.user_id = u.id
        WHERE gr.game_id = ?
        ORDER BY gr.timestamp DESC
    `;
    const [reviewRows] = await pool.query(reviewQuery, [gameId]);
    return reviewRows as any[];
};

export const addReview = async (
    userId: number,
    gameId: number,
    rating: number,
    review?: string
): Promise<void> => {
    const pool = getPool();

    // Check if the game exists and get its creator.
    const gameQuery = "SELECT creator_id FROM game WHERE id = ?";
    const [gameRows] = await pool.query(gameQuery, [gameId]);
    if (!gameRows || (gameRows as any[]).length === 0) {
        throw new Error("No game found with id");
    }
    const creatorId = (gameRows as any[])[0].creator_id;
    if (creatorId === userId) {
        throw new Error("Cannot review your own game");
    }

    // Check if the user has already reviewed the game.
    const reviewCheckQuery = "SELECT id FROM game_review WHERE game_id = ? AND user_id = ?";
    const [existingRows] = await pool.query(reviewCheckQuery, [gameId, userId]);
    if (existingRows && (existingRows as any[]).length > 0) {
        throw new Error("Can only review a game once");
    }

    // Validate that the rating is between 1 and 10.
    if (rating < 1 || rating > 10) {
        throw new Error("Rating must be between 1 and 10");
    }

    // Insert the review.
    const insertQuery = "INSERT INTO game_review (game_id, user_id, rating, review) VALUES (?, ?, ?, ?)";
    await pool.query(insertQuery, [gameId, userId, rating, review || null]);
};
