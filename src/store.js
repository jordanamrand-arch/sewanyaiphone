// ============================================
// Sewanya iPhone — REST API + Optimistic Store
// ============================================

const API_BASE = '/api';

// Mappers to convert between Frontend (snake_case / custom names) and Backend (camelCase / DB columns)
const mappers = {
  iphone: {
    toFrontend(db) {
      if (!db) return null;
      return {
        id: db.id,
        model: db.model,
        nomor_seri: db.serialNumber,
        warna: db.color,
        battery_health: db.batteryHealth,
        status_fisik: db.physicalStatus,
      };
    },
    toBackend(fe) {
      if (!fe) return null;
      return {
        model: fe.model,
        serialNumber: fe.nomor_seri,
        color: fe.warna,
        batteryHealth: Number(fe.battery_health),
        physicalStatus: fe.status_fisik,
      };
    }
  },
  pricing: {
    toFrontend(db) {
      if (!db) return null;
      return {
        id: db.id,
        iphone_id: db.iphoneId,
        jenis_durasi: db.durationType,
        durasi: db.duration,
        harga: db.price,
      };
    },
    toBackend(fe) {
      if (!fe) return null;
      return {
        iphoneId: fe.iphone_id,
        durationType: fe.jenis_durasi,
        duration: Number(fe.durasi),
        price: Number(fe.harga),
      };
    }
  },
  transaction: {
    toFrontend(db) {
      if (!db) return null;
      return {
        id: db.id,
        tx_number: db.txNumber,
        user_id: db.userId,
        iphone_id: db.iphoneId,
        customer_name: db.customerName,
        customer_whatsapp: db.customerWhatsapp,
        tanggal_waktu_mulai: db.startTime,
        tanggal_waktu_selesai: db.endTime,
        dp_amount: db.dpAmount,
        settlement_amount: db.settlementAmount,
        total_harga: db.totalPrice,
        status_pembayaran: db.paymentStatus,
        status_rental: db.rentalStatus,
        created_at: db.createdAt,
      };
    },
    toBackend(fe) {
      if (!fe) return null;
      return {
        iphoneId: fe.iphone_id,
        customerName: fe.customer_name,
        customerWhatsapp: fe.customer_whatsapp,
        startTime: fe.tanggal_waktu_mulai,
        endTime: fe.tanggal_waktu_selesai,
        dpAmount: Number(fe.dp_amount || 0),
        settlementAmount: Number(fe.settlement_amount || 0),
        totalPrice: Number(fe.total_harga || 0),
        paymentStatus: fe.status_pembayaran,
        rentalStatus: fe.status_rental,
      };
    }
  },
  user: {
    toFrontend(db) {
      if (!db) return null;
      return {
        id: db.id,
        nama: db.name,
        username: db.email.split('@')[0],
        email: db.email,
        role: db.role,
      };
    },
    toBackend(fe) {
      if (!fe) return null;
      return {
        name: fe.nama,
        email: fe.email || `${fe.username}@sewanya.com`,
        role: fe.role,
      };
    }
  },
  log: {
    toFrontend(db) {
      if (!db) return null;
      return {
        id: db.id,
        user_id: db.userId,
        activity: db.activity,
        created_at: db.createdAt,
      };
    },
    toBackend(fe) {
      if (!fe) return null;
      return {
        activity: fe.activity,
      };
    }
  }
};

// Generic fetch client with credentials included for session cookies
async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  options.credentials = 'include';
  options.headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  const response = await fetch(url, options);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  return response.json().catch(() => ({}));
}

function generateId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
}

export const store = {
  // In-memory cache
  _session: null,
  _iphones: [],
  _pricing: [],
  _transactions: [],
  _logs: [],
  _users: [],
  _txCounter: 5,

  // ============ INITIALIZATION ============
  async init() {
    try {
      // 1. Fetch current session to check if logged in
      const sessionResult = await apiFetch('/auth/get-session');
      if (sessionResult && sessionResult.user) {
        this._session = {
          id: sessionResult.user.id,
          nama: sessionResult.user.name,
          username: sessionResult.user.email.split('@')[0],
          email: sessionResult.user.email,
          role: sessionResult.user.role,
        };
        // 2. Fetch all database records since we are authenticated
        await this._fetchData();
      } else {
        this._session = null;
      }
    } catch (err) {
      console.warn('Initial session check failed or user not authenticated:', err.message);
      this._session = null;
    }
  },

  async _fetchData() {
    try {
      const [iphones, pricing, transactions, logs, users] = await Promise.all([
        apiFetch('/iphones').catch(() => []),
        apiFetch('/pricing').catch(() => []),
        apiFetch('/transactions?perPage=10000').catch(() => ({ data: [] })),
        apiFetch('/logs').catch(() => []),
        apiFetch('/users').catch(() => []),
      ]);

      // Map backend responses to frontend entities
      this._iphones = iphones.map(mappers.iphone.toFrontend);
      this._pricing = pricing.map(mappers.pricing.toFrontend);
      
      const txList = Array.isArray(transactions) ? transactions : transactions.data || [];
      this._transactions = txList.map(mappers.transaction.toFrontend);
      this._txCounter = this._transactions.length;
      
      this._logs = logs.map(mappers.log.toFrontend);
      this._users = users.map(mappers.user.toFrontend);
    } catch (err) {
      console.error('Failed to load database records:', err);
    }
  },

  // ============ SESSION / AUTH ============
  getSession() {
    return this._session;
  },

  setSession(user) {
    this._session = user;
  },

  async clearSession() {
    try {
      await apiFetch('/auth/sign-out', { method: 'POST' });
    } catch (err) {
      console.error('Failed to sign out from backend:', err);
    }
    this._session = null;
    this._iphones = [];
    this._pricing = [];
    this._transactions = [];
    this._logs = [];
    this._users = [];
  },

  async login(username, password) {
    // Map simple username (e.g. 'admin') to email
    const email = username.includes('@') ? username : `${username}@sewanya.com`;

    try {
      // 1. Authenticate with Better Auth on backend
      const result = await apiFetch('/auth/sign-in/email', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (result && result.user) {
        this._session = {
          id: result.user.id,
          nama: result.user.name,
          username: result.user.email.split('@')[0],
          email: result.user.email,
          role: result.user.role,
        };

        // 2. Fetch full system data now that we are logged in
        await this._fetchData();
        return this._session;
      }
    } catch (err) {
      console.error('Login failed:', err);
    }
    return null;
  },

  isLoggedIn() {
    return !!this.getSession();
  },

  // ============ USERS ============
  getUsers() {
    return this._users;
  },

  getUserById(id) {
    return this.getUsers().find((u) => u.id === id);
  },

  addUser(data) {
    const tempId = generateId('user');
    const user = { id: tempId, ...data };
    this._users.push(user);

    // Sync in background
    apiFetch('/users', {
      method: 'POST',
      body: JSON.stringify(mappers.user.toBackend(data)),
    }).then((created) => {
      const idx = this._users.findIndex(u => u.id === tempId);
      if (idx !== -1) this._users[idx].id = created.id;
    }).catch(err => console.error('Failed to sync added user:', err));

    return user;
  },

  updateUser(id, data) {
    const idx = this._users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    this._users[idx] = { ...this._users[idx], ...data };

    // Sync in background
    apiFetch(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(mappers.user.toBackend(data)),
    }).catch(err => console.error('Failed to sync updated user:', err));

    // Update current session if editing self
    if (this._session && this._session.id === id) {
      this._session = { ...this._session, nama: data.nama, role: data.role };
    }
    return this._users[idx];
  },

  deleteUser(id) {
    this._users = this._users.filter((u) => u.id !== id);

    // Sync in background
    apiFetch(`/users/${id}`, { method: 'DELETE' })
      .catch(err => console.error('Failed to sync deleted user:', err));
  },

  // ============ IPHONES ============
  getIphones() {
    return this._iphones;
  },

  getIphoneById(id) {
    return this.getIphones().find((i) => i.id === id);
  },

  addIphone(data) {
    const tempId = generateId('iphone');
    const iphone = { id: tempId, ...data };
    this._iphones.push(iphone);

    // Sync in background
    apiFetch('/iphones', {
      method: 'POST',
      body: JSON.stringify(mappers.iphone.toBackend(data)),
    }).then((created) => {
      const idx = this._iphones.findIndex(i => i.id === tempId);
      if (idx !== -1) {
        this._iphones[idx].id = created.id;
        // Keep in-memory cache aligned with database UUID
      }
    }).catch(err => console.error('Failed to sync added iphone:', err));

    return iphone;
  },

  updateIphone(id, data) {
    const idx = this._iphones.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    this._iphones[idx] = { ...this._iphones[idx], ...data };

    // Sync in background
    apiFetch(`/iphones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(mappers.iphone.toBackend(data)),
    }).catch(err => console.error('Failed to sync updated iphone:', err));

    return this._iphones[idx];
  },

  deleteIphone(id) {
    this._iphones = this._iphones.filter((i) => i.id !== id);
    this._pricing = this._pricing.filter((p) => p.iphone_id !== id);

    // Sync in background
    apiFetch(`/iphones/${id}`, { method: 'DELETE' })
      .catch(err => console.error('Failed to sync deleted iphone:', err));
  },

  // ============ PRICING ============
  getPricing() {
    return this._pricing;
  },

  getPricingByIphone(iphoneId) {
    return this.getPricing().filter((p) => p.iphone_id === iphoneId);
  },

  getPricingTier(iphoneId, jenisDurasi, durasi) {
    return this.getPricing().find(
      (p) =>
        p.iphone_id === iphoneId &&
        p.jenis_durasi === jenisDurasi &&
        p.durasi === Number(durasi)
    );
  },

  addPricing(data) {
    const tempId = generateId('price');
    const item = { id: tempId, ...data };
    this._pricing.push(item);

    // Sync in background
    apiFetch('/pricing', {
      method: 'POST',
      body: JSON.stringify(mappers.pricing.toBackend(data)),
    }).then((created) => {
      const idx = this._pricing.findIndex(p => p.id === tempId);
      if (idx !== -1) this._pricing[idx].id = created.id;
    }).catch(err => console.error('Failed to sync added pricing tier:', err));

    return item;
  },

  updatePricing(id, data) {
    const idx = this._pricing.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    this._pricing[idx] = { ...this._pricing[idx], ...data };

    // Sync in background
    apiFetch(`/pricing/${id}`, {
      method: 'PUT',
      body: JSON.stringify(mappers.pricing.toBackend(data)),
    }).catch(err => console.error('Failed to sync updated pricing tier:', err));

    return this._pricing[idx];
  },

  deletePricing(id) {
    this._pricing = this._pricing.filter((p) => p.id !== id);

    // Sync in background
    apiFetch(`/pricing/${id}`, { method: 'DELETE' })
      .catch(err => console.error('Failed to sync deleted pricing tier:', err));
  },

  // ============ TRANSACTIONS ============
  getTransactions() {
    return this._transactions;
  },

  getTransactionById(id) {
    return this.getTransactions().find((t) => t.id === id);
  },

  getNextTxNumber() {
    this._txCounter++;
    return `TX-${String(this._txCounter).padStart(3, '0')}`;
  },

  addTransaction(data) {
    const tempId = generateId('tx');
    const txNumber = this.getNextTxNumber();
    const tx = {
      id: tempId,
      tx_number: txNumber,
      created_at: new Date().toISOString(),
      user_id: this._session ? this._session.id : 'unknown',
      ...data,
    };
    this._transactions.push(tx);

    // Sync in background
    apiFetch('/transactions', {
      method: 'POST',
      body: JSON.stringify(mappers.transaction.toBackend(data)),
    }).then((created) => {
      const idx = this._transactions.findIndex(t => t.id === tempId);
      if (idx !== -1) {
        // Update both the UUID and the final sequential TX number generated by the database
        this._transactions[idx].id = created.id;
        this._transactions[idx].tx_number = created.txNumber;
      }
    }).catch(err => console.error('Failed to sync added transaction:', err));

    return tx;
  },

  updateTransaction(id, data) {
    const idx = this._transactions.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    this._transactions[idx] = { ...this._transactions[idx], ...data };

    // Sync in background
    apiFetch(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(mappers.transaction.toBackend(data)),
    }).catch(err => console.error('Failed to sync updated transaction:', err));

    return this._transactions[idx];
  },

  deleteTransaction(id) {
    this._transactions = this._transactions.filter((t) => t.id !== id);

    // Sync in background
    apiFetch(`/transactions/${id}`, { method: 'DELETE' })
      .catch(err => console.error('Failed to sync deleted transaction:', err));
  },

  isIphoneAvailable(iphoneId, startDate, endDate, excludeTxId = null) {
    const transactions = this.getTransactions();
    const start = new Date(startDate);
    const end = new Date(endDate);

    return !transactions.some((tx) => {
      if (tx.id === excludeTxId) return false;
      if (tx.iphone_id !== iphoneId) return false;
      if (tx.status_rental === 'selesai') return false;

      const txStart = new Date(tx.tanggal_waktu_mulai);
      const txEnd = new Date(tx.tanggal_waktu_selesai);

      return start < txEnd && end > txStart;
    });
  },

  getAvailableIphones(startDate, endDate, excludeTxId = null) {
    const iphones = this.getIphones().filter((i) => i.status_fisik === 'ready');
    return iphones.filter((i) =>
      this.isIphoneAvailable(i.id, startDate, endDate, excludeTxId)
    );
  },

  // ============ ACTIVITY LOGS ============
  getLogs() {
    return this._logs;
  },

  addLog(data) {
    const tempId = generateId('log');
    const log = {
      id: tempId,
      created_at: new Date().toISOString(),
      user_id: this._session ? this._session.id : 'unknown',
      ...data,
    };
    this._logs.unshift(log);

    // Sync in background
    apiFetch('/logs', {
      method: 'POST',
      body: JSON.stringify(mappers.log.toBackend(data)),
    }).then((created) => {
      const idx = this._logs.findIndex(l => l.id === tempId);
      if (idx !== -1) this._logs[idx].id = created.id;
    }).catch(err => console.error('Failed to sync added log:', err));

    return log;
  },

  // ============ DASHBOARD STATS ============
  getDashboardStats() {
    const iphones = this.getIphones();
    const transactions = this.getTransactions();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalUnit = iphones.length;
    const sedangDisewa = transactions.filter(
      (t) => t.status_rental === 'aktif_disewa'
    ).length;
    const booking = transactions.filter(
      (t) => t.status_rental === 'booking'
    ).length;
    const terlambat = transactions.filter(
      (t) => t.status_rental === 'terlambat'
    ).length;

    const pendapatanBulan = transactions
      .filter((t) => {
        const created = new Date(t.created_at);
        return created >= monthStart && t.status_pembayaran !== 'menunggu_dp';
      })
      .reduce((sum, t) => sum + (t.total_harga || 0), 0);

    const transaksiAktif = transactions.filter(
      (t) => t.status_rental === 'aktif_disewa' || t.status_rental === 'terlambat'
    );

    const bookingHariIni = transactions.filter((t) => {
      if (t.status_rental !== 'booking') return false;
      const startDate = new Date(t.tanggal_waktu_mulai);
      return (
        startDate.toDateString() === now.toDateString()
      );
    });

    const unitTersedia = iphones.filter((i) => {
      if (i.status_fisik !== 'ready') return false;
      return !transactions.some(
        (t) =>
          t.iphone_id === i.id &&
          (t.status_rental === 'aktif_disewa' || t.status_rental === 'booking')
      );
    });

    return {
      totalUnit,
      sedangDisewa,
      booking,
      terlambat,
      pendapatanBulan,
      transaksiAktif,
      bookingHariIni,
      unitTersedia,
    };
  },

  resetAll() {
    this.clearSession();
  },
};
