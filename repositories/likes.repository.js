const { Like, Post } = require("../models");

class LikeRepository {
  createUserLike = async (post_id, user_id) => {
    await Like.create({ post_id, user_id });
    return;
  };
  deleteUserLike = async (post_id, user_id) => {
    await Like.destroy({ where: { post_id, user_id } });
    return;
  };
  findExistUserLike = async (post_id, user_id) => {
    const result = await Like.findOne({ where: { post_id, user_id } });
    return result;
  };
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
    });
    posts.sort((a, b) => b.Post.likes - a.Post.likes || b.Post.createdAt - a.Post.createdAt);
    return posts;
  };
}

module.exports = LikeRepository;
