import { Request, Response } from "express";
import Logger from '../../config/logger';
import * as User from "../models/user.model";
import crypto from 'crypto';
import { hash, compare } from '../services/passwords';
import { validate } from '../services/validator';
import schemas from '../resources/schemas.json';

/**
 * Registers a new user.
 */
const register = async (req: Request, res: Response): Promise<void> => {
    try {
        // Validate incoming data against the user_register schema.
        const validationResult = await validate(schemas.user_register, req.body);
        if (validationResult !== true) {
            res.statusMessage = validationResult;
            res.status(400).send();
            return;
        }
        const { firstName, lastName, email, password } = req.body;

        const existingUser = await User.getUserByEmail(email);
        if (existingUser) {
            res.statusMessage = "Email already in use";
            res.status(403).send();
            return;
        }

        const hashedPassword = await hash(password);
        const newUserId = await User.createUser({
            firstName,
            lastName,
            email,
            password: hashedPassword,
        });

        res.status(201).json({ userId: newUserId });
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
};

/**
 * Authenticates a user.
 */
const login = async (req: Request, res: Response): Promise<void> => {
    try {
        // Validate incoming data against the user_login schema.
        const validationResult = await validate(schemas.user_login, req.body);
        if (validationResult !== true) {
            res.statusMessage = validationResult;
            res.status(400).send();
            return;
        }
        const { email, password } = req.body;

        const user = await User.getUserByEmail(email);
        if (!user) {
            res.statusMessage = "Incorrect email/password";
            res.status(401).send();
            return;
        }

        const passwordMatches = await compare(password, user.password);
        if (!passwordMatches) {
            res.statusMessage = "Incorrect email/password";
            res.status(401).send();
            return;
        }

        const token = crypto.randomBytes(32).toString('hex');
        await User.updateUserToken(user.id, token);
        res.status(200).json({ userId: user.id, token });
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
};

/**
 * Logs out a user.
 * Assumes that middleware has already validated the user token.
 */
const logout = async (req: Request, res: Response): Promise<void> => {
    try {
        const authToken = req.get("X-Authorization");
        const user = await User.getUserByToken(authToken!);
        if (!user) {
            res.statusMessage = "Unauthorized";
            res.status(401).send();
            return;
        }
        await User.updateUserToken(user.id, null);
        res.status(200).send();
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
};

/**
 * Retrieves user details.
 */
const view = async (req: Request, res: Response): Promise<void> => {
    try {
        // Assume validateUserId middleware has set req.userId.
        const userId = (req as any).userId as number;
        const user = await User.getUserById(userId);
        if (!user) {
            res.statusMessage = "User Not Found";
            res.status(404).send();
            return;
        }
        // Optionally, if a token is provided, get the current user.
        const token = req.get("X-Authorization");
        let currentUser: { id: number } | null = null;
        if (token) {
            currentUser = await User.getUserByToken(token);
        }
        if (currentUser && currentUser.id === userId) {
            res.json(user);
        } else {
            res.json({
                firstName: user.firstName,
                lastName: user.lastName,
            });
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
};

/**
 * Updates a user's details.
 */
const update = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).userId as number;
        // Validate incoming data against the user_edit schema if any fields are provided.
        if (Object.keys(req.body).length > 0) {
            const validationResult = await validate(schemas.user_edit, req.body);
            if (validationResult !== true) {
                res.statusMessage = validationResult;
                res.status(400).send();
                return;
            }
        }
        const { firstName, lastName, email, password, currentPassword } = req.body;
        let newPasswordHash: string | undefined;

        // Handle password update if fields are provided.
        if (password !== undefined || currentPassword !== undefined) {
            if (!password || !currentPassword) {
                res.statusMessage = "Both currentPassword and new password must be provided to change password";
                res.status(400).send();
                return;
            }
            if (password === currentPassword) {
                res.statusMessage = "New password must be different from current password";
                res.status(403).send();
                return;
            }
            const currentUser = await User.getUserByIdAuth(userId);
            if (!currentUser) {
                res.statusMessage = "User not found";
                res.status(404).send();
                return;
            }
            const passwordMatches = await compare(currentPassword, currentUser.password);
            if (!passwordMatches) {
                res.statusMessage = "Unauthorized: Current password is incorrect";
                res.status(401).send();
                return;
            }
            newPasswordHash = await hash(password);
        }

        const updateData: { firstName?: string; lastName?: string; email?: string; password?: string } = {};
        if (firstName !== undefined) updateData.firstName = firstName;
        if (lastName !== undefined) updateData.lastName = lastName;
        if (email !== undefined) updateData.email = email;
        if (newPasswordHash !== undefined) updateData.password = newPasswordHash;

        if (Object.keys(updateData).length === 0) {
            res.status(200).send();
            return;
        }
        await User.updateUserDetails(userId, updateData);
        res.status(200).send();
    } catch (err) {
        Logger.error(err);
        if (err.message.includes("Duplicate entry")) {
            res.statusMessage = "Duplicate entry (duplicate email)";
            res.status(403).send();
        }
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
};

export { register, login, logout, view, update };
