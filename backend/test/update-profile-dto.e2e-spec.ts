import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateProfileDto } from '../src/auth/dto/update-profile.dto';

describe('PATCH /auth/me validation', () => {
  async function errorsFor(body: Record<string, unknown>): Promise<string[]> {
    const errors = await validate(plainToInstance(UpdateProfileDto, body), { whitelist: true, forbidNonWhitelisted: true });
    return errors.map(error => error.property);
  }

  it.each([
    { businessName: 'شركة المثال' },
    { businessNameEn: 'Example Trading Co' },
    { businessNameEn: null },
    { reviewAmountThreshold: '5000.50' },
    { reviewAmountThreshold: 5000 },
    { reviewAmountThreshold: '0' },
    { reviewAmountThreshold: null },
    { businessName: 'Example Co', businessNameEn: 'Example Co', reviewAmountThreshold: '1' },
  ])('accepts %p', async body => {
    await expect(errorsFor(body)).resolves.toEqual([]);
  });

  it.each([
    [{ businessName: null }, 'businessName'],
    [{ businessName: '' }, 'businessName'],
    [{ businessName: 'ab' }, 'businessName'],
    [{ businessName: ' Example Co' }, 'businessName'],
    [{ businessName: 12345 }, 'businessName'],
    [{ businessNameEn: 'ab' }, 'businessNameEn'],
    [{ businessNameEn: 'Example Co ' }, 'businessNameEn'],
    [{ reviewAmountThreshold: '-1' }, 'reviewAmountThreshold'],
    [{ reviewAmountThreshold: '1.001' }, 'reviewAmountThreshold'],
    [{ reviewAmountThreshold: '10000000000' }, 'reviewAmountThreshold'],
    [{ reviewAmountThreshold: 'abc' }, 'reviewAmountThreshold'],
    [{ firstName: 'Changed' }, 'firstName'],
    [{ phone: '+966500000001' }, 'phone'],
    [{ isDemo: false }, 'isDemo'],
  ])('rejects %p', async (body, property) => {
    await expect(errorsFor(body)).resolves.toContain(property);
  });
});
