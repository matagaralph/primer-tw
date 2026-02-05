import prisma from '@/libs/prisma';
import { validate } from '@/libs/validate';
import authMiddleware from '@/middleware/auth';
import { Hono } from 'hono';
import * as z from 'zod';
import QRCode from 'qrcode';

const vouchers = new Hono();

const calculateVoucherSchema = z.object({
  campaign_id: z
    .string({ error: 'Campaign ID is required.' })
    .min(1, 'Campaign ID cannot be empty.'),
  spend_amount: z
    .number({ error: 'Spend amount is required and must be a number.' })
    .positive('Spend amount must be greater than 0.'),
});

function generateVoucherCode(length = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

vouchers.post(
  '/calculate',
  authMiddleware(['owner', 'issuer']),
  validate(calculateVoucherSchema),
  async (c) => {
    const { campaign_id, spend_amount } = c.req.valid('json');

    const campaign = await prisma.campaign.findUnique({
      where: { id: parseInt(campaign_id) },
    });

    if (!campaign) {
      return c.json({ statusCode: 404, message: 'Campaign not found.' }, 404);
    }

    const now = new Date();
    if (now < campaign.startDate || now > campaign.endDate) {
      return c.json(
        { statusCode: 400, message: 'Campaign is not active.' },
        400,
      );
    }

    const spendPerPoint = Number(campaign.spendPerPoint);
    const calculatedPoints = Math.floor(spend_amount / spendPerPoint);

    if (calculatedPoints < campaign.minPoints) {
      return c.json(
        {
          statusCode: 400,
          message: `Minimum spend required for ${campaign.minPoints} point(s) is ${campaign.minPoints * spendPerPoint}.`,
        },
        400,
      );
    }

    let code: string;
    let isUnique = false;
    do {
      code = generateVoucherCode();
      const existing = await prisma.voucher.findUnique({ where: { code } });
      isUnique = !existing;
    } while (!isUnique);

    // Create voucher record
    const voucher = await prisma.voucher.create({
      data: {
        campaignId: campaign.id,
        code,
        pointsValue: calculatedPoints,
        status: 'ACTIVE',
      },
    });

    const whatsappLink = `https://wa.me/${Bun.env.WHATSAPP_BOT_NUMBER}?text=${code}`;

    const qrCodeDataUrl = await QRCode.toDataURL(whatsappLink, {
      width: 300,
      margin: 2,
    });

    return c.json(
      {
        voucher: {
          id: voucher.id,
          code: voucher.code,
          points: voucher.pointsValue,
          status: voucher.status,
        },
        campaign: {
          id: campaign.id,
          title: campaign.title,
        },
        qr_code: qrCodeDataUrl,
        whatsapp_link: whatsappLink,
      },
      201,
    );
  },
);

export default vouchers;
