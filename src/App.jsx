import React, { useState, useEffect } from 'react';
import { BarChart3, Package, TrendingUp, Settings, LogOut, Download, Calendar, Plus, Edit2, Trash2, X, Search, AlertCircle, PieChart } from 'lucide-react';
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
            <img src="/logo.png" alt="Quasart Style" className="w-24 h-24 mx-auto mb-4 object-contain" />
            <h1 className="text-3xl font-bold mb-2 text-gray-800">Quasart Style</h1>
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
            <div className="flex items-center space-x-3">
              <img src="/logo.png" alt="Quasart Style" className="w-10 h-10 object-contain" />
              <h1 className="text-2xl font-bold text-gray-800">Quasart Style</h1>
            </div>
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
              onClick={() => setCurrentView('estadisticas')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                currentView === 'estadisticas' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <PieChart size={20} />
              <span className="font-medium">Estadísticas</span>
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

        {currentView === 'estadisticas' && (
          <div className="text-center py-12">
            <PieChart size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Sección de Estadísticas - Próximamente</p>
          </div>
        )}

        {currentView === 'lotes' && (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Sección de Lotes - Próximamente</p>
          </div>
        )}

        {currentView === 'inventario' && (
          <div className="text-center py-12">
            <TrendingUp size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Sección de Inventario - Próximamente</p>
          </div>
        )}

        {currentView === 'config' && (
          <div className="text-center py-12">
            <Settings size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Sección de Configuración - Próximamente</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
