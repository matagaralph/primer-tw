import { sValidator } from '@hono/standard-validator';
import type { ZodSchema } from 'zod';

export const validate = <T extends ZodSchema>(schema: T) =>
  sValidator('json', schema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          statusCode: 400,
          message: result.error[0]?.message,
        },
        400,
      );
    }
  });
