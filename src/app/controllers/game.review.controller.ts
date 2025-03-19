import { Request, Response } from "express";
import Logger from "../../config/logger";
import * as ReviewModel from "../models/game.review.model";
import * as User from "../models/user.model";
import { GameRequest } from "../middleware/game.middleware";

/**
 * gets a game review
 */
const getGameReviews = async (req: Request, res: Response): Promise<void> => {
    try {
        const gameId = (req as any).gameId as number;
        const reviews = await ReviewModel.getReviewsByGameId(gameId);
        res.status(200).json(reviews);
    } catch (err: any) {
        Logger.error(err);
        if (err.message.includes("No game found with id")) {
            res.statusMessage = "No game found with id";
            res.status(404).send();
        } else {
            res.statusMessage = "Internal server error";
            res.status(500).send();
        }
    }
};

/**
 * adds a game review
 */
const addGameReview = async (req: Request, res: Response): Promise<void> => {
    try {
        const { gameId, user } = req as GameRequest;
        const { rating, review } = req.body;
        if (rating === undefined) {
            res.statusMessage = "Invalid rating";
            res.status(400).send();
            return;
        }
        await ReviewModel.addReview(user.id, gameId, rating, review);
        res.status(201).send();
    } catch (err: any) {
        Logger.error(err);
        if (err.message.includes("No game found with id")) {
            res.statusMessage = "No game found with id";
            res.status(404).send();
        } else if (err.message.includes("Cannot review your own game")) {
            res.statusMessage = "Cannot review your own game";
            res.status(403).send();
        } else if (err.message.includes("Can only review a game once")) {
            res.statusMessage = "Can only review a game once";
            res.status(403).send();
        } else if (err.message.includes("Data too long")) {
            res.statusMessage = "Data too long";
            res.status(400).send();
        } else if (err.message.includes("Rating must be between")) {
            res.statusMessage = "Rating must be between 1 and 10";
            res.status(400).send();
        } else {
            res.status(500).send();
        }
    }
};

export { getGameReviews, addGameReview };
