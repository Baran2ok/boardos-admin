import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, query, orderBy } from "firebase/firestore";
import {
  LayoutDashboard,
  Building2,
  Wallet,
  Activity,
  Settings,
  LogOut,
  Plus,
  Search,
  MoreVertical,
  ChevronRight,
  ShieldAlert,
  CheckCircle,
  XCircle,
  Cpu,
  Trash2,
  Key
} from 'lucide-react';

// --- FIREBASE AYARLARI (CANLI BAĞLANTI) ---
const firebaseConfig = {
  apiKey: "AIzaSyDKcA0IPDXvxov7sGKp8Om6Wq6xcLCemV4",
  authDomain: "boardos-core.firebaseapp.com",
  projectId: "boardos-core",
  storageBucket: "boardos-core.firebasestorage.app",
  messagingSenderId: "1000355806604",
  appId: "1:1000355806604:web:f6682c169e607f2b9e2aa9"
};

// Firebase'i başlat
let db;
try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log("Firebase bağlantısı başarılı!");
} catch (error) {
  console.error("Firebase bağlantı hatası:", error);
}

// --- MOCK DATA (Yüklenirken veya Boşken Görünecek) ---
// Not: Gerçek veriler gelince bunların üzerine yazılacak.
const MOCK_SCHOOLS = [];

export default function BoardOS_SuperAdmin() {
  const [activeTab, setActiveTab] = useState('schools');
  const [schools, setSchools] = useState(MOCK_SCHOOLS);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('checking'); // checking, connected, error

  // Yeni Okul Formu State'i
  const [newSchool, setNewSchool] = useState({
    name: '',
    city: '',
    code: '',
    maxBoards: 20,
    licenseDuration: 12
  });

  // --- FIREBASE VERİ ÇEKME ---
  const fetchSchools = async () => {
    if (!db) {
      setConnectionStatus('error');
      return;
    }

    setLoading(true);
    try {
      const q = query(collection(db, "schools"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);

      const schoolList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setSchools(schoolList);
      setConnectionStatus('connected');
    } catch (error) {
      console.error("Veri çekme hatası:", error);
      setConnectionStatus('error');
    }
    setLoading(false);
  };

  useEffect(() => {
    // Sayfa açılınca verileri çek
    fetchSchools();
  }, []);

  // --- OKUL EKLEME FONKSİYONU ---
  const handleAddSchool = async (e) => {
    e.preventDefault();
    if (!db) {
      alert("Veritabanı bağlantısı yok!");
      return;
    }
    setLoading(true);

    // 1. Lisans Bitiş Tarihini Hesapla
    const today = new Date();
    const expiryDate = new Date(today.setMonth(today.getMonth() + parseInt(newSchool.licenseDuration)));
    const expiryString = expiryDate.toISOString().split('T')[0];

    // 2. Rastgele Lisans Anahtarı Üret (Benzersiz ID)
    const licenseKey = `BOS-${Math.random().toString(36).substr(2, 4).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    const schoolData = {
      name: newSchool.name,
      city: newSchool.city,
      code: newSchool.code,
      maxBoards: parseInt(newSchool.maxBoards),
      licenseEnds: expiryString,
      licenseKey: licenseKey,
      status: 'active',
      paymentStatus: 'paid', // Şimdilik ödendi varsayıyoruz
      createdAt: serverTimestamp()
    };

    try {
      // Firebase'e Ekle
      await addDoc(collection(db, "schools"), schoolData);

      // Listeyi yenile
      await fetchSchools();

      setShowAddModal(false);
      // Formu temizle
      setNewSchool({
        name: '',
        city: '',
        code: '',
        maxBoards: 20,
        licenseDuration: 12
      });
      alert(`✅ Okul Başarıyla Eklendi!\n🔑 Lisans Anahtarı: ${licenseKey}\n\nBu anahtarı okul müdürüne ilet.`);
    } catch (error) {
      console.error("Ekleme hatası:", error);
      alert("❌ Hata oluştu: " + error.message);
    }
    setLoading(false);
  };

  // --- OKUL SİLME FONKSİYONU ---
  const handleDeleteSchool = async (id) => {
    if (!window.confirm("DİKKAT: Bu okulu silerseniz lisansları iptal olur ve tahtalar kilitli kalabilir. Emin misiniz?")) return;

    try {
      await deleteDoc(doc(db, "schools", id));
      fetchSchools();
    } catch (error) {
      alert("Silme hatası: " + error.message);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">

      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 transition-all duration-300">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-8 h-8 bg-indigo-500 rounded flex items-center justify-center text-white shadow-lg shadow-indigo-500/50">
            <Cpu size={20} />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg tracking-tight">BoardOS</h1>
            <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Super Admin</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-6">
          <MenuButton icon={<LayoutDashboard size={18} />} text="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <MenuButton icon={<Building2 size={18} />} text="Okullar & Lisanslar" active={activeTab === 'schools'} onClick={() => setActiveTab('schools')} />
          <MenuButton icon={<Wallet size={18} />} text="Faturalar" active={activeTab === 'invoices'} onClick={() => setActiveTab('invoices')} />
          <MenuButton icon={<Activity size={18} />} text="Sistem Sağlığı" active={activeTab === 'health'} onClick={() => setActiveTab('health')} />
          <MenuButton icon={<Settings size={18} />} text="Global Ayarlar" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>

        <div className="p-4">
          {/* Bağlantı Durumu Göstergesi */}
          <div className={`mb-4 text-xs flex items-center gap-2 px-3 py-2 rounded-lg ${connectionStatus === 'connected' ? 'bg-emerald-900/30 text-emerald-400' : connectionStatus === 'error' ? 'bg-rose-900/30 text-rose-400' : 'bg-slate-800 text-slate-400'}`}>
            <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
            {connectionStatus === 'connected' ? 'Sunucuya Bağlı' : connectionStatus === 'error' ? 'Bağlantı Hatası' : 'Bağlanıyor...'}
          </div>
          <button className="w-full flex items-center gap-2 text-slate-400 hover:text-rose-500 transition-colors px-4 py-2 rounded-lg hover:bg-slate-800">
            <LogOut size={16} /> <span className="text-sm font-medium">Güvenli Çıkış</span>
          </button>
        </div>
      </aside>

      {/* ANA İÇERİK */}
      <main className="flex-1 overflow-auto bg-slate-50 p-8">

        {/* ÜST BAR */}
        <header className="flex justify-between items-center mb-8 animate-fade-in-down">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Okul Yönetimi</h2>
            <p className="text-slate-500 text-sm">Sisteme kayıtlı okulları yönet, yeni lisans oluştur.</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5"
          >
            <Plus size={18} /> Yeni Okul Ekle
          </button>
        </header>

        {/* İÇERİK ALANI */}
        <div className="grid gap-6 animate-fade-in-up">

          {/* İstatistik Kartları */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard title="Toplam Okul" value={schools.length} icon={<Building2 className="text-indigo-600" />} color="indigo" />
            <StatCard title="Aktif Lisans" value={schools.filter(s => s.status === 'active').length} icon={<CheckCircle className="text-emerald-600" />} color="emerald" />
            <StatCard title="Bitişi Yaklaşan" value={schools.filter(s => s.status === 'warning').length} icon={<ShieldAlert className="text-amber-600" />} color="amber" />
          </div>

          {/* Okul Tablosu */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input type="text" placeholder="Okul adı veya kodu ara..." className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white" />
              </div>
              <span className="text-xs text-slate-500 font-medium">Toplam {schools.length} kayıt listelendi</span>
            </div>

            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-4 font-semibold">Kurum Adı</th>
                  <th className="p-4 font-semibold">Şehir</th>
                  <th className="p-4 font-semibold">Lisans Bitiş</th>
                  <th className="p-4 font-semibold">Tahta Limiti</th>
                  <th className="p-4 font-semibold">Durum</th>
                  <th className="p-4 font-semibold text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schools.length > 0 ? schools.map((school) => (
                  <tr key={school.id} className="hover:bg-slate-50 group transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{school.name}</div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5 bg-slate-100 inline-block px-1.5 py-0.5 rounded">{school.code}</div>
                    </td>
                    <td className="p-4 text-slate-600">{school.city}</td>
                    <td className="p-4">
                      <div className="font-medium text-slate-700">{school.licenseEnds}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Otomatik Yenileme</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-bold">{school.maxBoards} Adet</span>
                    </td>
                    <td className="p-4">
                      <StatusBadge status={school.status} />
                    </td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Lisans Detayları">
                        <Key size={16} />
                      </button>
                      <button onClick={() => handleDeleteSchool(school.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Okulu Sil">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="p-12 text-center text-slate-400">
                      <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>Henüz kayıtlı okul yok.</p>
                      <button onClick={() => setShowAddModal(true)} className="mt-2 text-indigo-600 hover:underline">İlk okulu ekle</button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODAL: YENİ OKUL EKLE */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <Building2 className="text-indigo-600" size={20} /> Yeni Kurum Ekle
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-rose-500 transition-colors">
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleAddSchool} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kurum Adı</label>
                <input
                  required
                  type="text"
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="Örn: Diyarbakır Cumhuriyet Fen Lisesi"
                  value={newSchool.name}
                  onChange={(e) => setNewSchool({ ...newSchool, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kurum Kodu (MEB)</label>
                  <input
                    required
                    type="text"
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Örn: 123456"
                    value={newSchool.code}
                    onChange={(e) => setNewSchool({ ...newSchool, code: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Şehir</label>
                  <select
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    value={newSchool.city}
                    onChange={(e) => setNewSchool({ ...newSchool, city: e.target.value })}
                  >
                    <option value="">Seçiniz</option>
                    <option value="Diyarbakır">Diyarbakır</option>
                    <option value="İstanbul">İstanbul</option>
                    <option value="Ankara">Ankara</option>
                    <option value="İzmir">İzmir</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                  <label className="block text-xs font-bold text-indigo-800 mb-1 uppercase tracking-wider">Lisans Süresi</label>
                  <select
                    className="w-full bg-white border border-indigo-200 rounded p-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={newSchool.licenseDuration}
                    onChange={(e) => setNewSchool({ ...newSchool, licenseDuration: e.target.value })}
                  >
                    <option value="12">1 Yıl (Standart)</option>
                    <option value="24">2 Yıl</option>
                    <option value="36">3 Yıl</option>
                    <option value="60">5 Yıl (Avantajlı)</option>
                  </select>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                  <label className="block text-xs font-bold text-emerald-800 mb-1 uppercase tracking-wider">Tahta Limiti</label>
                  <input
                    type="number"
                    className="w-full bg-white border border-emerald-200 rounded p-1.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={newSchool.maxBoards}
                    onChange={(e) => setNewSchool({ ...newSchool, maxBoards: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">İptal</button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-lg shadow-indigo-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Ekleniyor...' : <><Plus size={18} /> Kaydet ve Lisansla</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- YARDIMCI COMPONENTLER ---

const MenuButton = ({ icon, text, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${active
      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20'
      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
  >
    <span className={active ? 'text-white' : 'text-slate-500 group-hover:text-white'}>{icon}</span>
    <span className="font-medium text-sm">{text}</span>
    {active && <ChevronRight size={14} className="ml-auto opacity-50" />}
  </button>
);

const StatCard = ({ title, value, icon, color }) => {
  const bgColors = {
    indigo: "bg-indigo-50 border-indigo-100",
    emerald: "bg-emerald-50 border-emerald-100",
    amber: "bg-amber-50 border-amber-100"
  };

  return (
    <div className={`p-5 rounded-xl border ${bgColors[color]} flex items-center justify-between`}>
      <div>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
      </div>
      <div className="p-3 bg-white rounded-lg shadow-sm border border-slate-100">
        {icon}
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const configs = {
    active: { color: "bg-emerald-100 text-emerald-700", text: "Aktif", icon: <CheckCircle size={12} /> },
    warning: { color: "bg-amber-100 text-amber-700", text: "Bitiyor", icon: <ShieldAlert size={12} /> },
    expired: { color: "bg-rose-100 text-rose-700", text: "Süresi Doldu", icon: <XCircle size={12} /> }
  };
  const config = configs[status] || configs.active;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${config.color}`}>
      {config.icon} {config.text}
    </span>
  );
};