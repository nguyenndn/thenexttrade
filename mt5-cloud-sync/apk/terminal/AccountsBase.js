const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { AccountRecord } = require('../types/AccountRecord');
const { ServersBase } = require('./ServersBase');

/**
 * Ported from APK: Lnet/metaquotes/metatrader5/terminal/AccountsBase;
 * Native JNI exports in libcommon.so:
 * - accountsAdd(...)      @ 0x002aa9d4
 * - accountsAllocate(...) @ 0x002aaac4
 * - accountsCount()       @ 0x002aac10
 * - accountsGet(int)      @ 0x002aad78
 * - accountsDelete(int)   @ 0x002aac8c
 * - accountsSave()        @ 0x002ab4d0
 */
class AccountsBase {
  static _instance = null;

  static getInstance() {
    if (!AccountsBase._instance) {
      AccountsBase._instance = new AccountsBase();
    }
    return AccountsBase._instance;
  }

  constructor() {
    const candidate2 = path.join(__dirname, '..', '..', 'accounts.dat.json');
    const candidate3 = path.join(__dirname, '..', '..', '..', 'accounts.dat.json');
    this.accountsFile = fs.existsSync(candidate2) ? candidate2 : candidate3;
    this.accounts = [];
    this.allocatedSimLogins = new Map();
    this._loadFromDisk();
  }

  _loadFromDisk() {
    try {
      if (fs.existsSync(this.accountsFile)) {
        const raw = JSON.parse(fs.readFileSync(this.accountsFile, 'utf8'));
        if (Array.isArray(raw)) {
          this.accounts = raw.map((item) => new AccountRecord(item));
        }
      }
    } catch (_) {
      this.accounts = [];
    }
  }

  /**
   * Ported from JNI: AccountsBase.accountsSave() @ 0x002ab4d0
   */
  accountsSave() {
    try {
      fs.writeFileSync(this.accountsFile, JSON.stringify(this.accounts, null, 2), 'utf8');
      return true;
    } catch (_) {
      return false;
    }
  }

  /**
   * Ported from JNI: AccountsBase.accountsCount() @ 0x002aac10
   */
  accountsCount() {
    return this.accounts.length;
  }

  /**
   * Ported from JNI: AccountsBase.accountsGet(int index) @ 0x002aad78
   */
  accountsGet(index) {
    return this.accounts[index] || null;
  }

  getAllAccounts() {
    return this.accounts;
  }

  /**
   * Ported from JNI: AccountsBase.accountsAdd(...) @ 0x002aa9d4
   */
  accountsAdd(
    login,
    serverHashOrName,
    password,
    certPassword = '',
    savePassword = true,
    isClient = false,
    isPreliminary = false,
    extraProps = {}
  ) {
    const serversBase = ServersBase.f();
    const srv = serversBase.get(serverHashOrName);
    const numericLogin = Number(String(login).replace(/^cl/i, '')) || 0;

    // Parse leverage integer (e.g. "1:500" -> 500)
    const levStr = String(extraProps.leverage || (srv ? srv.leverage : '1:500'));
    const levNum = parseInt(levStr.split(':').pop(), 10) || 500;

    const record = new AccountRecord({
      name: extraProps.name || '',
      login: numericLogin,
      hasPassword: Boolean(savePassword && password),
      hasCertificate: Boolean(certPassword),
      hasCertPassword: Boolean(certPassword),
      server: srv ? srv.name : String(serverHashOrName),
      serverHash: srv ? srv.hash : String(serverHashOrName),
      lastAccess: Date.now(),
      demo: extraProps.demo !== undefined ? extraProps.demo : (srv ? srv.demoEnable : true),
      real: extraProps.real !== undefined ? extraProps.real : (srv ? !srv.demoEnable : false),
      rights: extraProps.rights !== undefined ? extraProps.rights : 16,
      preliminary: Boolean(isPreliminary),
      company: extraProps.company || (srv ? srv.company : ''),
      currency: extraProps.currency || 'USD',
      deposit: extraProps.deposit !== undefined ? extraProps.deposit : (srv ? srv.deposit || 10000 : 10000),
      leverage: levNum,
      accountType: isClient ? AccountRecord.ACCOUNT_TYPE_CLIENT : AccountRecord.ACCOUNT_TYPE_SINGLE,
      balance: extraProps.balance,
      equity: extraProps.equity,
      profit: extraProps.profit || 0,
      margin: extraProps.margin || 0,
      marginFree: extraProps.marginFree,
      positions: extraProps.positions || [],
      orders: extraProps.orders || [],
      realAuthenticated: Boolean(extraProps.realAuthenticated),
      mt5AuthError: extraProps.mt5AuthError || null,
      accessPoint: extraProps.accessPoint || (srv && srv.access[0] ? srv.access[0] : ''),
      tcpLatencyMs: extraProps.tcpLatencyMs || 0
    });

    // Replace existing record with same login + server or unshift to top
    const existingIdx = this.accounts.findIndex(
      (a) => a.login === record.login && a.server.toLowerCase() === record.server.toLowerCase()
    );
    if (existingIdx >= 0) {
      this.accounts.splice(existingIdx, 1);
    }
    this.accounts.unshift(record);
    this.accountsSave();
    return record;
  }

  /**
   * Ported from JNI: AccountsBase.accountsAllocate(...) @ 0x002aaac4
   * Allocates a new Demo account on the selected broker's Demo server
   */
  accountsAllocate({
    broker,
    serverRecord,
    fullName = 'Nguyen Duy',
    email = 'trader@metatrader5.com',
    phone = '+84901234567',
    deposit = 10000,
    leverage = '1:500'
  }) {
    const generatedLogin = String(Math.floor(60000000 + Math.random() * 39999999));
    const generatedPassword = 'Mt5' + crypto.randomBytes(3).toString('hex') + '!';
    const investorPassword = 'Inv' + crypto.randomBytes(3).toString('hex') + '!';

    const allocatedInfo = {
      login: generatedLogin,
      password: generatedPassword,
      investorPassword,
      name: fullName,
      email,
      phone,
      company: broker ? broker.company : (serverRecord ? serverRecord.company : 'MetaQuotes Ltd.'),
      server: serverRecord ? serverRecord.name : 'MetaQuotes-Demo',
      serverHash: serverRecord ? serverRecord.hash : '0x7c8a91b2e4010001',
      deposit: Number(deposit) || (serverRecord ? serverRecord.deposit : 10000) || 10000,
      leverage: leverage || (serverRecord ? serverRecord.leverage : '1:500') || '1:500',
      currency: 'USD'
    };

    this.allocatedSimLogins.set(generatedLogin, allocatedInfo);
    return allocatedInfo;
  }

  getAllocatedSimAccount(login) {
    return this.allocatedSimLogins.get(String(login).replace(/^cl/i, '').trim()) || null;
  }
}

module.exports = { AccountsBase };
