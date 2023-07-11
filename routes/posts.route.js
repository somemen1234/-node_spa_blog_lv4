const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth-middleware.js");

const PostsController = require("../controllers/posts.controller.js");
const postsController = new PostsController();

router.get("/posts", postsController.getPosts);
router.post("/posts", authMiddleware, postsController.createPost);
router.get("/posts/:post_id", postsController.getDetailPost);
router.patch("/posts/:post_id", authMiddleware, postsController.patchPost);
router.delete("/posts/:post_id", authMiddleware, postsController.deletePost);
router.get("/user/likePosts", authMiddleware, postsController.getLikePosts);
router.post("/posts/:post_id/like", authMiddleware, postsController.likePost);

module.exports = router;
