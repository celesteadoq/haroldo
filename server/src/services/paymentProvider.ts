import crypto from 'node:crypto';

export interface ChargeRequest {
  amount: number;
  cardNumber: string;
  cardHolderName: string;
  expiryMonth: number;
  expiryYear: number;
  cvv: string;
}

export interface ChargeResult {
  approved: boolean;
  cardBrand: string;
  cardLast4: string;
  transactionReference: string;
  failureReason?: string;
}

export interface PaymentProvider {
  processCardPayment(request: ChargeRequest): Promise<ChargeResult>;
}

function detectCardBrand(digits: string): string {
  if (digits.startsWith('4')) return 'VISA';
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return 'Mastercard';
  if (
    /^(4011|4312|4389|4514|4576|5041|5066|5090|6277|6362|6363|650|6516|6550)/.test(digits)
  ) {
    return 'Elo';
  }
  return 'Cartão';
}

export class SimulatedPaymentProvider implements PaymentProvider {
  async processCardPayment(request: ChargeRequest): Promise<ChargeResult> {
    const digits = request.cardNumber.replace(/\D/g, '');
    const last4 = digits.slice(-4);
    const brand = detectCardBrand(digits);
    const txRef = `SIM-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const normalizedYear = request.expiryYear < 100 ? 2000 + request.expiryYear : request.expiryYear;

    if (digits.length < 13 || digits.length > 19) {
      return {
        approved: false,
        cardBrand: brand,
        cardLast4: last4 || '0000',
        transactionReference: txRef,
        failureReason: 'Número de cartão inválido.',
      };
    }

    if (
      normalizedYear < currentYear ||
      (normalizedYear === currentYear && request.expiryMonth < currentMonth)
    ) {
      return {
        approved: false,
        cardBrand: brand,
        cardLast4: last4,
        transactionReference: txRef,
        failureReason: 'Cartão expirado.',
      };
    }

    if (last4 === '0002') {
      return {
        approved: false,
        cardBrand: brand,
        cardLast4: last4,
        transactionReference: txRef,
        failureReason: 'Cartão recusado na simulação de pagamento (final 0002).',
      };
    }

    return {
      approved: true,
      cardBrand: brand,
      cardLast4: last4,
      transactionReference: txRef,
    };
  }
}

export const paymentProvider: PaymentProvider = new SimulatedPaymentProvider();
