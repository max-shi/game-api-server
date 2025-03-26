import { Request, Response } from "express";
import Logger from "../../config/logger";
import * as Game from "../models/game.model";
import * as User from "../models/user.model";
import { AuthenticatedRequest, GameRequest } from "../middleware/game.middleware";

/**
 * helper function to parse a non negative integer (error checking)
 */
const parseNonNegativeInteger = (
    value: any,
    name: string,
    defaultValue: number
): number => {
    if (value === undefined) return defaultValue;
    const parsed = parseInt(value as string, 10);
    if (isNaN(parsed) || parsed < 0) {
        throw new Error(`Invalid ${name}: must be a non-negative integer`);
    }
    return parsed;
};


/**
 * helper function to parse an array
 */
const parseArray = (param: any, name: string): number[] | null => {
    if (!param) return null;
    let arr: number[];
    if (Array.isArray(param)) {
        arr = param.map((p: string) => parseInt(p, 10));
    } else if (typeof param === "string") {
        arr = param.split(",").map(p => parseInt(p.trim(), 10));
    } else {
        return null;
    }
    // Validate each element.
    for (const num of arr) {
        if (isNaN(num) || num < 0) {
            throw new Error(`Invalid ${name}: must be a non-negative integer`);
        }
    }
    return arr;
};

/**
 * gets all game
 */
const getAllGames = async (req: Request, res: Response): Promise<void> => {
    try {
        // Parse and validate query parameters.
        const startIndex = parseNonNegativeInteger(req.query.startIndex, "startIndex", 0);
        const count = parseNonNegativeInteger(req.query.count, "count", 100);
        const price = parseNonNegativeInteger(req.query.price, "price", 10000);
        const creatorId = req.query.creatorId ? parseNonNegativeInteger(req.query.creatorId, "creatorId", 0) : null;
        const reviewerId = req.query.reviewerId ? parseNonNegativeInteger(req.query.reviewerId, "reviewerId", 0) : null;
        const q = req.query.q ? req.query.q.toString() : undefined;
        const genreIds = parseArray(req.query.genreIds, "genreIds");
        const platformIds = parseArray(req.query.platformIds, "platformIds");
        const sortBy = req.query.sortBy ? req.query.sortBy.toString() : "CREATED_ASC";
        let user = null;
        // If filtering by ownedByMe or wishlistedByMe, require a valid token.
        if (req.query.ownedByMe === "true" || req.query.wishlistedByMe === "true") {
            const token = req.get("X-Authorization");
            if (!token) {
                res.statusMessage = "Unauthorized: No token provided";
                res.status(401).send();
                return;
            }
            user = await User.getUserByToken(token);
            if (!user) {
                res.statusMessage = "Unauthorized";
                res.status(401).send();
                return;
            }
        } else {
            // Optionally, if a token is provided, attach the user.
            const token = req.get("X-Authorization");
            if (token) {
                user = await User.getUserByToken(token);
            }
        }

        const params: Game.GetGamesParams = {
            startIndex,
            count,
            q,
            genreIds,
            platformIds,
            price,
            creatorId,
            reviewerId,
            sortBy,
            ownedByMe: req.query.ownedByMe === "true",
            wishlistedByMe: req.query.wishlistedByMe === "true",
            userId: user ? user.id : undefined
        };

        const result = await Game.getGames(params);
        res.status(200).json(result);
    } catch (err) {
        Logger.error(err);
        if (err instanceof Error && err.message.includes("Invalid")) {
            res.status(400).send(err.message);
        } else {
            res.statusMessage = "Internal Server Error";
            res.status(500).send();
        }
    }
};

/**
 * gets a game
 */
const getGame = async (req: Request, res: Response): Promise<void> => {
    try {
        const gameId = (req as GameRequest).gameId;
        const game = await Game.getGameById(gameId);
        if (!game) {
            res.statusMessage = "No game found with the specified id";
            res.status(404).send();
            return;
        }
        res.status(200).json(game);
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
};

/**
 * adds a game
 */
const addGame = async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthenticatedRequest;
        if (!authReq.user) {
            res.statusMessage = "Unauthorized: No token provided";
            res.status(401).send();
            return;
        }

        const { title, description, genreId, price, platformIds } = req.body;
        if (!title || !description || genreId === undefined || price === undefined || !platformIds) {
            res.statusMessage = "Missing required game parameters";
            res.status(400).send();
            return;
        }

        if (!Array.isArray(platformIds) || platformIds.length === 0) {
            res.statusMessage = "platformIds must be a non-empty array";
            res.status(400).send();
            return;
        }

        const gameData: Game.PostGame = { title, description, genreId, price, platformIds };
        const newGameId = await Game.createGame(gameData, authReq.user.id);
        res.status(201).json({ gameId: newGameId });
    } catch (err: any) {
        if (err.message === "Game title already exists") {
            res.status(403).send(err.message);
        } else if (
            err.message.includes("Data too long for column") ||
            err.message.includes("Invalid genreId") ||
            err.message.includes("One or more platformIds") ||
            err.message.includes("At least one platform")
        ) {
            res.status(400).send(err.message);
        } else {
            Logger.error(err);
            res.statusMessage = "Internal Server Error";
            res.status(500).send();
        }
    }
};

/**
 * edits a game
 */
const editGame = async (req: Request, res: Response): Promise<void> => {
    try {
        const { gameId, user } = req as GameRequest;
        const { title, description, genreId, price, platforms } = req.body;
        const updatedData: {
            title?: string;
            description?: string;
            genreId?: number;
            price?: number;
            platforms?: number[];
        } = {};

        if (title !== undefined) updatedData.title = title;
        if (description !== undefined) updatedData.description = description;
        if (genreId !== undefined) updatedData.genreId = genreId;
        if (price !== undefined) updatedData.price = price;
        if (platforms !== undefined) updatedData.platforms = platforms;

        if (Object.keys(updatedData).length === 0) {
            res.statusMessage = "No update fields provided";
            res.status(400).send();
            return;
        }

        await Game.editGame(gameId, updatedData, user.id);
        res.status(200).send();
    } catch (err: any) {
        if (err.message === "No game found") {
            res.status(404).send(err.message);
        } else if (err.message === "Only the creator of a game may change it") {
            res.status(403).send(err.message);
        } else if (err.message === "Game title already exists") {
            res.status(403).send(err.message);
        } else if (
            err.message.includes("Invalid genreId") ||
            err.message.includes("platforms") ||
            err.message.includes("One or more platformIds are invalid")
        ) {
            res.status(400).send(err.message);
        } else {
            Logger.error(err);
            res.status(500).send();
        }
    }
}

/**
 * deletes a game
 */
const deleteGame = async (req: Request, res: Response): Promise<void> => {
    try {
        const { gameId, user } = req as GameRequest;
        const game = await Game.getGameById(gameId);
        if (!game) {
            res.statusMessage = "Not Found. No game found with id";
            res.status(404).send();
            return;
        }
        if (game.creatorId !== user.id) {
            res.statusMessage = "Forbidden. Only the creator of a game may delete it";
            res.status(403).send();
            return;
        }
        await Game.deleteGameById(gameId);
        res.status(200).send();
    } catch (err: any) {
        if (err.message === "Game has reviews") {
            res.statusMessage = "Forbidden. Can not delete a game with one or more reviews";
            res.status(403).send(err.message);
        } else if (err.message === "No game found") {
            res.statusMessage = "Not Found. No game found with id";
            res.status(404).send(err.message);
        } else {
            Logger.error(err);
            res.statusMessage = "Internal Server Error";
            res.status(500).send();
        }
    }
};

/**
 * gets the genres (returns as json)
 */
const getGenres = async (req: Request, res: Response): Promise<void> => {
    try {
        const genres = await Game.getAllGenres();
        res.status(200).json(genres);
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
};

/**
 * gets the platforms
 */
const getPlatforms = async (req: Request, res: Response): Promise<void> => {
    try {
        const platforms = await Game.getAllPlatforms();
        res.status(200).json(platforms);
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
};

export { getAllGames, getGame, addGame, editGame, deleteGame, getGenres, getPlatforms };
