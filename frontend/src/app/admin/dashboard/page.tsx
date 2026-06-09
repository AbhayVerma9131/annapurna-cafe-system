'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export default function AdminDashboard() {
  const [role, setRole] = useState('');
  const [activeTab, setActiveTab] = useState('orders');
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  
  const [newCat, setNewCat] = useState('');
  const [newProd, setNewProd] = useState({ name: '', price: '', categoryId: '', description: '' });
  const [newTable, setNewTable] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('role');
    
    if (!token) {
      router.push('/admin/login');
    } else {
      setRole(userRole || '');
      fetchOrders();
      fetchMenu();
      fetchTables();
      connectWebSockets();
    }
  }, [router]);

  const fetchTables = () => {
    fetch('https://annapurna-cafe.onrender.com/api/tables').then(res => res.json()).then(setTables);
  };

  const fetchOrders = () => {
    fetch('https://annapurna-cafe.onrender.com/api/orders')
      .then(res => res.json())
      .then(data => setOrders(data));
  };

  const fetchMenu = () => {
    fetch('https://annapurna-cafe.onrender.com/api/categories').then(res => res.json()).then(setCategories);
    fetch('https://annapurna-cafe.onrender.com/api/products').then(res => res.json()).then(setProducts);
  };

  const connectWebSockets = () => {
    const client = new Client({
      webSocketFactory: () => new SockJS('https://annapurna-cafe.onrender.com/ws'),
      onConnect: () => {
        client.subscribe('/topic/orders', (message) => {
          const updatedOrder = JSON.parse(message.body);
          setOrders(prev => {
            const exists = prev.find(o => o.id === updatedOrder.id);
            if (exists) {
              return prev.map(o => o.id === updatedOrder.id ? updatedOrder : o);
            }
            return [updatedOrder, ...prev];
          });
        });
      }
    });
    client.activate();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    router.push('/admin/login');
  };

  const updateOrderStatus = async (id: number, status: string) => {
    await fetch(`https://annapurna-cafe.onrender.com/api/orders/${id}/status?status=${status}`, { method: 'PUT' });
    fetchOrders(); // refresh
  };

  const generateBill = async (id: number) => {
    const res = await fetch(`https://annapurna-cafe.onrender.com/api/bills/generate/${id}`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      window.open(`https://annapurna-cafe.onrender.com/api/bills/download/${data.id}`, '_blank');
    }
  };

  const addCategory = async () => {
    await fetch('https://annapurna-cafe.onrender.com/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCat, description: '' })
    });
    setNewCat('');
    fetchMenu();
  };

  const deleteCategory = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    await fetch(`https://annapurna-cafe.onrender.com/api/categories/${id}`, { method: 'DELETE' });
    fetchMenu();
  };

  const addProduct = async () => {
    await fetch('https://annapurna-cafe.onrender.com/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newProd, price: parseFloat(newProd.price), available: true, initialStock: 100 })
    });
    setNewProd({ name: '', price: '', categoryId: '', description: '' });
    fetchMenu();
  };

  const deleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    await fetch(`https://annapurna-cafe.onrender.com/api/products/${id}`, { method: 'DELETE' });
    fetchMenu();
  };

  const uploadImage = async (id: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    await fetch(`https://annapurna-cafe.onrender.com/api/products/${id}/image`, {
      method: 'POST',
      body: formData
    });
    fetchMenu();
  };

  const addTable = async () => {
    await fetch(`https://annapurna-cafe.onrender.com/api/tables?tableNumber=${newTable}`, { method: 'POST' });
    setNewTable('');
    fetchTables();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-cafe-dark text-white p-4 shadow-md sticky top-0 z-10 flex justify-between items-center">
        <h1 className="text-2xl font-extrabold tracking-tight">Admin Dashboard</h1>
        <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-bold text-sm transition-colors">Logout</button>
      </header>

      <main className="max-w-7xl mx-auto p-8">
        <div className="flex space-x-2 mb-8 bg-gray-100 p-1 rounded-xl inline-flex shadow-inner">
          <button onClick={() => setActiveTab('orders')} className={`px-6 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'orders' ? 'bg-white text-cafe-primary shadow' : 'text-gray-600 hover:bg-gray-200'}`}>Live Orders</button>
          <button onClick={() => setActiveTab('menu')} className={`px-6 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'menu' ? 'bg-white text-cafe-primary shadow' : 'text-gray-600 hover:bg-gray-200'}`}>Menu Setup</button>
          <button onClick={() => setActiveTab('tables')} className={`px-6 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'tables' ? 'bg-white text-cafe-primary shadow' : 'text-gray-600 hover:bg-gray-200'}`}>Tables & QR</button>
        </div>

        {activeTab === 'orders' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {orders.sort((a,b) => b.id - a.id).map(order => (
              <div key={order.id} className="bg-white rounded-xl shadow-md border border-gray-100 p-6 flex flex-col">
                <div className="flex justify-between items-start mb-4 border-b pb-3">
                  <div>
                    <h3 className="font-extrabold text-lg text-gray-800">{order.orderNumber}</h3>
                    <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
                    <p className="font-bold text-cafe-primary mt-1">{order.table ? `Table ${order.table.tableNumber}` : 'Takeaway'}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                    order.status === 'RECEIVED' ? 'bg-red-50 text-red-600 border-red-200' : 
                    order.status === 'PREPARING' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' : 
                    order.status === 'READY' ? 'bg-blue-50 text-blue-600 border-blue-200' : 
                    order.status === 'DELIVERED' ? 'bg-green-50 text-green-600 border-green-200' : 
                    'bg-gray-100 text-gray-600 border-gray-200'
                  }`}>
                    {order.status}
                  </span>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3 flex-1 mb-4">
                  {order.orderItems.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm mb-1">
                      <span>{item.quantity}x {item.product.name}</span>
                      <span className="font-medium">₹{item.priceAtTime * item.quantity}</span>
                    </div>
                  ))}
                  <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                    <span>Total</span>
                    <span>₹{order.totalAmount}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-auto">
                  {order.status === 'RECEIVED' && <button onClick={() => updateOrderStatus(order.id, 'PREPARING')} className="col-span-2 bg-blue-500 text-white py-2 rounded-lg font-bold">Start Preparing</button>}
                  {order.status === 'PREPARING' && <button onClick={() => updateOrderStatus(order.id, 'READY')} className="col-span-2 bg-green-500 text-white py-2 rounded-lg font-bold">Mark Ready</button>}
                  {order.status === 'READY' && (
                    <>
                      <button onClick={() => updateOrderStatus(order.id, 'DELIVERED')} className="bg-gray-800 text-white py-2 rounded-lg font-bold text-sm">Delivered</button>
                      <button onClick={() => generateBill(order.id)} className="bg-cafe-primary text-white py-2 rounded-lg font-bold text-sm">Print Bill</button>
                    </>
                  )}
                  {order.status === 'DELIVERED' && <button onClick={() => generateBill(order.id)} className="col-span-2 bg-gray-200 text-gray-800 py-2 rounded-lg font-bold text-sm">Re-print Bill</button>}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
              <h2 className="text-xl font-bold mb-4 flex items-center"><span className="text-2xl mr-2">🏷️</span> Manage Categories</h2>
              <div className="flex space-x-2">
                <input type="text" placeholder="Category Name" value={newCat} onChange={e => setNewCat(e.target.value)} className="flex-1 border p-2 rounded" />
                <button onClick={addCategory} className="bg-cafe-primary text-white px-4 rounded font-bold">Add</button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {categories.map(c => (
                  <span key={c.id} className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center space-x-2">
                    <span>{c.name}</span>
                    <button onClick={() => deleteCategory(c.id)} className="text-red-500 hover:text-red-700 font-bold ml-2">×</button>
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-4 flex items-center"><span className="text-2xl mr-2">🍔</span> Manage Menu Items</h2>
              <div className="space-y-3">
                <input type="text" placeholder="Product Name" value={newProd.name} onChange={e => setNewProd({ ...newProd, name: e.target.value })} className="w-full border p-2 rounded" />
                <input type="number" placeholder="Price (₹)" value={newProd.price} onChange={e => setNewProd({ ...newProd, price: e.target.value })} className="w-full border p-2 rounded" />
                <select value={newProd.categoryId} onChange={e => setNewProd({ ...newProd, categoryId: e.target.value })} className="w-full border p-2 rounded">
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button onClick={addProduct} className="w-full bg-cafe-secondary text-white py-2 rounded font-bold">Add Product</button>
              </div>
            </div>
            
            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-xl mb-4">Current Menu Items</h3>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="py-2">Image</th>
                    <th className="py-2">Name</th>
                    <th className="py-2">Category</th>
                    <th className="py-2">Price</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-3">
                        {p.imagePath ? (
                          <img src={`https://annapurna-cafe.onrender.com/api/products/images/${p.imagePath}`} alt={p.name} className="w-12 h-12 object-cover rounded-md border" />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center text-xs text-gray-500">No Img</div>
                        )}
                      </td>
                      <td className="py-3 font-medium">{p.name}</td>
                      <td className="py-3 text-gray-500">{p.category.name}</td>
                      <td className="py-3 font-bold text-cafe-primary">₹{p.price}</td>
                      <td className="py-3 text-right space-x-3">
                        <label className="cursor-pointer text-sm text-blue-500 font-semibold hover:underline">
                          Upload Photo
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                uploadImage(p.id, e.target.files[0]);
                              }
                            }} 
                          />
                        </label>
                        <button onClick={() => deleteProduct(p.id)} className="text-sm text-red-500 font-semibold hover:underline">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'tables' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-xl mb-4">Add Table</h3>
            <div className="flex space-x-2 mb-8 max-w-sm">
              <input type="text" placeholder="Table Number/Name" value={newTable} onChange={e => setNewTable(e.target.value)} className="flex-1 border p-2 rounded" />
              <button onClick={addTable} className="bg-cafe-primary text-white px-4 rounded font-bold">Create</button>
            </div>
            
            <h3 className="font-bold text-xl mb-4">Generated QRs</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {tables.map(t => (
                <div key={t.id} className="border rounded-xl p-4 text-center">
                  <h4 className="font-bold mb-2">Table {t.tableNumber}</h4>
                  <img src={`https://annapurna-cafe.onrender.com/api/tables/qr/${t.qrCodePath}`} alt="QR Code" className="w-full mb-2 border" />
                  <a href={`https://annapurna-cafe.onrender.com/api/tables/qr/${t.qrCodePath}`} download className="text-sm text-cafe-primary font-bold">Download PNG</a>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
