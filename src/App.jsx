import React, { useState, useEffect } from 'react';
import { BarChart3, Package, TrendingUp, Settings, LogOut, Calendar, Plus, Edit2, Trash2, X, Search, AlertCircle, PieChart, CheckCircle, Clock, Star, RefreshCw } from 'lucide-react';
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
    prendasInutiles: '0',
    tiposPrendas: [],
    detallesPrendas: {},
    ivaPrendas: '21',
    gastoEnvio: '0',
    ivaEnvio: '21',
    descuento: '0',
    tieneDescuento: false,
    formaPago: 'unico', 
    mesesPago: '1' 
  });

  const tiposDisponibles = ['Camiseta', 'Camisa', 'Pantalon', 'Vestido', 'Chaqueta', 'Sudadera', 'Jersey', 'Zapatos', 'Vaqueros', 'Otro'];

  const generarCodigoLote = (proveedor, fecha) => {
    const prov = proveedor.slice(0, 3).toUpperCase();
    const [anio, mes, dia] = fecha.split('-');
    return `${prov}-${dia}${mes}${anio.slice(2)}`;
  };

  const handleTipoToggle = (tipo) => {
    if (formData.tiposPrendas.includes(tipo)) {
      const nuevosTipos = formData.tiposPrendas.filter(t => t !== tipo);
      const nuevosDetalles = { ...formData.detallesPrendas };
      delete nuevosDetalles[tipo];
      setFormData({ ...formData, tiposPrendas: nuevosTipos, detallesPrendas: nuevosDetalles });
    } else {
      setFormData({ 
        ...formData, 
        tiposPrendas: [...formData.tiposPrendas, tipo],
        detallesPrendas: { ...formData.detallesPrendas, [tipo]: { cantidad: '', precio: '' } }
      });
    }
  };

  const handleDetalleChange = (tipo, campo, valor) => {
    setFormData({
      ...formData,
      detallesPrendas: {
        ...formData.detallesPrendas,
        [tipo]: {
          ...formData.detallesPrendas[tipo],
          [campo]: valor
        }
      }
    });
  };

  const calcularTotales = () => {
    const subtotalPrendas = Object.values(formData.detallesPrendas).reduce((sum, det) => {
      return sum + (parseFloat(det.precio) || 0);
    }, 0);
    
    const descuento = formData.tieneDescuento ? (parseFloat(formData.descuento) || 0) : 0;
    const subtotalConDescuento = subtotalPrendas - descuento;
    
    // IVA se aplica después del descuento
    const totalIvaPrendas = subtotalConDescuento * (parseFloat(formData.ivaPrendas) / 100);
    const totalPrendas = subtotalConDescuento + totalIvaPrendas;
    
    const gastoEnvio = parseFloat(formData.gastoEnvio) || 0;
    const ivaEnvio = gastoEnvio * (parseFloat(formData.ivaEnvio) / 100);
    const totalEnvio = gastoEnvio + ivaEnvio;
    
    const total = totalPrendas + totalEnvio;
    const cantidadTotal = Object.values(formData.detallesPrendas).reduce((sum, det) => {
      return sum + (parseInt(det.cantidad) || 0);
    }, 0);
    
    // Calcular precios unitarios por tipo
    const preciosUnitarios = {};
    Object.entries(formData.detallesPrendas).forEach(([tipo, det]) => {
      const cantidad = parseInt(det.cantidad) || 0;
      const precio = parseFloat(det.precio) || 0;
      if (cantidad > 0) {
        preciosUnitarios[tipo] = precio / cantidad;
      }
    });
    
    return { subtotalPrendas, descuento, subtotalConDescuento, totalIvaPrendas, totalPrendas, gastoEnvio, ivaEnvio, totalEnvio, total, cantidadTotal, preciosUnitarios };
  };

  const handleSubmit = () => {
    if (!formData.proveedor) {
      alert('Completa el proveedor');
      return;
    }
    if (formData.tiposPrendas.length === 0) {
      alert('Selecciona al menos un tipo de prenda');
      return;
    }
    
    for (const tipo of formData.tiposPrendas) {
      const det = formData.detallesPrendas[tipo];
      if (!det.cantidad || !det.precio) {
        alert(`Completa cantidad y precio para ${tipo}`);
        return;
      }
    }

    const totales = calcularTotales();
    const codigo = generarCodigoLote(formData.proveedor, formData.fecha);
    
    const nuevoLote = {
      id: editingLote?.id || Date.now().toString(),
      codigo, 
      proveedor: formData.proveedor, 
      fecha: formData.fecha,
      cantidad: totales.cantidadTotal,
      costeTotal: totales.total,
      costeUnitario: totales.total / totales.cantidadTotal,
      prendasInutiles: parseInt(formData.prendasInutiles),
      tiposPrendas: formData.tiposPrendas,
      detallesPrendas: formData.detallesPrendas,
      preciosUnitarios: totales.preciosUnitarios,
      ivaPrendas: parseFloat(formData.ivaPrendas),
      gastoEnvio: parseFloat(formData.gastoEnvio) || 0,
      ivaEnvio: parseFloat(formData.ivaEnvio),
      descuento: formData.tieneDescuento ? (parseFloat(formData.descuento) || 0) : 0,
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
    setFormData({ proveedor: '', fecha: new Date().toISOString().slice(0, 10), prendasInutiles: '0', tiposPrendas: [], detallesPrendas: {}, ivaPrendas: '21', gastoEnvio: '0', ivaEnvio: '21', descuento: '0', tieneDescuento: false, formaPago: 'unico', mesesPago: '1' });
  };

  const totales = calcularTotales();

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
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                  <span style={{ padding: '0.25rem 0.75rem', background: '#dbeafe', color: '#1e40af', borderRadius: '1rem', fontSize: '0.875rem', fontWeight: '600' }}>{lote.codigo}</span>
                  <span style={{ color: '#6b7280' }}>{lote.proveedor}</span>
                  {lote.tiposPrendas && lote.tiposPrendas.map(tipo => (
                    <span key={tipo} style={{ padding: '0.25rem 0.5rem', background: '#f3e8ff', color: '#6b21a8', borderRadius: '0.5rem', fontSize: '0.75rem' }}>
                      {tipo} ({lote.detallesPrendas?.[tipo]?.cantidad || 0}) - {lote.preciosUnitarios?.[tipo]?.toFixed(2) || '0.00'}€/u
                    </span>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', fontSize: '0.875rem' }}>
                  <div><p style={{ color: '#6b7280' }}>Fecha</p><p style={{ fontWeight: '600' }}>{new Date(lote.fecha).toLocaleDateString()}</p></div>
                  <div><p style={{ color: '#6b7280' }}>Total Prendas</p><p style={{ fontWeight: '600' }}>{lote.cantidad}</p></div>
                  <div><p style={{ color: '#6b7280' }}>Coste Total</p><p style={{ fontWeight: '600' }}>{lote.costeTotal.toFixed(2)} €</p></div>
                  <div><p style={{ color: '#6b7280' }}>Coste Unitario Medio</p><p style={{ fontWeight: '600' }}>{lote.costeUnitario.toFixed(2)} €</p></div>
                  <div><p style={{ color: '#6b7280' }}>Inútiles</p><p style={{ fontWeight: '600' }}>{lote.prendasInutiles || 0}</p></div>
                  <div><p style={{ color: '#6b7280' }}>Forma de Pago</p><p style={{ fontWeight: '600' }}>{lote.mesesPago === 1 ? 'Pago único' : `${lote.mesesPago} meses`}</p></div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => { 
                  setEditingLote(lote); 
                  setFormData({ 
                    proveedor: lote.proveedor, 
                    fecha: lote.fecha, 
                    prendasInutiles: (lote.prendasInutiles || 0).toString(),
                    tiposPrendas: lote.tiposPrendas || [],
                    detallesPrendas: lote.detallesPrendas || {},
                    ivaPrendas: (lote.ivaPrendas || 21).toString(),
                    gastoEnvio: (lote.gastoEnvio || 0).toString(),
                    ivaEnvio: (lote.ivaEnvio || 21).toString(),
                    descuento: (lote.descuento || 0).toString(),
                    tieneDescuento: (lote.descuento || 0) > 0,
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
          <div style={{ background: 'white', borderRadius: '0.5rem', maxWidth: '48rem', width: '100%', padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{editingLote ? 'Editar' : 'Nuevo'} Lote</h3>
              <button onClick={() => { setShowModal(false); setEditingLote(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div><label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Proveedor</label><input type="text" value={formData.proveedor} onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} /></div>
                <div><label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Fecha</label><input type="date" value={formData.fecha} onChange={(e) => setFormData({ ...formData, fecha: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} /></div>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Tipos de prendas en el lote</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  {tiposDisponibles.map(tipo => (
                    <div key={tipo} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: formData.tiposPrendas.includes(tipo) ? '#eff6ff' : '#f9fafb', borderRadius: '0.5rem', cursor: 'pointer', border: formData.tiposPrendas.includes(tipo) ? '2px solid #2563eb' : '2px solid transparent' }} onClick={() => handleTipoToggle(tipo)}>
                      <input type="checkbox" checked={formData.tiposPrendas.includes(tipo)} onChange={() => handleTipoToggle(tipo)} style={{ cursor: 'pointer' }} />
                      <span style={{ fontSize: '0.875rem', color: formData.tiposPrendas.includes(tipo) ? '#1e40af' : '#6b7280' }}>{tipo}</span>
                    </div>
                  ))}
                </div>
              </div>

              {formData.tiposPrendas.length > 0 && (
                <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '0.5rem' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem', color: '#1f2937' }}>Detalles por tipo de prenda</h4>
                  {formData.tiposPrendas.map(tipo => {
                    const cantidad = parseInt(formData.detallesPrendas[tipo]?.cantidad) || 0;
                    const precio = parseFloat(formData.detallesPrendas[tipo]?.precio) || 0;
                    const precioUnitario = cantidad > 0 ? precio / cantidad : 0;
                    return (
                      <div key={tipo} style={{ marginBottom: '0.75rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280' }}>{tipo}</span>
                          <input type="number" placeholder="Cantidad" value={formData.detallesPrendas[tipo]?.cantidad || ''} onChange={(e) => handleDetalleChange(tipo, 'cantidad', e.target.value)} style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }} />
                          <input type="number" step="0.01" placeholder="Precio total €" value={formData.detallesPrendas[tipo]?.precio || ''} onChange={(e) => handleDetalleChange(tipo, 'precio', e.target.value)} style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }} />
                        </div>
                        {cantidad > 0 && precio > 0 && (
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem', paddingLeft: '0.5rem' }}>
                            Precio unitario: {precioUnitario.toFixed(2)} €/unidad
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={{ background: '#f0f9ff', padding: '1rem', borderRadius: '0.5rem' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem', color: '#1f2937' }}>Costes adicionales</h4>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <input type="checkbox" id="tieneDescuento" checked={formData.tieneDescuento} onChange={(e) => setFormData({ ...formData, tieneDescuento: e.target.checked })} style={{ cursor: 'pointer' }} />
                  <label htmlFor="tieneDescuento" style={{ fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer' }}>Aplicar descuento</label>
                </div>
                {formData.tieneDescuento && (
                  <div style={{ marginBottom: '0.75rem' }}><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', marginBottom: '0.25rem', color: '#6b7280' }}>Descuento (€)</label><input type="number" step="0.01" value={formData.descuento} onChange={(e) => setFormData({ ...formData, descuento: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }} /></div>
                )}
                
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
                  <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', marginBottom: '0.25rem', color: '#6b7280' }}>IVA Prendas (%)</label><input type="number" step="0.01" value={formData.ivaPrendas} onChange={(e) => setFormData({ ...formData, ivaPrendas: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }} /></div>
                  <div style={{ display: 'flex', alignItems: 'end', fontSize: '0.875rem', color: '#6b7280' }}>+{totales.totalIvaPrendas.toFixed(2)} €</div>
                  
                  <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', marginBottom: '0.25rem', color: '#6b7280' }}>Gasto Envío (€)</label><input type="number" step="0.01" value={formData.gastoEnvio} onChange={(e) => setFormData({ ...formData, gastoEnvio: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }} /></div>
                  <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', marginBottom: '0.25rem', color: '#6b7280' }}>IVA Envío (%)</label><input type="number" step="0.01" value={formData.ivaEnvio} onChange={(e) => setFormData({ ...formData, ivaEnvio: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }} /></div>
                </div>
              </div>

              <div style={{ background: '#ecfdf5', padding: '1rem', borderRadius: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Subtotal prendas:</span>
                  <span style={{ fontWeight: '600' }}>{totales.subtotalPrendas.toFixed(2)} €</span>
                </div>
                {totales.descuento > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Descuento:</span>
                    <span style={{ fontWeight: '600', color: '#dc2626' }}>-{totales.descuento.toFixed(2)} €</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Subtotal con descuento:</span>
                  <span style={{ fontWeight: '600' }}>{totales.subtotalConDescuento.toFixed(2)} €</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>IVA prendas ({formData.ivaPrendas}%):</span>
                  <span style={{ fontWeight: '600' }}>+{totales.totalIvaPrendas.toFixed(2)} €</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Envío + IVA:</span>
                  <span style={{ fontWeight: '600' }}>+{totales.totalEnvio.toFixed(2)} €</span>
                </div>
                <div style={{ borderTop: '2px solid #10b981', paddingTop: '0.5rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '1rem', fontWeight: '700', color: '#065f46' }}>TOTAL:</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: '700', color: '#065f46' }}>{totales.total.toFixed(2)} €</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Total prendas:</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{totales.cantidadTotal}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Precio unitario medio:</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{totales.cantidadTotal > 0 ? (totales.total / totales.cantidadTotal).toFixed(2) : '0.00'} €</span>
                </div>
              </div>

              <div><label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Prendas Inútiles (desechables)</label><input type="number" value={formData.prendasInutiles} onChange={(e) => setFormData({ ...formData, prendasInutiles: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} /></div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div><label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Forma de Pago</label><select value={formData.formaPago} onChange={(e) => { setFormData({ ...formData, formaPago: e.target.value, mesesPago: e.target.value === 'unico' ? '1' : formData.mesesPago }); }} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}><option value="unico">Pago único</option><option value="plazos">A plazos</option></select></div>
                {formData.formaPago === 'plazos' && (
                  <div><label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Número de Meses</label><select value={formData.mesesPago} onChange={(e) => setFormData({ ...formData, mesesPago: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}><option value="2">2 meses</option><option value="3">3 meses</option><option value="4">4 meses</option><option value="5">5 meses</option><option value="6">6 meses</option><option value="12">12 meses</option></select></div>
                )}
              </div>
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

const InventarioManager = ({ data, setData }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingPrenda, setEditingPrenda] = useState(null);
  const [filtro, setFiltro] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [ordenamiento, setOrdenamiento] = useState('recientes'); // nuevo
  const [formData, setFormData] = useState({ 
    loteId: '', 
    tipo: '', 
    talla: '', 
    precioObjetivo: '', 
    precioVentaReal: '', 
    fechaSubida: '', 
    fechaVentaPendiente: '', 
    fechaVentaConfirmada: '', 
    lavada: false,
    destacada: false,
    resubida: false,
    costeDestacado: '',
    fechaGastoDestacado: '',
    destacadaDespuesResubida: false,
    costeDestacadoDespuesResubida: '',
    fechaGastoDestacadoDespuesResubida: '',
    devuelta: false,
    tipoDevolucion: '',
    fechaDevolucion: ''
  });

  const resetForm = () => {
    setFormData({ 
      loteId: '', 
      tipo: '', 
      talla: '', 
      precioObjetivo: '', 
      precioVentaReal: '', 
      fechaSubida: '', 
      fechaVentaPendiente: '', 
      fechaVentaConfirmada: '', 
      lavada: false,
      destacada: false,
      resubida: false,
      costeDestacado: '',
      fechaGastoDestacado: '',
      destacadaDespuesResubida: false,
      costeDestacadoDespuesResubida: '',
      fechaGastoDestacadoDespuesResubida: '',
      devuelta: false,
      tipoDevolucion: '',
      fechaDevolucion: ''
    });
    setEditingPrenda(null);
  };

  const handleEdit = (prenda) => {
    setEditingPrenda(prenda);
    setFormData({ 
      loteId: prenda.loteId, 
      tipo: prenda.tipo, 
      talla: prenda.talla, 
      precioObjetivo: prenda.precioObjetivo.toString(), 
      precioVentaReal: prenda.precioVentaReal.toString(), 
      fechaSubida: prenda.fechaSubida || '', 
      fechaVentaPendiente: prenda.fechaVentaPendiente || '', 
      fechaVentaConfirmada: prenda.fechaVentaConfirmada || '', 
      lavada: prenda.lavada || false,
      destacada: prenda.destacada || false,
      resubida: prenda.resubida || false,
      costeDestacado: (prenda.costeDestacado || '').toString(),
      fechaGastoDestacado: prenda.fechaGastoDestacado || '',
      destacadaDespuesResubida: prenda.destacadaDespuesResubida || false,
      costeDestacadoDespuesResubida: (prenda.costeDestacadoDespuesResubida || '').toString(),
      fechaGastoDestacadoDespuesResubida: prenda.fechaGastoDestacadoDespuesResubida || '',
      devuelta: prenda.devuelta || false,
      tipoDevolucion: prenda.tipoDevolucion || '',
      fechaDevolucion: prenda.fechaDevolucion || ''
    });
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!formData.loteId || !formData.tipo || !formData.talla) {
      alert('Completa campos obligatorios');
      return;
    }
    
    if (formData.destacada && !formData.resubida && !formData.costeDestacado) {
      alert('Debes indicar el coste de destacar esta prenda');
      return;
    }
    
    if (formData.destacadaDespuesResubida && !formData.costeDestacadoDespuesResubida) {
      alert('Debes indicar el coste de destacar después de resubir');
      return;
    }
    
    if (formData.devuelta && !formData.tipoDevolucion) {
      alert('Debes seleccionar el tipo de devolución');
      return;
    }
    
    const lote = data.lotes.find(l => l.id === formData.loteId);
    if (!lote) return;
    
    let estado = 'comprada';
    if (formData.devuelta) {
      estado = 'devuelta';
    } else if (formData.fechaVentaConfirmada) {
      estado = 'vendida-confirmada';
    } else if (formData.fechaVentaPendiente) {
      estado = 'vendida-pendiente';
    } else if (formData.fechaSubida) {
      estado = 'subida';
    }
    
    const prendaData = {
      id: editingPrenda?.id || Date.now().toString(), 
      loteId: formData.loteId, 
      loteCodigo: lote.codigo,
      sku: editingPrenda?.sku || (() => {
        const skuNumero = data.prendas.length + 1;
        return `QS-${skuNumero.toString().padStart(4, '0')}`;
      })(),
      tipo: formData.tipo, 
      talla: formData.talla,
      precioCompra: lote.costeUnitario, 
      precioObjetivo: parseFloat(formData.precioObjetivo) || 0,
      precioVentaReal: parseFloat(formData.precioVentaReal) || 0,
      fechaSubida: formData.fechaSubida || null, 
      fechaVentaPendiente: formData.fechaVentaPendiente || null,
      fechaVentaConfirmada: formData.fechaVentaConfirmada || null, 
      estado,
      lavada: formData.lavada,
      destacada: formData.destacada,
      resubida: formData.resubida,
      costeDestacado: formData.destacada && !formData.resubida ? parseFloat(formData.costeDestacado) || 0 : 0,
      fechaGastoDestacado: formData.destacada && !formData.resubida ? formData.fechaGastoDestacado : null,
      destacadaDespuesResubida: formData.destacadaDespuesResubida || false,
      costeDestacadoDespuesResubida: formData.destacadaDespuesResubida ? parseFloat(formData.costeDestacadoDespuesResubida) || 0 : 0,
      fechaGastoDestacadoDespuesResubida: formData.destacadaDespuesResubida ? formData.fechaGastoDestacadoDespuesResubida : null,
      devuelta: formData.devuelta || false,
      tipoDevolucion: formData.devuelta ? formData.tipoDevolucion : null,
      fechaDevolucion: formData.devuelta ? formData.fechaDevolucion : null,
      createdAt: editingPrenda?.createdAt || Date.now()
    };
    
    if (editingPrenda) {
      setData({ ...data, prendas: data.prendas.map(p => p.id === editingPrenda.id ? prendaData : p) });
    } else {
      setData({ ...data, prendas: [...data.prendas, prendaData] });
    }
    setShowModal(false);
    resetForm();
  };

  const prendasOrdenadas = [...prendas].sort((a, b) => {
    if (ordenamiento === 'recientes') {
      return (b.createdAt || 0) - (a.createdAt || 0);
    } else {
      return (a.createdAt || 0) - (b.createdAt || 0);
    }
  });

  const getEstadoColor = (estado) => {
    const colores = {
      'comprada': { bg: '#f3f4f6', text: '#1f2937' },
      'subida': { bg: '#dbeafe', text: '#1e40af' },
      'vendida-pendiente': { bg: '#fef3c7', text: '#92400e' },
      'vendida-confirmada': { bg: '#d1fae5', text: '#065f46' },
      'devuelta': { bg: '#fee2e2', text: '#991b1b' }
    };
    return colores[estado] || colores['comprada'];
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
          <div style={{ flex: 1, position: 'relative' }}><Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} size={20} /><input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por SKU o tipo..." style={{ width: '100%', paddingLeft: '2.5rem', paddingRight: '1rem', paddingTop: '0.5rem', paddingBottom: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} /></div>
          <select value={filtro} onChange={(e) => setFiltro(e.target.value)} style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}><option value="todos">Todos</option><option value="comprada">Compradas</option><option value="subida">En Vinted</option><option value="vendida-pendiente">Pendientes</option><option value="vendida-confirmada">Vendidas</option></select>
        </div>
      </div>
      {prendas.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '0.5rem', padding: '3rem', textAlign: 'center' }}>
          <Package size={48} style={{ margin: '0 auto 1rem', color: '#9ca3af' }} />
          <p style={{ color: '#6b7280' }}>No hay prendas</p>
        </div>
      ) : (
        prendas.map(p => (
          <div key={p.id} style={{ background: 'white', borderRadius: '0.5rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                  <span style={{ padding: '0.25rem 0.75rem', background: '#f3e8ff', color: '#6b21a8', borderRadius: '1rem', fontSize: '0.875rem', fontWeight: '600' }}>{p.sku}</span>
                  <span style={{ padding: '0.125rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', background: p.estado === 'comprada' ? '#f3f4f6' : p.estado === 'subida' ? '#dbeafe' : p.estado === 'vendida-pendiente' ? '#fef3c7' : '#d1fae5', color: p.estado === 'comprada' ? '#1f2937' : p.estado === 'subida' ? '#1e40af' : p.estado === 'vendida-pendiente' ? '#92400e' : '#065f46' }}>{p.estado}</span>
                  {p.lavada && <span style={{ padding: '0.125rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', background: '#dbeafe', color: '#1e40af' }}>Lavada</span>}
                  {p.destacada && !p.resubida && <span style={{ padding: '0.125rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', background: '#fef3c7', color: '#92400e', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Star size={12} />Destacada</span>}
                  {p.resubida && <span style={{ padding: '0.125rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', background: '#e0e7ff', color: '#3730a3', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><RefreshCw size={12} />Resubida</span>}
                  {p.destacadaDespuesResubida && <span style={{ padding: '0.125rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', background: '#fef3c7', color: '#92400e', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Star size={12} />Destacada post-resubida</span>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', fontSize: '0.875rem' }}>
                  <div><p style={{ color: '#6b7280' }}>Lote</p><p style={{ fontWeight: '600' }}>{p.loteCodigo}</p></div>
                  <div><p style={{ color: '#6b7280' }}>Tipo</p><p style={{ fontWeight: '600' }}>{p.tipo}</p></div>
                  <div><p style={{ color: '#6b7280' }}>Talla</p><p style={{ fontWeight: '600' }}>{p.talla}</p></div>
                  <div><p style={{ color: '#6b7280' }}>Compra</p><p style={{ fontWeight: '600' }}>{p.precioCompra.toFixed(2)} €</p></div>
                  <div><p style={{ color: '#6b7280' }}>Venta</p><p style={{ fontWeight: '600', color: '#10b981' }}>{p.precioVentaReal > 0 ? `${p.precioVentaReal.toFixed(2)} €` : '-'}</p></div>
                  {p.destacada && p.costeDestacado > 0 && <div><p style={{ color: '#6b7280' }}>Coste Destacado</p><p style={{ fontWeight: '600', color: '#f59e0b' }}>{p.costeDestacado.toFixed(2)} €</p></div>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => handleEdit(p)} style={{ padding: '0.5rem', color: '#2563eb', background: 'transparent', border: 'none', cursor: 'pointer' }}><Edit2 size={18} /></button>
                <button onClick={() => { if (window.confirm('Eliminar?')) setData({ ...data, prendas: data.prendas.filter(pr => pr.id !== p.id) }); }} style={{ padding: '0.5rem', color: '#dc2626', background: 'transparent', border: 'none', cursor: 'pointer' }}><Trash2 size={18} /></button>
              </div>
            </div>
          </div>
        ))
      )}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: '0.5rem', maxWidth: '48rem', width: '100%', padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{editingPrenda ? `Editar Prenda (${editingPrenda.sku})` : 'Nueva Prenda'}</h3>
              <button onClick={() => { setShowModal(false); resetForm(); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div><label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Lote</label><select value={formData.loteId} onChange={(e) => setFormData({ ...formData, loteId: e.target.value, tipo: '' })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} disabled={editingPrenda}><option value="">Selecciona</option>{data.lotes.map(l => <option key={l.id} value={l.id}>{l.codigo}</option>)}</select></div>
                <div><label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Tipo</label><select value={formData.tipo} onChange={(e) => setFormData({ ...formData, tipo: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} disabled={!formData.loteId}><option value="">Selecciona</option>{formData.loteId && data.lotes.find(l => l.id === formData.loteId)?.tiposPrendas?.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div><label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Talla</label><input type="text" value={formData.talla} onChange={(e) => setFormData({ ...formData, talla: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} placeholder="M, L, 42..." /></div>
                <div><label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Precio Objetivo</label><input type="number" step="0.01" value={formData.precioObjetivo} onChange={(e) => setFormData({ ...formData, precioObjetivo: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} placeholder="20.00" /></div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="checkbox" id="lavada" checked={formData.lavada} onChange={(e) => setFormData({ ...formData, lavada: e.target.checked })} style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }} />
                  <label htmlFor="lavada" style={{ fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer' }}>¿Prenda lavada? (se añadirá coste de {data.config.costeLavado}€)</label>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: formData.resubida ? 0.5 : 1 }}>
                  <input 
                    type="checkbox" 
                    id="destacada" 
                    checked={formData.destacada} 
                    onChange={(e) => setFormData({ ...formData, destacada: e.target.checked })} 
                    disabled={formData.resubida}
                    style={{ width: '1.25rem', height: '1.25rem', cursor: formData.resubida ? 'not-allowed' : 'pointer' }} 
                  />
                  <label htmlFor="destacada" style={{ fontSize: '0.875rem', fontWeight: '500', cursor: formData.resubida ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Star size={16} />
                    ¿Prenda destacada?
                  </label>
                </div>
                
                {formData.destacada && !formData.resubida && (
                  <div style={{ marginLeft: '2rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem', color: '#f59e0b' }}>Coste de destacar (€)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      value={formData.costeDestacado} 
                      onChange={(e) => setFormData({ ...formData, costeDestacado: e.target.value })} 
                      style={{ width: '100%', padding: '0.5rem 0.75rem', border: '2px solid #f59e0b', borderRadius: '0.5rem', marginBottom: '0.5rem' }} 
                      placeholder="1.95" 
                    />
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem', color: '#f59e0b' }}>Fecha del gasto de destacar</label>
                    <input 
                      type="date" 
                      value={formData.fechaGastoDestacado || ''} 
                      onChange={(e) => setFormData({ ...formData, fechaGastoDestacado: e.target.value })} 
                      style={{ width: '100%', padding: '0.5rem 0.75rem', border: '2px solid #f59e0b', borderRadius: '0.5rem' }} 
                    />
                  </div>
                )}
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input 
                    type="checkbox" 
                    id="resubida" 
                    checked={formData.resubida} 
                    onChange={(e) => setFormData({ ...formData, resubida: e.target.checked })} 
                    style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }} 
                  />
                  <label htmlFor="resubida" style={{ fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <RefreshCw size={16} />
                    ¿Prenda resubida?
                  </label>
                </div>
                
                {formData.resubida && (
                  <div style={{ marginLeft: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <input 
                        type="checkbox" 
                        id="destacadaDespuesResubida" 
                        checked={formData.destacadaDespuesResubida || false} 
                        onChange={(e) => setFormData({ ...formData, destacadaDespuesResubida: e.target.checked })} 
                        style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }} 
                      />
                      <label htmlFor="destacadaDespuesResubida" style={{ fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Star size={16} />
                        ¿Destacada después de resubir?
                      </label>
                    </div>
                    
                  {formData.destacadaDespuesResubida && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem', color: '#f59e0b' }}>Coste de destacar después de resubir (€)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        value={formData.costeDestacadoDespuesResubida || ''} 
                        onChange={(e) => setFormData({ ...formData, costeDestacadoDespuesResubida: e.target.value })} 
                        style={{ width: '100%', padding: '0.5rem 0.75rem', border: '2px solid #f59e0b', borderRadius: '0.5rem', marginBottom: '0.5rem' }} 
                        placeholder="1.95" 
                      />
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem', color: '#f59e0b' }}>Fecha del gasto de destacar post-resubida</label>
                      <input 
                        type="date" 
                        value={formData.fechaGastoDestacadoDespuesResubida || ''} 
                        onChange={(e) => setFormData({ ...formData, fechaGastoDestacadoDespuesResubida: e.target.value })} 
                        style={{ width: '100%', padding: '0.5rem 0.75rem', border: '2px solid #f59e0b', borderRadius: '0.5rem' }} 
                      />
                    </div>
                  )}
                  </div>
                )}
                
                {formData.resubida && (
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginLeft: '2rem', fontStyle: 'italic' }}>
                    * Si la prenda ya estaba destacada, ese estado se mantiene bloqueado
                  </div>
                )}
              </div>
              
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
                <h4 style={{ fontWeight: '600', marginBottom: '0.75rem' }}>Estado de la prenda</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div><label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Fecha Subida</label><input type="date" value={formData.fechaSubida} onChange={(e) => setFormData({ ...formData, fechaSubida: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} /></div>
                  <div><label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Fecha Venta Pendiente</label><input type="date" value={formData.fechaVentaPendiente} onChange={(e) => setFormData({ ...formData, fechaVentaPendiente: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div><label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Precio Venta Real</label><input type="number" step="0.01" value={formData.precioVentaReal} onChange={(e) => setFormData({ ...formData, precioVentaReal: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} placeholder="18.50" /></div>
                    <div><label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Fecha Confirmada</label><input type="date" value={formData.fechaVentaConfirmada} onChange={(e) => setFormData({ ...formData, fechaVentaConfirmada: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} /></div>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1rem', marginTop: '1rem' }}>
              <h4 style={{ fontWeight: '600', marginBottom: '0.75rem' }}>¿Prenda devuelta?</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <input 
                  type="checkbox" 
                  id="devuelta" 
                  checked={formData.devuelta || false} 
                  onChange={(e) => setFormData({ ...formData, devuelta: e.target.checked, tipoDevolucion: e.target.checked ? formData.tipoDevolucion : '' })} 
                  style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }} 
                />
                <label htmlFor="devuelta" style={{ fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer' }}>
                  Marcar como devuelta
                </label>
              </div>
              
              {formData.devuelta && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Tipo de devolución</label>
                  <select 
                    value={formData.tipoDevolucion || ''} 
                    onChange={(e) => setFormData({ ...formData, tipoDevolucion: e.target.value })} 
                    style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
                  >
                    <option value="">Selecciona tipo</option>
                    <option value="gastos-comprador">Gastos de envío pagados por el comprador</option>
                    <option value="gastos-nosotros">Gastos de envío pagados por nosotros</option>
                    <option value="prenda-dinero-nosotros">Prenda y dinero para nosotros</option>
                    <option value="prenda-dinero-cliente">Prenda y dinero para el cliente</option>
                  </select>
                  
                  <div style={{ marginTop: '0.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Fecha de devolución</label>
                    <input 
                      type="date" 
                      value={formData.fechaDevolucion || ''} 
                      onChange={(e) => setFormData({ ...formData, fechaDevolucion: e.target.value })} 
                      style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} 
                    />
                  </div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button onClick={() => { setShowModal(false); resetForm(); }} style={{ flex: 1, padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', background: 'white', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleSubmit} style={{ flex: 1, padding: '0.5rem 1rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>{editingPrenda ? 'Guardar' : 'Crear'}</button>
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

const GastosIngresosManager = ({ data, setData }) => {
  const [tab, setTab] = useState('gastos');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ concepto: '', cantidad: '', fecha: new Date().toISOString().slice(0, 10) });

  const resetForm = () => {
    setFormData({ concepto: '', cantidad: '', fecha: new Date().toISOString().slice(0, 10) });
    setEditingItem(null);
  };

  const handleSubmit = () => {
    if (!formData.concepto || !formData.cantidad || !formData.fecha) {
      alert('Completa todos los campos');
      return;
    }

    const nuevoItem = {
      id: editingItem?.id || Date.now().toString(),
      concepto: formData.concepto,
      cantidad: parseFloat(formData.cantidad),
      fecha: formData.fecha
    };

    if (tab === 'gastos') {
      if (editingItem) {
        setData({ ...data, gastos: data.gastos.map(g => g.id === editingItem.id ? nuevoItem : g) });
      } else {
        setData({ ...data, gastos: [...data.gastos, nuevoItem] });
      }
    } else {
      if (editingItem) {
        setData({ ...data, ingresos: data.ingresos.map(i => i.id === editingItem.id ? nuevoItem : i) });
      } else {
        setData({ ...data, ingresos: [...data.ingresos, nuevoItem] });
      }
    }

    setShowModal(false);
    resetForm();
  };

  const items = tab === 'gastos' ? data.gastos : data.ingresos;
  const sortedItems = [...items].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Gastos e Ingresos</h2>
        <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>
          <Plus size={20} />
          <span>Nuevo {tab === 'gastos' ? 'Gasto' : 'Ingreso'}</span>
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ borderBottom: '1px solid #e5e7eb', display: 'flex', padding: '0 1.5rem' }}>
          <button onClick={() => setTab('gastos')} style={{ padding: '1rem', borderBottom: tab === 'gastos' ? '2px solid #2563eb' : '2px solid transparent', fontWeight: '500', color: tab === 'gastos' ? '#2563eb' : '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>Gastos</button>
          <button onClick={() => setTab('ingresos')} style={{ padding: '1rem', borderBottom: tab === 'ingresos' ? '2px solid #2563eb' : '2px solid transparent', fontWeight: '500', color: tab === 'ingresos' ? '#2563eb' : '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>Ingresos</button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {sortedItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              <p>No hay {tab} registrados</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {sortedItems.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{item.concepto}</p>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>{new Date(item.fecha).toLocaleDateString()}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '1.125rem', fontWeight: 'bold', color: tab === 'gastos' ? '#dc2626' : '#10b981' }}>
                      {tab === 'gastos' ? '-' : '+'}{item.cantidad.toFixed(2)} €
                    </span>
                    <button onClick={() => { setEditingItem(item); setFormData({ concepto: item.concepto, cantidad: item.cantidad.toString(), fecha: item.fecha }); setShowModal(true); }} style={{ padding: '0.5rem', color: '#2563eb', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => { if (window.confirm('¿Eliminar?')) { if (tab === 'gastos') setData({ ...data, gastos: data.gastos.filter(g => g.id !== item.id) }); else setData({ ...data, ingresos: data.ingresos.filter(i => i.id !== item.id) }); } }} style={{ padding: '0.5rem', color: '#dc2626', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: '0.5rem', maxWidth: '32rem', width: '100%', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{editingItem ? 'Editar' : 'Nuevo'} {tab === 'gastos' ? 'Gasto' : 'Ingreso'}</h3>
              <button onClick={() => { setShowModal(false); resetForm(); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Concepto</label>
                <input type="text" value={formData.concepto} onChange={(e) => setFormData({ ...formData, concepto: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} placeholder="Gasolina, publicidad, venta extra..." />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Cantidad (€)</label>
                <input type="number" step="0.01" value={formData.cantidad} onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} placeholder="50.00" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Fecha</label>
                <input type="date" value={formData.fecha} onChange={(e) => setFormData({ ...formData, fecha: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button onClick={() => { setShowModal(false); resetForm(); }} style={{ flex: 1, padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', background: 'white', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleSubmit} style={{ flex: 1, padding: '0.5rem 1rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PagosManager = ({ data }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const getPagosPorMes = (month) => {
    const [year, monthNum] = month.split('-');
    const fechaMes = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
    
    const pagos = [];
    
    data.lotes.forEach(lote => {
      if (!lote.fecha) return;
      
      const fechaLote = new Date(lote.fecha);
      const mesesPago = lote.mesesPago || 1;
      const cuotaMensual = lote.costeTotal / mesesPago;
      
      for (let i = 0; i < mesesPago; i++) {
        const fechaPago = new Date(fechaLote);
        fechaPago.setMonth(fechaPago.getMonth() + i);
        
        if (fechaPago.getFullYear() === fechaMes.getFullYear() && 
            fechaPago.getMonth() === fechaMes.getMonth()) {
          pagos.push({
            loteId: lote.id,
            loteCodigo: lote.codigo,
            proveedor: lote.proveedor,
            cuota: i + 1,
            totalCuotas: mesesPago,
            cantidad: cuotaMensual,
            fechaPago: fechaPago,
            costeTotal: lote.costeTotal
          });
        }
      }
    });
    
    return pagos.sort((a, b) => a.fechaPago - b.fechaPago);
  };

  const pagos = getPagosPorMes(selectedMonth);
  const totalMes = pagos.reduce((sum, p) => sum + p.cantidad, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Calendario de Pagos</h2>
      </div>

      <div style={{ background: 'white', borderRadius: '0.5rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <Calendar size={20} style={{ color: '#6b7280' }} />
          <input 
            type="month" 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)} 
            style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} 
          />
          <div style={{ marginLeft: 'auto', fontSize: '1.25rem', fontWeight: 'bold', color: '#dc2626' }}>
            Total: {totalMes.toFixed(2)} €
          </div>
        </div>

        {pagos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
            <p>No hay pagos programados para este mes</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {pagos.map((pago, idx) => (
              <div key={`${pago.loteId}-${pago.cuota}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', background: '#f9fafb', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <span style={{ padding: '0.25rem 0.75rem', background: '#dbeafe', color: '#1e40af', borderRadius: '1rem', fontSize: '0.875rem', fontWeight: '600' }}>
                      {pago.loteCodigo}
                    </span>
                    <span style={{ fontWeight: '600', fontSize: '1rem' }}>{pago.proveedor}</span>
                    {pago.totalCuotas > 1 && (
                      <span style={{ padding: '0.125rem 0.5rem', background: '#fef3c7', color: '#92400e', borderRadius: '0.5rem', fontSize: '0.75rem' }}>
                        Cuota {pago.cuota}/{pago.totalCuotas}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '2rem', fontSize: '0.875rem', color: '#6b7280' }}>
                    <div>
                      <span style={{ fontWeight: '500' }}>Fecha: </span>
                      {pago.fechaPago.toLocaleDateString()}
                    </div>
                    <div>
                      <span style={{ fontWeight: '500' }}>Coste total lote: </span>
                      {pago.costeTotal.toFixed(2)} €
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626' }}>
                  {pago.cantidad.toFixed(2)} €
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

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
  const prendasConfirmadas = data.prendas.filter(p => p.fechaVentaConfirmada && p.fechaVentaConfirmada.startsWith(month));
  const prendasPendientes = data.prendas.filter(p => p.fechaVentaPendiente && p.fechaVentaPendiente.startsWith(month) && !p.fechaVentaConfirmada);
  const gastosMes = data.gastos.filter(g => g.fecha && g.fecha.startsWith(month));
  const ingresosMes = data.ingresos.filter(i => i.fecha && i.fecha.startsWith(month));
  
  const totalVentasConfirmadas = prendasConfirmadas.reduce((sum, p) => sum + (p.precioVentaReal || 0), 0);
  const totalVentasPendientes = prendasPendientes.reduce((sum, p) => sum + (p.precioVentaReal || 0), 0);
  const totalVentas = totalVentasConfirmadas + totalVentasPendientes;
  
  const totalGastosManuales = gastosMes.reduce((sum, g) => sum + g.cantidad, 0);
  const gastosEnvio = prendasConfirmadas.length * data.config.costeEnvio;
  const gastosLavado = [...prendasConfirmadas, ...prendasPendientes].filter(p => p.lavada).length * data.config.costeLavado;
  
// NUEVO: Gastos de destacados del mes (incluye destacados normales y después de resubir)
// Gastos de destacados del mes (usa la fecha del gasto, no la fecha de subida)
  const gastosDestacados = data.prendas.reduce((sum, p) => {
    let total = 0;
    // Destacado normal
    if (p.destacada && !p.resubida && p.costeDestacado && p.fechaGastoDestacado && p.fechaGastoDestacado.startsWith(month)) {
      total += parseFloat(p.costeDestacado);
    }
    // Destacado después de resubir
    if (p.destacadaDespuesResubida && p.costeDestacadoDespuesResubida && p.fechaGastoDestacadoDespuesResubida && p.fechaGastoDestacadoDespuesResubida.startsWith(month)) {
      total += parseFloat(p.costeDestacadoDespuesResubida);
    }
    return sum + total;
  }, 0);
  
  const gastosLotes = data.lotes.reduce((sum, lote) => {
    if (!lote.fecha) return sum;
    const fechaLote = new Date(lote.fecha);
    const [yearMes, monthMes] = month.split('-');
    const fechaMes = new Date(parseInt(yearMes), parseInt(monthMes) - 1, 1);
    const mesesPago = lote.mesesPago || 1;
    const cuotaMensual = lote.costeTotal / mesesPago;
    for (let i = 0; i < mesesPago; i++) {
      const fechaPago = new Date(fechaLote);
      fechaPago.setMonth(fechaPago.getMonth() + i);
      if (fechaPago.getFullYear() === fechaMes.getFullYear() && fechaPago.getMonth() === fechaMes.getMonth()) {
        return sum + cuotaMensual;
      }
    }
    return sum;
  }, 0);
  
  const totalGastos = totalGastosManuales + gastosEnvio + gastosLavado + gastosDestacados + gastosLotes;
  const totalIngresos = ingresosMes.reduce((sum, i) => sum + i.cantidad, 0);
  const beneficioNeto = totalVentas + totalIngresos - totalGastos;
  const prendasVendidas = prendasConfirmadas.length + prendasPendientes.length;
  const ticketMedio = prendasVendidas > 0 ? totalVentas / prendasVendidas : 0;
  const costeCompraTotal = [...prendasConfirmadas, ...prendasPendientes].reduce((sum, p) => sum + (p.precioCompra || 0), 0);
  const margenBruto = totalVentas > 0 ? ((totalVentas - costeCompraTotal) / totalVentas * 100) : 0;
  
  return { 
    totalVentas, 
    totalVentasConfirmadas, 
    totalVentasPendientes, 
    totalGastos, 
    totalGastosManuales, 
    gastosEnvio, 
    gastosLavado, 
    gastosDestacados,  // NUEVO
    gastosLotes, 
    totalIngresos, 
    beneficioNeto, 
    prendasVendidas, 
    prendasConfirmadas: prendasConfirmadas.length, 
    prendasPendientes: prendasPendientes.length, 
    ticketMedio, 
    margenBruto 
  };
};

  const currentMetrics = calculateMonthMetrics(selectedMonth);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const isCurrentMonth = selectedMonth === thisMonth;
  const alerts = [];
  // Calcular stock correctamente: todas las prendas compradas históricamente menos las vendidas
  const todosLotesHistoricos = data.lotes;
  const totalCompradasHistoricas = todosLotesHistoricos.reduce((sum, l) => sum + l.cantidad, 0);
  
  // Total de prendas vendidas confirmadas de todos los tiempos
  const totalVendidasHistoricas = data.prendas.filter(p => p.fechaVentaConfirmada).length;
  
  // Stock actual real = compradas - vendidas - inútiles
  const totalInutiles = todosLotesHistoricos.reduce((sum, l) => sum + (l.prendasInutiles || 0), 0);
  const stockActual = totalCompradasHistoricas - totalVendidasHistoricas - totalInutiles;
  
  if (stockActual < data.config.alertaStock) {
    alerts.push({ tipo: 'stock', mensaje: `Stock bajo: ${stockActual} prendas` });
  }
  if (currentMetrics.margenBruto < data.config.alertaMargen) {
    alerts.push({ tipo: 'margen', mensaje: `Margen bajo: ${currentMetrics.margenBruto.toFixed(1)}%` });
  }

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
              <div style={{ width: '2.5rem', height: '2.5rem', background: '#2563eb', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package size={24} style={{ color: 'white' }} />
              </div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>Quasart Style</h1>
            </div>
            <button onClick={() => setIsAuthenticated(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}><LogOut size={20} /><span>Salir</span></button>
          </div>
        </div>
      </header>
      <nav style={{ background: 'white', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0.75rem 1rem', display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
          <button onClick={() => setCurrentView('dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.5rem', background: currentView === 'dashboard' ? '#2563eb' : 'transparent', color: currentView === 'dashboard' ? 'white' : '#6b7280', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}><BarChart3 size={20} /><span style={{ fontWeight: '500' }}>Inicio</span></button>
          <button onClick={() => setCurrentView('lotes')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.5rem', background: currentView === 'lotes' ? '#2563eb' : 'transparent', color: currentView === 'lotes' ? 'white' : '#6b7280', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}><Package size={20} /><span style={{ fontWeight: '500' }}>Lotes</span></button>
          <button onClick={() => setCurrentView('inventario')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.5rem', background: currentView === 'inventario' ? '#2563eb' : 'transparent', color: currentView === 'inventario' ? 'white' : '#6b7280', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}><TrendingUp size={20} /><span style={{ fontWeight: '500' }}>Inventario</span></button>
          <button onClick={() => setCurrentView('gastosIngresos')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.5rem', background: currentView === 'gastosIngresos' ? '#2563eb' : 'transparent', color: currentView === 'gastosIngresos' ? 'white' : '#6b7280', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}><TrendingUp size={20} /><span style={{ fontWeight: '500' }}>Gastos/Ingresos</span></button>
          <button onClick={() => setCurrentView('pagos')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.5rem', background: currentView === 'pagos' ? '#2563eb' : 'transparent', color: currentView === 'pagos' ? 'white' : '#6b7280', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}><Calendar size={20} /><span style={{ fontWeight: '500' }}>Pagos</span></button>
          <button onClick={() => setCurrentView('estadisticas')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.5rem', background: currentView === 'estadisticas' ? '#2563eb' : 'transparent', color: currentView === 'estadisticas' ? 'white' : '#6b7280', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}><PieChart size={20} /><span style={{ fontWeight: '500' }}>Estadísticas</span></button>
          <button onClick={() => setCurrentView('config')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.5rem', background: currentView === 'config' ? '#2563eb' : 'transparent', color: currentView === 'config' ? 'white' : '#6b7280', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}><Settings size={20} /><span style={{ fontWeight: '500' }}>Configuración</span></button>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              <div style={{ background: 'white', borderRadius: '0.5rem', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ height: '0.5rem', background: 'linear-gradient(to right, #f59e0b, #d97706)' }}></div>
                <div style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Clock size={20} style={{ color: '#f59e0b' }} />
                    <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280' }}>Ventas Pendientes</h3>
                  </div>
                  <p style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937' }}>{currentMetrics.totalVentasPendientes.toFixed(2)} €</p>
                  <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>{currentMetrics.prendasPendientes} prendas</p>
                </div>
              </div>
              <div style={{ background: 'white', borderRadius: '0.5rem', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ height: '0.5rem', background: 'linear-gradient(to right, #10b981, #059669)' }}></div>
                <div style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <CheckCircle size={20} style={{ color: '#10b981' }} />
                    <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280' }}>Ventas Completadas</h3>
                  </div>
                  <p style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937' }}>{currentMetrics.totalVentasConfirmadas.toFixed(2)} €</p>
                  <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>{currentMetrics.prendasConfirmadas} prendas</p>
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <div style={{ background: 'white', borderRadius: '0.5rem', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ height: '0.5rem', background: 'linear-gradient(to right, #3b82f6, #2563eb)' }}></div>
                <div style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.5rem' }}>Ventas Totales</h3>
                  <p style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937' }}>{currentMetrics.totalVentas.toFixed(2)} €</p>
                  <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>{currentMetrics.prendasVendidas} prendas vendidas</p>
                </div>
              </div>
              <div style={{ background: 'white', borderRadius: '0.5rem', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ height: '0.5rem', background: 'linear-gradient(to right, #ef4444, #dc2626)' }}></div>
                <div style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.5rem' }}>Gastos Totales</h3>
                  <p style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937' }}>{currentMetrics.totalGastos.toFixed(2)} €</p>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                    <div>Manuales: {currentMetrics.totalGastosManuales.toFixed(2)} €</div>
                    <div>Lotes: {currentMetrics.gastosLotes.toFixed(2)} €</div>
                    <div>Envío: {currentMetrics.gastosEnvio.toFixed(2)} €</div>
                    <div>Lavado: {currentMetrics.gastosLavado.toFixed(2)} €</div>
                    <div>Destacados: {currentMetrics.gastosDestacados.toFixed(2)} €</div>
                  </div>
                </div>
              </div>
              <div style={{ background: 'white', borderRadius: '0.5rem', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ height: '0.5rem', background: 'linear-gradient(to right, #10b981, #059669)' }}></div>
                <div style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.5rem' }}>Beneficio Neto</h3>
                  <p style={{ fontSize: '1.875rem', fontWeight: 'bold', color: currentMetrics.beneficioNeto >= 0 ? '#10b981' : '#ef4444' }}>{currentMetrics.beneficioNeto.toFixed(2)} €</p>
                </div>
              </div>
              <div style={{ background: 'white', borderRadius: '0.5rem', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ height: '0.5rem', background: 'linear-gradient(to right, #8b5cf6, #7c3aed)' }}></div>
                <div style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.5rem' }}>Margen Bruto</h3>
                  <p style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937' }}>{currentMetrics.margenBruto.toFixed(1)} %</p>
                  <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>Ticket medio: {currentMetrics.ticketMedio.toFixed(2)} €</p>
                </div>
              </div>
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
        {currentView === 'estadisticas' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ background: 'white', borderRadius: '0.5rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Estadísticas del Mes</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <Calendar size={20} style={{ color: '#6b7280' }} />
                  <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
                </div>
              </div>
            </div>

            {/* EXISTENCIAS */}
            <div style={{ background: 'white', borderRadius: '0.5rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>📦 Existencias</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                {(() => {
                  const lotesMesActual = data.lotes.filter(l => l.fecha && l.fecha.startsWith(selectedMonth));
                  const prendasCompradas = lotesMesActual.reduce((sum, l) => sum + l.cantidad, 0);
                  const [year, month] = selectedMonth.split('-');
                  const mesAnteriorDate = new Date(parseInt(year), parseInt(month) - 2, 1);
                  const mesAnterior = mesAnteriorDate.toISOString().slice(0, 7);
                  const lotesMesAnterior = data.lotes.filter(l => l.fecha && l.fecha.startsWith(mesAnterior));
                  const prendasCompradasMesAnterior = lotesMesAnterior.reduce((sum, l) => sum + l.cantidad, 0);
                  const prendasVendidasMesAnterior = data.prendas.filter(p => p.fechaVentaConfirmada && p.fechaVentaConfirmada.startsWith(mesAnterior)).length;
                  const prendasPeriodoAnterior = prendasCompradasMesAnterior - prendasVendidasMesAnterior;
                  const todosLotesAnteriores = data.lotes.filter(l => l.fecha && l.fecha < selectedMonth);
                  const totalCompradasAnteriores = todosLotesAnteriores.reduce((sum, l) => sum + l.cantidad, 0);
                  const totalVendidasAnteriores = data.prendas.filter(p => p.fechaVentaConfirmada && p.fechaVentaConfirmada < selectedMonth).length;
                  const prendasTotalesPeriodosAnteriores = totalCompradasAnteriores - totalVendidasAnteriores;
                  const prendasVendidasMes = data.prendas.filter(p => p.fechaVentaConfirmada && p.fechaVentaConfirmada.startsWith(selectedMonth)).length;
                  const ratioRotacion = (prendasCompradas + prendasPeriodoAnterior) > 0 ? prendasVendidasMes / (prendasCompradas + prendasPeriodoAnterior) : 0;
                  const prendasVendidasConFechas = data.prendas.filter(p => p.fechaVentaConfirmada && p.fechaVentaConfirmada.startsWith(selectedMonth) && p.fechaSubida);
                  const tiempoPromedio = prendasVendidasConFechas.length > 0 ? prendasVendidasConFechas.reduce((sum, p) => sum + Math.floor((new Date(p.fechaVentaConfirmada) - new Date(p.fechaSubida)) / (1000 * 60 * 60 * 24)), 0) / prendasVendidasConFechas.length : 0;
                  return (
                    <>
                      <div style={{ background: '#f9fafb', borderRadius: '0.5rem', padding: '1rem' }}><div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Prendas compradas</div><div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>{prendasCompradas}</div><div style={{ fontSize: '0.65rem', color: '#9ca3af', marginTop: '0.25rem' }}>De {lotesMesActual.length} lote(s)</div></div>
                      <div style={{ background: '#f9fafb', borderRadius: '0.5rem', padding: '1rem' }}><div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Del periodo anterior</div><div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>{prendasPeriodoAnterior}</div><div style={{ fontSize: '0.65rem', color: '#9ca3af', marginTop: '0.25rem' }}>No vendidas en {mesAnterior}</div></div>
                      <div style={{ background: '#eff6ff', borderRadius: '0.5rem', padding: '1rem' }}><div style={{ fontSize: '0.75rem', color: '#1e40af', marginBottom: '0.25rem' }}>Total periodos anteriores</div><div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e40af' }}>{prendasTotalesPeriodosAnteriores}</div><div style={{ fontSize: '0.65rem', color: '#3b82f6', marginTop: '0.25rem' }}>Stock acumulado</div></div>
                      <div style={{ background: '#f9fafb', borderRadius: '0.5rem', padding: '1rem' }}><div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Prendas vendidas</div><div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>{prendasVendidasMes}</div></div>
                      <div style={{ background: '#f9fafb', borderRadius: '0.5rem', padding: '1rem' }}><div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Ratio de rotación</div><div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>{ratioRotacion.toFixed(2)}</div></div>
                      <div style={{ background: '#f9fafb', borderRadius: '0.5rem', padding: '1rem' }}><div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Tiempo promedio Vinted</div><div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>{Math.round(tiempoPromedio)} días</div></div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* CALIDAD */}
            <div style={{ background: 'white', borderRadius: '0.5rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>⭐ Calidad</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                {(() => {
                  const lotesMes = data.lotes.filter(l => l.fecha && l.fecha.startsWith(selectedMonth));
                  const prendasInutiles = lotesMes.reduce((sum, l) => sum + (l.prendasInutiles || 0), 0);
                  
                  // Prendas a tratar: prendas del mes que están marcadas como lavadas
                  const prendasMesCreadas = data.prendas.filter(p => {
                    const lote = data.lotes.find(l => l.id === p.loteId);
                    return lote && lote.fecha && lote.fecha.startsWith(selectedMonth);
                  });
                  const prendasATratar = prendasMesCreadas.filter(p => p.lavada).length;
                  
                  const totalPrendas = lotesMes.reduce((sum, l) => sum + l.cantidad, 0);
                  const prendasDefectuosas = prendasATratar + prendasInutiles;
                  const porcDefectuosas = totalPrendas > 0 ? (prendasDefectuosas / totalPrendas * 100) : 0;
                  const porcATratar = totalPrendas > 0 ? (prendasATratar / totalPrendas * 100) : 0;
                  const porcInutiles = totalPrendas > 0 ? (prendasInutiles / totalPrendas * 100) : 0;
                  
                  const prendasVendidasMes = data.prendas.filter(p => {
                    const fechaVenta = p.fechaVentaConfirmada || p.fechaVentaPendiente;
                    return fechaVenta && fechaVenta.startsWith(selectedMonth);
                  });
                  const vendidasAlObjetivo = prendasVendidasMes.filter(p => p.precioVentaReal >= p.precioObjetivo && p.precioObjetivo > 0).length;
                  const porcObjetivo = prendasVendidasMes.length > 0 ? (vendidasAlObjetivo / prendasVendidasMes.length * 100) : 0;
                  
                  return (
                    <>
                      <div style={{ background: '#fef3c7', borderRadius: '0.5rem', padding: '1rem' }}><div style={{ fontSize: '0.75rem', color: '#78350f', marginBottom: '0.25rem' }}>Prendas defectuosas</div><div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#92400e' }}>{porcDefectuosas.toFixed(1)} %</div><div style={{ fontSize: '0.75rem', color: '#92400e', marginTop: '0.25rem' }}>{prendasDefectuosas} de {totalPrendas}</div></div>
                      <div style={{ background: '#dbeafe', borderRadius: '0.5rem', padding: '1rem' }}><div style={{ fontSize: '0.75rem', color: '#1e40af', marginBottom: '0.25rem' }}>Prendas a tratar</div><div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e40af' }}>{porcATratar.toFixed(1)} %</div><div style={{ fontSize: '0.75rem', color: '#1e40af', marginTop: '0.25rem' }}>{prendasATratar} de {totalPrendas}</div></div>
                      <div style={{ background: '#fee2e2', borderRadius: '0.5rem', padding: '1rem' }}><div style={{ fontSize: '0.75rem', color: '#991b1b', marginBottom: '0.25rem' }}>Prendas inútiles (desechables)</div><div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626' }}>{porcInutiles.toFixed(1)} %</div><div style={{ fontSize: '0.75rem', color: '#991b1b', marginTop: '0.25rem' }}>{prendasInutiles} de {totalPrendas}</div></div>
                      <div style={{ background: '#d1fae5', borderRadius: '0.5rem', padding: '1rem' }}><div style={{ fontSize: '0.75rem', color: '#065f46', marginBottom: '0.25rem' }}>Ventas al precio objetivo</div><div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#065f46' }}>{porcObjetivo.toFixed(1)} %</div><div style={{ fontSize: '0.75rem', color: '#065f46', marginTop: '0.25rem' }}>{vendidasAlObjetivo} de {prendasVendidasMes.length}</div></div>
                    </>
                  );
                })()}
              </div>
            </div>
            
            {/* ANÁLISIS DE VENTAS */}
            <div style={{ background: 'white', borderRadius: '0.5rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>💰 Análisis de Ventas</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                {(() => {
                  const prendasVendidasMes = data.prendas.filter(p => {
                    const fechaVenta = p.fechaVentaConfirmada || p.fechaVentaPendiente;
                    return fechaVenta && fechaVenta.startsWith(selectedMonth);
                  });
                  const precioMax = prendasVendidasMes.length > 0 ? Math.max(...prendasVendidasMes.map(p => p.precioVentaReal)) : 0;
                  const precioMin = prendasVendidasMes.length > 0 ? Math.min(...prendasVendidasMes.filter(p => p.precioVentaReal > 0).map(p => p.precioVentaReal)) : 0;
                  const ticketMedio = prendasVendidasMes.length > 0 ? prendasVendidasMes.reduce((sum, p) => sum + p.precioVentaReal, 0) / prendasVendidasMes.length : 0;
                  const costePromedio = prendasVendidasMes.length > 0 ? prendasVendidasMes.reduce((sum, p) => sum + p.precioCompra, 0) / prendasVendidasMes.length : 0;
                  const totalVentas = prendasVendidasMes.reduce((sum, p) => sum + p.precioVentaReal, 0);
                  const totalCostes = prendasVendidasMes.reduce((sum, p) => sum + p.precioCompra, 0);
                  const margenBruto = totalVentas > 0 ? ((totalVentas - totalCostes) / totalVentas * 100) : 0;
                  
                  // Tasa de devoluciones real basada en prendas devueltas
                  const prendasDevueltasMes = data.prendas.filter(p => p.devuelta && p.fechaDevolucion && p.fechaDevolucion.startsWith(selectedMonth)).length;
                  const tasaDevoluciones = prendasVendidasMes.length > 0 ? (prendasDevueltasMes / prendasVendidasMes.length * 100) : 0;
                  
                  return (
                    <>
                      <div style={{ background: '#f9fafb', borderRadius: '0.5rem', padding: '1rem' }}><div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Precio máximo</div><div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>{precioMax.toFixed(2)} €</div></div>
                      <div style={{ background: '#f9fafb', borderRadius: '0.5rem', padding: '1rem' }}><div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Precio mínimo</div><div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>{precioMin.toFixed(2)} €</div></div>
                      <div style={{ background: '#f9fafb', borderRadius: '0.5rem', padding: '1rem' }}><div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Ticket medio</div><div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2563eb' }}>{ticketMedio.toFixed(2)} €</div></div>
                      <div style={{ background: '#f9fafb', borderRadius: '0.5rem', padding: '1rem' }}><div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Coste promedio compra</div><div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>{costePromedio.toFixed(2)} €</div></div>
                      <div style={{ background: '#d1fae5', borderRadius: '0.5rem', padding: '1rem' }}><div style={{ fontSize: '0.75rem', color: '#065f46', marginBottom: '0.25rem' }}>Margen bruto promedio</div><div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#065f46' }}>{margenBruto.toFixed(2)} %</div></div>
                      <div style={{ background: '#f9fafb', borderRadius: '0.5rem', padding: '1rem' }}>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Tasa de devoluciones</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626' }}>{tasaDevoluciones.toFixed(2)} %</div>
                        <div style={{ fontSize: '0.65rem', color: '#9ca3af', marginTop: '0.25rem' }}>{prendasDevueltasMes} devueltas de {prendasVendidasMes.length}</div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* RESULTADOS FINANCIEROS */}
            <div style={{ background: 'white', borderRadius: '0.5rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>📊 Resultados Financieros</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#10b981', marginBottom: '0.75rem' }}>Ingresos</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f9fafb', borderRadius: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Ventas</span>
                    <span style={{ fontWeight: '600', color: '#1f2937' }}>{currentMetrics.totalVentas.toFixed(2)} €</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f9fafb', borderRadius: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Otros ingresos</span>
                    <span style={{ fontWeight: '600', color: '#1f2937' }}>{currentMetrics.totalIngresos.toFixed(2)} €</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#d1fae5', borderRadius: '0.5rem', marginTop: '0.5rem' }}>
                    <span style={{ fontWeight: '600', color: '#065f46' }}>Total Ingresos</span>
                    <span style={{ fontWeight: 'bold', color: '#065f46' }}>{(currentMetrics.totalVentas + currentMetrics.totalIngresos).toFixed(2)} €</span>
                  </div>
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#ef4444', marginBottom: '0.75rem' }}>Gastos</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f9fafb', borderRadius: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Gastos manuales</span>
                    <span style={{ fontWeight: '600', color: '#1f2937' }}>{currentMetrics.totalGastosManuales.toFixed(2)} €</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f9fafb', borderRadius: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Lotes (cuotas del mes)</span>
                    <span style={{ fontWeight: '600', color: '#1f2937' }}>{currentMetrics.gastosLotes.toFixed(2)} €</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f9fafb', borderRadius: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Envío</span>
                    <span style={{ fontWeight: '600', color: '#1f2937' }}>{currentMetrics.gastosEnvio.toFixed(2)} €</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f9fafb', borderRadius: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Destacados</span>
                    <span style={{ fontWeight: '600', color: '#1f2937' }}>{currentMetrics.gastosDestacados.toFixed(2)} €</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#fee2e2', borderRadius: '0.5rem', marginTop: '0.5rem' }}>
                    <span style={{ fontWeight: '600', color: '#991b1b' }}>Total Gastos</span>
                    <span style={{ fontWeight: 'bold', color: '#991b1b' }}>{currentMetrics.totalGastos.toFixed(2)} €</span>
                  </div>
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#2563eb', marginBottom: '0.75rem' }}>Beneficio</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: currentMetrics.beneficioNeto >= 0 ? '#d1fae5' : '#fee2e2', borderRadius: '0.5rem' }}>
                    <div style={{ fontSize: '0.875rem', color: currentMetrics.beneficioNeto >= 0 ? '#065f46' : '#991b1b', marginBottom: '0.5rem' }}>Beneficio Neto</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: currentMetrics.beneficioNeto >= 0 ? '#10b981' : '#ef4444' }}>{currentMetrics.beneficioNeto.toFixed(2)} €</div>
                    <div style={{ fontSize: '0.75rem', color: currentMetrics.beneficioNeto >= 0 ? '#065f46' : '#991b1b', marginTop: '0.5rem' }}>Margen: {currentMetrics.margenBruto.toFixed(1)}%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {currentView === 'lotes' && <LotesManager data={data} setData={saveData} />}
        {currentView === 'inventario' && <InventarioManager data={data} setData={saveData} />}
        {currentView === 'gastosIngresos' && <GastosIngresosManager data={data} setData={saveData} />}
        {currentView === 'pagos' && <PagosManager data={data} />}
        {currentView === 'config' && <ConfigManager data={data} setData={saveData} />}
      </main>
    </div>
  );
}

export default App;
