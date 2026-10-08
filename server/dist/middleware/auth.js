"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requireAdmin = requireAdmin;
const jwt_1 = require("../utils/jwt");
function requireAuth(req, res, next) {
    try {
        const header = req.headers.authorization;
        if (!header || !header.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }
        const token = header.replace("Bearer ", "").trim();
        const payload = (0, jwt_1.verifyToken)(token);
        req.user = payload;
        next();
    }
    catch {
        return res.status(401).json({
            message: "Invalid or expired token",
        });
    }
}
function requireAdmin(req, res, next) {
    if (req.user?.role !== "ADMIN") {
        return res.status(403).json({
            message: "Admin access required",
        });
    }
    next();
}
