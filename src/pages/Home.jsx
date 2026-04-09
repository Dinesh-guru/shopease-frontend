import { useState, useEffect } from 'react';
import { getProducts } from '../api/productApi';
import { getCategories } from '../api/categoryApi';
import { useDispatch } from 'react-redux';
import { fetchCart } from '../store/slices/cartSlice';
import { useSelector } from 'react-redux';
import ProductCard from '../components/ProductCard';
import { toast } from 'react-toastify';

const Home = () => {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);

  // Products state
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter state
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);

  // Pagination state
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 8;

  // Load cart on mount if logged in
  useEffect(() => {
    if (token) dispatch(fetchCart());
  }, [token]);

  // Load categories once
  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.data))
      .catch(() => toast.error('Failed to load categories'));
  }, []);

  // Load products when filters or page change
  useEffect(() => {
    loadProducts();
  }, [page, search, selectedCategory]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await getProducts(
        page,
        pageSize,
        search,
        selectedCategory
      );
      setProducts(res.data.content);
      setTotalPages(res.data.totalPages);
      setTotalElements(res.data.totalElements);
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(0); // reset to first page on new search
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    setPage(0);
  };

  const handleClearFilters = () => {
    setSearch('');
    setSearchInput('');
    setSelectedCategory('');
    setPage(0);
  };

  return (
    <div style={styles.page}>

      {/* Hero Banner */}
      <div style={styles.hero}>
        <h1 style={styles.heroTitle}>Welcome to ShopEase</h1>
        <p style={styles.heroSubtitle}>
          Discover amazing products at unbeatable prices
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} style={styles.searchForm}>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search for products..."
            style={styles.searchInput}
          />
          <button type="submit" style={styles.searchBtn}>
            Search
          </button>
        </form>
      </div>

      <div style={styles.container}>

        {/* Category Filter */}
        <div style={styles.filterRow}>
          <div style={styles.categories}>
            <button
              onClick={() => handleCategoryChange('')}
              style={selectedCategory === ''
                ? styles.categoryBtnActive
                : styles.categoryBtn}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                style={String(selectedCategory) === String(cat.id)
                  ? styles.categoryBtnActive
                  : styles.categoryBtn}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Active filters indicator */}
          {(search || selectedCategory) && (
            <div style={styles.activeFilters}>
              <span style={styles.filterInfo}>
                {totalElements} result{totalElements !== 1 ? 's' : ''}
                {search && ` for "${search}"`}
              </span>
              <button
                onClick={handleClearFilters}
                style={styles.clearBtn}
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p style={styles.loadingText}>Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div style={styles.emptyContainer}>
            <p style={styles.emptyText}>🔍 No products found</p>
            <p style={styles.emptySubtext}>
              Try a different search or category
            </p>
            <button
              onClick={handleClearFilters}
              style={styles.clearFiltersBtn}
            >
              View all products
            </button>
          </div>
        ) : (
          <div style={styles.grid}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={styles.pagination}>
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 0}
              style={page === 0 ? styles.pagesBtnDisabled : styles.pagesBtn}
            >
              ← Previous
            </button>

            <div style={styles.pageNumbers}>
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  onClick={() => setPage(index)}
                  style={page === index
                    ? styles.pageNumberActive
                    : styles.pageNumber}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages - 1}
              style={page === totalPages - 1
                ? styles.pagesBtnDisabled
                : styles.pagesBtn}
            >
              Next →
            </button>
          </div>
        )}

        {/* Results info */}
        {products.length > 0 && (
          <p style={styles.resultsInfo}>
            Showing {page * pageSize + 1}–
            {Math.min((page + 1) * pageSize, totalElements)} of{' '}
            {totalElements} products
          </p>
        )}
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: 'calc(100vh - 64px)',
    backgroundColor: '#f0f2f5',
  },
  hero: {
    background: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
    padding: '60px 20px',
    textAlign: 'center',
    color: '#fff',
  },
  heroTitle: {
    fontSize: '42px',
    fontWeight: '800',
    marginBottom: '12px',
  },
  heroSubtitle: {
    fontSize: '18px',
    opacity: 0.85,
    marginBottom: '30px',
  },
  searchForm: {
    display: 'flex',
    maxWidth: '560px',
    margin: '0 auto',
    gap: '10px',
  },
  searchInput: {
    flex: 1,
    padding: '13px 18px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '15px',
    outline: 'none',
  },
  searchBtn: {
    padding: '13px 28px',
    backgroundColor: '#2ecc71',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '30px 20px',
  },
  filterRow: {
    marginBottom: '24px',
  },
  categories: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    marginBottom: '12px',
  },
  categoryBtn: {
    padding: '8px 18px',
    border: '1px solid #ddd',
    borderRadius: '20px',
    backgroundColor: '#fff',
    fontSize: '14px',
    cursor: 'pointer',
    color: '#555',
  },
  categoryBtnActive: {
    padding: '8px 18px',
    border: '1px solid #3498db',
    borderRadius: '20px',
    backgroundColor: '#3498db',
    fontSize: '14px',
    cursor: 'pointer',
    color: '#fff',
    fontWeight: '600',
  },
  activeFilters: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginTop: '8px',
  },
  filterInfo: {
    fontSize: '14px',
    color: '#555',
  },
  clearBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#e74c3c',
    fontSize: '14px',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '24px',
    marginBottom: '32px',
  },
  loadingContainer: {
    textAlign: 'center',
    padding: '80px 0',
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '4px solid #f0f2f5',
    borderTop: '4px solid #3498db',
    borderRadius: '50%',
    margin: '0 auto 16px',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    color: '#7f8c8d',
    fontSize: '16px',
  },
  emptyContainer: {
    textAlign: 'center',
    padding: '80px 0',
  },
  emptyText: {
    fontSize: '24px',
    color: '#2c3e50',
    marginBottom: '8px',
  },
  emptySubtext: {
    color: '#7f8c8d',
    fontSize: '15px',
    marginBottom: '20px',
  },
  clearFiltersBtn: {
    backgroundColor: '#3498db',
    color: '#fff',
    border: 'none',
    padding: '10px 24px',
    borderRadius: '8px',
    fontSize: '15px',
    cursor: 'pointer',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '12px',
    margin: '32px 0 16px',
  },
  pagesBtn: {
    padding: '9px 20px',
    border: '1px solid #3498db',
    borderRadius: '8px',
    backgroundColor: '#fff',
    color: '#3498db',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  pagesBtnDisabled: {
    padding: '9px 20px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    backgroundColor: '#f5f5f5',
    color: '#bbb',
    fontSize: '14px',
    cursor: 'not-allowed',
  },
  pageNumbers: {
    display: 'flex',
    gap: '6px',
  },
  pageNumber: {
    width: '36px',
    height: '36px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    backgroundColor: '#fff',
    color: '#555',
    fontSize: '14px',
    cursor: 'pointer',
  },
  pageNumberActive: {
    width: '36px',
    height: '36px',
    border: '1px solid #3498db',
    borderRadius: '6px',
    backgroundColor: '#3498db',
    color: '#fff',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: '700',
  },
  resultsInfo: {
    textAlign: 'center',
    color: '#7f8c8d',
    fontSize: '13px',
  },
};

export default Home;