"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = void 0;
const supabase_1 = require("../config/supabase");
// Middleware to verify JWT token
const verifyToken = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'No authorization token provided',
            });
        }
        // Extract token (remove 'Bearer ' prefix)
        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token format',
            });
        }
        // Verify token with Supabase
        const { data, error } = await supabase_1.supabase.auth.getUser(token);
        if (error || !data.user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token',
            });
        }
        // Add user info to request
        req.body.user = data.user;
        // Continue to the next middleware or route handler
        next();
    }
    catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};
exports.verifyToken = verifyToken;
