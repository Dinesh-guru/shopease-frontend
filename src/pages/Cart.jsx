import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  fetchCart,
  updateItem,
  removeItem,
  emptyCart
} from '../store/slices/cartSlice';
import { placeOrder } from '../api/orderApi';
import { toast } from 'react-toastify';


const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, totalItems, totalAmount, loading } = useSelector(
    (state) => state.cart
  );

  useEffect(() => {
    dispatch(fetchCart());
  }, []);

  const handleQuantityChange = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) return;
    const result = await dispatch(updateItem({ cartItemId, quantity: newQuantity }));
    if (updateItem.rejected.match(result)) {
      toast.error(result.payload || 'Failed to update quantity');
    }
  };

  const handleRemove = async (cartItemId, productName) => {
    const result = await dispatch(removeItem(cartItemId));
    if (removeItem.fulfilled.match(result)) {
      toast.success(`${productName} removed from cart`);
    }
  };

  const handleClearCart = async () => {
    await dispatch(emptyCart());
    toast.success('Cart cleared');
  };

  const handlePlaceOrder = async () => {
    try {
      const res = await placeOrder();
      dispatch(fetchCart());
      toast.success('Order created! Proceeding to payment...');
      // Pass order data to payment page
      navigate('/payment', { state: { order: res.data } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    }
  };

  if (loading) {
    return (
      <div style={styles.centered}>
        <p style={styles.loadingText}>Loading cart...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div style={styles.centered}>
        <div style={styles.emptyCart}>
          <p style={styles.emptyIcon}>🛒</p>
          <h2 style={styles.emptyTitle}>Your cart is empty</h2>
          <p style={styles.emptySubtitle}>
            Add some products to get started
          </p>
          <button
            onClick={() => navigate('/')}
            style={styles.shopBtn}
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>Your Cart</h1>
        <p style={styles.subtitle}>{totalItems} item{totalItems !== 1 ? 's' : ''}</p>

        <div style={styles.layout}>

          {/* Cart Items */}
          <div style={styles.itemsSection}>
            {items.map((item) => (
              <div key={item.cartItemId} style={styles.cartItem}>

                {/* Product Image */}
                <img
                  src={item.imageUrl ||
                    'https://via.placeholder.com/100x100?text=No+Image'}
                  alt={item.productName}
                  style={styles.itemImage}
                  onError={(e) => {
                    e.target.src =
                      'https://via.placeholder.com/100x100?text=No+Image';
                  }}
                />

                {/* Product Details */}
                <div style={styles.itemDetails}>
                  <h3 style={styles.itemName}>{item.productName}</h3>
                  <p style={styles.itemPrice}>
                    ₹{item.price?.toLocaleString('en-IN')} each
                  </p>

                  {/* Quantity Controls */}
                  <div style={styles.quantityRow}>
                    <button
                      onClick={() =>
                        handleQuantityChange(item.cartItemId, item.quantity - 1)
                      }
                      style={styles.qtyBtn}
                      disabled={item.quantity <= 1}
                    >
                      −
                    </button>
                    <span style={styles.qtyValue}>{item.quantity}</span>
                    <button
                      onClick={() =>
                        handleQuantityChange(item.cartItemId, item.quantity + 1)
                      }
                      style={styles.qtyBtn}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Subtotal + Remove */}
                <div style={styles.itemRight}>
                  <p style={styles.subtotal}>
                    ₹{item.subtotal?.toLocaleString('en-IN')}
                  </p>
                  <button
                    onClick={() =>
                      handleRemove(item.cartItemId, item.productName)
                    }
                    style={styles.removeBtn}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}

            {/* Clear Cart */}
            <button onClick={handleClearCart} style={styles.clearBtn}>
              🗑 Clear entire cart
            </button>
          </div>

          {/* Order Summary */}
          <div style={styles.summary}>
            <h2 style={styles.summaryTitle}>Order Summary</h2>

            <div style={styles.summaryRow}>
              <span>Items ({totalItems})</span>
              <span>₹{totalAmount?.toLocaleString('en-IN')}</span>
            </div>
            <div style={styles.summaryRow}>
              <span>Shipping</span>
              <span style={{ color: '#2ecc71' }}>FREE</span>
            </div>
            <div style={styles.summaryRow}>
              <span>Tax (18% GST)</span>
              <span>₹{(totalAmount * 0.18)?.toLocaleString('en-IN',
                { maximumFractionDigits: 2 })}</span>
            </div>

            <div style={styles.divider} />

            <div style={styles.totalRow}>
              <span>Total</span>
              <span>₹{(totalAmount * 1.18)?.toLocaleString('en-IN',
                { maximumFractionDigits: 2 })}</span>
            </div>

            <button
              onClick={handlePlaceOrder}
              style={styles.placeOrderBtn}
            >
              Place Order
            </button>

            <button
              onClick={() => navigate('/')}
              style={styles.continueBtn}
            >
              ← Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: 'calc(100vh - 64px)',
    backgroundColor: '#f0f2f5',
    padding: '30px 20px',
  },
  container: {
    maxWidth: '1100px',
    margin: '0 auto',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: '4px',
  },
  subtitle: {
    color: '#7f8c8d',
    fontSize: '15px',
    marginBottom: '24px',
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '1fr 340px',
    gap: '24px',
    alignItems: 'start',
  },
  itemsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  cartItem: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  itemImage: {
    width: '90px',
    height: '90px',
    objectFit: 'cover',
    borderRadius: '8px',
    flexShrink: 0,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: '6px',
  },
  itemPrice: {
    fontSize: '14px',
    color: '#7f8c8d',
    marginBottom: '12px',
  },
  quantityRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  qtyBtn: {
    width: '32px',
    height: '32px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    backgroundColor: '#f8f9fa',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: {
    fontSize: '16px',
    fontWeight: '600',
    minWidth: '24px',
    textAlign: 'center',
  },
  itemRight: {
    textAlign: 'right',
    flexShrink: 0,
  },
  subtotal: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#2ecc71',
    marginBottom: '8px',
  },
  removeBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#e74c3c',
    fontSize: '13px',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  clearBtn: {
    backgroundColor: 'transparent',
    border: '1px solid #e74c3c',
    color: '#e74c3c',
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    alignSelf: 'flex-start',
  },
  summary: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    position: 'sticky',
    top: '84px',
  },
  summaryTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: '20px',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    color: '#555',
    marginBottom: '12px',
  },
  divider: {
    borderTop: '1px solid #eee',
    margin: '16px 0',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '18px',
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: '20px',
  },
  placeOrderBtn: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#2ecc71',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    marginBottom: '12px',
  },
  continueBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: 'transparent',
    color: '#3498db',
    border: '1px solid #3498db',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  centered: {
    minHeight: 'calc(100vh - 64px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCart: {
    textAlign: 'center',
    padding: '40px',
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  emptyTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: '8px',
  },
  emptySubtitle: {
    color: '#7f8c8d',
    fontSize: '15px',
    marginBottom: '24px',
  },
  shopBtn: {
    backgroundColor: '#3498db',
    color: '#fff',
    border: 'none',
    padding: '12px 28px',
    borderRadius: '8px',
    fontSize: '15px',
    cursor: 'pointer',
  },
  loadingText: {
    color: '#7f8c8d',
    fontSize: '16px',
  },
};

export default Cart;