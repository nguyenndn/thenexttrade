/**
 * Ported from APK:
 * - Lnet/metaquotes/metatrader5/types/ServerRecord; (classes.dex @ 0x58eb84)
 * - Lnet/metaquotes/metatrader5/types/BrokerRecord; (classes.dex @ 0x58cbfc)
 */
class BrokerRecord {
  constructor({
    company = '',
    serverName = '',
    website = '',
    logoHash = '',
    limitedAccess = false
  } = {}) {
    this.company = company;
    this.serverName = serverName;
    this.website = website;
    this.logoHash = logoHash;
    this.limitedAccess = Boolean(limitedAccess);
  }

  getCompany() {
    return this.company;
  }

  getLogoHash() {
    return this.logoHash;
  }

  getServerName() {
    return this.serverName;
  }

  getWebsite() {
    return this.website;
  }

  isLimitedAccess() {
    return this.limitedAccess;
  }
}

class ServerRecord {
  constructor({
    name = '',
    company = '',
    icon = '',
    accounts = 0,
    ping = 45,
    time = Date.now(),
    website = '',
    demoEnable = true,
    limitedAccess = false,
    fintezaFlags = 0,
    fintezaMasterSite = '',
    build = 4620,
    hash = '',
    access = [],
    leverage = '1:500',
    group = '',
    deposit = 10000
  } = {}) {
    this.name = name;
    this.company = company;
    this.icon = icon;
    this.accounts = accounts;
    this.ping = ping;
    this.time = time;
    this.website = website;
    this.demoEnable = Boolean(demoEnable);
    this.limitedAccess = Boolean(limitedAccess);
    this.fintezaFlags = fintezaFlags;
    this.fintezaMasterSite = fintezaMasterSite;
    this.build = build;
    this.hash = hash;
    this.access = Array.isArray(access) ? access : [];
    this.leverage = leverage;
    this.group = group;
    this.deposit = Number(deposit) || 0;
  }

  toString() {
    return this.name;
  }
}

module.exports = { BrokerRecord, ServerRecord };
