import { PaymentResponse } from '@/constants/data';

export interface PaymentParams {
  page?: number;
  limit?: number;
  search?: string;
}

export async function getPayments(
  params: PaymentParams
): Promise<PaymentResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page.toString());
  if (params.limit) query.set('limit', params.limit.toString());
  if (params.search) query.set('search', params.search);

  try {
    const res = await fetch(`/api/payments?${query.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      throw new Error(`Error: ${res.status} ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error('Failed to fetch payments:', error);
    return {
      success: false,
      message: 'Failed to fetch payments',
      error: String(error)
    };
  }
}
