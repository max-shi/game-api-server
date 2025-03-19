import path from "path";
import fs from "fs/promises";
import Logger from "../../config/logger";
import { getPool } from "../../config/db";

const IMAGE_DIR = path.join(__dirname, "..", "..", "..", "storage", "images");

export async function getUserImage(id: number): Promise<{ data: Buffer; contentType: string } | null> {
    try {
        const pool = getPool();
        const query = "SELECT image_filename FROM user WHERE id = ?";
        const [rows] = await pool.query(query, [id]);
        if (!rows || rows.length === 0) {
            throw new Error("User not found");
        }
        const imageFileName = rows[0].image_filename;
        if (!imageFileName) return null;
        const fullPath = path.join(IMAGE_DIR, imageFileName);
        try {
            await fs.access(fullPath);
        } catch {
            return null;
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

/**
 * Sets or replaces a user's profile image.
 *
 */
export async function setUserImage(
    userId: number,  // Now a user id, not a token.
    id: number,
    imageBuffer: Buffer,
    contentType: string
): Promise<boolean> {
    // Ensure the authenticated user is allowed to change this image.
    if (userId !== id) {
        throw new Error("Unauthorized");
    }

    let extension: string;
    switch (contentType) {
        case "image/png":
            extension = "png";
            break;
        case "image/jpeg":
            extension = "jpeg";
            break;
        case "image/gif":
            extension = "gif";
            break;
        default:
            throw new Error("Unsupported image type");
    }

    const newImageFilename = `user_${id}.${extension}`;
    const newImagePath = path.join(IMAGE_DIR, newImageFilename);

    // Ensure the image directory exists.
    await fs.mkdir(IMAGE_DIR, { recursive: true });

    const pool = getPool();
    const query = "SELECT image_filename FROM user WHERE id = ?";
    const [rows] = await pool.query(query, [id]);
    if (!rows || rows.length === 0) {
        throw new Error("User not found");
    }
    const oldImageFilename: string | null = rows[0].image_filename;

    // Remove old image if present and different.
    if (oldImageFilename && oldImageFilename !== newImageFilename) {
        const fullOldPath = path.join(IMAGE_DIR, oldImageFilename);
        try {
            await fs.unlink(fullOldPath);
        } catch (err) {
            Logger.error(`Failed to delete old image: ${fullOldPath}`, err);
        }
    }

    // Write the new image file.
    await fs.writeFile(newImagePath, imageBuffer);

    // Update the user's record with the new image filename.
    const updateQuery = "UPDATE user SET image_filename = ? WHERE id = ?";
    await pool.query(updateQuery, [newImageFilename, id]);

    const isNew = !oldImageFilename;
    return isNew;
}

export async function deleteUserImage(id: number): Promise<boolean> {
    const pool = getPool();
    const query = "SELECT image_filename FROM user WHERE id = ?";
    const [rows] = await pool.query(query, [id]);
    if (!rows || rows.length === 0) {
        throw new Error("User not found");
    }
    const imageFileName = rows[0].image_filename;
    if (!imageFileName) return false;
    const fullPath = path.join(IMAGE_DIR, imageFileName);
    try {
        await fs.unlink(fullPath);
    } catch (err) {
        Logger.error(`Error deleting image file: ${fullPath}`, err);
    }
    const updateQuery = "UPDATE user SET image_filename = NULL WHERE id = ?";
    await pool.query(updateQuery, [id]);
    return true;
}
