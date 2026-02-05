import prisma from '@/libs/prisma';
import { validate } from '@/libs/validate';
import authMiddleware from '@/middleware/auth';
import { Hono } from 'hono';
import * as z from 'zod';
import { required } from 'zod/mini';

const claims = new Hono();

const verifyClaimSchema = z.object({
  code: z
    .string({ error: 'Code is required.' })
    .min(1, 'Code cannot be empty.'),
});

const issueClaimSchema = z.object({
  code: z
    .string({ error: 'Code is required.' })
    .min(1, 'Code cannot be empty.'),
});

// Verify a claim by code - Owner scans/types Shopper's pink QR code
claims.post(
  '/verify',
  authMiddleware(['owner', 'issuer']),
  validate(verifyClaimSchema),
  async (c) => {
    const { code } = c.req.valid('json');

    const claim = await prisma.claim.findUnique({
      where: { code },
      include: {
        reward: {
          include: {
            campaign: true,
          },
        },
        shopper: true,
      },
    });

    if (!claim) {
      return c.json({ statusCode: 404, message: 'Claim not found.' }, 404);
    }

    if (claim.status === 'ISSUED') {
      return c.json(
        {
          statusCode: 400,
          message: 'This claim has already been issued.',
          issued_at: claim.issuedAt,
        },
        400,
      );
    }

    return c.json({
      id: claim.id,
      code: claim.code,
      status: claim.status,
      reward_id: claim.reward.id,
      reward_title: claim.reward.title,
      required_points: claim.reward.requiredPoints,
      campaign_id: claim.reward.campaign.id,
      shopper: claim.shopper.phoneNumber,
      created_at: claim.createdAt,
    });
  },
);

// Issue a claim - Sets status to "ISSUED", records timestamp
claims.post(
  '/issue',
  authMiddleware(['owner', 'issuer']),
  validate(issueClaimSchema),
  async (c) => {
    const { code } = c.req.valid('json');

    const claim = await prisma.claim.findUnique({
      where: { code },
      include: {
        reward: {
          include: {
            campaign: true,
          },
        },
        shopper: true,
      },
    });

    if (!claim) {
      return c.json({ statusCode: 404, message: 'Claim not found.' }, 404);
    }

    if (claim.status === 'ISSUED') {
      return c.json(
        {
          statusCode: 400,
          message: 'This claim has already been issued.',
          issued_at: claim.issuedAt,
        },
        400,
      );
    }

    const updatedClaim = await prisma.claim.update({
      where: { id: claim.id },
      data: {
        status: 'ISSUED',
        issuedAt: new Date(),
      },
      include: {
        reward: {
          include: {
            campaign: true,
          },
        },
        shopper: true,
      },
    });

    return c.json({
      id: updatedClaim.id,
      code: updatedClaim.code,
      status: updatedClaim.status,
      issued_at: updatedClaim.issuedAt,
      reward_title: updatedClaim.reward.title,
      campaign: updatedClaim.reward.campaign.title,
      shopper_name: updatedClaim.shopper.name,
      shopper_phone_number: updatedClaim.shopper.phoneNumber,
    });
  },
);

export default claims;
