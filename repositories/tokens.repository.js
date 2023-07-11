const { Token } = require("../models");

class TokenRepository {
  findRefreshToken = async (user_id) => {
    const token = await Token.findOne({ where: { user_id } });
    return token;
  };
  createRefreshToken = async (token_id, user_id) => {
    await Token.create({ token_id, user_id });
    return;
  };
  deleteRefreshToken = async (user_id) => {
    await Token.destroy({ where: { user_id } });
    return;
  };
}

module.exports = TokenRepository;
