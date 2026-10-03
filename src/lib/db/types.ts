// supabase/migrations/0001_init.sql 과 같은 구조. 한쪽을 바꾸면 다른 쪽도 바꾼다.

export type Role = "customer" | "admin";

export interface Profile {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: Role;
  company_name: string;
  business_number: string;
  created_at: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface LabeledValue {
  label: string;
  value: string;
}

export interface ImageRef {
  url: string | null; // null 이면 placeholder
  alt: string;
}

export interface Product {
  id: string;
  slug: string;
  name_en: string;
  name_ko: string;
  category_slugs: string[];
  is_visible: boolean;
  sort_order: number;
  images: ImageRef[];
  specs: LabeledValue[];
  spec_note: string;
  towel_size: string;
  detail_html: string;
  detail_images: ImageRef[];
  notice_html: string;
  guide_html: string;
  shipping_info: LabeledValue[];
  base_price: number;
  vat_included: boolean;
  allow_editor: boolean;
  allow_upload: boolean;
  label_width_mm: number;
  label_height_mm: number;
  label_bleed_mm: number;
  label_safe_mm: number;
  label_corner_mm: number;
  label_pages: number;
  allow_pages: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductColor {
  id: string;
  product_id: string;
  name: string;
  swatch: string;
  images: ImageRef[];
  mockup_url: string | null;
  label_x: number;
  label_y: number;
  label_w: number;
  label_rotate: number;
  sort_order: number;
}

export interface ProductPriceTier {
  id: string;
  product_id: string;
  min_qty: number;
  unit_price: number;
}

export interface ProductFile {
  id: string;
  product_id: string;
  kind: "guide" | "template";
  name: string;
  url: string;
  created_at: string;
}

export interface Template {
  id: string;
  name: string;
  category: string;
  product_id: string | null;
  canvas_json: unknown;
  thumbnail_url: string | null;
  is_visible: boolean;
  sort_order: number;
  created_at: string;
}

export interface Sticker {
  id: string;
  name: string;
  category: string;
  url: string;
  sort_order: number;
  created_at: string;
}

export interface Design {
  id: string;
  user_id: string;
  product_id: string;
  color_id: string | null;
  name: string;
  canvas_json: unknown;
  thumbnail_url: string | null;
  print_png_url: string | null;
  print_pdf_url: string | null;
  print_cmyk_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DesignUpload {
  id: string;
  user_id: string;
  product_id: string;
  file_name: string;
  file_size: number;
  storage_path: string;
  agreed_at: string;
  created_at: string;
}

export interface Wishlist {
  user_id: string;
  product_id: string;
  created_at: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  color_id: string | null;
  design_id: string | null;
  upload_id: string | null;
  quantity: number;
  created_at: string;
}

export type OrderStatus = "pending" | "paid" | "producing" | "shipping" | "done" | "cancelled";

export interface Order {
  id: string;
  order_no: string;
  user_id: string;
  status: OrderStatus;
  supply_amount: number;
  vat_amount: number;
  total_amount: number;
  shipping_fee: number;
  recipient: Record<string, string>;
  tax_invoice: Record<string, string | boolean> | null;
  payment: Record<string, unknown> | null;
  tracking_no: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  color_name: string | null;
  design_id: string | null;
  upload_id: string | null;
  quantity: number;
  unit_price: number;
  line_amount: number;
}

export interface QuoteRequest {
  id: string;
  user_id: string | null;
  company: string;
  name: string;
  phone: string;
  email: string;
  product: string;
  quantity: string;
  due_date: string;
  message: string;
  attachments: { name: string; path: string; size: number }[];
  status: "new" | "in_progress" | "done";
  admin_memo: string;
  created_at: string;
}

export interface Notice {
  id: string;
  title: string;
  body_html: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface AiGeneration {
  id: string;
  user_id: string;
  prompt: string;
  style: string;
  provider: string;
  result_paths: string[];
  success: boolean;
  error: string | null;
  cost_estimate: number;
  kst_date: string;
  created_at: string;
}

export interface KeyValue {
  key: string;
  value: unknown;
  updated_at: string;
}

export interface Tables {
  profiles: Profile;
  categories: Category;
  products: Product;
  product_colors: ProductColor;
  product_price_tiers: ProductPriceTier;
  product_files: ProductFile;
  templates: Template;
  stickers: Sticker;
  designs: Design;
  design_uploads: DesignUpload;
  wishlists: Wishlist;
  cart_items: CartItem;
  orders: Order;
  order_items: OrderItem;
  quote_requests: QuoteRequest;
  notices: Notice;
  ai_generations: AiGeneration;
  site_settings: KeyValue;
  site_contents: KeyValue;
}

export type TableName = keyof Tables;
