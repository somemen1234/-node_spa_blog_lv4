const CommentRepository = require("../repositories/comments.repository.js");
const PostRepository = require("../repositories/posts.repository.js");

class CommentService {
  commentRepository = new CommentRepository();
  postRepository = new PostRepository();

  findComments = async (post_id) => {
    try {
      const existPost = await this.postRepository.findOnePost(post_id);
      if (!existPost) return { code: 404, errorMessage: "게시글이 없습니다." };

      const existComments = await this.commentRepository.findAllComment(post_id);
      if (!existComments.length) return { code: 404, errorMessage: "게시글의 댓글이 없습니다." };

      return existComments;
    } catch (error) {
      console.error(error);
      return { code: 500, errorMessage: "댓글 조회에 실패했습니다." };
    }
  };

  createComment = async (post_id, comment, res) => {
    const { user_id } = res.locals.user;
    const name = res.locals.userName;
    try {
      const existPost = await this.postRepository.findOnePost(post_id);
      if (!existPost) return { code: 404, errorMessage: "게시글이 없습니다." };

      if (!comment) return { code: 400, errorMessage: "댓글 정보가 입력되지 않았습니다." };

      await this.commentRepository.createComment(user_id, post_id, name, comment);

      return true;
    } catch (error) {
      console.error(error);
      return { code: 500, errorMessage: "댓글 작성에 실패했습니다." };
    }
  };

  putComment = async (post_id, comment_id, comment, res) => {
    const { user_id } = res.locals.user;

    try {
      const existPost = await this.postRepository.findOnePost(post_id);
      if (!existPost) return { code: 404, errorMessage: "게시글이 없습니다." };

      const existComment = await this.commentRepository.findOneComment(comment_id);
      if (!existComment) return { code: 404, errorMessage: "해당 댓글이 없습니다." };

      if (!comment) return { code: 400, errorMessage: "댓글 정보가 입력되지 않았습니다." };

      if (user_id !== existComment.user_id)
        return { code: 401, errorMessage: "댓글 수정 권한이 존재하지 않습니다." };

      await this.commentRepository.updateComment(comment_id, comment);

      return true;
    } catch (error) {
      console.error(error);
      return { code: 500, errorMessage: "댓글 수정에 실패했습니다." };
    }
  };

  deleteComment = async (post_id, comment_id, res) => {
    const { user_id } = res.locals.user;

    try {
      const existPost = await this.postRepository.findOnePost(post_id);
      if (!existPost) return { code: 404, errorMessage: "게시글이 없습니다." };

      const existComment = await this.commentRepository.findOneComment(comment_id);
      if (!existComment) return { code: 404, errorMessage: "해당 댓글이 없습니다." };

      if (user_id !== existComment.user_id)
        return { code: 401, errorMessage: "댓글 삭제 권한이 존재하지 않습니다." };

      await this.commentRepository.deleteComment(comment_id);

      return true;
    } catch (error) {
      console.error(error);
      return { code: 500, errorMessage: "댓글 삭제에 실패했습니다." };
    }
  };
}

module.exports = CommentService;
