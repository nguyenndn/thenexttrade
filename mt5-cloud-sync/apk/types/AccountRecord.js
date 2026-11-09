/**
 * Ported from APK: Lnet/metaquotes/metatrader5/types/AccountRecord;
 * DEX offset: 0x58caac (classes.dex)
 */
class AccountRecord {
  static ACCOUNT_TYPE_SINGLE = 0;
  static ACCOUNT_TYPE_CLIENT = 1;
  static ACCOUNT_TYPE_CLIENT_ACCOUNT = 2;

  static USER_PASSWORD_MAIN = 0;
  static USER_PASSWORD_INVESTOR = 1;
  static USER_PASSWORD_TRADER = 2;
  static USER_PASSWORD_MONEY = 3;

  static USER_RIGHT_READ_ONLY = 1n;
  static USER_RIGHT_PASSWORD = 2n;
  static USER_RIGHT_TRADE_DISABLED = 4n;
  static USER_RIGHT_INVESTOR = 8n;
  static USER_RIGHT_SESSION_TRADER = 16n;
  static USER_RIGHT_SESSION_MONEY = 32n;

  static DEFAULT_DEMO_ACCOUNT_NAME = 'MetaTrader 5 Android Demo';

  constructor({
    name = '',
    login = 0,
    hasPassword = true,
    hasCertificate = false,
    hasCertPassword = false,
    server = '',
    serverHash = '',
    lastAccess = Date.now(),
    demo = true,
    rights = 16,
    contest = false,
    preliminary = false,
    real = false,
    company = '',
    currency = 'USD',
    deposit = 10000.0,
    currencyDigits = 2,
    leverage = 500,
    email = '',
    links = [],
    flags = 0,
    accountType = AccountRecord.ACCOUNT_TYPE_SINGLE,
    clientLogin = 0,
    // Extended live runtime fields populated after NetworkManager.networkConnect
    balance = null,
    equity = null,
    profit = 0.0,
    margin = 0.0,
    marginFree = null,
    positions = [],
    orders = [],
    realAuthenticated = false,
    mt5AuthError = null,
    accessPoint = '',
    tcpLatencyMs = 0
  } = {}) {
    this.FLAG_HAS_ONE_TIME_PASSWORD = 1;
    this.FLAG_USE_OWN_OTP_GENERATOR = 2;
    this.FLAG_HAS_PASSKEY = 4;

    this.login = Number(String(login).replace(/^cl/i, '')) || 0;
    this.formattedLogin =
      accountType === AccountRecord.ACCOUNT_TYPE_CLIENT
        ? (String(login).startsWith('cl') ? String(login) : `cl${login}`)
        : String(login);
    this.hasPassword = Boolean(hasPassword);
    this.server = server;
    this.serverHash = serverHash;
    this.lastAccess = lastAccess;
    this.demo = Boolean(demo);
    this.rights = rights;
    this.contest = Boolean(contest);
    this.preliminary = Boolean(preliminary);
    this.real = Boolean(real);
    this.hasCertificate = Boolean(hasCertificate);
    this.hasCertPassword = Boolean(hasCertPassword);
    this.company = company;
    this.currency = currency || 'USD';
    this.deposit = Number(deposit) || 0;
    this.currencyDigits = currencyDigits;
    this.leverage = leverage;
    this.email = email;
    this.name = this.prepareAccountName(name);
    this.links = Array.isArray(links) ? links : [];
    this.flags = flags;
    this.accountType = accountType;
    this.clientLogin = clientLogin;
    this.investor = this.isInvestor();

    // Live runtime state
    this.balance = balance !== null ? balance : this.deposit;
    this.equity = equity !== null ? equity : this.balance;
    this.profit = profit;
    this.margin = margin;
    this.marginFree = marginFree !== null ? marginFree : this.equity;
    this.positions = positions;
    this.orders = orders;
    this.realAuthenticated = realAuthenticated;
    this.mt5AuthError = mt5AuthError;
    this.accessPoint = accessPoint;
    this.tcpLatencyMs = tcpLatencyMs;
  }

  /**
   * Ported from AccountRecord.prepareAccountName(String) @ 0x58ca50
   */
  prepareAccountName(name) {
    if (!name || String(name).trim().length === 0) {
      return this.demo ? AccountRecord.DEFAULT_DEMO_ACCOUNT_NAME : 'MetaTrader 5 Account';
    }
    return String(name).trim();
  }

  /**
   * Ported from AccountRecord.isClient() @ 0x58c850
   */
  isClient() {
    return this.accountType === AccountRecord.ACCOUNT_TYPE_CLIENT;
  }

  /**
   * Ported from AccountRecord.isClientAccount() @ 0x58c870
   */
  isClientAccount() {
    return this.accountType === AccountRecord.ACCOUNT_TYPE_CLIENT_ACCOUNT;
  }

  /**
   * Ported from AccountRecord.isInvestor() @ 0x58c894
   */
  isInvestor() {
    return (BigInt(this.rights) & AccountRecord.USER_RIGHT_INVESTOR) !== 0n;
  }

  /**
   * Ported from AccountRecord.isTrader() @ 0x58ca20
   */
  isTrader() {
    return (BigInt(this.rights) & AccountRecord.USER_RIGHT_SESSION_TRADER) !== 0n;
  }

  /**
   * Ported from AccountRecord.isMaster() @ 0x58c8c4
   */
  isMaster() {
    return !this.isInvestor() && this.isTrader();
  }

  toString() {
    return this.name;
  }
}

module.exports = { AccountRecord };
