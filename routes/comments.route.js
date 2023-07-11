const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth-middleware.js");

const CommentsController = require("../controllers/comments.controller.js");
const commentsController = new CommentsController();

router.get("/posts/:post_id/comments", commentsController.getComments);
router.post("/posts/:post_id/comments", authMiddleware, commentsController.createComment);
router.put("/posts/:post_id/comments/:comment_id", authMiddleware, commentsController.putComment);
router.delete(
  "/posts/:post_id/comments/:comment_id",
  authMiddleware,
  commentsController.deleteComment
);

module.exports = router;
