import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Tipos para as tabelas
export interface Category {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  barcode?: string
  sale_price: number
  cost_price?: number
  stock: number
  unit: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
  category_id: string
  category?: Category
}

export interface User {
  id: string
  email: string
  name?: string
  password: string
  role: string
  created_at: string
  updated_at: string
}

export interface Sale {
  id: string
  total: number
  discount: number
  final_total: number
  payment_method: string
  status: string
  notes?: string
  created_at: string
  updated_at: string
  user_id: string
}

export interface SaleItem {
  id: string
  quantity: number
  unit_price: number
  total: number
  created_at: string
  sale_id: string
  product_id: string
  product?: Product
}

export interface Client {
  id: string
  name: string
  email: string
  phone?: string
  document?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  amount: number
  method: string
  status: string
  transaction_id?: string
  pix_qr_code?: string
  pix_key?: string
  expires_at?: string
  paid_at?: string
  webhook_data?: string
  created_at: string
  updated_at: string
  sale_id: string
}

// Funções helper para operações comuns
export const db = {
  // Categorias
  categories: {
    findMany: () => supabase.from('categories').select('*'),
    findById: (id: string) => supabase.from('categories').select('*').eq('id', id).single(),
    create: (data: Omit<Category, 'id' | 'created_at' | 'updated_at'>) => 
      supabase.from('categories').insert(data).select().single(),
    update: (id: string, data: Partial<Omit<Category, 'id' | 'created_at' | 'updated_at'>>) => 
      supabase.from('categories').update(data).eq('id', id).select().single(),
    delete: (id: string) => supabase.from('categories').delete().eq('id', id)
  },

  // Produtos
  products: {
    findMany: () => supabase.from('products').select(`
      *,
      category:categories(*)
    `),
    findById: (id: string) => supabase.from('products').select(`
      *,
      category:categories(*)
    `).eq('id', id).single(),
    findByBarcode: (barcode: string) => supabase.from('products').select(`
      *,
      category:categories(*)
    `).eq('barcode', barcode).single(),
    create: (data: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'category'>) => 
      supabase.from('products').insert(data).select().single(),
    update: (id: string, data: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at' | 'category'>>) => 
      supabase.from('products').update(data).eq('id', id).select().single(),
    delete: (id: string) => supabase.from('products').delete().eq('id', id)
  },

  // Vendas
  sales: {
    findMany: () => supabase.from('sales').select('*'),
    findById: (id: string) => supabase.from('sales').select('*').eq('id', id).single(),
    create: (data: Omit<Sale, 'id' | 'created_at' | 'updated_at'>) => 
      supabase.from('sales').insert(data).select().single(),
    update: (id: string, data: Partial<Omit<Sale, 'id' | 'created_at' | 'updated_at'>>) => 
      supabase.from('sales').update(data).eq('id', id).select().single()
  },

  // Itens de venda
  saleItems: {
    findBySaleId: (saleId: string) => supabase.from('sale_items').select(`
      *,
      product:products(*)
    `).eq('sale_id', saleId),
    create: (data: Omit<SaleItem, 'id' | 'created_at' | 'product'>) => 
      supabase.from('sale_items').insert(data).select().single(),
    delete: (id: string) => supabase.from('sale_items').delete().eq('id', id)
  },

  clients: {
    findMany: () => supabase.from('clients').select('*'),
    findById: (id: string) => supabase.from('clients').select('*').eq('id', id).single(),
    findByEmail: (email: string) => supabase.from('clients').select('*').eq('email', email).single(),
    create: (data: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => 
      supabase.from('clients').insert(data).select().single(),
    update: (id: string, data: Partial<Omit<Client, 'id' | 'created_at' | 'updated_at'>>) => 
      supabase.from('clients').update(data).eq('id', id).select().single(),
    delete: (id: string) => supabase.from('clients').delete().eq('id', id)
  },

  payments: {
    findMany: () => supabase.from('payments').select('*'),
    findById: (id: string) => supabase.from('payments').select('*').eq('id', id).single(),
    findBySaleId: (saleId: string) => supabase.from('payments').select('*').eq('sale_id', saleId),
    create: (data: Omit<Payment, 'id' | 'created_at' | 'updated_at'>) => 
      supabase.from('payments').insert(data).select().single(),
    update: (id: string, data: Partial<Omit<Payment, 'id' | 'created_at' | 'updated_at'>>) => 
      supabase.from('payments').update(data).eq('id', id).select().single(),
    delete: (id: string) => supabase.from('payments').delete().eq('id', id)
  }
}