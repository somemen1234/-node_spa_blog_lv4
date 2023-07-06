const express = require("express");
const { Post, Like, sequelize } = require("../models");
const { Op, Transaction } = require("sequelize");
const authMiddleware = require("../middlewares/auth-middleware.js");
const router = express.Router();

//게시글 등록 API
router.post("/posts", authMiddleware, async (req, res) => {
  try {
    const { user_id } = res.locals.user;
    const name = res.locals.userName;
    const { title, content } = req.body;

    if (!title || !content)
      return res.status(400).json({ errorMessage: "게시글의 정보가 입력되지 않았습니다." });

    //DB에 데이터가 비어있다면 AUTO_INCREMENT를 1로 초기화 하는 방법(쿼리문에서) => 좋은 action이 아님(시말서 각)
    //ALTER TABLE table_name AUTO_INCREMENT = 1;
    const post = await Post.create({
      user_id: user_id,
      name: name,
      title,
      content,
    });

    return res.status(201).json({ message: "게시글을 생성하였습니다." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ errorMessage: "게시글 작성에 실패했습니다." });
  }
});

//게시글 전제 조회 API
router.get("/posts", async (_, res) => {
  try {
    //방법 1 : posts 테이블에 likes 어트리뷰트를 추가해서 출력
    const posts = await Post.findAll({
      attributes: ["post_id", "name", "title", "likes", "createdAt"],
    });
    if (!posts.length) return res.status(404).json({ errorMessage: "작성된 게시글이 없습니다." });
    posts.sort((a, b) => b.likes - a.likes || b.createdAt - a.createdAt);

    //방법 2 : like 테이블만을 이용해서 출력
    // const posts = await Post.findAll({
    //   attributes: ["post_id", "User_id", "title", "Name", "createdAt"],
    //   include: [
    //     {
    //       model: Like,
    //       attributes: ["User_id", "Post_id"],
    //       groupBy: ["Post_id"],
    //     },
    //   ],
    // });
    // const results = posts.map((post) => {
    //   return {
    //     post_id: post.post_id,
    //     User_id: post.User_id,
    //     title: post.title,
    //     Name: post.Name,
    //     createdAt: post.createdAt,
    //     Likes: post.Likes.length,
    //   };
    // });
    // results.sort((a, b) => b.Likes - a.Likes || b.createdAt - a.createdAt);

    return res.status(200).json({ posts });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ errorMessage: "게시글 조회에 실패하였습니다." });
  }
});

//게시글 상세조회 API
router.get("/posts/:post_id", async (req, res) => {
  try {
    const { post_id } = req.params;
    const post = await Post.findOne({
      attributes: ["post_id", "name", "title", "content", "likes", "createdAt"],
      where: { post_id },
    });

    if (!post) return res.status(404).json({ errorMessage: "해당 게시글을 찾을 수 없습니다." });

    return res.status(200).json({ post });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ errorMessage: "게시글 조회에 실패했습니다." });
  }
});

//게시글 수정 API
router.patch("/posts/:post_id", authMiddleware, async (req, res) => {
  try {
    const { post_id } = req.params;
    const { user_id } = res.locals.user;
    const { title, content } = req.body;

    const existPost = await Post.findOne({ where: { post_id } });
    if (!existPost)
      return res.status(404).json({ errorMessage: "해당 게시글을 찾을 수 없습니다." });

    if (user_id !== existPost.user_id)
      return res.status(401).json({ errorMessage: "게시글 수정 권한이 존재하지 않습니다." });

    if (!title && !content)
      return res
        .status(400)
        .json({ errorMessage: "게시글과 내용이 둘 다 빈 내용인지 확인해 주세요." });

    await Post.update(
      { title, content }, // 수정할 컬럼 및 데이터
      {
        where: { user_id: existPost.user_id },
      } //어떤 데이터를 수정할지
    );

    return res.status(201).json({ message: "게시글을 수정하였습니다." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ errorMessage: "게시글 수정에 실패했습니다." });
  }
});

//게시글 삭제 API
router.delete("/posts/:post_id", authMiddleware, async (req, res) => {
  try {
    const { post_id } = req.params;
    const { user_id } = res.locals.user;

    const existPost = await Post.findOne({ where: { post_id } });

    if (!existPost)
      return res.status(404).json({ errorMessage: "해당 게시글을 찾을 수 없습니다." });

    if (user_id !== existPost.user_id)
      return res.status(401).json({ errorMessage: "게시글 삭제 권한이 존재하지 않습니다." });

    await Post.destroy({
      where: { user_id: existPost.user_id },
    });
    return res.status(200).json({ message: "게시글을 삭제하였습니다." });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ errorMessage: "게시글 삭제에 실패했습니다." });
  }
});

// 좋아요 기능
router.post("/posts/:post_id/like", authMiddleware, async (req, res) => {
  const { post_id } = req.params;
  const { user_id } = res.locals.user; // 현재 로그인한 사용자의 ID

  try {
    const post = await Post.findByPk(post_id);
    if (!post) {
      return res.status(404).json({ errorMessage: "게시글을 찾을 수 없습니다." });
    }

    const existingLike = await Like.findOne({
      where: {
        [Op.and]: [{ Post_id: post_id }, { user_id }],
      },
    });
    const t = await sequelize.transaction({
      isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
    });
    try {
      if (existingLike) {
        // 이미 좋아요를 눌렀다면 좋아요 취소
        await existingLike.destroy(); // 좋아요 기록 삭제
        {
          transaction: t;
        }
        const postLikes = await Post.findOne({ where: { post_id } });
        await Post.update({ likes: postLikes.likes - 1 }, { where: { post_id } });
        {
          transaction: t;
        }
        await t.commit();
        return res.status(200).json({ message: "좋아요를 취소했습니다." });
      } else {
        // 좋아요 추가
        await Like.create({ post_id, user_id }); // 좋아요 기록 생성
        {
          transaction: t;
        }
        const postLikes = await Post.findOne({ where: { post_id } });
        await Post.update({ likes: postLikes.likes + 1 }, { where: { post_id } });
        {
          transaction: t;
        }
        await t.commit();
        return res.status(200).json({ message: "좋아요를 추가했습니다." });
      }
    } catch (transactionError) {
      console.err(transactionError);
      await t.rollback();
      throw transactionError;
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ errorMessage: "좋아요를 처리하는 도중 에러가 발생했습니다." });
  }
});

// 테이블의 컬럼 개수 세어주기
// [Sequelize.fn("COUNT", Sequelize.col("Like.Post_id")), "Likes"]
router.get("/loginUser/likePosts", authMiddleware, async (req, res) => {
  const { user_id } = res.locals.user;
  // const user = await User.findByPk(user_id);
  // const posts = await user.getLikes({
  //   attributes: [[Sequelize.fn("COUNT", Sequelize.col("Like.like_id")), "Likes"]],
  //   groupBy:["Like.Post_id"],
  // });

  //방법 1 : 그냥 posts 테이블에 likes 속성을 추가 해 좋아요 누를 때마다 올라갈 수 있도록 설정(트랜잭션 이용)
  try {
    const userLikes = await Like.findAll({
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
    if (!userLikes)
      return res.status(404).json({ errorMessage: "좋아요를 누른 게시글이 없습니다." });

    userLikes.sort((a, b) => b.Post.likes - a.Post.likes || b.Post.createdAt - a.Post.createdAt);

    //방법 2 : posts에 likes를 넣지 않고 구현(비효율적인거 같아서 1번 방법으로 변경했음)
    // const userLikes = await Like.findAll({
    //   where: { User_id: user_id },
    //   attributes: ["Post_id", "User_id"],
    //   include: [
    //     {
    //       model: Post,
    //       attributes: ["title", "Name", "createdAt",],
    //     },
    //   ],
    // });
    // const arr = userLikes.map((arr) => {
    //   return arr.Post_id;
    // });

    // const resultPosts = await Post.findAll({
    //   attributes: ["post_id", "User_id", "title", "Name", "createdAt"],
    //   where: { post_id: [...arr] },
    //   include: [
    //     {
    //       model: Like,
    //       attributes: ["User_id", "Post_id"],
    //       groupBy: ["Post_id"],
    //     },
    //   ],
    // });

    // const results = resultPosts.map((post) => {
    //   return {
    //     post_id: post.post_id,
    //     User_id: post.User_id,
    //     Name: post.Name,
    //     createdAt: post.createdAt,
    //     Likes: post.Likes.length,
    //   };
    // });
    // results.sort((a, b) => b.Likes - a.Likes);

    return res.status(200).json({ userLikes });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ errorMessage: "게시글 조회를 실패했습니다." });
  }
});

module.exports = router;
