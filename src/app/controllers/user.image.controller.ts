import { Request, Response } from "express";
import Logger from "../../config/logger";
import * as userImage from "../models/user.image.model";
import { UserRequest, AuthenticatedUserRequest } from "../middleware/user.middleware";
import { validate } from '../services/validator';

// TODO : can we put this schema in the .json (resources/schemas.json)
const imageContentTypeSchema = {
    type: "object",
    properties: {
        contentType: {
            type: "string",
            enum: ["image/png", "image/jpeg", "image/gif"]
        }
    },
    required: ["contentType"],
    additionalProperties: false
};

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
    } catch (err: any) {
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
        const userId = (req as UserRequest).userId;
        const authUser = (req as AuthenticatedUserRequest).user;
        const headerValidationResult = await validate(imageContentTypeSchema, {
            contentType: req.header("Content-Type")
        });
        if (headerValidationResult !== true) {
            res.statusMessage = headerValidationResult;
            res.status(400).send();
            return;
        }
        const contentType = req.header("Content-Type")!;
        // Validate that the body contains a Buffer.
        const imageBuffer = req.body;
        if (!Buffer.isBuffer(imageBuffer)) {
            res.statusMessage = "Invalid image data";
            res.status(400).send();
            return;
        }
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
    } catch (err: any) {
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
