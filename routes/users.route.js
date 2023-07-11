const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth-middleware.js");

const UsersController = require("../controllers/users.controller.js");
const usersController = new UsersController();

router.post("/users/signup", usersController.signup);
router.post("/users/login", usersController.login);
router.delete("/users/logout", authMiddleware, usersController.logout);
router.post("/users/switchId/:user_id", authMiddleware, usersController.switchId);

module.exports = router;
