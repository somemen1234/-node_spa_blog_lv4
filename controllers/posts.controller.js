const PostService = require("../services/posts.service.js");

class PostsController {
  postService = new PostService();

  getPosts = async (_, res, next) => {
    const result = await this.postService.findAllPost();

    if (result.errorMessage) res.status(result.code).json({ errorMessage: result.errorMessage });
    else res.status(200).json({ data: result });
  };

  createPost = async (req, res, next) => {
    const { title, content } = req.body;
    const result = await this.postService.createPost(title, content, res);

    if (result.errorMessage) res.status(result.code).json({ errorMessage: result.errorMessage });
    else res.status(200).json({ message: "게시글을 생성하였습니다." });
  };

  getDetailPost = async (req, res, next) => {
    const { post_id } = req.params;
    const result = await this.postService.findOnePost(post_id);

    if (result.errorMessage) res.status(result.code).json({ errorMessage: result.errorMessage });
    else res.status(200).json({ data: result });
  };

  patchPost = async (req, res, next) => {
    const { post_id } = req.params;
    const { title, content } = req.body;
    const result = await this.postService.patchPost(post_id, title, content, res);

    if (result.errorMessage) res.status(result.code).json({ errorMessage: result.errorMessage });
    else res.status(201).json({ message: "게시글을 수정하였습니다." });
  };

  deletePost = async (req, res, next) => {
    const { post_id } = req.params;
    const result = await this.postService.deletePost(post_id, res);

    if (result.errorMessage) res.status(result.code).json({ errorMessage: result.errorMessage });
    else res.status(200).json({ message: "게시글을 삭제하였습니다." });
  };

  likePost = async (req, res, next) => {
    const { post_id } = req.params;
    const result = await this.postService.likePost(post_id, res);

    if (result.errorMessage) res.status(result.code).json({ errorMessage: result.errorMessage });
    else if (result === "cancel") res.status(200).json({ message: "좋아요를 취소했습니다." });
    else if (result === "add") res.status(200).json({ message: "좋아요를 추가했습니다." });
  };

  getLikePosts = async (_, res, next) => {
    const result = await this.postService.getLikePosts(res);

    if (result.errorMessage) res.status(result.code).json({ errorMessage: result.errorMessage });
    else res.status(200).json({ data: result });
  };
}

module.exports = PostsController;
