import jwt, { Secret, SignOptions } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '30d';

export function sign(payload: any) {
  const secret: Secret = JWT_SECRET as Secret;
  const options: SignOptions = { expiresIn: JWT_EXPIRES as SignOptions['expiresIn'] };
  return jwt.sign(payload, secret, options);
}

export function verify(token: string) {
  const secret: Secret = JWT_SECRET as Secret;
  return jwt.verify(token, secret);
}
