import React, { useState, useEffect } from 'react';
import { BarChart3, Package, TrendingUp, Settings, LogOut, Download, Calendar, Plus, Edit2, Trash2, X, Search, AlertCircle } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDghfp6jJPvRZyJACb5DeRJTF_EvsRnorY",
  authDomain: "quasartstyle-vinted.firebaseapp.com",
  projectId: "quasartstyle-vinted",
  storageBucket: "quasartstyle-vinted.firebasestorage.app",
  messagingSenderId: "188988784305",
  appId: "1:188988784305:web:d45d34f114882a2c58ac90"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const useFirebaseData = () => {
  const [data, setData] = useState({
    lotes: [],
    prendas: [],
    gastos: [],
    ingresos: [],
    config: {
      costeEnvio: 0.18,
      costeLavado: 0.15,
      alertaDias: 30,
      alertaStock: 50,
      alertaMargen: 60,
      alertaDefectuosas: 40
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const defaultData = {
      lotes: [],
      prendas: [],
      gastos: [],
      ingresos: [],
      config: {
        costeEnvio: 0.18,
        costeLavado: 0.15,
        alertaDias: 30,
        alertaStock: 50,
        alertaMargen: 60,
        alertaDefectuosas: 40
      }
    };

    const docRef = doc(db, 'quasart', 'data');
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setData(docSnap.data());
      } else {
        setDoc(docRef, defaultData);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const saveData = async (newData) => {
    setData(newData);
    const docRef = doc(db, 'quasart', 'data');
    await setDoc(docRef, newData);
  };

  return [data, saveData, loading];
};

const LotesManager = ({ data, setData }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingLote, setEditingLote] = useState(null);
  const [formData, setFormData] = useState({
    proveedor: '',
    fecha: new Date().toISOString().slice(0, 10),
    cantidad: '',
    costeTotal: '',
    prendasDefectuosas: '0'
  });

  const generarCodigoLote = (proveedor, fecha) => {
    const prov = proveedor.slice(0, 3).toUpperCase();
    const [anio, mes, dia] = fecha.split('-');
    return `${prov}-${dia}${mes}${anio.slice(2)}`;
  };

  const handleSubmit = () => {
    if (!formData.proveedor || !formData.cantidad || !formData.costeTotal) {
      alert('Completa todos los campos');
      return;
    }

    const costeUnitario = parseFloat(formData.costeTotal) / parseInt(formData.cantidad);
    const codigo = generarCodigoLote(formData.proveedor, formData.fecha);

    const nuevoLote = {
      id: editingLote?.id || Date.now().toString(),
      codigo,
      proveedor: formData.proveedor,
      fecha: formData.fecha,
      cantidad: parseInt(formData.cantidad),
      costeTotal: parseFloat(formData.costeTotal),
      costeUnitario,
      prendasDefectuosas: parseInt(formData.prendasDefectuosas)
    };

    if (editingLote) {
      setData({ ...data, lotes: data.lotes.map(l => l.id === editingLote.id ? nuevoLote : l) });
    } else {
      setData({ ...data, lotes: [...data.lotes, nuevoLote] });
    }

    setShowModal(false);
    setEditingLote(null);
    setFormData({ proveedor: '', fecha: new Date().toISOString().slice(0, 10), cantidad: '', costeTotal: '', prendasDefectuosas: '0' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion de Lotes</h2>
        <button onClick={() => setShowModal(true)} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={20} />
          <span>Nuevo Lote</span>
        </button>
      </div>

      <div className="grid gap-4">
        {data.lotes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Package size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No hay lotes</p>
          </div>
        ) : (
          data.lotes.map(lote => (
            <div key={lote.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">{lote.codigo}</span>
                    <span className="text-gray-600">{lote.proveedor}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Fecha</p>
                      <p className="font-semibold">{new Date(lote.fecha).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Prendas</p>
                      <p className="font-semibold">{lote.cantidad}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Coste Total</p>
                      <p className="font-semibold">{lote.costeTotal.toFixed(2)} €</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Coste Unitario</p>
                      <p className="font-semibold">{lote.costeUnitario.toFixed(2)} €</p>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => { setEditingLote(lote); setFormData({ proveedor: lote.proveedor, fecha: lote.fecha, cantidad: lote.cantidad.toString(), costeTotal: lote.costeTotal.toString(), prendasDefectuosas: lote.prendasDefectuosas.toString() }); setShowModal(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => { if (window.confirm('Eliminar lote?')) setData({ ...data, lotes: data.lotes.filter(l => l.id !== lote.id) }); }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">{editingLote ? 'Editar' : 'Nuevo'} Lote</h3>
              <button onClick={() => { setShowModal(false); setEditingLote(null); }} className="text-gray-500"><X size={24} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Proveedor</label>
                <input type="text" value={formData.proveedor} onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="Humana" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fecha</label>
                <input type="date" value={formData.fecha} onChange={(e) => setFormData({ ...formData, fecha: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cantidad</label>
                <input type="number" value={formData.cantidad} onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="100" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Coste Total</label>
                <input type="number" step="0.01" value={formData.costeTotal} onChange={(e) => setFormData({ ...formData, costeTotal: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="450.00" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Defectuosas</label>
                <input type="number" value={formData.prendasDefectuosas} onChange={(e) => setFormData({ ...formData, prendasDefectuosas: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="0" />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={() => { setShowModal(false); setEditingLote(null); }} className="flex-1 px-4 py-2 border rounded-lg">Cancelar</button>
              <button onClick={handleSubmit} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const InventarioManager = ({ data, setData }) => {
  const [showModal, setShowModal] = useState(false);
  const [filtro, setFiltro] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [formData, setFormData] = useState({
    loteId: '', tipo: '', talla: '', precioObjetivo: '', precioVentaReal: '', fechaSubida: '', fechaVentaConfirmada: ''
  });

  const tipos = ['Camiseta', 'Camisa', 'Pantalon', 'Vestido', 'Chaqueta', 'Sudadera', 'Jersey', 'Zapatos', 'Otro'];

  const handleSubmit = () => {
    if (!formData.loteId || !formData.tipo || !formData.talla) {
      alert('Completa campos obligatorios');
      return;
    }

    const lote = data.lotes.find(l => l.id === formData.loteId);
    if (!lote) return;

    let estado = 'comprada';
    if (formData.fechaVentaConfirmada) estado = 'vendida-confirmada';
    else if (formData.fechaSubida) estado = 'subida';

    const nueva = {
      id: Date.now().toString(),
      loteId: formData.loteId,
      loteCodigo: lote.codigo,
      sku: `QS-${Date.now().toString().slice(-8)}`,
      tipo: formData.tipo,
      talla: formData.talla,
      precioCompra: lote.costeUnitario,
      precioObjetivo: parseFloat(formData.precioObjetivo) || 0,
      precioVentaReal: parseFloat(formData.precioVentaReal) || 0,
      fechaSubida: formData.fechaSubida || null,
      fechaVentaConfirmada: formData.fechaVentaConfirmada || null,
      estado
    };

    setData({ ...data, prendas: [...data.prendas, nueva] });
    setShowModal(false);
    setFormData({ loteId: '', tipo: '', talla: '', precioObjetivo: '', precioVentaReal: '', fechaSubida: '', fechaVentaConfirmada: '' });
  };

  const prendas = data.prendas.filter(p => {
    const matchFiltro = filtro === 'todos' || p.estado === filtro;
    const matchBusqueda = p.sku.toLowerCase().includes(busqueda.toLowerCase()) || p.tipo.toLowerCase().includes(busqueda.toLowerCase());
    return matchFiltro && matchBusqueda;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Inventario</h2>
        <button onClick={() => { if (data.lotes.length === 0) alert('Crea un lote primero'); else setShowModal(true); }} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg">
          <Plus size={20} />
          <span>Nueva Prenda</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar..." className="w-full pl-10 pr-4 py-2 border rounded-lg" />
          </div>
          <select value={filtro} onChange={(e) => setFiltro(e.target.value)} className="px-4 py-2 border rounded-lg">
            <option value="todos">Todos</option>
            <option value="comprada">Compradas</option>
            <option value="subida">En Vinted</option>
            <option value="vendida-confirmada">Vendidas</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4">
        {prendas.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Package size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No hay prendas</p>
          </div>
        ) : (
          prendas.map(p => (
            <div key={p.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">{p.sku}</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">{p.estado}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div><p className="text-gray-600">Lote</p><p className="font-semibold">{p.loteCodigo}</p></div>
                    <div><p className="text-gray-600">Tipo</p><p className="font-semibold">{p.tipo}</p></div>
                    <div><p className="text-gray-600">Talla</p><p className="font-semibold">{p.talla}</p></div>
                    <div><p className="text-gray-600">Compra</p><p className="font-semibold">{p.precioCompra.toFixed(2)} €</p></div>
                    <div><p className="text-gray-600">Venta</p><p className="font-semibold text-green-600">{p.precioVentaReal > 0 ? `${p.precioVentaReal.toFixed(2)} €` : '-'}</p></div>
                  </div>
                </div>
                <button onClick={() => { if (window.confirm('Eliminar?')) setData({ ...data, prendas: data.prendas.filter(pr => pr.id !== p.id) }); }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-screen overflow-y-auto">
            <div className="flex justify-between mb-6">
              <h3 className="text-xl font-bold">Nueva Prenda</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500"><X size={24} /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Lote</label>
                  <select value={formData.loteId} onChange={(e) => setFormData({ ...formData, loteId: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                    <option value="">Selecciona</option>
                    {data.lotes.map(l => <option key={l.id} value={l.id}>{l.codigo}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo</label>
                  <select value={formData.tipo} onChange={(e) => setFormData({ ...formData, tipo: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                    <option value="">Selecciona</option>
                    {tipos.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Talla</label>
                  <input type="text" value={formData.talla} onChange={(e) => setFormData({ ...formData, talla: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="M, L, 42..." />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Precio Objetivo</label>
                  <input type="number" step="0.01" value={formData.precioObjetivo} onChange={(e) => setFormData({ ...formData, precioObjetivo: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="20.00" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Fecha Subida</label>
                  <input type="date" value={formData.fechaSubida} onChange={(e) => setFormData({ ...formData, fechaSubida: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Precio Venta Real</label>
                  <input type="number" step="0.01" value={formData.precioVentaReal} onChange={(e) => setFormData({ ...formData, precioVentaReal: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="18.50" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fecha Venta Confirmada</label>
                <input type="date" value={formData.fechaVentaConfirmada} onChange={(e) => setFormData({ ...formData, fechaVentaConfirmada: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border rounded-lg">Cancelar</button>
              <button onClick={handleSubmit} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg">Crear</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ConfigManager = ({ data, setData }) => {
  const [tab, setTab] = useState('costes');

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Configuracion</h2>
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b flex px-6">
          <button onClick={() => setTab('costes')} className={`py-4 px-4 border-b-2 font-medium ${tab === 'costes' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>Costes</button>
          <button onClick={() => setTab('alertas')} className={`py-4 px-4 border-b-2 font-medium ${tab === 'alertas' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>Alertas</button>
        </div>
        <div className="p-6">
          {tab === 'costes' && (
            <div className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-sm font-medium mb-1">Coste Envio</label>
                <input type="number" step="0.01" value={data.config.costeEnvio} onChange={(e) => setData({ ...data, config: { ...data.config, costeEnvio: parseFloat(e.target.value) } })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Coste Lavado</label>
                <input type="number" step="0.01" value={data.config.costeLavado} onChange={(e) => setData({ ...data, config: { ...data.config, costeLavado: parseFloat(e.target.value) } })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
            </div>
          )}
          {tab === 'alertas' && (
            <div className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-sm font-medium mb-1">Dias sin vender</label>
                <input type="number" value={data.config.alertaDias} onChange={(e) => setData({ ...data, config: { ...data.config, alertaDias: parseInt(e.target.value) } })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Stock minimo</label>
                <input type="number" value={data.config.alertaStock} onChange={(e) => setData({ ...data, config: { ...data.config, alertaStock: parseInt(e.target.value) } })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Margen minimo %</label>
                <input type="number" value={data.config.alertaMargen} onChange={(e) => setData({ ...data, config: { ...data.config, alertaMargen: parseInt(e.target.value) } })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [currentView, setCurrentView] = useState('dashboard');
  const [data, setData, loading] = useFirebaseData();
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const handleLogin = () => {
    if (password === '1qstothemoon!') {
      setIsAuthenticated(true);
      setPassword('');
    } else {
      alert('Contraseña incorrecta');
    }
  };

  const calculateMonthMetrics = (month) => {
    const prendasMes = data.prendas.filter(p => {
      const fechaVenta = p.fechaVentaConfirmada || p.fechaVentaPendiente;
      return fechaVenta && fechaVenta.startsWith(month);
    });

    const gastosMes = data.gastos.filter(g => g.fecha && g.fecha.startsWith(month));
    const ingresosMes = data.ingresos.filter(i => i.fecha && i.fecha.startsWith(month));

    const totalVentas = prendasMes.reduce((sum, p) => sum + (p.precioVentaReal || 0), 0);
    const totalGastos = gastosMes.reduce((sum, g) => sum + g.cantidad, 0);
    const totalIngresos = ingresosMes.reduce((sum, i) => sum + i.cantidad, 0);
    const beneficioNeto = totalVentas + totalIngresos - totalGastos;

    const prendasVendidas = prendasMes.length;
    const ticketMedio = prendasVendidas > 0 ? totalVentas / prendasVendidas : 0;
    
    const costeCompraTotal = prendasMes.reduce((sum, p) => sum + (p.precioCompra || 0), 0);
    const margenBruto = totalVentas > 0 ? ((totalVentas - costeCompraTotal) / totalVentas) * 100 : 0;

    return {
      totalVentas,
      totalGastos,
      totalIngresos,
      beneficioNeto,
      prendasVendidas,
      ticketMedio,
      margenBruto
    };
  };

  const currentMetrics = calculateMonthMetrics(selectedMonth);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const isCurrentMonth = selectedMonth === thisMonth;

  const alerts = [];
  const stockActual = data.prendas.filter(p => p.estado === 'comprada' || p.estado === 'subida').length;
  
  if (stockActual < data.config.alertaStock) {
    alerts.push({ tipo: 'stock', mensaje: `Stock bajo: ${stockActual} prendas` });
  }
  
  if (currentMetrics.margenBruto < data.config.alertaMargen) {
    alerts.push({ tipo: 'margen', mensaje: `Margen bajo: ${currentMetrics.margenBruto.toFixed(1)}%` });
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">
              quasart<span className="italic">STYLE</span>
            </h1>
            <p className="text-gray-600">Panel de Control Vinted</p>
          </div>
          
          <div className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="Contraseña"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all"
            >
              Entrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">
              quasart<span className="italic">STYLE</span>
            </h1>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <LogOut size={20} />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex space-x-2 overflow-x-auto">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                currentView === 'dashboard' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <BarChart3 size={20} />
              <span className="font-medium">Dashboard</span>
            </button>
            <button
              onClick={() => setCurrentView('lotes')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                currentView === 'lotes' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Package size={20} />
              <span className="font-medium">Lotes</span>
            </button>
            <button
              onClick={() => setCurrentView('inventario')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                currentView === 'inventario' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <TrendingUp size={20} />
              <span className="font-medium">Inventario</span>
            </button>
            <button
              onClick={() => setCurrentView('config')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                currentView === 'config' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Settings size={20} />
              <span className="font-medium">Configuración</span>
            </button>
          </div>
        </div>
      </nav>

      {alerts.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="text-yellow-600 flex-shrink-0" size={20} />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900 mb-2">Alertas activas</h3>
                <ul className="space-y-1">
                  {alerts.map((alert, idx) => (
                    <li key={idx} className="text-yellow-800 text-sm">{alert.mensaje}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-6">
        {currentView === 'dashboard' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center space-x-4">
                  <Calendar size={20} className="text-gray-600" />
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {!isCurrentMonth && (
                    <button
                      onClick={() => setSelectedMonth(thisMonth)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Mes actual
                    </button>
                  )}
                </div>
                <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  <Download size={18} />
                  <span>Exportar</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-600" />
                <div className="p-6">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Ventas</h3>
                  <p className="text-2xl font-bold text-gray-900">{currentMetrics.totalVentas.toFixed(2)} €</p>
                  <p className="text-xs text-gray-500 mt-1">{currentMetrics.prendasVendidas} prendas</p>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-red-500 to-red-600" />
                <div className="p-6">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Gastos</h3>
                  <p className="text-2xl font-bold text-gray-900">{currentMetrics.totalGastos.toFixed(2)} €</p>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-green-500 to-green-600" />
                <div className="p-6">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Beneficio Neto</h3>
                  <p className="text-2xl font-bold text-gray-900">{currentMetrics.beneficioNeto.toFixed(2)} €</p>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-purple-500 to-purple-600" />
                <div className="p-6">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Margen Bruto</h3>
                  <p className="text-2xl font-bold text-gray-900">{currentMetrics.margenBruto.toFixed(1)} %</p>
                  <p className="text-xs text-gray-500 mt-1">Ticket: {currentMetrics.ticketMedio.toFixed(2)} €</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">Stock actual</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {data.prendas.filter(p => p.estado === 'comprada').length}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Compradas</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-900">
                    {data.prendas.filter(p => p.estado === 'subida').length}
                  </div>
                  <div className="text-sm text-blue-600 mt-1">En Vinted</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-900">
                    {data.prendas.filter(p => p.estado === 'vendida-pendiente').length}
                  </div>
                  <div className="text-sm text-yellow-600 mt-1">Pendientes</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-900">
                    {data.prendas.filter(p => p.estado === 'vendida-confirmada').length}
                  </div>
                  <div className="text-sm text-green-600 mt-1">Vendidas</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'lotes' && <LotesManager data={data} setData={setData} />}
        {currentView === 'inventario' && <InventarioManager data={data} setData={setData} />}
        {currentView === 'config' && <ConfigManager data={data} setData={setData} />}
      </main>
    </div>
  );
}

export default App;
