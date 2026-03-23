const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { JWT_KEY } = require('../env');
const {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
} = require('../errors/AppError');

class AuthService {
  constructor({ userTable }, knex) {
    this._knex = knex;
    this._userTable = userTable;
  }

  async signup({ email, password }) {
    if (!email || !password) {
      throw new BadRequestError('Email and password are required');
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await this._knex(this._userTable)
      .where({ email: normalizedEmail })
      .first();

    if (existingUser) {
      throw new ConflictError('Email already exists');
    }

    const password_hash = await bcrypt.hash(password, 10);

    const insertedUsers = await this._knex(this._userTable).insert(
      {
        email: normalizedEmail,
        password_hash,
        role: 'user',
      },
      ['id', 'email', 'role'],
    );

    return insertedUsers[0];
  }

  async login({ email, password }) {
    if (!email || !password) {
      throw new BadRequestError('Email and password are required');
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await this._knex(this._userTable)
      .where({ email: normalizedEmail })
      .first();

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_KEY,
      { expiresIn: '1d' },
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }
}

module.exports = AuthService;
