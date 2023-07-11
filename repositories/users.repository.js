const { User } = require("../models");

class UserRepository {
  //이미 가입된 유저인지 조회
  existUserMail = async (email) => {
    const user = await User.findOne({ where: { email } });
    return user;
  };
  //특정 유저의 정보 조회
  existUser = async (user_id) => {
    const user = await User.findOne({ where: { user_id } });
    return user;
  };
  //회원가입
  signup = async (email, name, password) => {
    await User.create({ email, name, password });
    return;
  };
}

module.exports = UserRepository;
