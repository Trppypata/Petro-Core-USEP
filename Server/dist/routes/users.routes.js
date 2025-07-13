"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const users_controller_1 = require("../controllers/users.controller");
const router = (0, express_1.Router)();
// Register new student
router.post('/registerStudent', users_controller_1.registerStudent);
// Get all users
router.get('/fetchUserDetails', users_controller_1.fetchUserDetails);
// Get all teams/courses
router.get('/teams', users_controller_1.getTeams);
// Count total users
router.get('/countUsers', users_controller_1.countUsers);
// Update user
router.put('/:id', users_controller_1.updateUser);
// Delete user
router.delete('/:id', users_controller_1.deleteUser);
exports.default = router;
