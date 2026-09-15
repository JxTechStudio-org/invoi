BEGIN;

DO $$
DECLARE
    invalid_values TEXT;
BEGIN
    SELECT string_agg(quote_literal(value), ', ' ORDER BY value)
    INTO invalid_values
    FROM (
        SELECT DISTINCT "paymentStatus" AS value
        FROM "Invoice"
        WHERE "paymentStatus" IS NOT NULL
          AND lower(btrim("paymentStatus")) NOT IN ('paid', 'unpaid', 'partially_paid', 'overdue')
    ) unsupported;
    IF invalid_values IS NOT NULL THEN
        RAISE EXCEPTION 'Cannot migrate Invoice.paymentStatus; unsupported values: %', invalid_values;
    END IF;

    SELECT string_agg(quote_literal(value), ', ' ORDER BY value)
    INTO invalid_values
    FROM (
        SELECT DISTINCT "paymentMethod" AS value
        FROM "Invoice"
        WHERE "paymentMethod" IS NOT NULL
          AND lower(btrim("paymentMethod")) NOT IN (
              'bank transfer', 'bank_transfer', 'credit card', 'credit_card',
              'cash', 'cheque', 'online payment', 'online_payment', 'mixed'
          )
    ) unsupported;
    IF invalid_values IS NOT NULL THEN
        RAISE EXCEPTION 'Cannot migrate Invoice.paymentMethod; unsupported values: %', invalid_values;
    END IF;

    SELECT string_agg(quote_literal(value), ', ' ORDER BY value)
    INTO invalid_values
    FROM (
        SELECT DISTINCT "currency" AS value
        FROM "Invoice"
        WHERE "currency" IS NOT NULL
          AND upper(btrim("currency")) NOT IN ('SAR', 'USD', 'AED')
    ) unsupported;
    IF invalid_values IS NOT NULL THEN
        RAISE EXCEPTION 'Cannot migrate Invoice.currency; unsupported values: %', invalid_values;
    END IF;
END $$;

CREATE TYPE "PaymentStatus" AS ENUM ('paid', 'unpaid', 'partially_paid', 'overdue');
CREATE TYPE "PaymentMethod" AS ENUM (
    'bank_transfer',
    'credit_card',
    'cash',
    'cheque',
    'online_payment',
    'mixed'
);
CREATE TYPE "Currency" AS ENUM ('SAR', 'USD', 'AED');

ALTER TABLE "Invoice"
ADD COLUMN "amountPaid" DECIMAL(12,2);

ALTER TABLE "User"
ADD COLUMN "reviewAmountThreshold" DECIMAL(12,2);

ALTER TABLE "Invoice"
ALTER COLUMN "paymentStatus" TYPE "PaymentStatus"
USING (
    CASE
        WHEN "paymentStatus" IS NULL THEN NULL
        ELSE lower(btrim("paymentStatus"))
    END
)::"PaymentStatus";

ALTER TABLE "Invoice"
ALTER COLUMN "paymentMethod" TYPE "PaymentMethod"
USING (
    CASE lower(btrim("paymentMethod"))
        WHEN 'bank transfer' THEN 'bank_transfer'
        WHEN 'bank_transfer' THEN 'bank_transfer'
        WHEN 'credit card' THEN 'credit_card'
        WHEN 'credit_card' THEN 'credit_card'
        WHEN 'cash' THEN 'cash'
        WHEN 'cheque' THEN 'cheque'
        WHEN 'online payment' THEN 'online_payment'
        WHEN 'online_payment' THEN 'online_payment'
        WHEN 'mixed' THEN 'mixed'
        ELSE "paymentMethod"
    END
)::"PaymentMethod";

ALTER TABLE "Invoice"
ALTER COLUMN "currency" TYPE "Currency"
USING (
    CASE
        WHEN "currency" IS NULL THEN NULL
        ELSE upper(btrim("currency"))
    END
)::"Currency";

COMMIT;
