const { Post, Like } = require("../models");
const { Sequelize } = require("sequelize");

class PostRepository {
  //게시글 전체 조회
  findAllPost = async () => {
    const posts = await Post.findAll({
      attributes: [
        "post_id",
        "name",
        "title",
        [
          Sequelize.literal(`(SELECT COUNT(*) FROM likes WHERE likes.post_id = Post.post_id)`),
          "likes",
        ],
        "createdAt",
      ],
      include: [
        {
          model: Like,
          attributes: [],
        },
      ],
      order: [
        [Sequelize.literal("likes"), "DESC"],
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
      attributes: [
        "post_id",
        "user_id",
        "name",
        "title",
        "content",
        [
          Sequelize.literal(`(SELECT COUNT(*) FROM likes WHERE likes.post_id = Post.post_id)`),
          "likes",
        ],
        "createdAt",
      ],
      where: { post_id },
      include: [
        {
          model: Like,
          attributes: [],
          groupBy: ["post_id"],
        },
      ],
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
}
module.exports = PostRepository;
