import { Order, OrderResponse } from '@/constants/data';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

/**
 * API client functions for orders
 * These functions handle communication with the API routes
 */

export interface GetOrdersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  user_status?: string;
  vendor_id?: string;
  service_id?: string;
  hub_id?: string;
}

export interface CreateOrderParams {
  pickup_time_slot: {
    start: string;
    end: string;
  };
  pickup_address: {
    label: string;
    address_line: string;
  };
  subscription_snapshot: {
    plan_name: string;
    next_renewal_date?: string | Date;
  };
  pickup_date: string;
  service_id: {
    name: string;
    price?: number;
  };
  total_weight_kg?: string;
  heavy_items?: string;
  payment_status: string;
  status: string;
}

export interface UpdateOrderParams extends Partial<CreateOrderParams> {
  id: string;
}

/**
 * Get all orders with optional filters and pagination
 */

export async function getOrders(
  params: GetOrdersParams = {}
): Promise<OrderResponse> {
  const {
    page = 1,
    limit = 10,
    search = '',
    status = '',
    user_status = '',
    vendor_id = '',
    service_id = '',
    hub_id = ''
  } = params;

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
    ...(status && { status }),
    ...(user_status && { user_status }),
    ...(vendor_id && { vendor_id }),
    ...(service_id && { service_id }),
    ...(hub_id && { hub_id })
  });

  const response = await fetch(`${API_BASE_URL}/orders?${queryParams}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const err = await response.json();
      message = err?.message || message;
    } catch {}
    throw new Error(`Failed to fetch orders: ${message}`);
  }

  return response.json();
}

/**
 * Get a single order by ID
 */
export async function getOrderById(orderId: string): Promise<OrderResponse> {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch order: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Create a new order
 */
export async function createOrder(
  orderData: CreateOrderParams
): Promise<OrderResponse> {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(orderData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.message || `Failed to create order: ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * Update an existing order
 */
export async function updateOrder(
  orderData: UpdateOrderParams
): Promise<OrderResponse> {
  const { id, ...updateData } = orderData;

  const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updateData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.message || `Failed to update order: ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * Delete an order
 */
export async function deleteOrder(orderId: string): Promise<OrderResponse> {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.message || `Failed to delete order: ${response.statusText}`
    );
  }

  return response.json();
}
