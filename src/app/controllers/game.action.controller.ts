import { Request, Response } from "express";
import Logger from "../../config/logger";
import * as ActionModel from "../models/game.action.model";
import { GameRequest } from "../middleware/game.middleware";

/**
 * Adds a game to the wishlist.
 */
const addGameToWishlist = async (req: Request, res: Response): Promise<void> => {
    try {
        const { gameId, user } = req as GameRequest;
        await ActionModel.addGameToWishlistModel(user.id, gameId);
        res.status(200).send();
    } catch (err: any) {
        if (err.message.includes("No game with id")) {
            res.status(404).send(err.message);
        } else if (
            err.message.includes("Cannot wishlist a game you created") ||
            err.message.includes("Cannot wishlist a game you have marked as owned")
        ) {
            res.status(403).send(err.message);
        } else {
            Logger.error(err);
            res.status(500).send();
        }
    }
};

/**
 * Removes a game from the wishlist.
 */
const removeGameFromWishlist = async (req: Request, res: Response): Promise<void> => {
    try {
        const { gameId, user } = req as GameRequest;
        await ActionModel.removeGameFromWishlistModel(user.id, gameId);
        res.status(200).send();
    } catch (err: any) {
        if (err.message === "No game with id") {
            res.status(404).send(err.message);
        } else if (err.message === "Game is not wishlisted by the user") {
            res.status(403).send(err.message);
        } else {
            Logger.error(err);
            res.status(500).send();
        }
    }
};

/**
 * Adds a game to owned.
 */
const addGameToOwned = async (req: Request, res: Response): Promise<void> => {
    try {
        const { gameId, user } = req as GameRequest;
        await ActionModel.addGameToOwnedModel(user.id, gameId);
        res.status(200).send();
    } catch (err: any) {
        if (err.message === "No game with id") {
            res.status(404).send(err.message);
        } else if (err.message === "Cannot mark a game you created as owned") {
            res.status(403).send(err.message);
        } else {
            Logger.error(err);
            res.status(500).send();
        }
    }
};

/**
 * Removes a game from owned.
 */
const removeGameFromOwned = async (req: Request, res: Response): Promise<void> => {
    try {
        const { gameId, user } = req as GameRequest;
        await ActionModel.removeGameFromOwnedModel(user.id, gameId);
        res.status(200).send();
    } catch (err: any) {
        if (err.message === "No game with id") {
            res.status(404).send(err.message);
        } else if (err.message === "Game is not marked as owned by the user") {
            res.status(403).send(err.message);
        } else {
            Logger.error(err);
            res.status(500).send();
        }
    }
};

export { addGameToWishlist, removeGameFromWishlist, addGameToOwned, removeGameFromOwned };
