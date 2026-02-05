import prisma from '@/libs/prisma';
import { validate } from '@/libs/validate';
import authMiddleware from '@/middleware/auth';
import { Hono } from 'hono';
import * as z from 'zod';
import { some, every, except } from 'hono/combine';

const campaigns = new Hono();

const createCampaignSchema = z
  .object({
    company_id: z.number({
      error: 'Company ID is required and must be a number.',
    }),
    title: z
      .string({ error: 'Title is required.' })
      .min(1, 'Title cannot be empty.'),
    start_date: z.iso.datetime({
      error: 'Start date must be a valid ISO datetime.',
    }),
    end_date: z.iso.datetime({
      error: 'End date must be a valid ISO datetime.',
    }),
    min_points: z
      .number({ error: 'Minimum points must be a number.' })
      .int('Minimum points must be a whole number.')
      .min(1, 'Minimum points must be at least 1.')
      .optional(),
    spend_per_point: z.number({
      error: 'Spend per point is required and must be a number.',
    }),
    description: z.string().optional(),
  })
  .refine((data) => new Date(data.end_date) > new Date(data.start_date), {
    message: 'End date must be after start date.',
    path: ['end_date'],
  });

const createRewardSchema = z.object({
  title: z
    .string({ error: 'Title is required.' })
    .min(1, 'Title cannot be empty.'),
  required_points: z
    .number({ error: 'Required points must be a number.' })
    .int('Required points must be a whole number.')
    .min(1, 'Required points must be at least 1.'),
});

campaigns.get('/', authMiddleware('admin'), async (c) => {
  const allCampaigns = await prisma.campaign.findMany({
    include: { company: true },
    orderBy: { createdAt: 'desc' },
  });
  return c.json(allCampaigns);
});

campaigns.get('/company/:company_id', async (c) => {
  const companyId = Number(c.req.param('company_id'));

  if (isNaN(companyId)) {
    return c.json(
      { statusCode: 400, message: 'Missing company information.' },
      400,
    );
  }

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) {
    return c.json({ statusCode: 404, message: 'Company not found.' }, 404);
  }

  const companyCampaigns = await prisma.campaign.findMany({
    where: { companyId },
    include: { company: true },
    orderBy: { createdAt: 'desc' },
  });
  return c.json(companyCampaigns);
});

campaigns.post(
  '/',
  authMiddleware('owner'),
  validate(createCampaignSchema),
  async (c) => {
    const data = c.req.valid('json');

    const company = await prisma.company.findUnique({
      where: { id: data.company_id },
    });
    if (!company) {
      return c.json({ statusCode: 400, message: 'Company not found.' }, 400);
    }

    const campaign = await prisma.campaign.create({
      data: {
        companyId: data.company_id,
        title: data.title,
        startDate: new Date(data.start_date),
        endDate: new Date(data.end_date),
        minPoints: data.min_points ?? 1,
        spendPerPoint: data.spend_per_point,
        description: data.description,
      },
    });

    return c.json(campaign, 201);
  },
);

campaigns.post(
  '/:id/rewards',
  authMiddleware(['owner', 'issuer']),
  validate(createRewardSchema),
  async (c) => {
    const campaignId = c.req.param('id');

    const campaign = await prisma.campaign.findUnique({
      where: { id: parseInt(campaignId) },
    });

    if (!campaign) {
      return c.json({ statusCode: 404, message: 'Campaign not found.' }, 404);
    }

    const data = c.req.valid('json');

    const reward = await prisma.reward.create({
      data: {
        campaignId: campaign.id,
        title: data.title,
        requiredPoints: data.required_points,
      },
    });

    return c.json(reward, 201);
  },
);

export default campaigns;
