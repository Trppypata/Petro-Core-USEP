"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdminOrStudent = exports.isStudent = exports.isAdmin = exports.hasRole = void 0;
/**
 * Middleware to check if a user has the required role
 * @param roles Array of allowed roles
 */
const hasRole = (roles) => {
    return (req, res, next) => {
        try {
            // User is added to req.body by the auth middleware
            const { user } = req.body;
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized: User not authenticated',
                });
            }
            // Extract user role from metadata
            const userRole = user.user_metadata?.role;
            if (!userRole) {
                return res.status(403).json({
                    success: false,
                    message: 'Forbidden: User has no role assigned',
                });
            }
            // Check if user's role is in the allowed roles array
            if (!roles.includes(userRole)) {
                return res.status(403).json({
                    success: false,
                    message: `Forbidden: Access requires one of these roles: ${roles.join(', ')}`,
                });
            }
            // User has required role, proceed to next middleware
            next();
        }
        catch (error) {
            console.error('Role middleware error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
            });
        }
    };
};
exports.hasRole = hasRole;
// Common role middleware shortcuts
exports.isAdmin = (0, exports.hasRole)(['admin']);
exports.isStudent = (0, exports.hasRole)(['student']);
exports.isAdminOrStudent = (0, exports.hasRole)(['admin', 'student']);
