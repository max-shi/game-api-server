import { Request, Response, NextFunction } from "express";
import * as User from "../models/user.model";

interface AuthenticatedRequest extends Request {
    user: any;
}

interface GameRequest extends AuthenticatedRequest {
    gameId: number;
}

const validateGameId = (req: Request, res: Response, next: NextFunction): void => {
    const gameId = parseInt(req.params.id, 10);
    if (isNaN(gameId) || gameId < 0) {
        res.statusMessage = "Invalid game id";
        res.status(400).send();
        return;
    }
    (req as GameRequest).gameId = gameId;
    next();
};

const validateAuthToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
const validateGameRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

export { validateGameId, validateAuthToken, validateGameRequest, AuthenticatedRequest,  GameRequest };
