const { ServersBase } = require('./apk/terminal/ServersBase');
const { AccountsBase } = require('./apk/terminal/AccountsBase');
const { NetworkManager } = require('./apk/terminal/NetworkManager');
const { TradesBase } = require('./apk/terminal/TradesBase');
const { BrokerInfoAPI } = require('./apk/brokers/BrokerInfoAPI');
const { BrokerSearchViewModel_Lkv } = require('./apk/ui/BrokerSearchViewModel_Lkv');
const { LoginViewModel_Lyk2 } = require('./apk/ui/LoginViewModel_Lyk2');
const {
  TradeDeal,
  TradeOrder,
  HistoryPosition,
  TradePosition,
  PositionViewInfo,
  DealsInfoRecord,
  HistoryInfoRecord,
  TradeInfoRecord,
  EntityHistoryPeriod,
  HistoryPeriodCalculator_Loh6
} = require('./apk/types/TradeTypes');

/**
 * MT5 Mobile Cloud Sync Service for GSN-CRM
 *
 * Designed for mobile-only users (without PC/EA) who provide:
 * - serverName (e.g. "STARTRADERFinancial-Demo", "Exness-MT5Real", "ICMarketsSC-Demo")
 * - login      (Account ID, e.g. "1610076507")
 * - password   (Master Password or Investor Password / passview)
 * - from / to  (Date range for trade history sync)
 *
 * Implements the 2-step workflow:
 * 1. step1Login({ serverName, login, password })
 * 2. step2GetHistoryAndSync({ serverName, login, password, from, to, days, syncKey, crmBaseUrl })
 */
class CloudSyncService {
  static _instance = null;

  static getInstance() {
    if (!CloudSyncService._instance) {
      CloudSyncService._instance = new CloudSyncService();
    }
    return CloudSyncService._instance;
  }

  constructor() {
    this.serversBase = ServersBase.f();
    this.accountsBase = AccountsBase.getInstance();
    this.networkManager = NetworkManager.getInstance();
    this.tradesBase = TradesBase.getInstance();
    this.brokerInfoAPI = new BrokerInfoAPI(this.serversBase);
    this.brokerSearchVm = new BrokerSearchViewModel_Lkv(this.serversBase, this.brokerInfoAPI);
    this.loginVm = new LoginViewModel_Lyk2(
      this.brokerInfoAPI,
      this.serversBase,
      this.accountsBase,
      this.networkManager
    );
  }

  /**
   * Search MT5 Brokers & Servers (uses APK BrokerInfoAPI + ServersBase)
   */
  async searchBrokersAndServers(query = '', region = 'VN') {
    const res = await this.brokerSearchVm.searchBrokers(query, region);
    const servers = [];
    const seenServers = new Set();
    for (const b of res.brokers || []) {
      const logoUrl = b.logoHash
        ? `https://download.terminal.free/cdn/mobile/logos/${String(b.logoHash).charAt(0)}/${b.logoHash}.png`
        : '';
      for (const s of b.servers || []) {
        const srvKey = String(s.name || '').trim().toLowerCase();
        if (!srvKey || seenServers.has(srvKey)) continue;
        seenServers.add(srvKey);
        const isDemo = Boolean(s.isDemo) || /demo/i.test(s.name || '');
        servers.push({
          name: s.name,
          serverName: s.name,
          broker: b.shortName || b.company,
          company: b.company,
          brokerId: b.id,
          website: b.website || '',
          logoHash: b.logoHash || '',
          logoUrl,
          isDemo,
          accessPoints: s.access || []
        });
      }
    }
    return {
      success: true,
      query,
      brokers: res.brokers,
      servers,
      trace: res.trace
    };
  }

  /**
   * STEP 1: Login with Mobile User's Server Name, Account ID, and Password (or Passview/Investor)
   */
  async step1Login({
    serverName,
    login,
    password,
    accountType = 'SINGLE',
    brokerId = ''
  }) {
    if (!serverName || !String(serverName).trim()) {
      return { success: false, error: 'Server name is required' };
    }
    if (!login || !String(login).trim()) {
      return { success: false, error: 'Account ID (login) is required' };
    }
    if (!password || !String(password).trim()) {
      return { success: false, error: 'Password (or Passview/Investor password) is required' };
    }

    const cleanServer = String(serverName).trim();
    const loginRes = await this.loginVm.f({
      brokerId: brokerId || cleanServer,
      accountType,
      login: String(login).trim(),
      password: String(password).trim(),
      serverName: cleanServer,
      savePassword: true
    });

    if (!loginRes.success) {
      return loginRes;
    }

    const acc = loginRes.account;
    const isInvestor = Number(acc.rights) === NetworkManager.USER_RIGHT_INVESTOR;

    return {
      success: true,
      account: {
        login: acc.login,
        name: acc.name,
        server: acc.server,
        company: acc.company,
        currency: acc.currency,
        balance: acc.balance,
        equity: acc.equity,
        marginFree: acc.marginFree,
        leverage: acc.leverage,
        demo: acc.demo,
        real: acc.real,
        isInvestor,
        tradeAllowed: !isInvestor,
        accessPoint: acc.accessPoint,
        tcpLatencyMs: acc.tcpLatencyMs
      },
      tcpCheck: loginRes.tcpCheck,
      trace: loginRes.trace
    };
  }

  /**
   * STEP 2: Fetch Trade History by [from, to] and optionally push directly to GSN-CRM
   * (/api/ea/heartbeat + /api/ea/trades in batches of <= 500 trades per TRADE_SYNC_SPECIFICATION.md)
   */
  async step2GetHistoryAndSync({
    serverName,
    login,
    password,
    from = null,
    to = null,
    days = 30,
    limit = 5000,
    syncKey = '',
    crmBaseUrl = 'http://localhost:3000',
    autoPush = false
  }) {
    // 1. Authenticate first via Step 1 if password is provided
    let authResult = null;
    if (password && String(password).trim()) {
      authResult = await this.step1Login({ serverName, login, password });
      if (!authResult.success) {
        return authResult;
      }
    }

    // 2. Load Trade History from APK TradesBase (.dat containers) filtered by [from, to]
    const historyResult = await this.tradesBase.loadTradeHistory({
      login,
      password,
      server: serverName,
      days,
      from,
      to,
      limit
    });

    if (!historyResult.success) {
      return historyResult;
    }

    // 3. If autoPush is enabled and syncKey is provided, push to GSN-CRM (/api/ea/heartbeat + /api/ea/trades)
    let crmPushResult = null;
    if (autoPush && syncKey && String(syncKey).trim()) {
      crmPushResult = await this.pushToGsnCrm({
        crmBaseUrl,
        syncKey: String(syncKey).trim(),
        heartbeatEnvelope: historyResult.heartbeatEnvelope,
        syncEnvelope: historyResult.syncEnvelope
      });
    }

    return {
      ...historyResult,
      auth: authResult ? authResult.account : historyResult.accountInfo,
      crmPush: crmPushResult
    };
  }

  /**
   * Pushes heartbeatEnvelope and syncEnvelope (batched at max 500 trades/request)
   * to GSN-CRM's /api/ea/heartbeat and /api/ea/trades endpoints.
   */
  async pushToGsnCrm({
    crmBaseUrl = 'http://localhost:3000',
    syncKey,
    heartbeatEnvelope,
    syncEnvelope,
    batchSize = 500
  }) {
    const baseUrl = String(crmBaseUrl || 'http://localhost:3000').replace(/\/+$/, '');
    const headers = {
      'Content-Type': 'application/json',
      'X-Sync-Key': String(syncKey).trim()
    };

    // 1. Initial Heartbeat (isSyncing: true)
    let heartbeatResponse = null;
    try {
      const hbRes = await fetch(`${baseUrl}/api/ea/heartbeat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...heartbeatEnvelope, isSyncing: true })
      });
      heartbeatResponse = {
        status: hbRes.status,
        data: await hbRes.json().catch(() => null)
      };
    } catch (err) {
      return {
        success: false,
        stage: 'heartbeat',
        error: err.message
      };
    }

    // 2. Batch Trade Sync (<= 500 trades per request as required by /api/ea/trades)
    const allTrades = Array.isArray(syncEnvelope.trades) ? syncEnvelope.trades : [];
    const chunks = [];
    for (let i = 0; i < allTrades.length; i += batchSize) {
      chunks.push(allTrades.slice(i, i + batchSize));
    }
    if (chunks.length === 0) {
      chunks.push([]);
    }

    let totalReceived = 0;
    let totalImported = 0;
    let totalUpdated = 0;
    let totalClosed = 0;
    let totalBackfilled = 0;
    let totalSkipped = 0;
    const batchResults = [];

    for (let idx = 0; idx < chunks.length; idx++) {
      const batchTrades = chunks[idx];
      const payload = {
        ...syncEnvelope,
        trades: batchTrades
      };
      const trRes = await fetch(`${baseUrl}/api/ea/trades`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      const trData = await trRes.json().catch(() => ({}));
      batchResults.push({
        batchIndex: idx + 1,
        tradesCount: batchTrades.length,
        status: trRes.status,
        data: trData
      });

      if (trData && trData.success) {
        totalReceived += Number(trData.received || 0);
        totalImported += Number(trData.imported || 0);
        totalUpdated += Number(trData.updated || 0);
        totalClosed += Number(trData.closed || 0);
        totalBackfilled += Number(trData.backfilled || 0);
        totalSkipped += Number(trData.skipped || 0);
      }
    }

    // 3. Final Heartbeat (isSyncing: false)
    try {
      await fetch(`${baseUrl}/api/ea/heartbeat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...heartbeatEnvelope, isSyncing: false })
      });
    } catch (_) {}

    const allSucceeded = batchResults.every((b) => b.status >= 200 && b.status < 300 && b.data?.success);
    return {
      success: allSucceeded,
      crmBaseUrl: baseUrl,
      batchesCount: chunks.length,
      summary: {
        received: totalReceived,
        imported: totalImported,
        updated: totalUpdated,
        closed: totalClosed,
        backfilled: totalBackfilled,
        skipped: totalSkipped
      },
      heartbeatResponse,
      batchResults
    };
  }
}

module.exports = {
  CloudSyncService,
  ServersBase,
  AccountsBase,
  NetworkManager,
  TradesBase,
  BrokerInfoAPI,
  BrokerSearchViewModel_Lkv,
  LoginViewModel_Lyk2,
  TradeDeal,
  TradeOrder,
  HistoryPosition,
  TradePosition,
  PositionViewInfo,
  DealsInfoRecord,
  HistoryInfoRecord,
  TradeInfoRecord,
  EntityHistoryPeriod,
  HistoryPeriodCalculator_Loh6
};
