import {Request, Response} from "express";
import Logger from '../../config/logger';
import * as User from "../models/user.model";
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { firstName, lastName, email, password } = req.body;
        // extract the parameters from the request body

        // Error Checking

        // if missing first name, last name, email OR password, then send a (400), and status message Missing required fields
        if (!firstName || !lastName || !email || !password) {
            res.statusMessage = "Missing required fields";
            res.status(400).send();
            return;
        }
        // if email format is incorrect, send a (400)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // email regex
        if (!emailRegex.test(email)) {
            res.statusMessage = "Invalid email format";
            res.status(400).send();
            return;
        }
        // if the password length is less than 6, send a (400)
        if (password.length < 6) {
            res.statusMessage = "Password must be at least 6 characters";
            res.status(400).send();
            return;
        }
        // if a user already exists, then we send a (403)
        const existingUser = await User.getUserByEmail(email);
        if (existingUser) {
            res.statusMessage = "Email already in use";
            res.status(403).send();
            return;
        }
        // hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        // https://www.npmjs.com/package/bcrypt (see this) yuh
        // Create a new user (not in the database)
        const newUserId = await User.createUser({
            firstName,
            lastName,
            email,
            password: hashedPassword,
        });
        // Return a 201 Created response with the new user's ID.
        res.status(201).json({ userId: newUserId });
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        // Validate that email and password are provided.
        if (!email || !password) {
            res.statusMessage = "Missing email or password";
            res.status(400).send();
            return;
        }

        // Retrieve the user by email (includes the hashed password).
        const user = await User.getUserByEmail(email);
        if (!user) {
            res.statusMessage = "Incorrect email/password";
            res.status(401).send();
            return;
        }

        // Verify the password using bcrypt.
        const passwordMatches = await bcrypt.compare(password, user.password);
        if (!passwordMatches) {
            res.statusMessage = "Incorrect email/password";
            res.status(401).send();
            return;
        }

        // Generate a new random token.
        const token = crypto.randomBytes(32).toString('hex');
        // https://www.geeksforgeeks.org/node-js-crypto-randombytes-method/

        // Update the user's token in the database.
        await User.updateUserToken(user.id, token);

        // Return the userId and token in the response.
        res.status(200).json({ userId: user.id, token });
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const logout = async (req: Request, res: Response): Promise<void> => {
    try {
        // Retrieve the token from the header
        const token = req.get("X-Authorization");
        if (!token) {
            res.statusMessage = "Unauthorized: No token provided";
            res.status(401).send();
            return;
        }

        // Find the user associated with this token
        const user = await User.getUserByToken(token);
        if (!user) {
            res.statusMessage = "Unauthorized";
            res.status(401).send();
            return;
        }

        // Remove the token from the user record to log them out.
        // set to null cuz the db initalises the token to be null
        await User.updateUserToken(user.id, null);

        res.status(200).send();
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}


const view = async (req: Request, res: Response): Promise<void> => {
    try {
        // Parse the user ID from the URL parameter.
        const userId = parseInt(req.params.id, 10);
        if (isNaN(userId)) {
            res.statusMessage = "Invalid user id";
            res.status(400).send();
            return;
        }

        // Retrieve the user's details from the database.
        const user = await User.getUserById(userId);
        if (!user) {
            res.statusMessage = "User Not Found";
            res.status(404).send();
            return;
        }

        // Check if the request is authenticated.
        const token = req.get("X-Authorization");
        let currentUser: { id: number } | null = null;
        if (token) {
            currentUser = await User.getUserByToken(token);
        }

        // If the authenticated user is the same as the one being viewed,
        // return the full user object (including email).
        // Otherwise, return only the first and last names.
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
}


const update = async (req: Request, res: Response): Promise<void> => {
    try {
        // Parse and validate the user ID from the URL parameter.
        const userId = parseInt(req.params.id, 10);
        if (isNaN(userId)) {
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/isNaN
            // Shold be able to cover all cases of invalid user id.
            res.statusMessage = "Invalid user id";
            res.status(400).send();
            return;
        }

        // Retrieve the token from the header and check authentication.
        const token = req.get("X-Authorization");
        if (!token) {
            res.statusMessage = "Unauthorized: Missing token";
            res.status(401).send();
            return;
        }

        // Ensure the token belongs to the same user being updated.
        const authUser = await User.getUserByToken(token);
        if (!authUser || authUser.id !== userId) {
            res.statusMessage = "Forbidden: You cannot edit another user's information";
            res.status(403).send();
            return;
        }

        // Extract fields from the request body.
        const { firstName, lastName, email, password, currentPassword } = req.body;

        // Validate firstName if provided.
        // Note: Firstname is required.
        if (firstName !== undefined) {
            if (typeof firstName !== 'string' || firstName.trim().length === 0 || firstName.length > 64) {
                res.statusMessage = "Invalid first name";
                res.status(400).send();
                return;
            }
        }

        // Validate lastName if provided.
        // Note: Lastname is required.
        if (lastName !== undefined) {
            if (typeof lastName !== 'string' || lastName.trim().length === 0 || lastName.length > 64) {
                res.statusMessage = "Invalid last name";
                res.status(400).send();
                return;
            }
        }

        // Validate email if provided.
        // Note: Email is required.
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
            // Check that the email is not already in use by another user.
            const existingUser = await User.getUserByEmail(email);
            if (existingUser && existingUser.id !== userId) {
                res.statusMessage = "Email already in use";
                res.status(403).send();
                return;
            }
        }

        // Handle password update if requested.
        let newPasswordHash: string | undefined;
        if (password !== undefined || currentPassword !== undefined) {
            // Both currentPassword and new password must be provided.
            if (!password || !currentPassword) {
                res.statusMessage = "Both currentPassword and new password must be provided to change password";
                res.status(400).send();
                return;
            }
            // Ensure the new password differs from the current one.
            if (password === currentPassword) {
                res.statusMessage = "New password must be different from current password";
                res.status(403).send();
                return;
            }
            // Enforce minimum length for passwords.
            if (password.length < 6 || currentPassword.length < 6) {
                res.statusMessage = "Passwords must be at least 6 characters";
                res.status(400).send();
                return;
            }
            // Retrieve the user's current record (including the hashed password) for verification.
            const currentUser = await User.getUserByIdAuth(userId);
            if (!currentUser) {
                res.statusMessage = "User not found";
                res.status(404).send();
                return;
            }
            // Compare provided currentPassword with the stored hash.
            const passwordMatches = await bcrypt.compare(currentPassword, currentUser.password);
            if (!passwordMatches) {
                res.statusMessage = "Unauthorized: Current password is incorrect";
                res.status(401).send();
                return;
            }
            // Hash the new password.
            newPasswordHash = await bcrypt.hash(password, 10);
        }

        // Build an object of fields to update.
        const updateData: { firstName?: string, lastName?: string, email?: string, password?: string } = {};
        if (firstName !== undefined) updateData.firstName = firstName; // unsure if the undefined check is needed
        if (lastName !== undefined) updateData.lastName = lastName;
        if (email !== undefined) updateData.email = email;
        if (newPasswordHash !== undefined) updateData.password = newPasswordHash;

        // If no fields to update were provided, respond with 200 OK.
        if (Object.keys(updateData).length === 0) {
            res.status(200).send();
            return;
        }

        // Update the user's details in the database.
        await User.updateUserDetails(userId, updateData);
        res.status(200).send();
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}


export {register, login, logout, view, update}