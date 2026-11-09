const { AccountRecord } = require('../types/AccountRecord');
const { ServersBase } = require('../terminal/ServersBase');
const { AccountsBase } = require('../terminal/AccountsBase');
const { NetworkManager, PreferencesBase } = require('../terminal/NetworkManager');
const { BrokerInfoAPI } = require('../brokers/BrokerInfoAPI');

/**
 * Ported from APK: Lyk2; (ViewModel for LoginFragment)
 * DEX offsets in classes.dex:
 * - <init>(BrokerInfoAPI, Lq42) @ 0x316950
 * - e(Lwc4)                     @ 0x316224
 * - f(AccountRecord, ...)       @ 0x3162c0
 * - g(serverHash, login, ...)   @ 0x3167b0
 */
class LoginViewModel_Lyk2 {
  constructor(
    brokerInfoAPI = new BrokerInfoAPI(),
    serversBase = ServersBase.f(),
    accountsBase = AccountsBase.getInstance(),
    networkManager = NetworkManager.getInstance(),
    preferencesBase = PreferencesBase.a()
  ) {
    this.b = brokerInfoAPI;
    this.serversBase = serversBase;
    this.accountsBase = accountsBase;
    this.networkManager = networkManager;
    this.preferencesBase = preferencesBase;
    this.d = false; // isClient flag
    this.j = false; // connecting state
    this.k = false; // connected state
  }

  /**
   * Ported from Lyk2.e() @ 0x316224
   * Determines post-login navigation target ("trade", "marketwatch", "chart", "accounts")
   */
  e(targetRoute = 'accounts') {
    const validTargets = ['chart', 'marketwatch', 'trade', 'order', 'accounts'];
    return validTargets.includes(targetRoute) ? targetRoute : 'accounts';
  }

  /**
   * Ported from Lyk2.f(...) @ 0x3162c0 (and outer wrapper @ 0x467910)
   * 1. Validates Login & Password
   * 2. Formats "cl" prefix if accountType == ACCOUNT_TYPE_CLIENT
   * 3. Checks ServersBase.get(serverHash); if missing, queries BrokerInfoAPI & calls ServersBase.a()
   * 4. Calls Lyk2.g(...)
   */
  async f({
    brokerId = 'startrader',
    accountType = 'SINGLE',
    login = '',
    password = '',
    certPassword = '',
    serverName = 'STARTRADERFinancial-Demo',
    savePassword = true,
    otpPassword = ''
  }) {
    const cleanLogin = String(login || '').trim();
    if (!cleanLogin) {
      return { success: false, error: 'Login is required (Lok2 validation failed in Lyk2.f)' };
    }
    if (!password || String(password).length === 0) {
      return { success: false, error: 'Password is required (Lkk2 validation failed in Lyk2.f)' };
    }

    const isClient = accountType === 'CLIENT' || accountType === AccountRecord.ACCOUNT_TYPE_CLIENT;
    this.d = isClient;

    // Exact logic from Lyk2.f @ 0x467910: prepend "cl" when Client account is selected
    const formattedLogin = isClient
      ? (cleanLogin.startsWith('cl') ? cleanLogin : `cl${cleanLogin}`)
      : cleanLogin;

    // Look up ServerRecord in ServersBase.get(serverHash) (@ 0x3162c0 line 2293)
    let serverRecord = this.serversBase.get(serverName);
    let brokerUpdatedViaApi = false;

    if (!serverRecord) {
      // Lines 2296-2320 of disassembled_login.txt:
      // Query BrokerInfoAPI (this.b) and call ServersBase.a(company, website, logoHash, Llv)
      const apiRes = await this.b.d(brokerId || serverName);
      for (const brokerInfo of apiRes.lsvResult.a) {
        for (const llv of brokerInfo.getServers()) {
          this.serversBase.a(brokerInfo.getCompany(), brokerInfo.website, brokerInfo.logoHash, llv);
        }
      }
      serverRecord = this.serversBase.get(serverName);
      brokerUpdatedViaApi = true;
    }

    // Fallback if user entered a custom server name not in initial DB
    if (!serverRecord) {
      const broker = this.serversBase.getBrokerInfoByIdOrCompany(brokerId) || this.serversBase.brokers[0];
      this.serversBase.a(broker.company, broker.website, broker.logoHash, {
        name: serverName,
        access: [`${serverName.toLowerCase().replace(/[^a-z0-9.-]/g, '')}.mt5.com:443`],
        isDemo: serverName.toLowerCase().includes('demo') || serverName.toLowerCase().includes('trial') ? 1 : 0,
        leverage: '1:500',
        group: 'demo\\standard',
        deposit: 10000,
        build: 4620
      });
      serverRecord = this.serversBase.get(serverName);
    }

    // Call Lyk2.g(serverHash, login, password, certPassword, savePassword, otpPassword, isClient)
    return this.g({
      serverRecord,
      formattedLogin,
      cleanLogin,
      password,
      certPassword,
      savePassword,
      otpPassword,
      isClient,
      brokerUpdatedViaApi
    });
  }

  /**
   * Ported from Lyk2.g([B serverHash, long login, String password, String certPassword, boolean savePassword, String otpPassword, boolean isClient, Continuation)
   * DEX offset: 0x3167b0
   */
  async g({
    serverRecord,
    formattedLogin,
    cleanLogin,
    password,
    certPassword,
    savePassword,
    otpPassword,
    isClient,
    brokerUpdatedViaApi
  }) {
    this.j = true;

    // Line 2368-2370: PreferencesBase.a().putLong("Main.LastAccount", login)
    const numericLogin = Number(String(cleanLogin).replace(/^cl/i, '')) || 0;
    this.preferencesBase.putLong('Main.LastAccount', numericLogin);

    // Line 2371-2373: TerminalNative.network.c(...)
    const netResult = await this.networkManager.c(
      formattedLogin,
      serverRecord.hash,
      password,
      certPassword,
      savePassword,
      otpPassword,
      isClient,
      false
    );

    this.j = false;
    this.k = Boolean(netResult.connected);

    if (!netResult.connected || !netResult.accountRecord) {
      return {
        success: false,
        error: netResult.error || 'Login failed: Authorization failed'
      };
    }

    const broker =
      this.serversBase.getBrokerInfoByIdOrCompany(serverRecord.company) ||
      this.serversBase.brokers[0];
    const allBrokerServers = broker
      ? broker.getServers().map((s) => s.name).join(',')
      : serverRecord.name;

    const webTerminalUrl =
      `https://metatraderweb.app/trade?servers=${encodeURIComponent(allBrokerServers)}` +
      `&trade_server=${encodeURIComponent(serverRecord.name)}` +
      `&login=${encodeURIComponent(cleanLogin)}` +
      `&mode=${serverRecord.demoEnable ? 'demo' : 'connect'}&lang=en`;

    const acc = netResult.accountRecord;
    const trace = [
      {
        layer: '1. APK LoginViewModel (Ported)',
        symbol: 'LoginFragment -> LoginViewModel_Lyk2.f()',
        address: 'src/apk/ui/LoginViewModel_Lyk2.js (DEX @ 0x3162c0)',
        detail: isClient
          ? `AccountRecord.ACCOUNT_TYPE_CLIENT -> prepended "cl" prefix: "${cleanLogin}" -> "${formattedLogin}"`
          : `AccountRecord.ACCOUNT_TYPE_SINGLE (Trade account) -> login="${formattedLogin}"`
      },
      {
        layer: '2. APK ServersBase Lookup (Ported)',
        symbol: `ServersBase.get("${serverRecord.hash}")`,
        address: 'src/apk/terminal/ServersBase.js (JNI @ 0x002b5b2c)',
        detail: `Resolved ServerRecord(name="${serverRecord.name}", build=${serverRecord.build}, access=${JSON.stringify(serverRecord.access)})${brokerUpdatedViaApi ? ' [Updated via BrokerInfoAPI]' : ''}`
      },
      {
        layer: '3. APK PreferencesBase & Lyk2.g (Ported)',
        symbol: `PreferencesBase.putLong("Main.LastAccount", ${numericLogin}) -> NetworkManager.c(...)`,
        address: 'src/apk/ui/LoginViewModel_Lyk2.js (DEX @ 0x3167b0)',
        detail: 'Saved Main.LastAccount preference and invoked NetworkManager.c()'
      },
      {
        layer: '4. APK AccountsBase (Ported)',
        symbol: `AccountsBase.accountsAdd("${formattedLogin}", "${serverRecord.hash}", ***, "", ${Boolean(savePassword)}, ${isClient}, false)`,
        address: 'src/apk/terminal/AccountsBase.js (JNI @ 0x002aa9d4)',
        detail: `Persisted AccountRecord(name="${acc.name}", login=${acc.login}, balance=${acc.balance} ${acc.currency}) into accounts.dat.json`
      },
      {
        layer: '5. APK NetworkManager & Sub-Databases (Ported)',
        symbol: `NetworkManager.networkSetAccount(...) + AccountDatabases_Lg31.c(${numericLogin})`,
        address: 'src/apk/terminal/NetworkManager.js (JNI @ 0x002a2f00 / DEX @ 0x26dc90)',
        detail: 'Bound active account credentials and mounted TradesBase, HistoryBase, SymbolsBase, MailboxBase, NotificationsBase'
      },
      {
        layer: '6. APK Binary Socket Connect (Ported)',
        symbol: `NetworkManager.networkConnect("${otpPassword}", false) -> Lyk2.e("accounts")`,
        address: 'src/apk/terminal/NetworkManager.js (JNI @ 0x002a2c1c / DEX @ 0x316224)',
        detail: `Authenticated "${acc.name}" on ${acc.server} (${netResult.tcpHandshake.endpoint}, ${netResult.tcpHandshake.latencyMs} ms) | Balance: ${Number(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })} ${acc.currency} | Equity: ${Number(acc.equity).toLocaleString('en-US', { minimumFractionDigits: 2 })} ${acc.currency} | Positions: ${(acc.positions || []).length} | Orders: ${(acc.orders || []).length}`
      }
    ];

    return {
      success: true,
      nextScreen: this.e('accounts'),
      account: netResult.accountRecord,
      allSavedAccounts: this.accountsBase.getAllAccounts(),
      tcpCheck: netResult.tcpHandshake,
      webTerminalUrl,
      trace
    };
  }
}

module.exports = { LoginViewModel_Lyk2 };
