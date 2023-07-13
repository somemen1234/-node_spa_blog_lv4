const { Comment } = require("../models");

class CommentRepository {
  //해당 게시글의 댓글 조회
  findAllComment = async (post_id) => {
    const comments = await Comment.findAll({
      attributes: ["comment_id", "name", "comment", "createdAt"],
      order: [["createdAt", "DESC"]],
      where: { post_id },
    });
    return comments;
  };
  //해당 게시글의 댓글 생성
  createComment = async (user_id, post_id, name, comment) => {
    await Comment.create({ user_id, post_id, name, comment });
    return;
  };
  //수정 및 삭제를 위한 특정 댓글 여부 조회
  findOneComment = async (comment_id) => {
    const comment = await Comment.findOne({
      attributes: ["comment_id", "user_id", "name", "comment", "createdAt"],
      order: [["createdAt", "DESC"]],
      where: { comment_id },
    });
    return comment;
  };
  //해당 댓글 수정
  updateComment = async (comment_id, comment) => {
    await Comment.update({ comment }, { where: { comment_id } });
    return;
  };
  //해당 댓글 삭제
  deleteComment = async (comment_id) => {
    await Comment.destroy({ where: { comment_id } });
    return;
  };
}

module.exports = CommentRepository;
