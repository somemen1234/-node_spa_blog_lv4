const CommentService = require("../services/comments.service.js");

class CommentsController {
  commentService = new CommentService();

  //댓글 조회
  getComments = async (req, res) => {
    const { post_id } = req.params;
    const result = await this.commentService.findComments(post_id);

    if (result.errorMessage) res.status(result.code).json({ errorMessage: result.errorMessage });
    else res.status(200).json({ data: result });
  };

  //댓글 생성
  createComment = async (req, res) => {
    const { post_id } = req.params;
    const { comment } = req.body;

    const result = await this.commentService.createComment(post_id, comment, res);

    if (result.errorMessage) res.status(result.code).json({ errorMessage: result.errorMessage });
    else res.status(200).json({ message: "댓글을 생성하였습니다." });
  };

  //댓글 수정
  putComment = async (req, res) => {
    const { post_id, comment_id } = req.params;
    const { comment } = req.body;
    const result = await this.commentService.putComment(post_id, comment_id, comment, res);

    if (result.errorMessage) res.status(result.code).json({ errorMessage: result.errorMessage });
    else res.status(200).json({ message: "댓글을 수정하였습니다." });
  };

  //댓글 삭제
  deleteComment = async (req, res) => {
    const { post_id, comment_id } = req.params;

    const result = await this.commentService.deleteComment(post_id, comment_id, res);

    if (result.errorMessage) res.status(result.code).json({ errorMessage: result.errorMessage });
    else res.status(200).json({ message: "댓글을 삭제하였습니다." });
  };
}

module.exports = CommentsController;
