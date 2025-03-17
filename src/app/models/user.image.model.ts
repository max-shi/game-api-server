import path from "path";
import fs from "fs/promises";
import Logger from "../../config/logger";
import { getPool } from "../../config/db";
import {getUserByToken} from "./user.model";

const IMAGE_DIR = path.join(__dirname, "..", "..", "..", "storage", "images");

export async function getUserImage(id: number): Promise<{ data: Buffer; contentType: string } | null> {
    try {
        const pool = getPool();
        const query = "SELECT image_filename FROM user WHERE id = ?";
        const [rows] = await pool.query(query, [id]);
        // if no rows, then no user.
        if (!rows || rows.length === 0) {
            throw new Error("User not found");
        }
        const imageFileName = rows[0].image_filename;
        if (!imageFileName) return null; // User exists, but has no image

        const fullPath = path.join(IMAGE_DIR, imageFileName);
        try {
            await fs.access(fullPath);
        } catch {
            return null; // File not found on disk
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

export async function setUserImage(
    authToken: string,
    id: number,
    imageBuffer: Buffer,
    contentType: string
): Promise<boolean> {
    // Check if the user is logged in and authorized to change this image.
    const loggedInUser = await getUserByToken(authToken);
    if (!loggedInUser || loggedInUser.id !== id) {
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
    // Retrieve any existing image filename from the database.
    const query = "SELECT image_filename FROM user WHERE id = ?";
    const [rows] = await pool.query(query, [id]);
    if (!rows || rows.length === 0) {
        throw new Error("User not found");
    }
    const oldImageFilename: string | null = rows[0].image_filename;

    // If there is an existing image (and it is different), remove it.
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

    // Update the user's record in the database with the new image filename.
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

    // Delete the file from storage.
    const fullPath = path.join(IMAGE_DIR, imageFileName);
    try {
        await fs.unlink(fullPath);
    } catch (err) {
        Logger.error(`Error deleting image file: ${fullPath}`, err);
    }

    // Update the database to set the image_filename to NULL.
    const updateQuery = "UPDATE user SET image_filename = NULL WHERE id = ?";
    await pool.query(updateQuery, [id]);
    return true;
}
