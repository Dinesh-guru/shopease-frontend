import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { getCategories } from '../api/categoryApi';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // Product form state
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '', description: '', price: '',
    stockQuantity: '', imageUrl: '', categoryId: '',
  });

  useEffect(() => {
    loadDashboard();
    loadCategories();
  }, []);

  useEffect(() => {
    if (activeTab === 'orders') loadOrders();
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'products') loadProducts();
  }, [activeTab]);

  const loadDashboard = async () => {
    try {
      const res = await API.get('/admin/dashboard');
      setStats(res.data);
    } catch (err) {
      toast.error('Failed to load dashboard');
    }
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await API.get('/admin/orders');
      setOrders(res.data);
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await API.get('/admin/users');
      setUsers(res.data);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await API.get('/products?page=0&size=100');
      setProducts(res.data.content);
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    const res = await getCategories();
    setCategories(res.data);
  };

  const handleOrderStatus = async (orderId, status) => {
    try {
      await API.put(`/admin/orders/${orderId}/status?status=${status}`);
      toast.success('Order status updated');
      loadOrders();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleUserRole = async (userId, role) => {
    try {
      await API.put(`/admin/users/${userId}/role?role=${role}`);
      toast.success('User role updated');
      loadUsers();
    } catch (err) {
      toast.error('Failed to update role');
    }
  };

  const handleProductSubmit = async () => {
    try {
      const payload = {
        ...productForm,
        price: parseFloat(productForm.price),
        stockQuantity: parseInt(productForm.stockQuantity),
        categoryId: parseInt(productForm.categoryId),
      };

      if (editingProduct) {
        await API.put(`/admin/products/${editingProduct.id}`, payload);
        toast.success('Product updated!');
      } else {
        await API.post('/admin/products', payload);
        toast.success('Product created!');
      }

      setShowProductForm(false);
      setEditingProduct(null);
      setProductForm({
        name: '', description: '', price: '',
        stockQuantity: '', imageUrl: '', categoryId: '',
      });
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || '',
      price: product.price,
      stockQuantity: product.stockQuantity,
      imageUrl: product.imageUrl || '',
      categoryId: product.category?.id || '',
    });
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await API.delete(`/admin/products/${productId}`);
      toast.success('Product deleted');
      loadProducts();
    } catch (err) {
      toast.error('Failed to delete product');
    }
  };

  const statusColors = {
    PENDING:    '#f39c12',
    PROCESSING: '#3498db',
    SHIPPED:    '#9b59b6',
    DELIVERED:  '#2ecc71',
    CANCELLED:  '#e74c3c',
  };

  return (
    <div style={styles.page}>

      {/* Sidebar */}
      <div style={styles.sidebar}>
        <h2 style={styles.sidebarTitle}>⚙️ Admin</h2>
        {[
          { key: 'dashboard', label: '📊 Dashboard' },
          { key: 'products', label: '📦 Products' },
          { key: 'orders', label: '🛒 Orders' },
          { key: 'users', label: '👥 Users' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={activeTab === tab.key
              ? styles.sidebarBtnActive
              : styles.sidebarBtn}
          >
            {tab.label}
          </button>
        ))}
        <button
          onClick={() => navigate('/')}
          style={styles.backBtn}
        >
          ← Back to Shop
        </button>
      </div>

      {/* Main Content */}
      <div style={styles.content}>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && stats && (
          <div>
            <h2 style={styles.tabTitle}>Dashboard Overview</h2>
            <div style={styles.statsGrid}>
              {[
                { label: 'Total Users', value: stats.totalUsers, color: '#3498db' },
                { label: 'Total Products', value: stats.totalProducts, color: '#2ecc71' },
                { label: 'Total Orders', value: stats.totalOrders, color: '#e67e22' },
                { label: 'Total Revenue',
                  value: `₹${stats.totalRevenue?.toLocaleString('en-IN')}`,
                  color: '#9b59b6' },
              ].map((stat) => (
                <div key={stat.label} style={styles.statCard}>
                  <p style={styles.statLabel}>{stat.label}</p>
                  <p style={{ ...styles.statValue, color: stat.color }}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            <h3 style={styles.sectionTitle}>Orders by Status</h3>
            <div style={styles.statsGrid}>
              {[
                { label: 'Pending', value: stats.pendingOrders, color: '#f39c12' },
                { label: 'Processing', value: stats.processingOrders, color: '#3498db' },
                { label: 'Delivered', value: stats.deliveredOrders, color: '#2ecc71' },
                { label: 'Cancelled', value: stats.cancelledOrders, color: '#e74c3c' },
              ].map((stat) => (
                <div key={stat.label} style={styles.statCard}>
                  <p style={styles.statLabel}>{stat.label} Orders</p>
                  <p style={{ ...styles.statValue, color: stat.color }}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div>
            <div style={styles.tabHeader}>
              <h2 style={styles.tabTitle}>Products</h2>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setProductForm({
                    name: '', description: '', price: '',
                    stockQuantity: '', imageUrl: '', categoryId: '',
                  });
                  setShowProductForm(true);
                }}
                style={styles.addBtn}
              >
                + Add Product
              </button>
            </div>

            {/* Product Form Modal */}
            {showProductForm && (
              <div style={styles.formCard}>
                <h3 style={styles.formTitle}>
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h3>
                <div style={styles.formGrid}>
                  {[
                    { key: 'name', label: 'Product Name', type: 'text' },
                    { key: 'price', label: 'Price (₹)', type: 'number' },
                    { key: 'stockQuantity', label: 'Stock Quantity', type: 'number' },
                    { key: 'imageUrl', label: 'Image URL', type: 'text' },
                  ].map((field) => (
                    <div key={field.key} style={styles.formField}>
                      <label style={styles.formLabel}>{field.label}</label>
                      <input
                        type={field.type}
                        value={productForm[field.key]}
                        onChange={(e) => setProductForm({
                          ...productForm, [field.key]: e.target.value
                        })}
                        style={styles.formInput}
                      />
                    </div>
                  ))}
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Category</label>
                    <select
                      value={productForm.categoryId}
                      onChange={(e) => setProductForm({
                        ...productForm, categoryId: e.target.value
                      })}
                      style={styles.formInput}
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>Description</label>
                  <textarea
                    value={productForm.description}
                    onChange={(e) => setProductForm({
                      ...productForm, description: e.target.value
                    })}
                    style={{ ...styles.formInput, height: '80px' }}
                  />
                </div>
                <div style={styles.formActions}>
                  <button onClick={handleProductSubmit} style={styles.saveBtn}>
                    {editingProduct ? 'Update Product' : 'Create Product'}
                  </button>
                  <button
                    onClick={() => setShowProductForm(false)}
                    style={styles.cancelBtn}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Products Table */}
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={styles.th}>Product</th>
                    <th style={styles.th}>Category</th>
                    <th style={styles.th}>Price</th>
                    <th style={styles.th}>Stock</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} style={styles.tableRow}>
                      <td style={styles.td}>
                        <div style={styles.productCell}>
                          <img
                            src={product.imageUrl ||
                              'https://via.placeholder.com/40'}
                            alt={product.name}
                            style={styles.productThumb}
                            onError={(e) => {
                              e.target.src =
                                'https://via.placeholder.com/40';
                            }}
                          />
                          <span style={styles.productName}>{product.name}</span>
                        </div>
                      </td>
                      <td style={styles.td}>
                        {product.category?.name || 'N/A'}
                      </td>
                      <td style={styles.td}>
                        ₹{product.price?.toLocaleString('en-IN')}
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          color: product.stockQuantity < 10
                            ? '#e74c3c' : '#2ecc71',
                          fontWeight: '600',
                        }}>
                          {product.stockQuantity}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <button
                          onClick={() => handleEditProduct(product)}
                          style={styles.editBtn}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          style={styles.deleteBtn}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div>
            <h2 style={styles.tabTitle}>All Orders</h2>
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={styles.th}>Order ID</th>
                    <th style={styles.th}>Customer</th>
                    <th style={styles.th}>Amount</th>
                    <th style={styles.th}>Items</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Update Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.orderId} style={styles.tableRow}>
                      <td style={styles.td}>#{order.orderId}</td>
                      <td style={styles.td}>
                        <p style={{ fontWeight: '600', margin: 0 }}>
                          {order.userName}
                        </p>
                        <p style={{ fontSize: '12px', color: '#7f8c8d', margin: 0 }}>
                          {order.userEmail}
                        </p>
                      </td>
                      <td style={styles.td}>
                        ₹{order.totalAmount?.toLocaleString('en-IN')}
                      </td>
                      <td style={styles.td}>{order.itemCount} items</td>
                      <td style={styles.td}>
                        <span style={{
                          backgroundColor: statusColors[order.status] + '22',
                          color: statusColors[order.status],
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '700',
                        }}>
                          {order.status}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <select
                          value={order.status}
                          onChange={(e) =>
                            handleOrderStatus(order.orderId, e.target.value)
                          }
                          style={styles.statusSelect}
                        >
                          {['PENDING','PROCESSING','SHIPPED',
                            'DELIVERED','CANCELLED'].map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <h2 style={styles.tabTitle}>All Users</h2>
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Role</th>
                    <th style={styles.th}>Provider</th>
                    <th style={styles.th}>Change Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} style={styles.tableRow}>
                      <td style={styles.td}>{user.name}</td>
                      <td style={styles.td}>{user.email}</td>
                      <td style={styles.td}>
                        <span style={{
                          backgroundColor: user.role === 'ADMIN'
                            ? '#9b59b622' : '#3498db22',
                          color: user.role === 'ADMIN'
                            ? '#9b59b6' : '#3498db',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '700',
                        }}>
                          {user.role}
                        </span>
                      </td>
                      <td style={styles.td}>{user.provider}</td>
                      <td style={styles.td}>
                        <select
                          value={user.role}
                          onChange={(e) =>
                            handleUserRole(user.id, e.target.value)
                          }
                          style={styles.statusSelect}
                        >
                          <option value="USER">USER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  page: {
    display: 'flex',
    minHeight: 'calc(100vh - 64px)',
  },
sidebar: {               
    width: '220px',
    backgroundColor: '#2c3e50',
    padding: '24px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flexShrink: 0,
  },
  sidebarTitle: {
    color: '#fff',
    fontSize: '18px',
    fontWeight: '700',
    marginBottom: '16px',
    paddingBottom: '16px',
    borderBottom: '1px solid #3d5166',
  },
  sidebarBtn: {
    padding: '10px 14px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#bdc3c7',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    textAlign: 'left',
  },
  sidebarBtnActive: {
    padding: '10px 14px',
    backgroundColor: '#3498db',
    border: 'none',
    color: '#fff',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    textAlign: 'left',
    fontWeight: '600',
  },
  backBtn: {
    marginTop: 'auto',
    padding: '10px 14px',
    backgroundColor: 'transparent',
    border: '1px solid #3d5166',
    color: '#bdc3c7',
    borderRadius: '8px',
    fontSize: '13px',
    cursor: 'pointer',
    textAlign: 'left',
  },
  content: {
    flex: 1,
    padding: '28px',
    backgroundColor: '#f0f2f5',
    overflowY: 'auto',
  },
  tabTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: '20px',
  },
  tabHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '28px',
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  statLabel: {
    fontSize: '13px',
    color: '#7f8c8d',
    marginBottom: '8px',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: '17px',
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: '16px',
  },
  addBtn: {
    padding: '10px 20px',
    backgroundColor: '#2ecc71',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  formTitle: {
    fontSize: '17px',
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: '16px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    marginBottom: '16px',
  },
  formField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  formLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#2c3e50',
  },
  formInput: {
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    width: '100%',
  },
  formActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '16px',
  },
  saveBtn: {
    padding: '10px 24px',
    backgroundColor: '#3498db',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  cancelBtn: {
    padding: '10px 24px',
    backgroundColor: 'transparent',
    color: '#e74c3c',
    border: '1px solid #e74c3c',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  tableContainer: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    backgroundColor: '#f8f9fa',
  },
  th: {
    padding: '14px 16px',
    textAlign: 'left',
    fontSize: '13px',
    fontWeight: '700',
    color: '#7f8c8d',
    borderBottom: '1px solid #eee',
  },
  tableRow: {
    borderBottom: '1px solid #f0f2f5',
  },
  td: {
    padding: '14px 16px',
    fontSize: '14px',
    color: '#2c3e50',
  },
  productCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  productThumb: {
    width: '40px',
    height: '40px',
    borderRadius: '6px',
    objectFit: 'cover',
  },
  productName: {
    fontWeight: '600',
  },
  editBtn: {
    padding: '6px 14px',
    backgroundColor: '#3498db',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
    marginRight: '6px',
  },
  deleteBtn: {
    padding: '6px 14px',
    backgroundColor: '#e74c3c',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  statusSelect: {
    padding: '6px 10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
  },
};

export default AdminDashboard;