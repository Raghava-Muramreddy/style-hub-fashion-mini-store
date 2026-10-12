export type Product = {
  id: number;
  name: string;
  description: string;
  category: string;
  image_url: string;
  price: number;
  currency: string;
  stock_quantity: number;
  is_active: boolean;
};

export type User = {
  id: number;
  full_name: string;
  email: string;
  is_active: boolean;
};

export type CartItem = {
  id: number;
  product_id: number;
  quantity: number;
  product_name?: string;
  unit_price?: number;
  line_total?: number;
};

export type Cart = {
  id: number;
  items: CartItem[];
  subtotal: number;
  currency: string;
  item_count: number;
};

export type OrderItem = {
  id: number;
  product_id: number | null;
  product_name_snapshot: string;
  unit_price: number;
  quantity: number;
  line_total: number;
};

export type Order = {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  subtotal: number;
  total_amount: number;
  currency: string;
  stripe_payment_intent_id?: string | null;
  created_at?: string;
  paid_at?: string;
  items: OrderItem[];
};
