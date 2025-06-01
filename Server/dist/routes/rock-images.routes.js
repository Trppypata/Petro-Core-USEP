"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const rock_images_controller_1 = require("../controllers/rock-images.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
// Public routes (no authentication required)
router.get('/:rockId', rock_images_controller_1.getRockImages);
router.get('/image/:id', rock_images_controller_1.getRockImage);
// Protected routes (authentication required)
router.post('/', auth_middleware_1.verifyToken, rock_images_controller_1.addRockImages);
router.put('/:id', auth_middleware_1.verifyToken, rock_images_controller_1.updateRockImage);
router.delete('/:id', auth_middleware_1.verifyToken, rock_images_controller_1.deleteRockImage);
router.delete('/rock/:rockId', auth_middleware_1.verifyToken, rock_images_controller_1.deleteRockImagesByRockId);
exports.default = router;
