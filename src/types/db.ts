// Hand-written row types mirroring supabase/migrations/0001_init.sql.
// Numeric columns arrive from PostgREST as JS numbers.

export type Category = { id: number; slug: string; name: string; image_url: string | null };

export type Product = {
  id: number;
  title: string;
  description: string;
  brand: string | null;
  category_id: number | null;
  price: number;
  list_price: number | null;
  rating: number;
  rating_count: number;
  stock: number;
  images: string[];
  thumbnail: string | null;
  is_prime: boolean;
  created_at: string;
};

export type CartItem = {
  user_id: string;
  product_id: number;
  qty: number;
  saved_for_later: boolean;
};

export type Address = {
  id: string;
  user_id: string;
  full_name: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string | null;
  is_default: boolean;
};

export type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled";

export type Order = {
  id: string;
  user_id: string;
  status: OrderStatus;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  address: Omit<Address, "id" | "user_id" | "is_default">;
  stripe_session_id: string | null;
  created_at: string;
};

export type OrderItem = {
  id: number;
  order_id: string;
  product_id: number | null;
  title: string;
  price: number;
  qty: number;
  thumbnail: string | null;
};

export type Review = {
  id: number;
  product_id: number;
  user_id: string;
  author_name: string;
  rating: number;
  title: string;
  body: string;
  created_at: string;
};

/** Fields ProductCard needs; a subset of Product. */
export type ProductSummary = Pick<
  Product,
  "id" | "title" | "price" | "list_price" | "rating" | "rating_count" | "thumbnail" | "is_prime"
>;
