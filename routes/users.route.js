const express = require("express");
const { User, Token } = require("../models");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const authMiddleware = require("../middlewares/auth-middleware.js");
const router = express.Router();
const salt = 12;

// 회원가입 API
router.post("/users/signup", async (req, res) => {
  try {
    const { email, name, password, confirmPassword } = req.body;
    const emailReg = new RegExp(/^\w+([\.-]?\w+)*@\w+([\.-]?\w)*(\.\w{2,3})+$/);

    if (!email || !name || !password || !confirmPassword)
      return res
        .status(400)
        .json({ errorMessage: "이메일, 이름, 비밀번호, 비밀번호 확인을 전부 입력해주세요." });

    // 정규형을 통해 비교
    if (!emailReg.test(email))
      return res
        .status(400)
        .json({ errorMessage: "이메일 형식이 올바르지 않습니다. 다시 입력해 주세요." });

    const emailName = email.split("@")[0];
    if (password.length < 4 || emailName.includes(password))
      return res.status(400).json({
        errorMessage: "패스워드는 4자리이상이고 이메일과 같은 값이 포함이 되면 안됩니다.",
      });

    if (password !== confirmPassword)
      return res.status(412).json({ errorMessage: "패스워드와 패스워드확인이 다릅니다." });

    const existUser = await User.findOne({ where: { email } });
    if (existUser) return res.status(409).json({ errorMessage: "이미 존재하는 이메일입니다." });

    if (password !== confirmPassword) {
      return res.status(412).json({ errorMessage: "패스워드와 패스워드확인이 다릅니다." });
    }

    const hashPassword = await bcrypt.hash(password, salt);

    await User.create({ email, name, password: hashPassword });

    return res.status(201).json({ message: "회원 가입에 성공하였습니다." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ errorMessage: "요청한 데이터 형식이 올바르지 않습니다." });
  }
});

// 로그인 API
router.post("/users/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ errorMessage: "이메일 또는 패스워드를 입력해주세요." });
  }
  const user = await User.findOne({ where: { email } });

  if (!user)
    return res
      .status(412)
      .json({ errorMessage: "회원가입되지 않은 이메일이거나 비밀번호가 다릅니다." });

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res
      .status(412)
      .json({ errorMessage: "회원가입되지 않은 이메일이거나 비밀번호가 다릅니다." });
  }
  // 저장된 user의 refreshToken이 있는지 확인
  const existReFreshToken = await Token.findOne({ where: { user_id: user.user_id } });

  // 없으면 accessToken과 refreshToken을 모두 생성
  if (!existReFreshToken) {
    const refreshToken = jwt.sign({}, process.env.JWT_SECRET_KEY, { expiresIn: "14d" });
    const accessToken = jwt.sign({ user_id: user.user_id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "1h",
    });

    await Token.create({ token_id: refreshToken, user_id: user.user_id });

    res.clearCookie("accessToken");
    res.cookie("accessToken", `Bearer ${accessToken}`);
    return res.status(200).json({ message: `${user.name}님 환영합니다.` });
  }

  try {
    // refreshToken이 있다면 검증을 실시
    // 검증이 성공이 된다면 accessToken만 새로 발급하고 refreshToken은 그대로 가져옴
    // 이 때, 기존에 있는 값을 지우고 새로 생성하는 이유는 Token에 여러 계정이 들어가기 때문에
    // 계정이 의도치않게 삭제되거나 로그아웃 되었을 때 가장 마지막에 로그인한 사용자의 정보가
    // 자동으로 로그인 되도록 설정하기 위해서 기존에 Token에 있는 값을 지우고 새로 생성
    // refreshToken은 그대로 가져오기에 만료기간은 갱신되지 않음
    jwt.verify(existReFreshToken.token_id, process.env.JWT_SECRET_KEY);

    await Token.destroy({ where: { user_id: user.user_id } });
    await Token.create({ token_id: existReFreshToken.token_id, user_id: user.user_id });

    const accessToken = jwt.sign({ user_id: user.user_id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "1h",
    });

    res.clearCookie("accessToken");
    res.cookie("accessToken", `Bearer ${accessToken}`);
    return res.status(200).json({ message: `${user.name}님 환영합니다.` });
  } catch (error) {
    // refreshToken이 만료되었을 경우
    // 두 토큰을 전부 생성
    if (error.name === "TokenExpiredError") {
      const refreshToken = jwt.sign({}, process.env.JWT_SECRET_KEY, { expiresIn: "14d" });
      const accessToken = jwt.sign({ user_id: user.user_id }, process.env.JWT_SECRET_KEY, {
        expiresIn: "1h",
      });

      await Token.destroy({ where: { user_id: user.user_id } });
      await Token.create({ token_id: refreshToken, user_id: user.user_id });

      res.clearCookie("accessToken");
      res.cookie("accessToken", `Bearer ${accessToken}`);
      return res.status(200).json({ message: `${user.name}님 환영합니다.` });
    }
    console.error(error);
    return res.status(500).json({ errorMessage: "로그인에 실패하였습니다." });
  }
});

//로그아웃 API
// 로그아웃 API
// 해당 유저의 토큰 값이 있는지 비교해서 있으면 삭제하고 없으면 로그인이 되어 있지 않다고 출력
router.delete("/logout/:user_id", authMiddleware, async (req, res) => {
  try {
    const { user_id } = req.params;
    const user = await User.findOne({ where: { user_id } });
    const existToken = await Token.findOne({ where: { user_id: user_id } });

    if (!existToken) {
      return res.status(401).json({
        errorMessage: "로그인이 되어 있지 않은 아이디입니다.",
      });
    }

    await Token.destroy({ where: { user_id: user_id } });
    res.clearCookie("accessToken");

    return res.status(200).json({ message: `${user.name}님이 로그아웃 되었습니다.` });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ errorMessage: "로그아웃에 실패하였습니다" });
  }
});

// 사용자 계정 전환 API
router.post("/switchId/:user_id", authMiddleware, async (req, res) => {
  //쿼리는 프론트에서 input창을 받아서 서버로 쏴주는 비밀번호(이 비밀번호가 현재 계정을 인증)
  const { user_id } = req.params;

  try {
    const existUser = await User.findOne({ where: { user_id } });
    if (!existUser)
      return res.status(404).json({
        errorMessage: "회원가입이 되어 있지 않은 아이디입니다. 회원가입 해주세요.",
      });

    // 해당 유저의 refreshToken을 가져와 검증함
    // 검증에 성공하면 해당 유저를 로그인 상태로 바꾸고 refreshToken을 삭제하고 재생성해서 제일 상단에 위치하게 함
    const existReFreshToken = await Token.findOne({ where: { user_id: existUser.user_id } });
    jwt.verify(existReFreshToken.token_id, process.env.JWT_SECRET_KEY);

    await Token.destroy({ where: { user_id: existUser.user_id } });
    await Token.create({ token_id: existReFreshToken.token_id, user_id: existUser.user_id });

    res.clearCookie("accessToken");
    const accessToken = jwt.sign({ user_id: existUser.user_id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "1h",
    });
    res.cookie("accessToken", `Bearer ${accessToken}`);
    return res.status(200).json({ message: `${existUser.name}님의 계정으로 전환되었습니다.` });
  } catch (error) {
    // 토큰이 검증 실패했으면 만료된 아이디라는 오류 반환
    if (error.name === "TokenExpiredError") {
      console.error(error);
      res.clearCookie("accessToken");
      await Token.destroy({ where: { user_id: user_id } });
      return res.status(401).json({
        errorMessage: "토큰이 만료된 아이디입니다. 다시 로그인 해주세요.",
      });
    }
    // 토큰이 존재하지 않았을 경우에 여기로 들어가서 로그인 먼저 해달라는 오류 반환
    console.error(error);
    return res.status(500).json({
      errorMessage: "계정 전환에 실패했습니다. 로그인 먼저 해주세요.",
    });
  }
});

module.exports = router;
