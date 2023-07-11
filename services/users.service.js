const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const salt = 12;
require("dotenv").config;
const env = process.env;

const UserRepository = require("../repositories/users.repository.js");
const TokenRepository = require("../repositories/tokens.repository.js");

class UserService {
  userRepository = new UserRepository();
  tokenRepository = new TokenRepository();

  signup = async (email, name, password, confirmPassword) => {
    const emailReg = new RegExp(/^\w+([\.-]?\w+)*@\w+([\.-]?\w)*(\.\w{2,3})+$/);

    try {
      if (!email || !name || !password || !confirmPassword)
        return {
          code: 400,
          errorMessage: "이메일, 이름, 비밀번호, 비밀번호 확인을 전부 입력해주세요.",
        };

      // 정규형을 통해 비교
      if (!emailReg.test(email))
        return { code: 400, errorMessage: "이메일 형식이 올바르지 않습니다. 다시 입력해 주세요." };

      const emailName = email.split("@")[0];
      if (password.length < 4 || emailName.includes(password))
        return {
          code: 400,
          errorMessage: "패스워드는 4자리이상이고 이메일과 같은 값이 포함이 되면 안됩니다.",
        };

      if (password !== confirmPassword)
        return { code: 412, errorMessage: "패스워드와 패스워드확인이 다릅니다." };

      const existUser = await this.userRepository.existUserMail(email);
      if (existUser) return { code: 409, errorMessage: "이미 존재하는 이메일입니다." };

      const hashPassword = await bcrypt.hash(password, salt);

      await this.userRepository.signup(email, name, hashPassword);

      return true;
    } catch (error) {
      console.error(error);
      return { code: 500, errorMessage: "요청한 데이터 형식이 올바르지 않습니다." };
    }
  };

  login = async (email, password, res) => {
    try {
      if (!email || !password)
        return { code: 400, errorMessage: "이메일 또는 패스워드를 입력해주세요." };

      const user = await this.userRepository.existUserMail(email);
      if (!user)
        return { code: 412, errorMessage: "회원가입되지 않은 이메일이거나 비밀번호가 다릅니다." };

      const match = await bcrypt.compare(password, user.password);
      if (!match)
        return { code: 412, errorMessage: "회원가입되지 않은 이메일이거나 비밀번호가 다릅니다." };

      // 저장된 user의 refreshToken이 있는지 확인
      const existReFreshToken = await this.tokenRepository.findRefreshToken(user.user_id);

      // 없으면 accessToken과 refreshToken을 모두 생성
      if (!existReFreshToken) {
        const refreshToken = jwt.sign({}, env.JWT_SECRET_KEY, { expiresIn: "14d" });
        const accessToken = jwt.sign({ user_id: user.user_id }, env.JWT_SECRET_KEY, {
          expiresIn: "1h",
        });

        await this.tokenRepository.createRefreshToken(refreshToken, user.user_id);

        res.clearCookie("accessToken");
        res.cookie("accessToken", `Bearer ${accessToken}`);
        return user.name;
      }

      try {
        // refreshToken이 있다면 검증을 실시
        // 검증이 성공이 된다면 accessToken만 새로 발급하고 refreshToken은 그대로 가져옴
        // 이 때, 기존에 있는 값을 지우고 새로 생성하는 이유는 Token에 여러 계정이 들어가기 때문에
        // 계정이 의도치않게 삭제되거나 로그아웃 되었을 때 가장 마지막에 로그인한 사용자의 정보가
        // 자동으로 로그인 되도록 설정하기 위해서 기존에 Token에 있는 값을 지우고 새로 생성
        // refreshToken은 그대로 가져오기에 만료기간은 갱신되지 않음
        jwt.verify(existReFreshToken.token_id, env.JWT_SECRET_KEY);

        await this.tokenRepository.deleteRefreshToken(user.user_id);
        await this.tokenRepository.createRefreshToken(existReFreshToken.token_id, user.user_id);

        const accessToken = jwt.sign({ user_id: user.user_id }, env.JWT_SECRET_KEY, {
          expiresIn: "1h",
        });

        res.clearCookie("accessToken");
        res.cookie("accessToken", `Bearer ${accessToken}`);
        return user.name;
      } catch (error) {
        // refreshToken이 만료되었을 경우
        // 두 토큰을 전부 생성
        if (error.name === "TokenExpiredError") {
          const refreshToken = jwt.sign({}, env.JWT_SECRET_KEY, { expiresIn: "14d" });
          const accessToken = jwt.sign({ user_id: user.user_id }, env.JWT_SECRET_KEY, {
            expiresIn: "1h",
          });

          await this.tokenRepository.deleteRefreshToken(user.user_id);
          await this.tokenRepository.createRefreshToken(refreshToken, user.user_id);

          res.clearCookie("accessToken");
          res.cookie("accessToken", `Bearer ${accessToken}`);
          return user.name;
        }
      }
    } catch (error) {
      console.error(error);
      return { code: 500, errorMessage: "로그인에 실패하였습니다." };
    }
  };

  logout = async (res) => {
    try {
      const { user_id } = res.locals.user;
      const user = await this.userRepository.existUser(user_id);

      await this.tokenRepository.deleteRefreshToken(user.user_id);
      res.clearCookie("accessToken");

      return user.name;
    } catch (error) {
      console.error(error);
      return { code: 500, errorMessage: "로그아웃에 실패하였습니다" };
    }
  };

  switchId = async (user_id, res) => {
    try {
      const existUser = await this.userRepository.existUser(user_id);
      if (!existUser)
        return {
          code: 404,
          errorMessage: "회원가입이 되어 있지 않은 아이디입니다. 회원가입 해주세요.",
        };

      // 해당 유저의 refreshToken을 가져와 검증함
      // 검증에 성공하면 해당 유저를 로그인 상태로 바꾸고 refreshToken을 삭제하고 재생성해서 제일 상단에 위치하게 함
      const existReFreshToken = await this.tokenRepository.findRefreshToken(user_id);
      if (!existReFreshToken)
        return { code: 404, errorMessage: "로그인이 되어 있지 않은 아이디입니다." };
      jwt.verify(existReFreshToken.token_id, env.JWT_SECRET_KEY);

      await this.tokenRepository.deleteRefreshToken(user_id);
      await this.tokenRepository.createRefreshToken(existReFreshToken.token_id, user_id);

      res.clearCookie("accessToken");
      const accessToken = jwt.sign({ user_id }, env.JWT_SECRET_KEY, { expiresIn: "1h" });
      res.cookie("accessToken", `Bearer ${accessToken}`);

      return existUser.name;
    } catch (error) {
      // 토큰이 검증 실패했으면 만료된 아이디라는 오류 반환
      if (error.name === "TokenExpiredError") {
        console.log(error);

        res.clearCookie("accessToken");
        await this.tokenRepository.deleteRefreshToken(user_id);

        return { code: 401, errorMessage: "토큰이 만료된 아이디입니다. 다시 로그인 해주세요." };
      }
      // 토큰이 존재하지 않았을 경우에 여기로 들어가서 로그인 먼저 해달라는 오류 반환
      console.error(error);
      return { code: 500, errorMessage: "계정 전환에 실패했습니다. " };
    }
  };
}

module.exports = UserService;