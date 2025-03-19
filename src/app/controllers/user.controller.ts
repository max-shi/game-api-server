import { Request, Response } from "express";
import Logger from '../../config/logger';
import * as User from "../models/user.model";
import bcrypt from 'bcrypt';
import crypto from 'crypto';

/**
 * Registers a new user.
 */
const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { firstName, lastName, email, password } = req.body;

        if (!firstName || !lastName || !email || !password) {
            res.statusMessage = "Missing required fields";
            res.status(400).send();
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            res.statusMessage = "Invalid email format";
            res.status(400).send();
            return;
        }

        if (password.length < 6) {
            res.statusMessage = "Password must be at least 6 characters";
            res.status(400).send();
            return;
        }

        const existingUser = await User.getUserByEmail(email);
        if (existingUser) {
            res.statusMessage = "Email already in use";
            res.status(403).send();
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
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
        const { email, password } = req.body;

        if (!email || !password) {
            res.statusMessage = "Missing email or password";
            res.status(400).send();
            return;
        }

        const user = await User.getUserByEmail(email);
        if (!user) {
            res.statusMessage = "Incorrect email/password";
            res.status(401).send();
            return;
        }

        const passwordMatches = await bcrypt.compare(password, user.password);
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
 * With middleware, we assume that validateUserAuthToken has attached the user.
 */
const logout = async (req: Request, res: Response): Promise<void> => {
    try {
        const authToken = req.get("X-Authorization"); // Could also be read by middleware if needed.
        // Since middleware guarantees a valid user, simply update the token.
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
                lastName: user.lastName
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
        const { firstName, lastName, email, password, currentPassword } = req.body;

        // Validate firstName.
        if (firstName !== undefined) {
            if (typeof firstName !== 'string' || firstName.trim().length === 0 || firstName.length > 64) {
                res.statusMessage = "Invalid first name";
                res.status(400).send();
                return;
            }
        }
        // Validate lastName.
        if (lastName !== undefined) {
            if (typeof lastName !== 'string' || lastName.trim().length === 0 || lastName.length > 64) {
                res.statusMessage = "Invalid last name";
                res.status(400).send();
                return;
            }
        }
        // Validate email.
        if (email !== undefined) {
            if (typeof email !== 'string' || email.trim().length === 0 || email.length > 256) {
                res.statusMessage = "Invalid email";
                res.status(400).send();
                return;
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                res.statusMessage = "Invalid email format";
                res.status(400).send();
                return;
            }
            const existingUser = await User.getUserByEmail(email);
            if (existingUser && existingUser.id !== userId) {
                res.statusMessage = "Email already in use";
                res.status(403).send();
                return;
            }
        }
        // Handle password update.
        let newPasswordHash: string | undefined;
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
            if (password.length < 6 || currentPassword.length < 6) {
                res.statusMessage = "Passwords must be at least 6 characters";
                res.status(400).send();
                return;
            }
            const currentUser = await User.getUserByIdAuth(userId);
            if (!currentUser) {
                res.statusMessage = "User not found";
                res.status(404).send();
                return;
            }
            const passwordMatches = await bcrypt.compare(currentPassword, currentUser.password);
            if (!passwordMatches) {
                res.statusMessage = "Unauthorized: Current password is incorrect";
                res.status(401).send();
                return;
            }
            newPasswordHash = await bcrypt.hash(password, 10);
        }

        const updateData: { firstName?: string, lastName?: string, email?: string, password?: string } = {};
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
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
};

export { register, login, logout, view, update };
