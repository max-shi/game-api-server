import path from "path";
import fs from "fs/promises";
import Logger from "../../config/logger";
import { getPool } from "../../config/db";

// Directory where game cover images are stored.
const GAME_IMAGE_DIR = path.join(__dirname, "..", "..", "..", "storage", "images");

export async function getGameImage(gameId: number): Promise<{ data: Buffer; contentType: string } | null> {
    try {
        const pool = getPool();
        const query = "SELECT image_filename FROM game WHERE id = ?";
        const [rows] = await pool.query(query, [gameId]);
        Logger.info("length of rows = " + (rows as any[]).length);
        if (!rows || (rows as any[]).length === 0) {
            Logger.info("error thrown");
            throw new Error("Game not found");
        }
        const imageFileName = (rows as any[])[0].image_filename;
        if (!imageFileName) return null;
        const fullPath = path.join(GAME_IMAGE_DIR, imageFileName);
        try {
            await fs.access(fullPath);
        } catch {
            return null; // File does not exist on disk.
        }
        const data = await fs.readFile(fullPath);
        const ext = path.extname(imageFileName).toLowerCase();
        let contentType = "";
        if (ext === ".png") {
            contentType = "image/png";
        } else if (ext === ".jpeg" || ext === ".jpg") {
            contentType = "image/jpeg";
        } else if (ext === ".gif") {
            contentType = "image/gif";
        }
        return { data, contentType };
    } catch (err) {
        Logger.error(err);
        throw err;
    }
}

export async function setGameImage(
    userId: number,
    gameId: number,
    imageBuffer: Buffer,
    contentType: string
): Promise<boolean> {
    const pool = getPool();
    // Retrieve the game record.
    const query = "SELECT creator_id, image_filename FROM game WHERE id = ?";
    const [rows] = await pool.query(query, [gameId]);
    if (!rows || (rows as any[]).length === 0) {
        throw new Error("Game not found");
    }
    const gameRecord = (rows as any[])[0];
    // Only the game creator is allowed to change its cover image.
    if (gameRecord.creator_id !== userId) {
        throw new Error("Forbidden: Only the creator of a game can change its cover image");
    }

    // Determine the file extension based on Content-Type.
    let extension: string;
    if (contentType === "image/png") {
        extension = "png";
    } else if (contentType === "image/jpeg") {
        extension = "jpeg";
    } else if (contentType === "image/gif") {
        extension = "gif";
    } else {
        throw new Error("Unsupported image type");
    }

    const newImageFilename = `game_${gameId}.${extension}`;
    const newImagePath = path.join(GAME_IMAGE_DIR, newImageFilename);

    // Ensure the image directory exists.
    await fs.mkdir(GAME_IMAGE_DIR, { recursive: true });

    const oldImageFilename: string | null = gameRecord.image_filename;
    if (oldImageFilename && oldImageFilename !== newImageFilename) {
        const oldImagePath = path.join(GAME_IMAGE_DIR, oldImageFilename);
        try {
            await fs.unlink(oldImagePath);
        } catch (err) {
            Logger.error(`Failed to delete old game image: ${oldImagePath}`, err);
        }
    }

    // Write the new image file.
    await fs.writeFile(newImagePath, imageBuffer);

    // Update the game record with the new image filename.
    const updateQuery = "UPDATE game SET image_filename = ? WHERE id = ?";
    await pool.query(updateQuery, [newImageFilename, gameId]);

    // Return true if there was no previous image.
    const isNew = !oldImageFilename;
    return isNew;
}
