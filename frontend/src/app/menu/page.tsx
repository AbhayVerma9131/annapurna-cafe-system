'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  available: boolean;
  imagePath: string;
  category: { id: number; name: string };
}

interface CartItem {
  product: Product;
  quantity: number;
  specialNotes?: string;
}

export default function MenuPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tableId = searchParams.get('table');

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch('http://localhost:8080/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data));
      
    fetch('http://localhost:8080/api/products')
      .then(res => res.json())
      .then(data => setProducts(data));
  }, []);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.map(item => item.product.id === productId ? { ...item, quantity: Math.max(0, item.quantity - 1) } : item).filter(item => item.quantity > 0));
  };

  const updateNotes = (productId: number, notes: string) => {
    setCart(prev => prev.map(item => item.product.id === productId ? { ...item, specialNotes: notes } : item));
  };

  const submitOrder = async () => {
    if (!customerName || !mobileNumber) return alert('Please enter name and mobile number.');
    if (cart.length === 0) return alert('Cart is empty.');

    setIsSubmitting(true);
    const orderReq = {
      customerName,
      mobileNumber,
      tableId: tableId ? parseInt(tableId) : null,
      items: cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        specialNotes: item.specialNotes || ''
      }))
    };

    try {
      const res = await fetch('http://localhost:8080/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderReq)
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Order placed successfully! Order ID: ${data.orderNumber}`);
        setCart([]);
        setIsCartOpen(false);
      } else {
        alert('Failed to place order.');
      }
    } catch (e) {
      alert('Error connecting to server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'All' || p.category.name === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen pb-24">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-cafe-primary to-cafe-secondary text-white pt-12 pb-16 px-6 rounded-b-[40px] shadow-lg mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/food.png')]"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">Annapurna Cafe</h1>
          <p className="text-white/80 font-medium">
            {tableId ? `Ordering for Table ${tableId}` : 'Takeaway Order'} • Quick & Fresh
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4">
        {/* Categories */}
        <div className="flex overflow-x-auto space-x-3 mb-8 hide-scrollbar pb-2 px-1">
          <button 
            onClick={() => setActiveCategory('All')}
            className={`px-6 py-2.5 rounded-full whitespace-nowrap font-bold transition-all duration-300 shadow-sm ${activeCategory === 'All' ? 'bg-cafe-dark text-white shadow-md transform scale-105' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
          >
            🔥 All Items
          </button>
          {categories.map(cat => (
            <button 
              key={cat.id} 
              onClick={() => setActiveCategory(cat.name)}
              className={`px-6 py-2.5 rounded-full whitespace-nowrap font-bold transition-all duration-300 shadow-sm ${activeCategory === cat.name ? 'bg-cafe-dark text-white shadow-md transform scale-105' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {products
            .filter(p => activeCategory === 'All' || p.category.name === activeCategory)
            .map(product => (
              <div key={product.id} className="bg-white/80 backdrop-blur-md rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-slide-up border border-white/40">
                {product.imagePath ? (
                  <img src={`http://localhost:8080/api/products/images/${product.imagePath}`} alt={product.name} className="w-full h-48 object-cover" />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  </div>
                )}
                
                <div className="p-5">
                  <h3 className="font-bold text-xl text-gray-800 mb-1">{product.name}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 h-10 mb-3">{product.description || 'Delicious freshly prepared item.'}</p>
                  
                  <div className="flex justify-between items-center mt-4">
                    <span className="font-extrabold text-2xl text-cafe-primary">₹{product.price}</span>
                    {product.available ? (
                      <div className="flex items-center space-x-2">
                        {cart.find(c => c.product.id === product.id) && (
                          <>
                            <button onClick={() => removeFromCart(product.id)} className="bg-gray-200 text-gray-700 w-8 h-8 rounded-full font-bold">-</button>
                            <span className="font-bold">{cart.find(c => c.product.id === product.id)?.quantity}</span>
                          </>
                        )}
                        <button onClick={() => addToCart(product)} className="bg-cafe-secondary text-white w-8 h-8 rounded-full font-bold">+</button>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1 rounded-full border border-red-100">Out of Stock</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Floating Cart Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-0 right-0 px-4 z-50 animate-slide-up">
          <div className="max-w-3xl mx-auto glass rounded-2xl shadow-2xl p-4 flex justify-between items-center border-t-4 border-cafe-primary bg-white">
            <div>
              <p className="text-xs text-gray-600 font-bold uppercase tracking-wider">Your Order</p>
              <p className="font-extrabold text-xl">{cart.reduce((sum, item) => sum + item.quantity, 0)} items <span className="text-cafe-primary">• ₹{cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)}</span></p>
            </div>
            <button 
              onClick={() => setIsCartOpen(true)}
              className="bg-cafe-dark hover:bg-black text-white px-6 py-3 rounded-xl font-bold shadow-md transition-colors"
            >
              View Cart &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Cart Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl animate-slide-up">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-2xl font-extrabold text-gray-800">Your Cart</h2>
              <button onClick={() => setIsCartOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 font-bold text-gray-600">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cart.map(item => (
                <div key={item.product.id} className="flex flex-col">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <h4 className="font-bold text-gray-800">{item.product.name}</h4>
                      <p className="text-sm text-cafe-primary font-bold">₹{item.product.price} x {item.quantity}</p>
                    </div>
                    <div className="flex items-center space-x-3 bg-gray-100 rounded-full px-2 py-1">
                      <button onClick={() => removeFromCart(item.product.id)} className="w-6 h-6 flex items-center justify-center font-bold text-gray-600">-</button>
                      <span className="font-bold text-gray-800">{item.quantity}</span>
                      <button onClick={() => addToCart(item.product)} className="w-6 h-6 flex items-center justify-center font-bold text-cafe-primary">+</button>
                    </div>
                  </div>
                  <div className="mt-2 text-xs">
                    <input 
                      type="text" 
                      placeholder="Special instructions? (e.g. less spicy)" 
                      className="w-full border rounded-lg p-2 bg-gray-50 focus:ring-2 focus:ring-cafe-primary focus:border-transparent outline-none transition-all"
                      value={item.specialNotes || ''}
                      onChange={(e) => updateNotes(item.product.id, e.target.value)}
                    />
                  </div>
                </div>
              ))}
              {cart.length === 0 && (
                <div className="text-center text-gray-400 py-12 flex flex-col items-center">
                  <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                  <p className="font-medium text-lg">Your cart is empty</p>
                  <p className="text-sm mt-1">Add some delicious items from the menu!</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50">
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Your Name</label>
                  <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-cafe-primary focus:border-transparent outline-none transition-all" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Mobile Number</label>
                  <input type="tel" value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-cafe-primary focus:border-transparent outline-none transition-all" placeholder="9876543210" />
                </div>
              </div>
              
              <div className="flex justify-between items-center mb-6 text-lg">
                <span className="font-bold text-gray-600">Total to Pay</span>
                <span className="font-extrabold text-2xl text-cafe-primary">₹{cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)}</span>
              </div>

              <button 
                onClick={submitOrder} 
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-cafe-primary to-cafe-secondary text-white font-extrabold py-4 rounded-xl shadow-lg disabled:opacity-50 hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
              >
                {isSubmitting ? 'Sending to Kitchen...' : 'Place Order Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
