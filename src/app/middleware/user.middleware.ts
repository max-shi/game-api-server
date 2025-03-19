import { Request, Response, NextFunction } from "express";
import * as User from "../models/user.model";

// Extend Request to include a validated user ID.
export interface UserRequest extends Request {
    userId: number;
}

// Extend Request to include the authenticated user.
export interface AuthenticatedUserRequest extends Request {
    user: any;
}

/**
 * Middleware to validate the user id parameter.
 * If valid, attaches it as req.userId.
 */
export const validateUserId = (req: Request, res: Response, next: NextFunction): void => {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId) || userId < 0) {
        res.statusMessage = "Invalid user id";
        res.status(400).send();
        return;
    }
    (req as UserRequest).userId = userId;
    next();
};

/**
 * Middleware to validate the authentication token.
 * Expects the token to be in the "X-Authorization" header.
 * If valid, attaches the user to req.user.
 */
export const validateUserAuthToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const token = req.get("X-Authorization");
    if (!token) {
        res.statusMessage = "Unauthorized: No token provied";
        res.status(401).send();
        return;
    }
    const user = await User.getUserByToken(token);
    if (!user) {
        res.statusMessage = "Unauthorized";
        res.status(401).send();
        return;
    }
    (req as AuthenticatedUserRequest).user = user;
    next();
};

/**
 * Middleware to authorize that the authenticated user (req.user)
 * is the same as the user whose id is in the URL (req.userId).
 */
export const authorizeUser = (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedUserRequest & UserRequest;
    if (!authReq.user || authReq.user.id !== authReq.userId) {
        res.statusMessage = "Forbidden: You cannot edit another user's information";
        res.status(403).send();
        return;
    }
    next();
};
