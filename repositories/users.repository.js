const { User } = require("../models");

class UserRepository {
  existUserMail = async (email) => {
    const user = await User.findOne({ where: { email } });
    return user;
  };
  existUser = async (user_id) => {
    const user = await User.findOne({ where: { user_id } });
    return user;
  };
  signup = async (email, name, password) => {
    await User.create({ email, name, password });
    return;
  };
}

module.exports = UserRepository;
