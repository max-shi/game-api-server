import { Request, Response } from "express";
import Logger from "../../config/logger";
import * as userImage from "../models/user.image.model";
import { UserRequest, AuthenticatedUserRequest } from "../middleware/user.middleware";

/**
 * Retrieves a user's profile image.
 */
const getImage = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as UserRequest).userId;
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

/**
 * Sets (or replaces) a user's profile image.
 * Assumes middleware has validated the user id and token and authorized the user.
 */
const setImage = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as UserRequest).userId;
        const authUser = (req as AuthenticatedUserRequest).user;
        // Since authorization middleware ensures authUser.id === userId, we can pass authUser.id.
        const contentType = req.header("Content-Type");
        if (!contentType) {
            res.statusMessage = "Content-Type header missing";
            res.status(400).send();
            return;
        }
        if (contentType !== "image/png" && contentType !== "image/jpeg" && contentType !== "image/gif") {
            res.statusMessage = "Unsupported image type";
            res.status(400).send();
            return;
        }
        const imageBuffer = req.body;
        if (!Buffer.isBuffer(imageBuffer)) {
            res.statusMessage = "Invalid image data";
            res.status(400).send();
            return;
        }
        // Call the model function using the authenticated user's id.
        const isNew = await userImage.setUserImage(authUser.id, userId, imageBuffer, contentType);
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
        } else {
            res.statusMessage = "Internal Server Error";
            res.status(500).send();
        }
    }
};

/**
 * Deletes a user's profile image.
 */
const deleteImage = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as UserRequest).userId;
        const deleted = await userImage.deleteUserImage(userId);
        if (deleted) {
            res.status(200).send();
        } else {
            res.statusMessage = "Image not found";
            res.status(404).send();
        }
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

export { getImage, setImage, deleteImage };
