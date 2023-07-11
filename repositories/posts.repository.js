const { Post } = require("../models");

class PostRepository {
  findAllPost = async () => {
    const posts = await Post.findAll({
      attributes: ["post_id", "name", "title", "likes", "createdAt"],
    });
    posts.sort((a, b) => b.likes - a.likes || b.createdAt - a.createdAt);
    return posts;
  };
  createPost = async (user_id, name, title, content) => {
    await Post.create({ user_id, name, title, content });
    return;
  };
  findOnePost = async (post_id) => {
    const post = await Post.findOne({
      attributes: ["post_id", "user_id", "name", "title", "content", "likes", "createdAt"],
      where: { post_id },
    });
    return post;
  };
  updatePost = async (post_id, title, content) => {
    await Post.update({ title, content }, { where: { post_id } });
    return;
  };
  deletePost = async (post_id) => {
    await Post.destroy({ where: { post_id } });
    return;
  };
  minusLikePost = async (post_id, likes) => {
    await Post.update({ likes: likes - 1 }, { where: { post_id } });
    return;
  };
  plusLikePost = async (post_id, likes) => {
    await Post.update({ likes: likes + 1 }, { where: { post_id } });
  };
}
module.exports = PostRepository;
