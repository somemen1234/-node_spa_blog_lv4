const { Post } = require("../models");

class PostRepository {
  //게시글 전체 조회
  findAllPost = async () => {
    const posts = await Post.findAll({
      attributes: ["post_id", "name", "title", "likes", "createdAt"],
      order: [
        ["likes", "DESC"],
        ["createdAt", "DESC"],
      ],
    });
    return posts;
  };
  //게시글 생성
  createPost = async (user_id, name, title, content) => {
    await Post.create({ user_id, name, title, content });
    return;
  };
  //특정 게시글 조회
  findOnePost = async (post_id) => {
    const post = await Post.findOne({
      attributes: ["post_id", "user_id", "name", "title", "content", "likes", "createdAt"],
      where: { post_id },
    });
    return post;
  };
  //게시글 수정
  updatePost = async (post_id, title, content) => {
    await Post.update({ title, content }, { where: { post_id } });
    return;
  };
  //게시글 삭제
  deletePost = async (post_id) => {
    await Post.destroy({ where: { post_id } });
    return;
  };
  //좋아요 눌렀을 때 게시글의 좋아요 증가
  plusLikePost = async (post_id, likes) => {
    await Post.update({ likes: likes + 1 }, { where: { post_id } });
  };
  //좋아요 취소로 게시글의 좋아요 감소
  minusLikePost = async (post_id, likes) => {
    await Post.update({ likes: likes - 1 }, { where: { post_id } });
    return;
  };
}
module.exports = PostRepository;
