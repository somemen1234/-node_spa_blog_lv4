const UserService = require("../services/users.service.js");

class UsersController {
  userService = new UserService();

  signup = async (req, res, next) => {
    const { email, name, password, confirmPassword } = req.body;
    const result = await this.userService.signup(email, name, password, confirmPassword);

    if (result.errorMessage) res.status(result.code).json({ errorMessage: result.errorMessage });
    else res.status(201).json({ message: "회원 가입에 성공하였습니다." });
  };

  login = async (req, res, next) => {
    const { email, password } = req.body;
    const result = await this.userService.login(email, password, res);

    if (result.errorMessage) res.status(result.code).json({ errorMessage: result.errorMessage });
    else res.status(200).json({ message: `${result}님 환영합니다.` });
  };

  logout = async (_, res, next) => {
    const result = await this.userService.logout(res);

    if (result.errorMessage) res.status(result.code).json({ errorMessage: result.errorMessage });
    else res.status(200).json({ message: `${result}님이 로그아웃 되었습니다.` });
  };

  switchId = async (req, res, next) => {
    const { user_id } = req.params;

    const result = await this.userService.switchId(user_id, res);

    if (result.errorMessage) res.status(result.code).json({ errorMessage: result.errorMessage });
    else res.status(200).json({ message: `${result}님의 계정으로 전환되었습니다.` });
  };
}

module.exports = UsersController;
