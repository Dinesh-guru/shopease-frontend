import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyOrders, cancelOrder } from '../api/orderApi';
import { toast } from 'react-toastify';

const statusColors = {
  PENDING:    { bg: '#fff3cd', color: '#856404' },
  PROCESSING: { bg: '#cce5ff', color: '#004085' },
  SHIPPED:    { bg: '#d4edda', color: '#155724' },
  DELIVERED:  { bg: '#d1ecf1', color: '#0c5460' },
  CANCELLED:  { bg: '#f8d7da', color: '#721c24' },
};

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await getMyOrders();
      setOrders(res.data);
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (orderId) => {
    try {
      await cancelOrder(orderId);
      toast.success('Order cancelled successfully');
      loadOrders(); // refresh list
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot cancel this order');
    }
  };

  const toggleExpand = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div style={styles.centered}>
        <p style={styles.loadingText}>Loading orders...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div style={styles.centered}>
        <div style={styles.emptyOrders}>
          <p style={styles.emptyIcon}>📦</p>
          <h2 style={styles.emptyTitle}>No orders yet</h2>
          <p style={styles.emptySubtitle}>
            Place your first order to see it here
          </p>
          <button
            onClick={() => navigate('/')}
            style={styles.shopBtn}
          >
            Start Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>My Orders</h1>
        <p style={styles.subtitle}>
          {orders.length} order{orders.length !== 1 ? 's' : ''} total
        </p>

        <div style={styles.ordersList}>
          {orders.map((order) => {
            const statusStyle = statusColors[order.status] || statusColors.PENDING;
            const isExpanded = expandedOrder === order.orderId;

            return (
              <div key={order.orderId} style={styles.orderCard}>

                {/* Order Header */}
                <div
                  style={styles.orderHeader}
                  onClick={() => toggleExpand(order.orderId)}
                >
                  <div style={styles.orderLeft}>
                    <p style={styles.orderId}>Order #{order.orderId}</p>
                    <p style={styles.orderDate}>
                      {formatDate(order.createdAt)}
                    </p>
                  </div>

                  <div style={styles.orderRight}>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: statusStyle.bg,
                      color: statusStyle.color,
                    }}>
                      {order.status}
                    </span>
                    <p style={styles.orderTotal}>
                      ₹{order.totalAmount?.toLocaleString('en-IN')}
                    </p>
                    <span style={styles.expandIcon}>
                      {isExpanded ? '▲' : '▼'}
                    </span>
                  </div>
                </div>

                {/* Order Items — shown when expanded */}
                {isExpanded && (
                  <div style={styles.orderBody}>
                    <div style={styles.itemsList}>
                      {order.items?.map((item, index) => (
                        <div key={index} style={styles.orderItem}>
                          <img
                            src={item.imageUrl ||
                              'https://via.placeholder.com/60x60?text=No+Image'}
                            alt={item.productName}
                            style={styles.itemImage}
                            onError={(e) => {
                              e.target.src =
                                'https://via.placeholder.com/60x60?text=No+Image';
                            }}
                          />
                          <div style={styles.itemInfo}>
                            <p style={styles.itemName}>{item.productName}</p>
                            <p style={styles.itemMeta}>
                              Qty: {item.quantity} ×
                              ₹{item.price?.toLocaleString('en-IN')}
                            </p>
                          </div>
                          <p style={styles.itemSubtotal}>
                            ₹{item.subtotal?.toLocaleString('en-IN')}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Order Footer */}
                    <div style={styles.orderFooter}>
                      <div style={styles.orderSummary}>
                        <span>Items total:</span>
                        <span>₹{order.totalAmount?.toLocaleString('en-IN')}</span>
                      </div>
                      <div style={styles.orderSummary}>
                        <span>Shipping:</span>
                        <span style={{ color: '#2ecc71' }}>FREE</span>
                      </div>

                      {order.status === 'PENDING' && (
                        <button
                          onClick={() => handleCancel(order.orderId)}
                          style={styles.cancelBtn}
                        >
                          Cancel Order
                        </button>
                      )}

                      {order.status === 'DELIVERED' && (
                        <button
                          onClick={() => navigate('/')}
                          style={styles.reorderBtn}
                        >
                          Shop Again
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
    maxWidth: '800px',
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
  ordersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    overflow: 'hidden',
  },
  orderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    cursor: 'pointer',
    userSelect: 'none',
  },
  orderLeft: {},
  orderId: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: '4px',
  },
  orderDate: {
    fontSize: '13px',
    color: '#7f8c8d',
  },
  orderRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  statusBadge: {
    padding: '5px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '700',
  },
  orderTotal: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#2c3e50',
  },
  expandIcon: {
    color: '#7f8c8d',
    fontSize: '12px',
  },
  orderBody: {
    borderTop: '1px solid #f0f2f5',
    padding: '20px 24px',
  },
  itemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '20px',
  },
  orderItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  itemImage: {
    width: '60px',
    height: '60px',
    objectFit: 'cover',
    borderRadius: '8px',
    flexShrink: 0,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: '4px',
  },
  itemMeta: {
    fontSize: '13px',
    color: '#7f8c8d',
  },
  itemSubtotal: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#2ecc71',
  },
  orderFooter: {
    borderTop: '1px solid #f0f2f5',
    paddingTop: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  orderSummary: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    color: '#555',
  },
  cancelBtn: {
    alignSelf: 'flex-start',
    marginTop: '8px',
    padding: '9px 20px',
    backgroundColor: 'transparent',
    border: '1px solid #e74c3c',
    color: '#e74c3c',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  reorderBtn: {
    alignSelf: 'flex-start',
    marginTop: '8px',
    padding: '9px 20px',
    backgroundColor: '#3498db',
    border: 'none',
    color: '#fff',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  centered: {
    minHeight: 'calc(100vh - 64px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyOrders: {
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

export default Orders;