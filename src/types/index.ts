export interface ICategory {
  id?: string;
  name: string;
  parentId: string | null;
  slug: string;
  productCount: number;
  sortOrder: number;
  isActive: boolean;
  createdAt?: any;
}

export interface IProductImage {
  url: string;
  isMain: boolean;
}

export interface IProduct {
  id?: string;
  title: string;
  name?: string;
  type: 'product' | 'bundle';
  categoryId: string;
  category?: string;
  price: number;
  compareAtPrice: number | null;
  oldPrice?: number;
  shortDescription?: string;
  description?: string;
  images?: IProductImage[] | string[];
  bundleItems?: { productId?: string; title: string; image: string; quantity: number }[];
  isActive?: boolean;
  isFreeShipping?: boolean;
  isFeatured?: boolean;
  rating?: number;
  badge?: string;
  isBundle?: boolean;
  createdAt?: any;
}

export interface IOrder {
  id?: string;
  productId: string;
  productName: string;
  quantity: number;
  customerName: string;
  customerPhone: string;
  wilaya: string;
  wilayaCode?: string;
  wilayaName?: string;
  municipality?: string;
  deliveryType?: 'home' | 'desk';
  productPrice: number;
  shippingCost: number;
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  createdAt: any;
}

export interface INotification {
  id?: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: any;
  type: 'new_order' | 'system';
  link?: string;
}

export interface IShippingZone {
  id?: string;
  code: string;
  nameAr: string;
  nameFr: string;
  homeDeliveryFee: number;
  deskDeliveryFee: number;
  isActive: boolean;
  municipalities: string[];
  updatedAt?: any;
}

