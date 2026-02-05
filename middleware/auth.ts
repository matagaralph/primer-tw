import { getSignedCookie } from 'hono/cookie';
import type { Context, Next } from 'hono';

const authMiddleware = (requiredRoles: string | string[]) => {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

  return async (c: Context, next: Next) => {
    const cookieValue = await getSignedCookie(
      c,
      process.env.AUTH_SECRET!,
      'royals_session',
    );

    if (!cookieValue) {
      return c.json({ message: 'Unauthenticated.' }, 401);
    }

    const user = JSON.parse(cookieValue);

    if (!roles.includes(user.role.toLowerCase())) {
      return c.json({ message: 'Unauthorised' }, 403);
    }

    c.set('user', user);

    await next();
  };
};

export default authMiddleware;
