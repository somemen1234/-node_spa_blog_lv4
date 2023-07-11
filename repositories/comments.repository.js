const { Comment } = require("../models");

class CommentRepository {
  findAllComment = async (post_id) => {
    const comments = await Comment.findAll({
      attributes: ["comment_id", "name", "comment", "createdAt"],
      order: [["createdAt", "DESC"]],
      where: { post_id },
    });
    return comments;
  };
  createComment = async (user_id, post_id, name, comment) => {
    await Comment.create({ user_id, post_id, name, comment });
    return;
  };
  findOneComment = async (comment_id) => {
    const comment = await Comment.findOne({
      attributes: ["comment_id", "user_id", "name", "comment", "createdAt"],
      order: [["createdAt", "DESC"]],
      where: { comment_id },
    });
    return comment;
  };
  updateComment = async (comment_id, comment) => {
    await Comment.update({ comment }, { where: { comment_id } });
    return;
  };
  deleteComment = async (comment_id) => {
    await Comment.destroy({ where: { comment_id } });
    return;
  };
}

module.exports = CommentRepository;
