import { Request, Response, NextFunction } from "express";
import * as User from "../models/user.model";

interface UserRequest extends Request {
    userId: number;
}

interface AuthenticatedUserRequest extends Request {
    user: any;
}

const validateUserId = (req: Request, res: Response, next: NextFunction): void => {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId) || userId < 0) {
        res.statusMessage = "Invalid user id";
        res.status(400).send();
        return;
    }
    (req as UserRequest).userId = userId;
    next();
};

const validateUserAuthToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

const authorizeUser = (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedUserRequest & UserRequest;
    if (!authReq.user || authReq.user.id !== authReq.userId) {
        res.statusMessage = "Forbidden: You cannot edit another user's information";
        res.status(403).send();
        return;
    }
    next();
};

export { authorizeUser, validateUserId, validateUserAuthToken, UserRequest, AuthenticatedUserRequest}