import { Request, Response } from "express";
import Logger from "../../config/logger";
import * as GameImage from "../models/game.image.model";
import { GameRequest } from "../middleware/game.middleware";
import { validate } from "../services/validator";

// Inline schema for validating allowed image content types.
const imageHeaderSchema = {
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

/**
 * Gets the image for the specified game.
 */
const getImage = async (req: Request, res: Response): Promise<void> => {
    try {
        const gameId = (req as any).gameId as number;
        const imageResult = await GameImage.getGameImage(gameId);
        if (!imageResult) {
            res.statusMessage = "Image not found";
            Logger.info("image not found");
            res.status(404).send();
            return;
        }
        res.set("Content-Type", imageResult.contentType);
        res.status(200).send(imageResult.data);
    } catch (err: any) {
        Logger.error(err);
        if (err.message.includes("Game not found")) {
            Logger.info("game not found");
            res.statusMessage = "Game not found";
            res.status(404).send();
        } else {
            res.statusMessage = "Internal Server Error";
            res.status(500).send();
        }
    }
};

/**
 * Sets (or replaces) the image for the specified game.
 */
const setImage = async (req: Request, res: Response): Promise<void> => {
    try {
        const { gameId, user } = req as GameRequest;
        const contentType = req.header("Content-Type");

        // Validate the Content-Type header using the inline schema.
        const headerValidation = await validate(imageHeaderSchema, { contentType });
        if (headerValidation !== true) {
            res.statusMessage = headerValidation;
            res.status(400).send();
            return;
        }

        const imageBuffer = req.body;
        if (!Buffer.isBuffer(imageBuffer)) {
            res.statusMessage = "Invalid image data";
            res.status(400).send();
            return;
        }
        const isNew = await GameImage.setGameImage(user.id, gameId, imageBuffer, contentType!);
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
        } else if (err.message.includes("Game not found")) {
            res.statusMessage = "Game not found";
            res.status(404).send();
        } else if (err.message.includes("Unauthorized")) {
            res.statusMessage = "Unauthorized";
            res.status(403).send();
        } else if (err.message.includes("Forbidden")) {
            res.statusMessage = "Forbidden";
            res.status(403).send();
        } else {
            res.statusMessage = "Internal Server Error";
            res.status(500).send();
        }
    }
};

export { getImage, setImage };
