import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import type { User } from "@shared/schema";

// Configure Passport Local Strategy
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return done(null, false, { message: "Invalid username or password" });
      }

      // Compare password with hashed password
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        return done(null, false, { message: "Invalid username or password" });
      }

      // Remove password from user object before returning
      const { password: _, ...userWithoutPassword } = user;
      return done(null, userWithoutPassword);
    } catch (error) {
      return done(error);
    }
  })
);

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await storage.getUser(id);
    if (!user) {
      return done(null, false);
    }
    
    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user;
    done(null, userWithoutPassword);
  } catch (error) {
    done(error);
  }
});

export default passport;

// Middleware to check if user is authenticated
export function requireAuth(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Authentication required" });
}

// Middleware to check if user has specific role OR is elevated via admin password
export function requireRole(roles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    // Check if user has the required role
    const hasRole = roles.includes(req.user.role);
    
    // Check if user has admin elevation (temporary admin access via password)
    const isElevated = req.session?.adminElevated === true;
    
    // Check if elevation is still valid (within 1 hour)
    const elevationTimestamp = req.session?.adminElevatedAt;
    const isElevationValid = isElevated && elevationTimestamp && 
                            (Date.now() - elevationTimestamp < 60 * 60 * 1000); // 1 hour
    
    // Grant access if user has role OR has valid elevation
    if (hasRole || isElevationValid) {
      return next();
    }
    
    // If elevation expired, clear it
    if (isElevated && !isElevationValid) {
      req.session.adminElevated = false;
      req.session.adminElevatedAt = null;
    }
    
    return res.status(403).json({ error: "Insufficient permissions" });
  };
}
