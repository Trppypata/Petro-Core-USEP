"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Load environment variables first
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env') });
// Debug environment variables
console.log('Environment loaded: NODE_ENV =', process.env.NODE_ENV);
console.log('API running at port:', process.env.PORT || 8001);
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const student_routes_1 = __importDefault(require("./routes/student.routes"));
const users_routes_1 = __importDefault(require("./routes/users.routes"));
const minerals_routes_1 = __importDefault(require("./routes/minerals.routes"));
const rocks_routes_1 = __importDefault(require("./routes/rocks.routes"));
const rock_images_routes_1 = __importDefault(require("./routes/rock-images.routes"));
const setup_storage_1 = require("./config/setup-storage");
// Create Express app
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8001;
// Middleware
app.use((0, cors_1.default)({
    origin: [
        'https://petro-core-usep.onrender.com'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true
}));
app.use(express_1.default.json());
// Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/api/student', student_routes_1.default);
app.use('/api/users', users_routes_1.default);
app.use('/api/minerals', minerals_routes_1.default);
app.use('/api/rocks', rocks_routes_1.default);
app.use('/api/rock-images', rock_images_routes_1.default);
// Health check routes
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is running' });
});
// Add API prefix health check endpoint to match client expectations
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is running' });
});
// 404 handler for unmatched routes
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.originalUrl} not found`,
        availableRoutes: [
            '/api/auth/*',
            '/api/admin/*',
            '/api/student/*',
            '/api/users/*',
            '/api/minerals/*',
            '/api/rocks/*',
            '/api/rock-images/*',
            '/health',
            '/api/health'
        ]
    });
});
// Initialize Supabase storage buckets
(0, setup_storage_1.setupStorageBuckets)().catch(err => {
    console.error('Error setting up storage buckets:', err);
});
// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
