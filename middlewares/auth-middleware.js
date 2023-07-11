const jwt = require("jsonwebtoken");
const { User, Token } = require("../models");

module.exports = async (req, res, next) => {
  const existReFreshToken = await Token.findOne({ order: [["createdAt", "DESC"]] });
  const { accessToken } = req.cookies;
  const [accessAuthType, accessAuthToken] = (accessToken ?? "").split(" ");

  try {
    // case 1) accessToken과 refreshToken이 둘다 없을때
    if (accessAuthType !== "Bearer" && !accessAuthToken && !existReFreshToken) {
      res.status(401).json({
        errorMessage: "로그인 후에 이용할 수 있는 기능입니다.",
      });
      return;
    }

    // case 2) refreshToken들만 있을 때(쿠키 삭제 원인)
    if (existReFreshToken && !accessAuthType && !accessAuthToken) {
      jwt.verify(existReFreshToken.token_id, process.env.JWT_SECRET_KEY);
      const accessToken = jwt.sign(
        { user_id: existReFreshToken.user_id },
        process.env.JWT_SECRET_KEY,
        {
          expiresIn: "1h",
        }
      );

      res.cookie("accessToken", `Bearer ${accessToken}`);
      const user = await User.findOne({ where: { user_id: existReFreshToken.user_id } });

      if (!user) {
        res.clearCookie("accessToken");
        return res.status(401).json({ errorMessage: "토큰 사용자가 존재하지 않습니다." });
      }

      res.locals.user = user;
      res.locals.userName = user.name;
      next();
    } else {
      try {
        // case 3) accessToken과 refreshToken이 둘다 있는 경우
        const { user_id } = jwt.verify(accessAuthToken, process.env.JWT_SECRET_KEY);
        const user = await User.findOne({ where: { user_id } });

        if (!user) {
          res.clearCookie("accessToken");
          return res.status(401).json({ errorMessage: "토큰 사용자가 존재하지 않습니다." });
        }
        res.locals.user = user;
        res.locals.userName = user.name;

        next();
      } catch (error) {
        // case 4) 토큰이 둘 다 있는데 accessToken만 만료
        if (error.name === "TokenExpiredError") {
          jwt.verify(existReFreshToken.token_id, process.env.JWT_SECRET_KEY);

          const accessToken = jwt.sign(
            { user_id: existReFreshToken.user_id },
            process.env.JWT_SECRET_KEY,
            {
              expiresIn: "1h",
            }
          );
          res.cookie("accessToken", `Bearer ${accessToken}`);
          const user = await User.findOne({ where: { user_id: existReFreshToken.user_id } });

          if (!user) {
            res.clearCookie("accessToken");
            res.status(401).json({ errorMessage: "토큰 사용자가 존재하지 않습니다." });
          }

          res.locals.user = user;
          res.locals.userName = user.name;
          next();
        }
      }
    }
  } catch (error) {
    // accessToken과 refreshToken 모두 만료
    if (error.name === "TokenExpiredError") {
      if (existReFreshToken)
        await Token.destroy({ where: { token_id: existReFreshToken.token_id } });

      res.status(401).json({
        errorMessage: "토큰이 만료된 아이디입니다. 다시 로그인 해주세요.",
      });
      return;
    } else {
      console.error(error);
      // 그 밖의 알수 없는 오류가 발생
      res.clearCookie("accessToken");
      Token.destroy({ where: {} });
      res.status(401).json({
        errorMessage: "전달된 쿠키에서 오류가 발생하였습니다. 모든 쿠키를 삭제합니다.",
      });
      return;
    }
  }
};
