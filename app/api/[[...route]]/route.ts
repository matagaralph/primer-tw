import { Hono } from 'hono';
import { handle } from 'hono/vercel';

import authRoute from '@/routes/auth';
import campaignsRoute from '@/routes/campaigns';
import botRoute from '@/routes/bot';
import vouchersRoute from '@/routes/vouchers';
import claimsRoute from '@/routes/claims';

const app = new Hono().basePath('/api');

app.route('/auth', authRoute);
app.route('/campaigns', campaignsRoute);
app.route('/bot', botRoute);
app.route('/vouchers', vouchersRoute);
app.route('/claims', claimsRoute);

export const GET = handle(app);
export const POST = handle(app);
