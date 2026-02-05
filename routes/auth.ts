import { Hono } from 'hono';
import * as z from 'zod';
import { compare, hash } from 'bcryptjs';
import { validate } from '@/libs/validate';
import prisma from '@/libs/prisma';
import { setSignedCookie, getSignedCookie, deleteCookie } from 'hono/cookie';

const auth = new Hono();

const loginSchema = z.object({
  email: z
    .string({ error: 'Email is required.' })
    .trim()
    .pipe(z.email({ error: 'Please provide a valid email address' })),
  password: z
    .string({ error: 'Password is required.' })
    .min(1, 'Password cannot be empty.'),
});

const registerSchema = z.object({
  name: z
    .string({ error: 'Name is required.' })
    .min(1, 'Name cannot be empty.'),
  email: z
    .string({ error: 'Email is required.' })
    .trim()
    .pipe(z.email({ error: 'Please provide a valid email address' })),
  password: z
    .string({ error: 'Password is required.' })
    .min(8, 'Password must be at least 8 characters.'),
  company_name: z
    .string({ error: 'Company name is required.' })
    .min(1, 'Company name cannot be empty.'),
});

auth.post('/register', validate(registerSchema), async (c) => {
  const { name, email, password, company_name } = c.req.valid('json');

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return c.json(
      { statusCode: 400, message: 'Email is already registered.' },
      400,
    );
  }

  const hashedPassword = await hash(password, 10);

  const result = await prisma.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: { name: company_name },
    });

    const user = await tx.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'OWNER',
        companyId: company.id,
      },
    });

    return { user, company };
  });

  return c.json(
    {
      name: result.user.name,
      email: result.user.email,
      company_id: result.company.id,
      role: result.user.role,
    },
    201,
  );
});

auth.post('/login', validate(loginSchema), async (c) => {
  const { email, password } = c.req.valid('json');

  const user = await prisma.user.findUnique({
    where: { email },
    include: { company: true },
  });

  if (!user) {
    return c.json(
      {
        statusCode: 401,
        message: 'These credentials do not match our records',
      },
      401,
    );
  }

  const isValidPassword = await compare(password, user.password);
  if (!isValidPassword) {
    return c.json(
      {
        statusCode: 401,
        message: 'These credentials do not match our records',
      },
      401,
    );
  }
  const userData = JSON.stringify({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  await setSignedCookie(
    c,
    'royals_session',
    userData,
    process.env.AUTH_SECRET!,
    {
      path: '/',
      secure: true,
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: 'Lax',
    },
  );

  return c.json({
    name: user.name,
    email: user.email,
    company_id: user.companyId,
    role: user.role,
  });
});

auth.post('/logout', (c) => {
  deleteCookie(c, 'royals_session', {
    path: '/',
    secure: true,
    httpOnly: true,
    sameSite: 'Strict',
  });
  return c.json({ message: 'Logged out successfully.' });
});

auth.get('/me', async (c) => {
  const cookieValue = await getSignedCookie(
    c,
    process.env.AUTH_SECRET!,
    'royals_session',
  );

  if (!cookieValue) {
    return c.json({ statusCode: 401, message: 'Unauthenticated.' }, 401);
  }

  const sessionUser = JSON.parse(cookieValue);

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    include: { company: true },
  });

  if (!user) {
    return c.json({ statusCode: 401, message: 'User not found.' }, 401);
  }

  return c.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    company: user.company
      ? {
          id: user.company.id,
          name: user.company.name,
          logo: user.company.logo,
        }
      : null,
    created_at: user.createdAt,
  });
});

export default auth;
