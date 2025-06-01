"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const mineralsController = __importStar(require("../controllers/minerals.controller"));
const rocksController = __importStar(require("../controllers/rocks.controller"));
const authController = __importStar(require("../controllers/auth.controller"));
const usersController = __importStar(require("../controllers/users.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});
// Auth routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/forgot-password', authController.resetPassword);
router.post('/auth/reset-password', authController.resetPassword);
router.get('/auth/me', auth_middleware_1.verifyToken, authController.getCurrentUser);
// User routes
router.get('/users', auth_middleware_1.verifyToken, usersController.fetchUserDetails);
router.post('/users', auth_middleware_1.verifyToken, usersController.registerStudent);
router.get('/users/:id', auth_middleware_1.verifyToken, usersController.fetchUserDetails);
router.put('/users/:id', auth_middleware_1.verifyToken, usersController.updateUser);
router.delete('/users/:id', auth_middleware_1.verifyToken, usersController.deleteUser);
// Mineral routes
router.get('/minerals', mineralsController.getAllMinerals);
router.post('/minerals', auth_middleware_1.verifyToken, mineralsController.addMineral);
router.put('/minerals/:id', auth_middleware_1.verifyToken, mineralsController.updateMineral);
router.delete('/minerals/:id', auth_middleware_1.verifyToken, mineralsController.deleteMineral);
router.post('/minerals/import', auth_middleware_1.verifyToken, upload.single('file'), mineralsController.importMineralsFromExcel);
router.post('/minerals/import-default', auth_middleware_1.verifyToken, mineralsController.importDefaultMinerals);
// Rock routes
router.get('/rocks', rocksController.getAllRocks);
router.post('/rocks', auth_middleware_1.verifyToken, rocksController.addRock);
router.put('/rocks/:id', auth_middleware_1.verifyToken, rocksController.updateRock);
router.delete('/rocks/:id', auth_middleware_1.verifyToken, rocksController.deleteRock);
router.post('/rocks/import', auth_middleware_1.verifyToken, upload.single('file'), rocksController.importRocksFromExcel);
exports.default = router;
