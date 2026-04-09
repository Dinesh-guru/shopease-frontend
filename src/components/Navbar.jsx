import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { resetCart } from '../store/slices/cartSlice';
import { toast } from 'react-toastify';

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token } = useSelector((state) => state.auth);
  const { totalItems } = useSelector((state) => state.cart);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(resetCart());
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>

        {/* Logo */}
        <Link to="/" style={styles.logo}>
          🛒 ShopEase
        </Link>

        {/* Nav Links */}
        <div style={styles.links}>
          <Link to="/" style={styles.link}>Products</Link>

          {token ? (
            <>
              <Link to="/cart" style={styles.link}>
                Cart {totalItems > 0 && (
                  <span style={styles.badge}>{totalItems}</span>
                )}
              </Link>
              <Link to="/orders" style={styles.link}>My Orders</Link>

              {/* Admin link — only visible to ADMIN users */}
              {user?.role === 'ADMIN' && (
                <Link to="/admin" style={styles.adminLink}>
                  ⚙️ Admin
                </Link>
              )}

              <span style={styles.username}>
                Hi, {user?.name?.split(' ')[0]}
              </span>
              <button onClick={handleLogout} style={styles.logoutBtn}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={styles.link}>Login</Link>
              <Link to="/register" style={styles.registerBtn}>
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    backgroundColor: '#2c3e50',
    padding: '0 20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '64px',
  },
  logo: {
    color: '#fff',
    fontSize: '22px',
    fontWeight: 'bold',
    textDecoration: 'none',
  },
  links: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  link: {
    color: '#ecf0f1',
    textDecoration: 'none',
    fontSize: '15px',
    position: 'relative',
  },
  badge: {
    backgroundColor: '#e74c3c',
    color: '#fff',
    borderRadius: '50%',
    padding: '2px 7px',
    fontSize: '11px',
    marginLeft: '4px',
  },
  username: {
    color: '#3498db',
    fontWeight: '600',
    fontSize: '15px',
  },
  adminLink: {
    color: '#f39c12',
    textDecoration: 'none',
    fontSize: '15px',
    fontWeight: '600',
  },
  logoutBtn: {
    backgroundColor: 'transparent',
    border: '1px solid #e74c3c',
    color: '#e74c3c',
    padding: '6px 14px',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  registerBtn: {
    backgroundColor: '#3498db',
    color: '#fff',
    padding: '7px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    textDecoration: 'none',
  },
};

export default Navbar;