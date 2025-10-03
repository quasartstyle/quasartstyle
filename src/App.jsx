import React, { useState, useEffect } from 'react';
import { BarChart3, Package, TrendingUp, Settings, LogOut, Calendar, Plus, Edit2, Trash2, X, Search, AlertCircle, PieChart } from 'lucide-react';
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
    config: { costeEnvio: 0.18, costeLavado: 0.15, alertaDias: 30, alertaStock: 50, alertaMargen: 60, alertaDefectuosas: 40 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const defaultData = {
      lotes: [],
      prendas: [],
      gastos: [],
      ingresos: [],
      config: { costeEnvio: 0.18, costeLavado: 0.15, alertaDias: 30, alertaStock: 50, alertaMargen: 60, alertaDefectuosas: 40 }
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

// COMPONENTE LOTES
const LotesManager = ({ data, setData }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingLote, setEditingLote] = useState(null);
  const [formData, setFormData] = useState({ proveedor: '', fecha: new Date().toISOString().slice(0, 10), cantidad: '', costeTotal: '', prendasDefectuosas: '0' });

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
      codigo, proveedor: formData.proveedor, fecha: formData.fecha,
      cantidad: parseInt(formData.cantidad), costeTotal: parseFloat(formData.costeTotal),
      costeUnitario, prendasDefectuosas: parseInt(formData.prendasDefectuosas)
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
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => { setEditingLote(lote); setFormData({ proveedor: lote.proveedor, fecha: lote.fecha, cantidad: lote.cantidad.toString(), costeTotal: lote.costeTotal.toString(), prendasDefectuosas: lote.prendasDefectuosas.toString() }); setShowModal(true); }} style={{ padding: '0.5rem', color: '#2563eb', background: 'transparent', border: 'none', cursor: 'pointer' }}><Edit2 size={18} /></button>
                <button onClick={() => { if (window.confirm('Eliminar?')) setData({ ...data, lotes: data.lotes.filter(l => l.id !== lote.id) }); }} style={{ padding: '0.5rem', color: '#dc2626', background: 'transparent', border: 'none', cursor: 'pointer' }}><Trash2 size={18} /></button>
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
              <button onClick={() => { setShowModal(false); setEditingLote(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div><label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Proveedor</label><input type="text" value={formData.proveedor} onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} /></div>
              <div><label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Fecha</label><input type="date" value={formData.fecha} onChange={(e) => setFormData({ ...formData, fecha: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} /></div>
              <div><label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Cantidad</label><input type="number" value={formData.cantidad} onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} /></div>
              <div><label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Coste Total</label><input type="number" step="0.01" value={formData.costeTotal} onChange={(e) => setFormData({ ...formData, costeTotal: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} /></div>
              <div><label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Defectuosas</label><input type="number" value={formData.prendasDefectuosas} onChange={(e) => setFormData({ ...formData, prendasDefectuosas: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} /></div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button onClick={() => { setShowModal(false); setEditingLote(null); }} style={{ flex: 1, padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', background: 'white', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleSubmit} style={{ flex: 1, padding: '0.5rem 1rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
// CONTINÚA AQUÍ DESPUÉS DE LA PARTE 1

// COMPONENTE INVENTARIO
const InventarioManager = ({ data, setData }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingPrenda, setEditingPrenda] = useState(null);
  const [filtro, setFiltro] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [formData, setFormData] = useState({ loteId: '', tipo: '', talla: '', precioObjetivo: '', precioVentaReal: '', fechaSubida: '', fechaVentaPendiente: '', fechaVentaConfirmada: '' });
  const tipos = ['Camiseta', 'Camisa', 'Pantalon', 'Vestido', 'Chaqueta', 'Sudadera', 'Jersey', 'Zapatos', 'Otro'];

  const resetForm = () => {
    setFormData({ loteId: '', tipo: '', talla: '', precioObjetivo: '', precioVentaReal: '', fechaSubida: '', fechaVentaPendiente: '', fechaVentaConfirmada: '' });
    setEditingPrenda(null);
  };

  const handleEdit = (prenda) => {
    setEditingPrenda(prenda);
    setFormData({ loteId: prenda.loteId, tipo: prenda.tipo, talla: prenda.talla, precioObjetivo: prenda.precioObjetivo.toString(), precioVentaReal: prenda.precioVentaReal.toString(), fechaSubida: prenda.fechaSubida || '', fechaVentaPendiente: prenda.fechaVentaPendiente || '', fechaVentaConfirmada: prenda.fechaVentaConfirmada || '' });
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!formData.loteId || !formData.tipo || !formData.talla) {
      alert('Completa campos obligatorios');
      return;
    }
    const lote = data.lotes.find(l => l.id === formData.loteId);
    if (!lote) return;
    let estado = 'comprada';
    if (formData.fechaVentaConfirmada) estado = 'vendida-confirmada';
    else if (formData.fechaVentaPendiente) estado = 'vendida-pendiente';
    else if (formData.fechaSubida) estado = 'subida';
    const prendaData = {
      id: editingPrenda?.id || Date.now().toString(), loteId: formData.loteId, loteCodigo: lote.codigo,
      sku: editingPrenda?.sku || `QS-${Date.now().toString().slice(-8)}`, tipo: formData.tipo, talla: formData.talla,
      precioCompra: lote.costeUnitario, precioObjetivo: parseFloat(formData.precioObjetivo) || 0,
      precioVentaReal: parseFloat(formData.precioVentaReal) || 0,
      fechaSubida: formData.fechaSubida || null, fechaVentaPendiente: formData.fechaVentaPendiente || null,
      fechaVentaConfirmada: formData.fechaVentaConfirmada || null, estado
    };
    if (editingPrenda) {
      setData({ ...data, prendas: data.prendas.map(p => p.id === editingPrenda.id ? prendaData : p) });
    } else {
      setData({ ...data, prendas: [...data.prendas, prendaData] });
    }
    setShowModal(false);
    resetForm();
  };

  const prendas = data.prendas.filter(p => {
    const matchFiltro = filtro === 'todos' || p.estado === filtro;
    const matchBusqueda = p.sku.toLowerCase().includes(busqueda.toLowerCase()) || p.tipo.toLowerCase().includes(busqueda.toLowerCase());
    return matchFiltro && matchBusqueda;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Inventario</h2>
        <button onClick={() => { if (data.lotes.length === 0) alert('Crea un lote primero'); else setShowModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}><Plus size={20} /><span>Nueva Prenda</span></button>
      </div>
      <div style={{ background: 'white', borderRadius: '0.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1, position: 'relative' }}><Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} size={20} /><input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar..." style={{ width: '100%', paddingLeft: '2.5rem', paddingRight: '1rem', paddingTop: '0.5rem', paddingBottom: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} /></div>
          <select value={filtro} onChange={(e) => setFiltro(e.target.value)} style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}><option value="todos">Todos</option><option value="comprada">Compradas</option><option value="subida">En Vinted</option><option value="vendida-pendiente">Pendientes</option><option value="vendida-confirmada">Vendidas</option></select>
        </div>
      </div>
      {prendas.length === 0 ? (<div style={{ background: 'white', borderRadius: '0.5rem', padding: '3rem', textAlign: 'center' }}><Package size={48} style={{ margin: '0 auto 1rem', color: '#9ca3af' }} /><p style={{ color: '#6b7280' }}>No hay prendas</p></div>) : (prendas.map(p => (<div key={p.id} style={{ background: 'white', borderRadius: '0.5rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><div style={{ flex: 1 }}><div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}><span style={{ padding: '0.25rem 0.75rem', background: '#f3e8ff', color: '#6b21a8', borderRadius: '1rem', fontSize: '0.875rem', fontWeight: '600' }}>{p.sku}</span><span style={{ padding: '0.125rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', background: p.estado === 'comprada' ? '#f3f4f6' : p.estado === 'subida' ? '#dbeafe' : p.estado === 'vendida-pendiente' ? '#fef3c7' : '#d1fae5', color: p.estado === 'comprada' ? '#1f2937' : p.estado === 'subida' ? '#1e40af' : p.estado === 'vendida-pendiente' ? '#92400e' : '#065f46' }}>{p.estado}</span></div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', fontSize: '0.875rem' }}><div><p style={{ color: '#6b7280' }}>Lote</p><p style={{ fontWeight: '600' }}>{p.loteCodigo}</p></div><div><p style={{ color: '#6b7280' }}>Tipo</p><p style={{ fontWeight: '600' }}>{p.tipo}</p></div><div><p style={{ color: '#6b7280' }}>Talla</p><p style={{ fontWeight: '600' }}>{p.talla}</p></div><div><p style={{ color: '#6b7280' }}>Compra</p><p style={{ fontWeight: '600' }}>{p.precioCompra.toFixed(2)} €</p></div><div><p style={{ color: '#6b7280' }}>Venta</p><p style={{ fontWeight: '600', color: '#10b981' }}>{p.precioVentaReal > 0 ? `${p.precioVentaReal.toFixed(2)} €` : '-'}</p></div></div></div><div style={{ display: 'flex', gap: '0.5rem' }}><button onClick={() => handleEdit(p)} style={{ padding: '0.5rem', color: '#2563eb', background: 'transparent', border: 'none', cursor: 'pointer' }}><Edit2 size={18} /></button><button onClick={() => { if (window.confirm('Eliminar?')) setData({ ...data, prendas: data.prendas.filter(pr => pr.id !== p.id) }); }} style={{ padding: '0.5rem', color: '#dc2626', background: 'transparent', border: 'none', cursor: 'pointer' }}><Trash2 size={18} /></button></div></div></div>)))}
      {showModal && (<div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 50 }}><div style={{ background: 'white', borderRadius: '0.5rem', maxWidth: '48rem', width: '100%', padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}><h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{editingPrenda ? 'Editar Prenda' : 'Nueva Prenda'}</h3><button onClick={() => { setShowModal(false); resetForm(); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button></div><div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}><div><label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Lote</label><select value={formData.loteId} onChange={(e) => setFormData({ ...formData, loteId: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} disabled={editingPrenda}><option value="">Selecciona</option>{data.lotes.map(l => <option key={l.id} value={l.id}>{l.codigo}</option>)}</select></div><div><label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Tipo</label><select value={formData.tipo} onChange={(e) => setFormData({ ...formData, tipo: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}><option value="">Selecciona</option>{tipos.map(t => <option key={t} value={t}>{t}</option>)}</select></div></div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}><div><label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Talla</label><input type="text" value={formData.talla} onChange={(e) => setFormData({ ...formData, talla: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} placeholder="M, L, 42..." /></div><div><label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Precio Objetivo</label><input type="number" step="0.01" value={formData.precioObjetivo} onChange={(e) => setFormData({ ...formData, precioObjetivo: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} placeholder="20.00" /></div></div><div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}><h4 style={{ fontWeight: '600', marginBottom: '0.75rem' }}>Estado de la prenda</h4><div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}><div><label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Fecha Subida</label><input type="date" value={formData.fechaSubida} onChange={(e) => setFormData({ ...formData, fechaSubida: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} /></div><div><label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Fecha Venta Pendiente</label><input type="date" value={formData.fechaVentaPendiente} onChange={(e) => setFormData({ ...formData, fechaVentaPendiente: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} /></div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}><div><label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Precio Venta Real</label><input type="number" step="0.01" value={formData.precioVentaReal} onChange={(e) => setFormData({ ...formData, precioVentaReal: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} placeholder="18.50" /></div><div><label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Fecha Confirmada</label><input type="date" value={formData.fechaVentaConfirmada} onChange={(e) => setFormData({ ...formData, fechaVentaConfirmada: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} /></div></div></div></div></div><div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}><button onClick={() => { setShowModal(false); resetForm(); }} style={{ flex: 1, padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', background: 'white', cursor: 'pointer' }}>Cancelar</button><button onClick={handleSubmit} style={{ flex: 1, padding: '0.5rem 1rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>{editingPrenda ? 'Guardar' : 'Crear'}</button></div></div></div>)}
    </div>
  );
};

// COMPONENTE CONFIG
const ConfigManager = ({ data, setData }) => {
  const [tab, setTab] = useState('costes');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Configuración</h2>
      <div style={{ background: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ borderBottom: '1px solid #e5e7eb', display: 'flex', padding: '0 1.5rem' }}>
          <button onClick={() => setTab('costes')} style={{ padding: '1rem', borderBottom: tab === 'costes' ? '2px solid #2563eb' : '2px solid transparent', fontWeight: '500', color: tab === 'costes' ? '#2563eb' : '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>Costes</button>
          <button onClick={() => setTab('alertas')} style={{ padding: '1rem', borderBottom: tab === 'alertas' ? '2px solid #2563eb' : '2px solid transparent', fontWeight: '500', color: tab === 'alertas' ? '#2563eb' : '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>Alertas</button>
        </div>
        <div style={{ padding: '1.5rem' }}>
          {tab === 'costes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '32rem' }}>
              <div><label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Coste Envío</label><input type="number" step="0.01" value={data.config.costeEnvio} onChange={(e) => setData({ ...data, config: { ...data.config, costeEnvio: parseFloat(e.target.value) } })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} /></div>
              <div><label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Coste Lavado</label><input type="number" step="0.01" value={data.config.costeLavado} onChange={(e) => setData({ ...data, config: { ...data.config, costeLavado: parseFloat(e.target.value) } })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} /></div>
            </div>
          )}
          {tab === 'alertas' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '32rem' }}>
              <div><label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Días sin vender</label><input type="number" value={data.config.alertaDias} onChange={(e) => setData({ ...data, config: { ...data.config, alertaDias: parseInt(e.target.value) } })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} /></div>
              <div><label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Stock mínimo</label><input type="number" value={data.config.alertaStock} onChange={(e) => setData({ ...data, config: { ...data.config, alertaStock: parseInt(e.target.value) } })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} /></div>
              <div><label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Margen mínimo %</label><input type="number" value={data.config.alertaMargen} onChange={(e) => setData({ ...data, config: { ...data.config, alertaMargen: parseInt(e.target.value) } })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} /></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// COMPONENTE APP PRINCIPAL
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [currentView, setCurrentView] = useState('dashboard');
  const [data, saveData, loading] = useFirebaseData();
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
    return { totalVentas, totalGastos, totalIngresos, beneficioNeto, prendasVendidas, ticketMedio, margenBruto };
  };

  const currentMetrics = calculateMonthMetrics(selectedMonth);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const isCurrentMonth = selectedMonth === thisMonth;
  const alerts = [];
  const stockActual = data.prendas.filter(p => p.estado === 'comprada' || p.estado === 'subida').length;
  if (stockActual < data.config.alertaStock) alerts.push({ tipo: 'stock', mensaje: `Stock bajo: ${stockActual} prendas` });
  if (currentMetrics.margenBruto < data.config.alertaMargen) alerts.push({ tipo: 'margen', mensaje: `Margen bajo: ${currentMetrics.margenBruto.toFixed(1)}%` });

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #0f172a, #1e293b, #0f172a)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', padding: '2rem', width: '100%', maxWidth: '28rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <img src="/logo.png" alt="Quasart Style" style={{ width: '6rem', height: '6rem', margin: '0 auto 1rem', objectFit: 'contain' }} />
            <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1f2937' }}>Quasart Style</h1>
            <p style={{ color: '#6b7280' }}>Panel de Control Vinted</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleLogin()} placeholder="Contraseña" style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', outline: 'none' }} />
            <button onClick={handleLogin} style={{ width: '100%', background: 'linear-gradient(to right, #2563eb, #1d4ed8)', color: 'white', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: '500', border: 'none', cursor: 'pointer' }}>Entrar</button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '3rem', height: '3rem', border: '2px solid #2563eb', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 1rem' }}></div>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <img src="/logo.png" alt="Quasart Style" style={{ width: '2.5rem', height: '2.5rem', objectFit: 'contain' }} />
              <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>Quasart Style</h1>
            </div>
            <button onClick={() => setIsAuthenticated(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}><LogOut size={20} /><span>Salir</span></button>
          </div>
        </div>
      </header>
      <nav style={{ background: 'white', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0.75rem 1rem', display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
          <button onClick={() => setCurrentView('dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.5rem', background: currentView === 'dashboard' ? '#2563eb' : 'transparent', color: currentView === 'dashboard' ? 'white' : '#6b7280', border: 'none', cursor: 'pointer' }}><BarChart3 size={20} /><span style={{ fontWeight: '500' }}>Dashboard</span></button>
          <button onClick={() => setCurrentView('estadisticas')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.5rem', background: currentView === 'estadisticas' ? '#2563eb' : 'transparent', color: currentView === 'estadisticas' ? 'white' : '#6b7280', border: 'none', cursor: 'pointer' }}><PieChart size={20} /><span style={{ fontWeight: '500' }}>Estadísticas</span></button>
          <button onClick={() => setCurrentView('lotes')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.5rem', background: currentView === 'lotes' ? '#2563eb' : 'transparent', color: currentView === 'lotes' ? 'white' : '#6b7280', border: 'none', cursor: 'pointer' }}><Package size={20} /><span style={{ fontWeight: '500' }}>Lotes</span></button>
          <button onClick={() => setCurrentView('inventario')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.5rem', background: currentView === 'inventario' ? '#2563eb' : 'transparent', color: currentView === 'inventario' ? 'white' : '#6b7280', border: 'none', cursor: 'pointer' }}><TrendingUp size={20} /><span style={{ fontWeight: '500' }}>Inventario</span></button>
          <button onClick={() => setCurrentView('config')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.5rem', background: currentView === 'config' ? '#2563eb' : 'transparent', color: currentView === 'config' ? 'white' : '#6b7280', border: 'none', cursor: 'pointer' }}><Settings size={20} /><span style={{ fontWeight: '500' }}>Config</span></button>
        </div>
      </nav>
      {alerts.length > 0 && (
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '1rem' }}>
          <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '0.5rem', padding: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <AlertCircle style={{ color: '#f59e0b', flexShrink: 0 }} size={20} />
              <div style={{ flex: 1 }}>
                <h3 style={{ fontWeight: '600', color: '#78350f', marginBottom: '0.5rem' }}>Alertas activas</h3>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {alerts.map((alert, idx) => (<li key={idx} style={{ color: '#92400e', fontSize: '0.875rem' }}>{alert.mensaje}</li>))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
      <main style={{ maxWidth: '80rem', margin: '0 auto', padding: '1.5rem' }}>
        {currentView === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ background: 'white', borderRadius: '0.5rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <Calendar size={20} style={{ color: '#6b7280' }} />
                  <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
                  {!isCurrentMonth && (<button onClick={() => setSelectedMonth(thisMonth)} style={{ color: '#2563eb', fontSize: '0.875rem', fontWeight: '500', background: 'none', border: 'none', cursor: 'pointer' }}>Mes actual</button>)}
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <div style={{ background: 'white', borderRadius: '0.5rem', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}><div style={{ height: '0.5rem', background: 'linear-gradient(to right, #3b82f6, #2563eb)' }}></div><div style={{ padding: '1.5rem' }}><h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.5rem' }}>Ventas</h3><p style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937' }}>{currentMetrics.totalVentas.toFixed(2)} €</p><p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>{currentMetrics.prendasVendidas} prendas</p></div></div>
              <div style={{ background: 'white', borderRadius: '0.5rem', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}><div style={{ height: '0.5rem', background: 'linear-gradient(to right, #ef4444, #dc2626)' }}></div><div style={{ padding: '1.5rem' }}><h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.5rem' }}>Gastos</h3><p style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937' }}>{currentMetrics.totalGastos.toFixed(2)} €</p></div></div>
              <div style={{ background: 'white', borderRadius: '0.5rem', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}><div style={{ height: '0.5rem', background: 'linear-gradient(to right, #10b981, #059669)' }}></div><div style={{ padding: '1.5rem' }}><h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.5rem' }}>Beneficio</h3><p style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937' }}>{currentMetrics.beneficioNeto.toFixed(2)} €</p></div></div>
              <div style={{ background: 'white', borderRadius: '0.5rem', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}><div style={{ height: '0.5rem', background: 'linear-gradient(to right, #8b5cf6, #7c3aed)' }}></div><div style={{ padding: '1.5rem' }}><h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.5rem' }}>Margen</h3><p style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937' }}>{currentMetrics.margenBruto.toFixed(1)} %</p><p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>Ticket: {currentMetrics.ticketMedio.toFixed(2)} €</p></div></div>
            </div>
            <div style={{ background: 'white', borderRadius: '0.5rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Stock actual</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                <div style={{ textAlign: 'center', padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem' }}><div style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937' }}>{data.prendas.filter(p => p.estado === 'comprada').length}</div><div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>Compradas</div></div>
                <div style={{ textAlign: 'center', padding: '1rem', background: '#eff6ff', borderRadius: '0.5rem' }}><div style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1e3a8a' }}>{data.prendas.filter(p => p.estado === 'subida').length}</div><div style={{ fontSize: '0.875rem', color: '#2563eb', marginTop: '0.25rem' }}>En Vinted</div></div>
                <div style={{ textAlign: 'center', padding: '1rem', background: '#fef3c7', borderRadius: '0.5rem' }}><div style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#78350f' }}>{data.prendas.filter(p => p.estado === 'vendida-pendiente').length}</div><div style={{ fontSize: '0.875rem', color: '#f59e0b', marginTop: '0.25rem' }}>Pendientes</div></div>
                <div style={{ textAlign: 'center', padding: '1rem', background: '#d1fae5', borderRadius: '0.5rem' }}><div style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#065f46' }}>{data.prendas.filter(p => p.estado === 'vendida-confirmada').length}</div><div style={{ fontSize: '0.875rem', color: '#10b981', marginTop: '0.25rem' }}>Vendidas</div></div>
              </div>
            </div>
          </div>
        )}
        {currentView === 'estadisticas' && (<div style={{ background: 'white', borderRadius: '0.5rem', padding: '3rem', textAlign: 'center' }}><PieChart size={48} style={{ margin: '0 auto 1rem', color: '#9ca3af' }} /><p style={{ color: '#6b7280' }}>Estadísticas - Próximamente</p></div>)}
        {currentView === 'lotes' && <LotesManager data={data} setData={saveData} />}
        {currentView === 'inventario' && <InventarioManager data={data} setData={saveData} />}
        {currentView === 'config' && <ConfigManager data={data} setData={saveData} />}
      </main>
    </div>
  );
}

export default App;
