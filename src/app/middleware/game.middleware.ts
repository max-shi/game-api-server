import { Request, Response, NextFunction } from "express";
import * as User from "../models/user.model";

export interface AuthenticatedRequest extends Request {
    user: any;
}

export interface GameRequest extends AuthenticatedRequest {
    gameId: number;
}

// Middleware to validate game id parameter only.
export const validateGameId = (req: Request, res: Response, next: NextFunction): void => {
    const gameId = parseInt(req.params.id, 10);
    if (isNaN(gameId) || gameId < 0) {
        res.statusMessage = "Invalid game id";
        res.status(400).send();
        return;
    }
    (req as GameRequest).gameId = gameId;
    next();
};

// Middleware to validate authentication token only.
export const validateAuthToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const token = req.get("X-Authorization");
    if (!token) {
        res.statusMessage = "Unauthorized: No token provided";
        res.status(401).send();
        return;
    }
    const user = await User.getUserByToken(token);
    if (!user) {
        res.statusMessage = "Unauthorized";
        res.status(401).send();
        return;
    }
    (req as AuthenticatedRequest).user = user;
    next();
};

// TODO, can we make it such that we can simply do validateAuthToken then validateGameId, instead of making a whole new middleware
// Middleware to validate both game id and authentication token.
export const validateGameRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const gameId = parseInt(req.params.id, 10);
    if (isNaN(gameId) || gameId < 0) {
        res.statusMessage = "Invalid game id";
        res.status(400).send();
        return;
    }
    const token = req.get("X-Authorization");
    if (!token) {
        res.statusMessage = "Unauthorized: No token provided";
        res.status(401).send();
        return;
    }
    const user = await User.getUserByToken(token);
    if (!user) {
        res.statusMessage = "Unauthorized";
        res.status(401).send();
        return;
    }
    (req as GameRequest).gameId = gameId;
    (req as GameRequest).user = user;
    next();
};
