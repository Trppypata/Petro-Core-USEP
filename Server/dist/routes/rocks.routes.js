"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const rocks_controller_1 = require("../controllers/rocks.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
// Configure multer storage for Excel file uploads
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit (increased from 10MB)
    fileFilter: (_req, file, cb) => {
        // Check file type
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            file.mimetype === 'application/vnd.ms-excel') {
            cb(null, true);
        }
        else {
            cb(new Error('Only Excel files are allowed'));
        }
    }
});
// Routes
// Public routes (no authentication required)
router.get('/', rocks_controller_1.getAllRocks);
router.get('/:id', rocks_controller_1.getRockById);
router.get('/stats', rocks_controller_1.getRockStats);
router.post('/import', upload.single('file'), rocks_controller_1.importRocksFromExcel); // Import without auth
router.post('/import-directly', rocks_controller_1.importRocksDirectly);
router.post('/import-default', rocks_controller_1.importDefaultRocks);
// Protected routes (authentication required)
router.post('/', auth_middleware_1.verifyToken, rocks_controller_1.addRock);
router.put('/:id', auth_middleware_1.verifyToken, rocks_controller_1.updateRock);
router.delete('/:id', auth_middleware_1.verifyToken, rocks_controller_1.deleteRock);
exports.default = router;
