const { sequelize } = require("../models");
const { Transaction } = require("sequelize");

const PostRepository = require("../repositories/posts.repository.js");
const LikeRepository = require("../repositories/likes.repository.js");
const UserRepository = require("../repositories/users.repository.js");

class PostService {
  postRepository = new PostRepository();
  likeRepository = new LikeRepository();
  userRepository = new UserRepository();

  //전체 게시글 조회
  findAllPost = async () => {
    try {
      const posts = await this.postRepository.findAllPost();

      if (!posts.length) return [];
      return posts;
    } catch (error) {
      console.error(error);
      return { code: 500, errorMessage: "게시글 조회에 실패하였습니다." };
    }
  };

  //게시글 생성
  createPost = async (title, content, res) => {
    try {
      const { user_id } = res.locals.user;
      const name = res.locals.userName;

      if (!title || !content)
        return { code: 400, errorMessage: "게시글의 정보가 입력되지 않았습니다." };

      await this.postRepository.createPost(user_id, name, title, content);

      return true;
    } catch (error) {
      console.error(error);
      return { code: 500, errorMessage: "게시글 작성에 실패했습니다." };
    }
  };

  //상세 게시글 조회
  findOnePost = async (post_id) => {
    try {
      const existPost = await this.postRepository.findOnePost(post_id);
      if (!existPost) return { code: 404, errorMessage: "해당 게시글을 찾을 수 없습니다." };

      return existPost;
    } catch (error) {
      console.error(error);
      return { code: 500, errorMessage: "게시글 조회에 실패했습니다." };
    }
  };

  //게시글 수정
  patchPost = async (post_id, title, content, res) => {
    try {
      const { user_id } = res.locals.user;

      const existPost = await this.postRepository.findOnePost(post_id);
      if (!existPost) return { code: 404, errorMessage: "해당 게시글을 찾을 수 없습니다." };

      if (user_id !== existPost.user_id)
        return { code: 401, errorMessage: "게시글 수정 권한이 존재하지 않습니다." };

      if (!title && !content)
        return { code: 400, errorMessage: "게시글과 내용이 둘 다 빈 내용인지 확인해 주세요." };

      await this.postRepository.updatePost(post_id, title, content);

      return true;
    } catch (error) {
      console.error(error);
      return { code: 500, errorMessage: "게시글 수정에 실패했습니다." };
    }
  };

  //게시글 삭제
  deletePost = async (post_id, res) => {
    try {
      const { user_id } = res.locals.user;

      const existPost = await this.postRepository.findOnePost(post_id);

      if (!existPost) return { code: 404, errorMessage: "해당 게시글을 찾을 수 없습니다." };

      if (user_id !== existPost.user_id)
        return { code: 401, errorMessage: "게시글 삭제 권한이 존재하지 않습니다." };

      await this.postRepository.deletePost(post_id);

      return true;
    } catch (error) {
      console.error(error);
      return { code: 500, errorMessage: "게시글 삭제에 실패했습니다." };
    }
  };

  //게시글 좋아요 누르기
  likePost = async (post_id, res) => {
    try {
      const { user_id } = res.locals.user; // 현재 로그인한 사용자의 ID

      const existPost = await this.postRepository.findOnePost(post_id);
      if (!existPost) {
        return { code: 404, errorMessage: "게시글을 찾을 수 없습니다." };
      }

      const existUserLike = await this.likeRepository.findExistUserLike(post_id, user_id);

      const t = await sequelize.transaction({
        isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
      });
      try {
        if (existUserLike) {
          // 이미 좋아요를 눌렀다면 좋아요 취소
          await this.likeRepository.deleteUserLike(post_id, user_id, { transaction: t }); // 좋아요 기록 삭제
          await this.postRepository.minusLikePost(post_id, existPost.likes, { transaction: t });
          await t.commit();
          return "cancel";
        } else {
          // 좋아요 추가
          await this.likeRepository.createUserLike(post_id, user_id, { transaction: t }); // 좋아요 기록 생성
          await this.postRepository.plusLikePost(post_id, existPost.likes, { transaction: t });
          await t.commit();
          return "add";
        }
      } catch (transactionError) {
        console.err(transactionError);
        await t.rollback();
        throw transactionError;
      }
    } catch (error) {
      console.error(error);
      return { code: 500, errorMessage: "좋아요를 처리하는 도중 에러가 발생했습니다." };
    }
  };

  //로그인된 사용자가 좋아요 누른 게시글 조회
  getLikePosts = async (res) => {
    const { user_id } = res.locals.user;

    try {
      const userLikePosts = await this.likeRepository.findUserLikePosts(user_id);

      if (!userLikePosts.length)
        return { code: 404, errorMessage: "좋아요를 누른 게시글이 없습니다." };

      return userLikePosts;
    } catch (error) {
      console.error(error);
      return { code: 500, errorMessage: "게시글 조회를 실패했습니다." };
    }
  };
}

module.exports = PostService;
