const UserService = require("../services/users.service.js");

class UsersController {
  userService = new UserService();

  //회원가입
  signup = async (req, res) => {
    const { email, name, password, confirmPassword } = req.body;
    const emailReg = new RegExp(/^\w+([\.-]?\w+)*@\w+([\.-]?\w)*(\.\w{2,3})+$/);

    if (!email || !name || !password || !confirmPassword)
      return res.status(400).json({
        errorMessage: "이메일, 이름, 비밀번호, 비밀번호 확인을 전부 입력해주세요.",
      });

    if (!emailReg.test(email))
      return res.status(400).json({
        errorMessage: "이메일 형식이 올바르지 않습니다. 다시 입력해 주세요.",
      });

    const emailName = email.split("@")[0];
    if (password.length < 4 || emailName.includes(password))
      return res.status(400).json({
        errorMessage: "패스워드는 4자리이상이고 이메일과 같은 값이 포함이 되면 안됩니다.",
      });

    if (password !== confirmPassword)
      return res.status(412).json({ errorMessage: "패스워드와 패스워드확인이 다릅니다." });

    const result = await this.userService.signup(email, name, password);

    if (result.errorMessage) res.status(result.code).json({ errorMessage: result.errorMessage });
    else res.status(201).json({ message: "회원 가입에 성공하였습니다." });
  };

  //로그인
  login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ errorMessage: "이메일 또는 패스워드를 입력해주세요." });

    const result = await this.userService.login(email, password, res);

    if (result.errorMessage) res.status(result.code).json({ errorMessage: result.errorMessage });
    else res.status(200).json({ message: `${result}님 환영합니다.` });
  };

  //로그아웃
  logout = async (_, res) => {
    const result = await this.userService.logout(res);

    if (result.errorMessage) res.status(result.code).json({ errorMessage: result.errorMessage });
    else res.status(200).json({ message: `${result}님이 로그아웃 되었습니다.` });
  };

  //사용자 계정 전환
  switchId = async (req, res) => {
    const { user_id } = req.params;

    const result = await this.userService.switchId(user_id, res);

    if (result.errorMessage) res.status(result.code).json({ errorMessage: result.errorMessage });
    else res.status(200).json({ message: `${result}님의 계정으로 전환되었습니다.` });
  };
}

module.exports = UsersController;
