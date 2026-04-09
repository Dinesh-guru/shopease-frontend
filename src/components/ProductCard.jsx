import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { addItemToCart } from '../store/slices/cartSlice';
import { toast } from 'react-toastify';

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);
  const { loading } = useSelector((state) => state.cart);

  const handleAddToCart = async (e) => {
    e.stopPropagation(); // prevent card click
    if (!token) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }
    const result = await dispatch(addItemToCart({
      productId: product.id,
      quantity: 1,
    }));
    if (addItemToCart.fulfilled.match(result)) {
      toast.success(`${product.name} added to cart!`);
    } else {
      toast.error(result.payload || 'Failed to add to cart');
    }
  };

  return (
    <div style={styles.card}>

      {/* Product Image */}
      <div style={styles.imageContainer}>
        <img
          src={product.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image'}
          alt={product.name}
          style={styles.image}
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
          }}
        />
        {product.stockQuantity === 0 && (
          <div style={styles.outOfStock}>Out of Stock</div>
        )}
      </div>

      {/* Product Info */}
      <div style={styles.info}>
        <p style={styles.category}>
          {product.category?.name || 'Uncategorized'}
        </p>
        <h3 style={styles.name}>{product.name}</h3>
        <p style={styles.description}>
          {product.description?.length > 80
            ? product.description.substring(0, 80) + '...'
            : product.description || 'No description available'}
        </p>

        <div style={styles.footer}>
          <span style={styles.price}>
            ₹{product.price?.toLocaleString('en-IN')}
          </span>
          <span style={styles.stock}>
            {product.stockQuantity > 0
              ? `${product.stockQuantity} left`
              : 'Out of stock'}
          </span>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={product.stockQuantity === 0 || loading}
          style={product.stockQuantity === 0 ? styles.btnDisabled : styles.btn}
        >
          {product.stockQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
};

const styles = {
  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    overflow: 'hidden',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer',
  },
  imageContainer: {
    position: 'relative',
    height: '200px',
    backgroundColor: '#f8f9fa',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  outOfStock: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    backgroundColor: '#e74c3c',
    color: '#fff',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
  },
  info: {
    padding: '16px',
  },
  category: {
    fontSize: '12px',
    color: '#3498db',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: '6px',
  },
  name: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: '8px',
    lineHeight: '1.3',
  },
  description: {
    fontSize: '13px',
    color: '#7f8c8d',
    marginBottom: '12px',
    lineHeight: '1.5',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  price: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#2ecc71',
  },
  stock: {
    fontSize: '12px',
    color: '#95a5a6',
  },
  btn: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#3498db',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  btnDisabled: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#bdc3c7',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'not-allowed',
  },
};

export default ProductCard;