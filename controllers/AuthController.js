class AuthController {
  constructor({ authService }) {
    this._authService = authService;
    this._bindMethods(['signup', 'login']);
  }

  async signup(request, response, next) {
    try {
      const user = await this._authService.signup(request.body);
      return response.status(201).json(user);
    } catch (err) {
      next(err);
    }
  }

  async login(request, response, next) {
    try {
      const result = await this._authService.login(request.body);
      return response.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  _bindMethods(methodNames) {
    methodNames.forEach((methodName) => {
      this[methodName] = this[methodName].bind(this);
    });
  }
}

module.exports = AuthController;
