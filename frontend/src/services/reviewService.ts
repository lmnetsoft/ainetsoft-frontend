import api from './api';

export interface ReviewRequest {
  productId: string;
  orderId: string;
  rating: number;
  comment: string;
}

export const submitReview = async (reviewData: ReviewRequest) => {
  const response = await api.post('/reviews/submit', reviewData);
  return response.data;
};

export const getProductReviews = async (productId: string) => {
  const response = await api.get(`/reviews/product/${productId}`);
  return response.data;
};