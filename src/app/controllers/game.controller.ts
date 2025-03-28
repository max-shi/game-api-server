import { Request, Response } from "express";
import Logger from "../../config/logger";
import * as Game from "../models/game.model";
import * as User from "../models/user.model";
import { AuthenticatedRequest, GameRequest } from "../middleware/game.middleware";
import { validate } from "../services/validator";
import schemas from "../resources/schemas.json";

/**
 * Retrieves all games.
 */
const getAllGames = async (req: Request, res: Response): Promise<void> => {
    try {
        // Validate query parameters against the game_search schema.
        const validationResult = await validate(schemas.game_search, req.query);
        if (validationResult !== true) {
            res.statusMessage = validationResult;
            res.status(400).send();
            return;
        }
        // Convert validated query params from strings to numbers where applicable.
        const startIndex = req.query.startIndex ? parseInt(req.query.startIndex as string, 10) : 0;
        const count = req.query.count ? parseInt(req.query.count as string, 10) : 2000000000000000;
        const price = req.query.price ? parseInt(req.query.price as string, 10) : null;
        const creatorId = req.query.creatorId ? parseInt(req.query.creatorId as string, 10) : null;
        const reviewerId = req.query.reviewerId ? parseInt(req.query.reviewerId as string, 10) : null;
        const q = req.query.q ? req.query.q.toString() : undefined;

        let genreIds: number[] | undefined;
        if (req.query.genreIds) {
            if (Array.isArray(req.query.genreIds)) {
                genreIds = req.query.genreIds.map((p) => parseInt(String(p), 10));
            } else {
                genreIds = (req.query.genreIds as string)
                    .split(",")
                    .map((p) => parseInt(p.trim(), 10));
            }
        }

        let platformIds: number[] | undefined;
        if (req.query.platformIds) {
            if (Array.isArray(req.query.platformIds)) {
                platformIds = req.query.platformIds.map((p) => parseInt(String(p), 10));
            } else {
                platformIds = (req.query.platformIds as string)
                    .split(",")
                    .map((p) => parseInt(p.trim(), 10));
            }
        }

        const sortBy = req.query.sortBy ? req.query.sortBy.toString() : "CREATED_ASC";
        const ownedByMe = req.query.ownedByMe === "true";
        const wishlistedByMe = req.query.wishlistedByMe === "true";

        // If filtering by ownedByMe or wishlistedByMe, require a valid token.
        let user = null;
        if (ownedByMe || wishlistedByMe) {
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
            // Optionally attach user if token is provided.
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
            ownedByMe,
            wishlistedByMe,
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
 * Retrieves a game by id.
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
 * Adds a new game.
 */
const addGame = async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthenticatedRequest;
        if (!authReq.user) {
            res.statusMessage = "Unauthorized: No token provided";
            res.status(401).send();
            return;
        }
        // Validate request body against the game_post schema.
        const validationResult = await validate(schemas.game_post, req.body);
        if (validationResult !== true) {
            res.statusMessage = validationResult;
            res.status(400).send();
            return;
        }
        const { title, description, genreId, price, platformIds } = req.body;
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
            err.message.includes("At least one platform") ||
            err.message.includes("Type Error")
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
 * Edits an existing game.
 */
const editGame = async (req: Request, res: Response): Promise<void> => {
    try {
        const { gameId, user } = req as GameRequest;
        // Validate request body against the game_patch schema.
        const validationResult = await validate(schemas.game_patch, req.body);
        if (validationResult !== true) {
            res.statusMessage = validationResult;
            res.status(400).send();
            return;
        }
        const { title, description, genreId, price, platformIds } = req.body;
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
        if (platformIds !== undefined) updatedData.platforms = platformIds;

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
            err.message.includes("platformIds must be a non-empty array") ||
            err.message.includes("One or more platformIds are invalid") ||
            err.message.includes("Type Error")
        ) {
            res.status(400).send(err.message);
        } else {
            Logger.error(err);
            res.status(500).send();
        }
    }
};

/**
 * Deletes a game.
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
 * Retrieves all genres.
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
 * Retrieves all platforms.
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
