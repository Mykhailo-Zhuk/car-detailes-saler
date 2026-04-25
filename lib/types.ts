export interface Car {
  id: string;
  vin: string;
  brand: string;
  model: string;
  year: number;
  engine: string;
  created_at: string;
}

export interface Part {
  id: string;
  code: string;
  name: string;
  description: string;
  category_id: string;
  price: number;
  stock: number;
  delivery_days: number;
  image_url: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  description: string;
}

export interface Analog {
  id: string;
  part_id: string;
  analog_part_id: string;
  type: string;
  note: string;
}

export interface Schema {
  id: string;
  part_id: string;
  title: string;
  image_url: string;
  created_at: string;
}

export interface Order {
  id: string;
  items: OrderItem[];
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  status: "new" | "processing" | "completed" | "cancelled";
  total: number;
  created_at: string;
}

export interface OrderItem {
  part_id: string;
  part_name: string;
  part_code: string;
  quantity: number;
  price: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string | ChatContent;
  timestamp: Date;
}

export interface ChatContent {
  type: "text" | "part_list" | "part_card" | "comparison" | "schema";
  data: any;
}

export interface CartItem {
  part: Part;
  quantity: number;
}
