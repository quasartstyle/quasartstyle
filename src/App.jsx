import React, { useState, useEffect } from 'react';
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
            <img src="/logo.png" alt="Quasart Style" style={{ width: '6rem', height: '6rem', margin: '0 auto 1rem', objectFit: 'contain' }} />
            <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1f2937' }}>Quasart Style</h1>
            <p style={{ color: '#6b7280' }}>Panel de Control Vinted</p>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="Contraseña"
              style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', outline: 'none' }}
            />
            <button
              onClick={handleLogin}
              style={{ width: '100%', background: 'linear-gradient(to right, #2563eb, #1d4ed8)', color: 'white', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: '500', border: 'none', cursor: 'pointer' }}
            >
              Entrar
            </button>
          </div>
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
            <button
              onClick={() => setIsAuthenticated(false)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <span>Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '80rem', margin: '0 auto', padding: '1.5rem' }}>
        <div style={{ background: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', padding: '3rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Bienvenido a Quasart Style</h2>
          <p style={{ color: '#6b7280' }}>Panel de control funcionando correctamente</p>
        </div>
      </main>
    </div>
  );
}

export default App;
