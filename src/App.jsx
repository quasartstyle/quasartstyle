import React, { useState, useEffect } from 'react';
import { BarChart3, Package, TrendingUp, Settings, LogOut, Calendar, Plus, Edit2, Trash2, X, Search, AlertCircle, PieChart, CheckCircle, Clock } from 'lucide-react';
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
    config: { costeEnvio: 0.18, costeLavado: 0.15, alertaDias: 30, alertaStock: 50, alertaMargen: 60 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const defaultData = {
      lotes: [],
      prendas: [],
      gastos: [],
      ingresos: [],
      config: { costeEnvio: 0.18, costeLavado: 0.15, alertaDias: 30, alertaStock: 50, alertaMargen: 60 }
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
    await setDoc(doc(db, 'quasart', 'data'), newData);
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
    prendasDefectuosas: '0', 
    formaPago: 'unico', 
    mesesPago: '1' 
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
      prendasDefectuosas: parseInt(formData.prendasDefectuosas),
      formaPago: formData.formaPago,
      mesesPago: parseInt(formData.mesesPago)
    };
    if (editingLote) {
      setData({ ...data, lotes: data.lotes.map(l => l.id === editingLote.id ? nuevoLote : l) });
    } else {
      setData({ ...data, lotes: [...data.lotes, nuevoLote] });
    }
    setShowModal(false);
    setEditingLote(null);
    setFormData({ proveedor: '', fecha: new Date().toISOString().slice(0, 10), cantidad: '', costeTotal: '', prendasDefectuosas: '0', formaPago: 'unico', mesesPago: '1' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Gestión de Lotes</h2>
        <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>
          <Plus size={20} />
          <span>Nuevo Lote</span>
        </button>
      </div>
      {data.lotes.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '0.5rem', padding: '3rem', textAlign: 'center' }}>
          <Package size={48} style={{ margin: '0 auto 1rem', color: '#9ca3af' }} />
          <p style={{ color: '#6b7280' }}>No hay lotes</p>
        </div>
      ) : (
        data.lotes.map(lote => (
          <div key={lote.id} style={{ background: 'white', borderRadius: '0.5rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <span style={{ padding: '0.25rem 0.75rem', background: '#dbeafe', color: '#1e40af', borderRadius: '1rem', fontSize: '0.875rem', fontWeight: '600' }}>{lote.codigo}</span>
                  <span style={{ color: '#6b7280' }}>{lote.proveedor}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                  <div><p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Fecha</p><p style={{ fontWeight: '600' }}>{new Date(lote.fecha).toLocaleDateString()}</p></div>
                  <div><p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Prendas</p><p style={{ fontWeight: '600' }}>{lote.cantidad}</p></div>
                  <div><p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Coste Total</p><p style={{ fontWeight: '600' }}>{lote.costeTotal.toFixed(2)} €</p></div>
                  <div><p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Coste Unitario</p><p style={{ fontWeight: '600' }}>{lote.costeUnitario.toFixed(2)} €</p></div>
                  <div><p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Forma de Pago</p><p style={{ fontWeight: '600' }}>{lote.mesesPago === 1 ? 'Pago único' : `${lote.mesesPago} meses`}</p></div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => { 
                  setEditingLote(lote); 
                  setFormData({ 
                    proveedor: lote.proveedor, 
                    fecha: lote.fecha, 
                    cantidad: lote.cantidad.toString(), 
                    costeTotal: lote.costeTotal.toString(), 
                    prendasDefectuosas: lote.prendasDefectuosas.toString(), 
                    formaPago: lote.mesesPago === 1 ? 'unico' : 'plazos', 
                    mesesPago: lote.mesesPago?.toString() || '1' 
                  }); 
                  setShowModal(true); 
                }} style={{ padding: '0.5rem', color: '#2563eb', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                  <Edit2 size={18} />
                </button>
                <button onClick={() => { 
                  if (window.confirm('¿Eliminar lote?')) setData({ ...data, lotes: data.lotes.filter(l => l.id !== lote.id) }); 
                }} style={{ padding: '0.5rem', color: '#dc2626', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))
      )}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: '0.5rem', maxWidth: '28rem', width: '100%', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{editingLote ? 'Editar' : 'Nuevo'} Lote</h3>
              <button onClick={() => { setShowModal(false); setEditingLote(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Proveedor</label>
                <input type="text" value={formData.proveedor} onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Fecha</label>
                <input type="date" value={formData.fecha} onChange={(e) => setFormData({ ...formData, fecha: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Cantidad</label>
                <input type="number" value={formData.cantidad} onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Coste Total</label>
                <input type="number" step="0.01" value={formData.costeTotal} onChange={(e) => setFormData({ ...formData, costeTotal: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Defectuosas</label>
                <input type="number" value={formData.prendasDefectuosas} onChange={(e) => setFormData({ ...formData, prendasDefectuosas: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Forma de Pago</label>
                <select value={formData.formaPago} onChange={(e) => { 
                  setFormData({ ...formData, formaPago: e.target.value, mesesPago: e.target.value === 'unico' ? '1' : formData.mesesPago }); 
                }} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}>
                  <option value="unico">Pago único</option>
                  <option value="plazos">A plazos</option>
                </select>
              </div>
              {formData.formaPago === 'plazos' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Número de Meses</label>
                  <select value={formData.mesesPago} onChange={(e) => setFormData({ ...formData, mesesPago: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}>
                    <option value="2">2 meses</option>
                    <option value="3">3 meses</option>
                    <option value="4">4 meses</option>
                    <option value="5">5 meses</option>
                    <option value="6">6 meses</option>
                    <option value="12">12 meses</option>
                  </select>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button onClick={() => { setShowModal(false); setEditingLote(null); }} style={{ flex: 1, padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', background: 'white', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={handleSubmit} style={{ flex: 1, padding: '0.5rem 1rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [data, saveData, loading] = useFirebaseData();

  const handleLogin = () => {
    if (password === '1qstothemoon!') {
      setIsAuthenticated(true);
      setPassword('');
    } else {
      alert('Contraseña incorrecta');
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #0f172a, #1e293b, #0f172a)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', padding: '2rem', width: '100%', maxWidth: '28rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ width: '6rem', height: '6rem', margin: '0 auto 1rem', background: '#2563eb', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={48} style={{ color: 'white' }} />
            </div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1f2937' }}>Quasart Style</h1>
            <p style={{ color: '#6b7280' }}>Panel de Control Vinted</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleLogin()} placeholder="Contraseña" style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', outline: 'none' }} />
            <button onClick={handleLogin} style={{ width: '100%', background: 'linear-gradient(to right, #2563eb, #1d4ed8)', color: 'white', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: '500', border: 'none', cursor: 'pointer' }}>
              Entrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#6b7280' }}>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <header style={{ background: 'white', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>Quasart Style</h1>
            <button onClick={() => setIsAuthenticated(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>
              <LogOut size={20} />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </header>
      <main style={{ maxWidth: '80rem', margin: '0 auto', padding: '1.5rem' }}>
        <LotesManager data={data} setData={saveData} />
      </main>
    </div>
  );
}

export default App;
