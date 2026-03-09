import React, { useState } from 'react';
import { FaStar } from 'react-icons/fa';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import './ReviewForm.css';

interface ReviewFormProps {
  productId: string;
  orderId: string;
  productName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ productId, orderId, productName, onSuccess, onCancel }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error("Vui lòng chọn số sao đánh giá!");
      return;
    }

    try {
      setIsSubmitting(true);
      // Matches the ReviewController.java @PostMapping("/submit")
      await api.post('/reviews/submit', {
        productId,
        orderId,
        rating,
        comment: comment.trim()
      });

      toast.success("Cảm ơn bạn đã đánh giá sản phẩm!");
      onSuccess(); // Triggers re-fetch in Purchase.tsx to update UI
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi gửi đánh giá.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="review-modal-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="review-form-card">
        <h3>Đánh giá sản phẩm</h3>
        <p className="product-name-label">{productName}</p>

        <form onSubmit={handleSubmit}>
          {/* STAR RATING SELECTOR */}
          <div className="star-rating-container">
            {[...Array(5)].map((_, index) => {
              const ratingValue = index + 1;
              return (
                <label key={index} className="star-label">
                  <input 
                    type="radio" 
                    className="rating-radio"
                    name="rating" 
                    value={ratingValue} 
                    onChange={() => setRating(ratingValue)} 
                  />
                  <FaStar 
                    className="star-icon" 
                    color={ratingValue <= (hover || rating) ? "#ffc107" : "#e4e5e9"}
                    onMouseEnter={() => setHover(ratingValue)}
                    onMouseLeave={() => setHover(0)}
                  />
                </label>
              );
            })}
            <span className="rating-text">
              {rating === 1 && "Tệ"}
              {rating === 2 && "Không hài lòng"}
              {rating === 3 && "Bình thường"}
              {rating === 4 && "Hài lòng"}
              {rating === 5 && "Tuyệt vời"}
            </span>
          </div>

          {/* COMMENT AREA */}
          <div className="comment-section">
            <textarea 
              placeholder="Chia sẻ cảm nhận của bạn về sản phẩm này nhé..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={200}
            />
            <small className="char-count">{comment.length}/200</small>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onCancel}>Hủy</button>
            <button type="submit" className="btn-submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang gửi..." : "Hoàn thành"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewForm;