import { Request, Response } from "express";
import Logger from "../../config/logger";
import * as userImage from "../models/user.image.model";


/**
 * Obtains the Image given user details
 *
 * Validates that the User ID is correct by checking if it is an Integer (via isNaN)
 * Additional checks for wether the given user ID has an image or not
 *
 * @param req Express request object.
 * @param res Express response object.
 */
const getImage = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = parseInt(req.params.id, 10);
        if (isNaN(userId)) {
            res.statusMessage = "Invalid user id";
            res.status(400).send();
            return;
        }

        const imageResult = await userImage.getUserImage(userId);
        if (!imageResult) {
            res.statusMessage = "Image not found";
            res.status(404).send();
            return;
        }
        res.set("Content-Type", imageResult.contentType);
        res.status(200).send(imageResult.data);
    } catch (err) {
        Logger.error(err);
        if (err.message.includes("User not found")) {
            res.statusMessage = "User not found";
            res.status(404).send();
        } else {
            res.statusMessage = "Internal Server Error";
            res.status(500).send();
        }
    }
};

const setImage = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = parseInt(req.params.id, 10);
        const authToken = req.header("X-Authorization");
        if (!authToken) {
            res.statusMessage = "Unauthorized: missing token";
            res.status(401).send();
            return;
        }
        if (isNaN(userId)) {
            res.statusMessage = "Invalid user id";
            res.status(400).send();
            return;
        }

        const contentType = req.header("Content-Type");
        if (!contentType) {
            res.statusMessage = "Content-Type header missing";
            res.status(400).send();
            return;
        }

        // Check if the content type is supported
        if (contentType !== "image/png" && contentType !== "image/jpeg" && contentType !== "image/gif") {
            res.statusMessage = "Unsupported image type";
            res.status(400).send();
            return;
        }

        // Assuming the raw binary image is available in req.body (as a Buffer)
        const imageBuffer = req.body;
        if (!Buffer.isBuffer(imageBuffer)) {
            res.statusMessage = "Invalid image data";
            res.status(400).send();
            return;
        }

        // Call the model function. It throws errors for unsupported types or if the user doesn't exist.
        const isNew = await userImage.setUserImage(authToken, userId, imageBuffer, contentType);
        if (isNew) {
            res.status(201).send();
        } else {
            res.status(200).send();
        }
    } catch (err: any) {
        Logger.error(err);
        if (err.message.includes("Unsupported image type")) {
            res.statusMessage = "Unsupported image type";
            res.status(400).send();
        } else if (err.message.includes("User not found")) {
            res.statusMessage = "User not found";
            res.status(404).send();
        } else if (err.message.includes("Unauthorized")) {
            res.statusMessage = "Unauthorized";
            res.status(403).send();
        }
        else {
            res.statusMessage = "Internal Server Error";
            res.status(500).send();
        }
    }
}

const deleteImage = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = parseInt(req.params.id, 10);
        if (isNaN(userId)) {
            res.statusMessage = "Invalid user id";
            res.status(400).send();
            return;
        }

        const deleted = await userImage.deleteUserImage(userId);
        if (deleted) {
            res.status(200).send();
        } else {
            res.statusMessage.includes("Image not found");
            res.status(404).send();
        }
    } catch (err) {
        Logger.error(err);
        if (err.message.includes("User not found")) {
            res.statusMessage = "User not found";
            res.status(404).send();
        } else {
            res.statusMessage = "Internal Server Error";
            Logger.info(err.message);
            res.status(500).send();
        }
    }
}

export { getImage, setImage, deleteImage };
