const { Like, Post } = require("../models");

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
    const posts = await Like.findAll({
      where: { user_id },
      groupBy: ["post_id"],
      attributes: [],
      include: [
        {
          model: Post,
          attributes: ["post_id", "title", "name", "likes", "createdAt"],
        },
      ],
      order: [
        [Post, "likes", "DESC"],
        [Post, "createdAt", "DESC"],
      ],
    });
    return posts;
  };
}

module.exports = LikeRepository;
