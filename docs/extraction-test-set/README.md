# Extraction test set: answer sheet

The answer key for measuring AI extraction (decision B9, Phase 1 task 2). Each row is one invoice file and the values a perfect extraction would produce. The model comparison script (task 11) reads this sheet and scores every field.

| File | Use |
|---|---|
| `answers-template.csv` | Empty sheet (header only): copy it and fill it in |
| `answers-example.csv` | Three made-up rows showing the format |

**Keep the real invoices and the filled sheet out of git.** They contain business data even after anonymising. Store them privately (e.g. a shared drive folder `invoi-test-set/` holding `answers.csv` and the files). This folder's `.gitignore` blocks anything except the files above.

## What to collect

30–50 invoices, with sensitive data removed or blurred. Aim for a mix:

- Arabic, English and bilingual invoices
- Clear PDFs, phone photos and poor scans
- With and without the ZATCA QR code
- Some with Arabic-Indic digits (١٢٣), some zero-rated (VAT 0), a few in other currencies
- At least one with a Hijri-only date, and one file holding more than one invoice

## Columns

The first six columns describe the file, so results can be split by kind of invoice. The next twelve are the fields extraction must find.

| Column | What to write |
|---|---|
| `file` | File name exactly as stored next to the sheet, e.g. `INV-017.pdf` |
| `language` | `ar`, `en` or `mixed` |
| `source` | `pdf` (digital), `scan` or `photo` |
| `quality` | `good` or `poor` |
| `hasQr` | `yes` if a ZATCA QR code is printed, else `no` |
| `arabicDigits` | `yes` if numbers are printed in Arabic-Indic digits |
| `vendorName` | Seller name as printed |
| `invoiceNumber` | As printed, including letters and dashes |
| `invoiceDate` | `YYYY-MM-DD` (Gregorian) |
| `dueDate` | `YYYY-MM-DD` |
| `totalAmount` | Total including VAT |
| `taxAmount` | VAT amount |
| `currency` | One of `SAR USD AED EUR GBP KWD QAR BHD OMR EGP JOD CNY INR` |
| `paymentStatus` | `paid`, `unpaid`, `partially_paid` or `overdue` |
| `paymentMethod` | `bank_transfer`, `credit_card`, `cash`, `cheque`, `online_payment` or `mixed` |
| `customerName` | Buyer name as printed (normally your business) |
| `taxNumber` | Vendor VAT number, digits only |
| `crNumber` | Vendor commercial registration number, digits only |
| `notes` | Anything unusual; not scored |

## Rules

- **Not printed → leave the cell empty.** Empty is the correct answer; extraction should return nothing there. This applies often to `dueDate`, `paymentStatus` and `paymentMethod` (decision F23: only when clearly printed).
- **Write values as they should be stored**, not as printed: ASCII digits (`123`, not `١٢٣`), a dot for decimals, no thousands separators or currency symbols, two decimals for amounts (`1150.00`).
- **Hijri-only dates:** leave the date empty and copy the printed date into `notes` (decision F20).
- **Names printed in two languages:** write both separated by ` | ` (space, bar, space). Either one counts as correct.
- **More than one invoice in a file:** fill in the first invoice only and say so in `notes` (decision F24).

## Editing the sheet

Excel turns long numbers into `3.00000E+14` and drops leading zeros, which corrupts `taxNumber`, `crNumber` and `invoiceNumber`. Either:

- use Google Sheets (File → Import, "Convert text to numbers, dates and formulas" **off**), or
- in Excel use Data → From Text/CSV, set those three columns to **Text** before loading.

Save as **CSV UTF-8** so Arabic stays readable.
