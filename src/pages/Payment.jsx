import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { processPayment, retryPayment } from '../api/paymentApi';
import { useDispatch } from 'react-redux';
import { fetchCart } from '../store/slices/cartSlice';
import { toast } from 'react-toastify';

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const order = location.state?.order;

  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [processing, setProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);

  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: '',
  });

  const [upiId, setUpiId] = useState('');

  // Auto redirect after successful payment
  useEffect(() => {
    if (paymentResult?.status === 'SUCCESS') {
      const timer = setTimeout(() => {
        navigate('/orders');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [paymentResult]);

  // No order data — show helpful message
  if (!order) {
    return (
      <div style={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px',
      }}>
        <p style={{ fontSize: '48px' }}>🛒</p>
        <h2 style={{ color: '#2c3e50' }}>No order found</h2>
        <p style={{ color: '#7f8c8d' }}>
          Please add items to cart and place an order first
        </p>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '10px 24px',
            backgroundColor: '#3498db',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '15px',
          }}
        >
          Browse Products
        </button>
      </div>
    );
  }

  const handleCardChange = (e) => {
    let value = e.target.value;

    if (e.target.name === 'cardNumber') {
      value = value.replace(/\D/g, '').substring(0, 16);
      value = value.replace(/(.{4})/g, '$1 ').trim();
    }

    if (e.target.name === 'expiryDate') {
      value = value.replace(/\D/g, '').substring(0, 4);
      if (value.length > 2) {
        value = value.substring(0, 2) + '/' + value.substring(2);
      }
    }

    if (e.target.name === 'cvv') {
      value = value.replace(/\D/g, '').substring(0, 3);
    }

    setCardData({ ...cardData, [e.target.name]: value });
  };

  const handlePayment = async () => {
    if (paymentMethod === 'CARD') {
      const rawCard = cardData.cardNumber.replace(/\s/g, '');
      if (rawCard.length < 16) {
        toast.error('Please enter a valid 16-digit card number');
        return;
      }
      if (!cardData.cardHolder) {
        toast.error('Please enter card holder name');
        return;
      }
      if (!cardData.expiryDate) {
        toast.error('Please enter expiry date');
        return;
      }
      if (cardData.cvv.length < 3) {
        toast.error('Please enter a valid CVV');
        return;
      }
    }

    if (paymentMethod === 'UPI' && !upiId.includes('@')) {
      toast.error('Please enter a valid UPI ID (e.g. dinesh@upi)');
      return;
    }

    setProcessing(true);

    try {
      const payload = {
        orderId: order.orderId,
        paymentMethod,
        cardNumber: cardData.cardNumber.replace(/\s/g, ''),
        cardHolder: cardData.cardHolder,
        expiryDate: cardData.expiryDate,
        cvv: cardData.cvv,
        upiId,
      };

      const res = await processPayment(payload);
      setPaymentResult(res.data);

      if (res.data.status === 'SUCCESS') {
        dispatch(fetchCart());
        toast.success('Payment successful!');
      } else {
        toast.error('Payment failed. You can retry.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment processing error');
    } finally {
      setProcessing(false);
    }
  };

  const handleRetry = async () => {
    setProcessing(true);
    try {
      const payload = {
        orderId: order.orderId,
        paymentMethod,
        cardNumber: cardData.cardNumber.replace(/\s/g, ''),
        cardHolder: cardData.cardHolder,
        expiryDate: cardData.expiryDate,
        cvv: cardData.cvv,
        upiId,
      };
      const res = await retryPayment(payload);
      setPaymentResult(res.data);
      if (res.data.status === 'SUCCESS') {
        dispatch(fetchCart());
        toast.success('Payment successful!');
      } else {
        toast.error('Payment failed again.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Retry failed');
    } finally {
      setProcessing(false);
    }
  };

  // Payment result screen
  if (paymentResult) {
    const isSuccess = paymentResult.status === 'SUCCESS';
    return (
      <div style={styles.page}>
        <div style={styles.resultCard}>
          <div style={styles.resultIcon}>
            {isSuccess ? '✅' : '❌'}
          </div>
          <h2 style={{
            ...styles.resultTitle,
            color: isSuccess ? '#2ecc71' : '#e74c3c'
          }}>
            {isSuccess ? 'Payment Successful!' : 'Payment Failed'}
          </h2>
          <p style={styles.resultMessage}>{paymentResult.message}</p>

          {isSuccess && (
            <>
              <div style={styles.txnBox}>
                <p style={styles.txnLabel}>Transaction ID</p>
                <p style={styles.txnId}>{paymentResult.transactionId}</p>
                <p style={styles.txnLabel}>Amount Paid</p>
                <p style={styles.txnAmount}>
                  ₹{paymentResult.amount?.toLocaleString('en-IN')}
                </p>
                <p style={styles.txnLabel}>Payment Method</p>
                <p style={styles.txnValue}>{paymentResult.paymentMethod}</p>
              </div>
              <p style={{
                color: '#7f8c8d',
                fontSize: '13px',
                marginBottom: '16px'
              }}>
                Redirecting to your orders in 3 seconds...
              </p>
            </>
          )}

          <div style={styles.resultActions}>
            {isSuccess ? (
              <button
                onClick={() => navigate('/orders')}
                style={styles.successBtn}
              >
                View My Orders →
              </button>
            ) : (
              <>
                <button
                  onClick={handleRetry}
                  style={styles.retryBtn}
                  disabled={processing}
                >
                  {processing ? 'Retrying...' : 'Retry Payment'}
                </button>
                <button
                  onClick={() => navigate('/orders')}
                  style={styles.ordersBtn}
                >
                  View Orders
                </button>
              </>
            )}
          </div>

          <p style={styles.testHint}>
            💡 Test tip: Use card starting with 0000 to simulate failure
          </p>
        </div>
      </div>
    );
  }

  // Payment form
  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* Left — Payment Form */}
        <div style={styles.formSection}>
          <h2 style={styles.title}>Complete Payment</h2>

          {/* Payment Method Tabs */}
          <div style={styles.methodTabs}>
            {['CARD', 'UPI', 'NETBANKING'].map((method) => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                style={paymentMethod === method
                  ? styles.methodTabActive
                  : styles.methodTab}
              >
                {method === 'CARD' && '💳 '}
                {method === 'UPI' && '📱 '}
                {method === 'NETBANKING' && '🏦 '}
                {method}
              </button>
            ))}
          </div>

          {/* Card Form */}
          {paymentMethod === 'CARD' && (
            <div style={styles.paymentForm}>
              <div style={styles.field}>
                <label style={styles.label}>Card Number</label>
                <input
                  type="text"
                  name="cardNumber"
                  value={cardData.cardNumber}
                  onChange={handleCardChange}
                  placeholder="1234 5678 9012 3456"
                  style={styles.input}
                  maxLength={19}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Card Holder Name</label>
                <input
                  type="text"
                  name="cardHolder"
                  value={cardData.cardHolder}
                  onChange={handleCardChange}
                  placeholder="DINESH KUMAR"
                  style={styles.input}
                />
              </div>
              <div style={styles.row}>
                <div style={styles.field}>
                  <label style={styles.label}>Expiry Date</label>
                  <input
                    type="text"
                    name="expiryDate"
                    value={cardData.expiryDate}
                    onChange={handleCardChange}
                    placeholder="MM/YY"
                    style={styles.input}
                    maxLength={5}
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>CVV</label>
                  <input
                    type="password"
                    name="cvv"
                    value={cardData.cvv}
                    onChange={handleCardChange}
                    placeholder="•••"
                    style={styles.input}
                    maxLength={3}
                  />
                </div>
              </div>
              <p style={styles.testHint}>
                💡 Use any 16-digit card for success.
                Start with 0000 to test failure.
              </p>
            </div>
          )}

          {/* UPI Form */}
          {paymentMethod === 'UPI' && (
            <div style={styles.paymentForm}>
              <div style={styles.field}>
                <label style={styles.label}>UPI ID</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="dinesh@upi or dinesh@okicici"
                  style={styles.input}
                />
              </div>
              <div style={styles.upiApps}>
                {['GPay', 'PhonePe', 'Paytm', 'BHIM'].map((app) => (
                  <button
                    key={app}
                    style={styles.upiApp}
                    onClick={() => setUpiId(`dinesh@${app.toLowerCase()}`)}
                  >
                    {app}
                  </button>
                ))}
              </div>
              <p style={styles.testHint}>
                💡 Enter any UPI ID with @ to simulate payment
              </p>
            </div>
          )}

          {/* Net Banking Form */}
          {paymentMethod === 'NETBANKING' && (
            <div style={styles.paymentForm}>
              <div style={styles.field}>
                <label style={styles.label}>Select Bank</label>
                <select style={styles.input}>
                  <option>State Bank of India</option>
                  <option>HDFC Bank</option>
                  <option>ICICI Bank</option>
                  <option>Axis Bank</option>
                  <option>Kotak Mahindra Bank</option>
                </select>
              </div>
              <p style={styles.testHint}>
                💡 Select any bank to simulate net banking payment
              </p>
            </div>
          )}

          <button
            onClick={handlePayment}
            disabled={processing}
            style={processing ? styles.payBtnDisabled : styles.payBtn}
          >
            {processing
              ? '⏳ Processing payment...'
              : `Pay ₹${order.totalAmount?.toLocaleString('en-IN')}`}
          </button>
        </div>

        {/* Right — Order Summary */}
        <div style={styles.summary}>
          <h3 style={styles.summaryTitle}>Order Summary</h3>
          <p style={styles.orderId}>Order #{order.orderId}</p>

          <div style={styles.itemsList}>
            {order.items?.map((item, index) => (
              <div key={index} style={styles.item}>
                <div style={styles.itemInfo}>
                  <p style={styles.itemName}>{item.productName}</p>
                  <p style={styles.itemQty}>Qty: {item.quantity}</p>
                </div>
                <p style={styles.itemPrice}>
                  ₹{item.subtotal?.toLocaleString('en-IN')}
                </p>
              </div>
            ))}
          </div>

          <div style={styles.divider} />

          <div style={styles.summaryRow}>
            <span>Subtotal</span>
            <span>₹{order.totalAmount?.toLocaleString('en-IN')}</span>
          </div>
          <div style={styles.summaryRow}>
            <span>Shipping</span>
            <span style={{ color: '#2ecc71' }}>FREE</span>
          </div>

          <div style={styles.divider} />

          <div style={styles.totalRow}>
            <span>Total</span>
            <span>₹{order.totalAmount?.toLocaleString('en-IN')}</span>
          </div>

          <div style={styles.secureNote}>
            🔒 Payments are 100% secure and encrypted
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
    maxWidth: '1000px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '1fr 360px',
    gap: '24px',
    alignItems: 'start',
  },
  formSection: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '28px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  title: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: '20px',
  },
  methodTabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '24px',
  },
  methodTab: {
    flex: 1,
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    color: '#555',
  },
  methodTabActive: {
    flex: 1,
    padding: '10px',
    border: '1px solid #3498db',
    borderRadius: '8px',
    backgroundColor: '#ebf5fb',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    color: '#3498db',
  },
  paymentForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 1,
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#2c3e50',
  },
  input: {
    padding: '11px 14px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '15px',
    outline: 'none',
    width: '100%',
  },
  row: {
    display: 'flex',
    gap: '16px',
  },
  upiApps: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  upiApp: {
    padding: '8px 16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: '13px',
  },
  testHint: {
    fontSize: '12px',
    color: '#7f8c8d',
    backgroundColor: '#f8f9fa',
    padding: '8px 12px',
    borderRadius: '6px',
    marginTop: '4px',
  },
  payBtn: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#2ecc71',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '20px',
  },
  payBtnDisabled: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#95a5a6',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'not-allowed',
    marginTop: '20px',
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
    marginBottom: '4px',
  },
  orderId: {
    fontSize: '13px',
    color: '#7f8c8d',
    marginBottom: '16px',
  },
  itemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '16px',
  },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemInfo: {},
  itemName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#2c3e50',
    margin: 0,
  },
  itemQty: {
    fontSize: '12px',
    color: '#7f8c8d',
    margin: 0,
  },
  itemPrice: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#2c3e50',
    margin: 0,
  },
  divider: {
    borderTop: '1px solid #eee',
    margin: '12px 0',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    color: '#555',
    marginBottom: '8px',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '18px',
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: '16px',
  },
  secureNote: {
    textAlign: 'center',
    fontSize: '12px',
    color: '#7f8c8d',
    padding: '10px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
  },
  resultCard: {
    maxWidth: '480px',
    margin: '40px auto',
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '40px',
    textAlign: 'center',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
  },
  resultIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  resultTitle: {
    fontSize: '26px',
    fontWeight: '700',
    marginBottom: '8px',
  },
  resultMessage: {
    color: '#7f8c8d',
    fontSize: '15px',
    marginBottom: '24px',
  },
  txnBox: {
    backgroundColor: '#f8f9fa',
    borderRadius: '10px',
    padding: '16px',
    marginBottom: '16px',
    textAlign: 'left',
  },
  txnLabel: {
    fontSize: '12px',
    color: '#7f8c8d',
    marginBottom: '2px',
    margin: 0,
  },
  txnId: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#2c3e50',
    fontFamily: 'monospace',
    marginBottom: '12px',
  },
  txnAmount: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#2ecc71',
    marginBottom: '12px',
  },
  txnValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: '0',
  },
  resultActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: '16px',
  },
  successBtn: {
    padding: '12px 28px',
    backgroundColor: '#2ecc71',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  retryBtn: {
    padding: '12px 24px',
    backgroundColor: '#e74c3c',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  ordersBtn: {
    padding: '12px 24px',
    backgroundColor: 'transparent',
    color: '#3498db',
    border: '1px solid #3498db',
    borderRadius: '8px',
    fontSize: '15px',
    cursor: 'pointer',
  },
};

export default Payment;