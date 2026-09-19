import React from 'react';
import { ProductDetailPage } from './ProductDetailPage';

export const ProductDetailsPage: React.FC<{ slug?: string }> = (props) => {
  return <ProductDetailPage {...props} />;
};

export default ProductDetailsPage;
