const { Like, Post } = require("../models");
const { Sequelize } = require("sequelize");

class LikeRepository {
  //해당 게시글의 유저 좋아요 생성(좋아요 없을 시)
  createUserLike = async (post_id, user_id) => {
    await Like.create({ post_id, user_id });
    return;
  };
  //해당 게시글의 유저 좋아요 삭제(좋아요 있을 시)
  deleteUserLike = async (post_id, user_id) => {
    await Like.destroy({ where: { post_id, user_id } });
    return;
  };
  //좋아요를 눌렀는지 확인을 위한 조회
  findExistUserLike = async (post_id, user_id) => {
    const result = await Like.findOne({ where: { post_id, user_id } });
    return result;
  };
  //해당 유저가 좋아요 누른 게시글 목록 조회
  findUserLikePosts = async (user_id) => {
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
          where: { user_id },
        },
      ],
      order: [
        [Sequelize.literal("likes"), "DESC"],
        ["createdAt", "DESC"],
      ],
    });
    return posts;
  };
}

module.exports = LikeRepository;
