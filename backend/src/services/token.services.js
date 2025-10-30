import jwt from 'jsonwebtoken';

const jwtAccess = process.env.JWT_SECRET || '';
const jwtAccessExpire = process.env.JWT_EXPIRE || '15m';
const jwtRefresh = process.env.JWT_REFRESH_SECRET || '';
const jwtRefreshExpire = process.env.JWT_REFRESH_EXPIRE || '7d';

export const generateAccessToken = (user) => {
    return jwt.sign(
        { id: user._id.toString(), role: user.role },
        jwtAccess,
        { expiresIn: jwtAccessExpire }
    );
};

export const generateRefreshToken = (user) => {
    return jwt.sign(
        { id: user._id.toString() },
        jwtRefresh,
        { expiresIn: jwtRefreshExpire }
    );
};
