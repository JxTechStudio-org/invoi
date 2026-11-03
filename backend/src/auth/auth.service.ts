import { BadRequestException, Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { InvoiceStatus, Prisma } from '@prisma/client';
import { ExtractionAvailabilityService } from '../extraction/extraction-availability.service';
import { recheckReviewReasons } from '../invoices/invoice-review';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly extractionAvailability: ExtractionAvailabilityService,
  ) { }

  // NOTE: existingUser function allows seamless test account generation through the register endpoint
  // so we can test invoice upload without manually registering every time.
  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');

    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        username: dto.username,
        phone: dto.phone,
        email: dto.email,
        passwordHash: hashedPassword,
        businessName: dto.businessName,
      },
      select: {
        id: true,
        email: true,
        businessName: true,
        firstName: true,
        lastName: true,
        username: true,
        phone: true,
        createdAt: true,
      },
    });
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: profileFields });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.toProfile(user);
  }

  /**
   * Saves the account settings (F19). If a value the review rules read has changed, the
   * rules are re-run on the account's needs_review invoices in the same transaction: rule
   * reasons are added or removed, every other reason is kept, and the status stays
   * needs_review. Completed and processing invoices are left alone.
   */
  async updateMe(userId: string, dto: UpdateProfileDto) {
    const data: Prisma.UserUpdateInput = {};
    if (dto.businessName !== undefined) data.businessName = dto.businessName;
    if (dto.businessNameEn !== undefined) data.businessNameEn = dto.businessNameEn;
    if (dto.reviewAmountThreshold !== undefined) {
      data.reviewAmountThreshold = dto.reviewAmountThreshold === null ? null : new Prisma.Decimal(dto.reviewAmountThreshold);
    }
    if (!Object.keys(data).length) {
      throw new BadRequestException('At least one setting is required');
    }

    const { user, recheckedInvoices } = await this.prisma.$transaction(async tx => {
      const before = await tx.user.findUnique({ where: { id: userId }, select: reviewSettingFields });
      if (!before) throw new UnauthorizedException('User not found');
      const user = await tx.user.update({ where: { id: userId }, data, select: profileFields });

      const settingsChanged = before.businessName !== user.businessName
        || before.businessNameEn !== user.businessNameEn
        || !sameThreshold(before.reviewAmountThreshold, user.reviewAmountThreshold);
      if (!settingsChanged) return { user, recheckedInvoices: 0 };

      // Same row locks as a hand edit or a finishing extraction, so neither is overwritten.
      await tx.$queryRaw`
        SELECT 1 FROM "Invoice" WHERE "userId" = ${userId} AND "status" = 'needs_review'::"InvoiceStatus" FOR UPDATE`;
      const invoices = await tx.invoice.findMany({
        where: { userId, status: InvoiceStatus.needs_review },
        select: {
          id: true, status: true, extractionConfidence: true, customerName: true,
          totalAmount: true, taxAmount: true, needsReviewReason: true,
        },
      });

      // One update per resulting reason list instead of one per invoice.
      const idsByReasons = new Map<string | null, string[]>();
      let changed = 0;
      for (const invoice of invoices) {
        const reasons = recheckReviewReasons(invoice, user);
        if (reasons === invoice.needsReviewReason) continue;
        idsByReasons.set(reasons, [...(idsByReasons.get(reasons) ?? []), invoice.id]);
        changed++;
      }
      for (const [needsReviewReason, ids] of idsByReasons) {
        await tx.invoice.updateMany({ where: { id: { in: ids }, userId }, data: { needsReviewReason } });
      }
      // Invoices whose review reasons actually changed, not every invoice that was looked at.
      return { user, recheckedInvoices: changed };
    });

    return { ...await this.toProfile(user), recheckedInvoices };
  }

  private async toProfile(user: Prisma.UserGetPayload<{ select: typeof profileFields }>) {
    // Lets the frontend hide re-extract up front instead of failing on click.
    const { isDemo, ...profile } = user;
    const extractionUnavailableReason = await this.extractionAvailability.unavailableReason({ id: user.id, isDemo });
    return { ...profile, extractionAvailable: !extractionUnavailableReason, extractionUnavailableReason };
  }
}

const reviewSettingFields = { businessName: true, businessNameEn: true, reviewAmountThreshold: true } as const;

const profileFields = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  username: true,
  phone: true,
  isDemo: true,
  ...reviewSettingFields,
} as const;

function sameThreshold(a: Prisma.Decimal | null, b: Prisma.Decimal | null): boolean {
  return a === null || b === null ? a === b : a.equals(b);
}