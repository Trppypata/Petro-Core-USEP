import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to check if a user has the required role
 * @param roles Array of allowed roles
 */
export const hasRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
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
    } catch (error) {
      console.error('Role middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };
};

// Common role middleware shortcuts
export const isAdmin = hasRole(['admin']);
export const isStudent = hasRole(['student']);
export const isAdminOrStudent = hasRole(['admin', 'student']); 