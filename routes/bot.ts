import prisma from '@/libs/prisma';
import { validate } from '@/libs/validate';
import { Hono } from 'hono';
import * as z from 'zod';
import QRCode from 'qrcode';

const bot = new Hono();

const registerShopperSchema = z.object({
  name: z
    .string({ error: 'Name is required.' })
    .min(1, 'Name cannot be empty.'),
  phone: z
    .string({ error: 'Phone number is required.' })
    .min(10, 'Phone number must be at least 10 characters.'),
});

const claimVoucherSchema = z.object({
  code: z
    .string({ error: 'Voucher code is required.' })
    .min(1, 'Voucher code cannot be empty.'),
  phone: z
    .string({ error: 'Phone number is required.' })
    .min(10, 'Phone number must be at least 10 characters.'),
});

const generateRewardSchema = z.object({
  reward_id: z
    .string({ error: 'Reward ID is required.' })
    .min(1, 'Reward ID cannot be empty.'),
  phone: z
    .string({ error: 'Phone number is required.' })
    .min(10, 'Phone number must be at least 10 characters.'),
});

function generateClaimCode(length = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

bot.post('/shoppers/register', validate(registerShopperSchema), async (c) => {
  const { phone, name } = c.req.valid('json');

  const existingShopper = await prisma.shopper.findUnique({
    where: { phoneNumber: phone },
  });

  if (existingShopper) {
    return c.json(
      { statusCode: 400, message: 'Phone number is already registered.' },
      400,
    );
  }

  await prisma.shopper.create({
    data: {
      phoneNumber: phone,
      name,
    },
  });

  return c.body(null, 204);
});

bot.get('/shoppers/balance', async (c) => {
  const phone = c.req.query('phone');

  if (!phone) {
    return c.json(
      { statusCode: 400, message: 'Phone number is required.' },
      400,
    );
  }

  const shopper = await prisma.shopper.findUnique({
    where: { phoneNumber: phone },
  });

  if (!shopper) {
    return c.json({ statusCode: 404, message: 'Shopper not found.' }, 404);
  }

  return c.json({
    phone_number: shopper.phoneNumber,
    points: shopper.points,
  });
});

bot.post('/vouchers/claim', validate(claimVoucherSchema), async (c) => {
  const { code, phone } = c.req.valid('json');

  const shopper = await prisma.shopper.findUnique({
    where: { phoneNumber: phone },
  });

  if (!shopper) {
    return c.json({ statusCode: 404, message: 'Shopper not found.' }, 404);
  }

  const voucher = await prisma.voucher.findUnique({
    where: { code },
    include: { campaign: true },
  });

  if (!voucher) {
    return c.json({ statusCode: 404, message: 'Voucher not found.' }, 404);
  }

  if (voucher.status !== 'ACTIVE') {
    return c.json(
      { statusCode: 400, message: 'This voucher has already been used.' },
      400,
    );
  }

  // Link voucher to shopper, update status, and add points in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const updatedVoucher = await tx.voucher.update({
      where: { id: voucher.id },
      data: {
        shopperId: shopper.id,
        status: 'USED',
      },
    });

    const updatedShopper = await tx.shopper.update({
      where: { id: shopper.id },
      data: {
        points: { increment: voucher.pointsValue },
      },
    });

    return { voucher: updatedVoucher, shopper: updatedShopper };
  });

  return c.json({
    message: `Successfully claimed ${voucher.pointsValue} points!`,
    points_earned: voucher.pointsValue,
    total_points: result.shopper.points,
    campaign: voucher.campaign.title,
  });
});

// Check available rewards based on shopper's current points
bot.get('/rewards/available', async (c) => {
  const phone = c.req.query('phone');

  if (!phone) {
    return c.json(
      { statusCode: 400, message: 'Phone number is required.' },
      400,
    );
  }

  const shopper = await prisma.shopper.findUnique({
    where: { phoneNumber: phone },
  });

  if (!shopper) {
    return c.json({ statusCode: 404, message: 'Shopper not found.' }, 404);
  }

  // Find all rewards the shopper can afford
  const availableRewards = await prisma.reward.findMany({
    where: {
      requiredPoints: { lte: shopper.points },
      campaign: {
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
    },
    include: { campaign: true },
    orderBy: { requiredPoints: 'asc' },
  });

  return c.json({
    current_points: shopper.points,
    rewards: availableRewards.map((reward) => ({
      id: reward.id,
      title: reward.title,
      required_points: reward.requiredPoints,
      campaign: {
        id: reward.campaign.id,
        title: reward.campaign.title,
      },
    })),
  });
});

// Generate a claim voucher for a specific reward
bot.post('/rewards/generate', validate(generateRewardSchema), async (c) => {
  const { reward_id, phone } = c.req.valid('json');

  const shopper = await prisma.shopper.findUnique({
    where: { phoneNumber: phone },
  });

  if (!shopper) {
    return c.json({ statusCode: 404, message: 'Shopper not found.' }, 404);
  }

  const reward = await prisma.reward.findUnique({
    where: { id: parseInt(reward_id) },
    include: { campaign: true },
  });

  if (!reward) {
    return c.json({ statusCode: 404, message: 'Reward not found.' }, 404);
  }

  if (shopper.points < reward.requiredPoints) {
    return c.json(
      {
        statusCode: 400,
        message: `Insufficient points. You have ${shopper.points} points but need ${reward.requiredPoints}.`,
        current_points: shopper.points,
        required_points: reward.requiredPoints,
      },
      400,
    );
  }

  // Generate unique claim code
  let code: string;
  let isUnique = false;
  do {
    code = generateClaimCode();
    const existing = await prisma.claim.findUnique({ where: { code } });
    isUnique = !existing;
  } while (!isUnique);

  // Create claim and deduct points in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const claim = await tx.claim.create({
      data: {
        rewardId: reward.id,
        shopperId: shopper.id,
        code,
        status: 'PENDING',
      },
    });

    const updatedShopper = await tx.shopper.update({
      where: { id: shopper.id },
      data: {
        points: { decrement: reward.requiredPoints },
      },
    });

    return { claim, shopper: updatedShopper };
  });

  const qrCodeDataUrl = await QRCode.toDataURL(code, {
    width: 300,
    margin: 2,
    color: {
      dark: '#D946EF',
      light: '#FFFFFF',
    },
  });

  return c.json({
    reward_title: reward.title,
    claim_code: result.claim.code,
    claim_id: result.claim.id,
    remaining_points: result.shopper.points,
    qr_code: qrCodeDataUrl,
  });
});

export default bot;
