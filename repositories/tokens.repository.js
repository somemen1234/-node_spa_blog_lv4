const { Token } = require("../models");

class TokenRepository {
  //해당 유저가 로그인 중인지 확인
  findRefreshToken = async (user_id) => {
    const token = await Token.findOne({ where: { user_id } });
    return token;
  };
  //refresh token 생성
  createRefreshToken = async (token_id, user_id) => {
    await Token.create({ token_id, user_id });
    return;
  };
  //refresh token 삭제
  deleteRefreshToken = async (user_id) => {
    await Token.destroy({ where: { user_id } });
    return;
  };
}

module.exports = TokenRepository;
