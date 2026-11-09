const { ServerRecord, BrokerRecord } = require('../types/ServerRecord');
const { BrokerInfo } = require('../brokers/BrokerInfo');

/**
 * Ported from APK: Lnet/metaquotes/metatrader5/terminal/ServersBase;
 * Native JNI exports in libcommon.so:
 * - filterBrokers(String query, String region) @ 0x0032cd88
 * - getBroker(int index)                       @ 0x0032cd70
 * - brokerServersSorted(String company, List)  @ 0x0032d348
 * - get(byte[] serverHash)                     @ 0x002b5b2c
 * - addServer(ServerInfo)                      @ 0x002b5cc8
 * - updateServer(ServerInfo)                   @ 0x002b70e4
 * - authV2Allowed(int build)                   @ 0x0032d6f4
 */
class ServersBase {
  static _instance = null;

  static f() {
    if (!ServersBase._instance) {
      ServersBase._instance = new ServersBase();
    }
    return ServersBase._instance;
  }

  constructor() {
    this.brokers = [];
    this.serversByHash = new Map();
    this.serversByName = new Map();
    this.lastFilteredBrokers = [];
    try {
      const { INITIAL_BROKERS_DATA } = require('./brokersDataSeed');
      if (Array.isArray(INITIAL_BROKERS_DATA)) {
        this.loadInitialDatabase(INITIAL_BROKERS_DATA);
      }
    } catch (_) {}
  }

  /**
   * Seed initial preferential & local servers.dat brokers
   */
  loadInitialDatabase(rawBrokersArray) {
    for (const raw of rawBrokersArray) {
      const brokerInfo = raw instanceof BrokerInfo ? raw : new BrokerInfo(raw);
      this.registerBrokerInfo(brokerInfo);
    }
  }

  registerBrokerInfo(brokerInfo) {
    const existingIdx = this.brokers.findIndex(
      (b) => b.company.toLowerCase() === brokerInfo.company.toLowerCase()
    );
    if (existingIdx >= 0) {
      this.brokers[existingIdx] = brokerInfo;
    } else {
      this.brokers.push(brokerInfo);
    }

    for (const srv of brokerInfo.getServers()) {
      const record = new ServerRecord({
        name: srv.name,
        company: brokerInfo.company,
        icon: brokerInfo.logoHash,
        website: brokerInfo.website,
        demoEnable: srv.isDemo === 1,
        limitedAccess: srv.limitedAccess,
        build: srv.build || 4620,
        hash: srv.serverHash,
        access: srv.access,
        leverage: srv.leverage,
        group: srv.group,
        deposit: srv.deposit
      });
      this.addServer(record);
    }
  }

  /**
   * Ported from ServersBase.a(String company, String website, String logoHash, Llv serverEndpoint)
   * Called in Lyk2.f @ 0x3162c0 when updating server info from BrokerInfoAPI
   */
  a(company, website, logoHash, llv) {
    const record = new ServerRecord({
      name: llv.name,
      company,
      icon: logoHash,
      website,
      demoEnable: llv.isDemo === 1,
      limitedAccess: llv.limitedAccess,
      build: llv.build || 4620,
      hash: llv.serverHash,
      access: llv.access,
      leverage: llv.leverage,
      group: llv.group,
      deposit: llv.deposit
    });
    return this.addServer(record);
  }

  /**
   * Ported from JNI: ServersBase.addServer(ServerInfo) @ 0x002b5cc8
   */
  addServer(serverRecord) {
    this.serversByHash.set(serverRecord.hash, serverRecord);
    this.serversByName.set(serverRecord.name.toLowerCase(), serverRecord);
    return true;
  }

  /**
   * Ported from JNI: ServersBase.updateServer(ServerInfo) @ 0x002b70e4
   */
  updateServer(serverRecord) {
    return this.addServer(serverRecord);
  }

  /**
   * Ported from JNI: ServersBase.get(byte[] serverHash) @ 0x002b5b2c
   */
  get(serverHashOrName) {
    if (!serverHashOrName) return null;
    if (this.serversByHash.has(serverHashOrName)) {
      return this.serversByHash.get(serverHashOrName);
    }
    return this.serversByName.get(String(serverHashOrName).toLowerCase()) || null;
  }

  /**
   * Ported from JNI: ServersBase.filterBrokers(String query, String region) @ 0x0032cd88
   */
  filterBrokers(query = '', region = 'VN') {
    const q = String(query || '').trim().toLowerCase();
    if (!q) {
      // Empty query -> Return preferential brokers (Preferential.LoadInternal)
      this.lastFilteredBrokers = this.brokers.filter((b) => b.preferential);
    } else {
      this.lastFilteredBrokers = this.brokers.filter(
        (b) =>
          b.company.toLowerCase().includes(q) ||
          b.shortName.toLowerCase().includes(q) ||
          b.servers.some((s) => s.name.toLowerCase().includes(q))
      );
    }
    return this.lastFilteredBrokers.length;
  }

  /**
   * Ported from JNI: ServersBase.getBroker(int index) @ 0x0032cd70
   */
  getBroker(index) {
    const b = this.lastFilteredBrokers[index];
    if (!b) return null;
    return new BrokerRecord({
      company: b.company,
      serverName: b.shortName,
      website: b.website,
      logoHash: b.logoHash,
      limitedAccess: b.limitedAccess
    });
  }

  getFilteredBrokerInfos() {
    return this.lastFilteredBrokers;
  }

  getBrokerInfoByIdOrCompany(idOrCompany) {
    const key = String(idOrCompany || '').toLowerCase();
    return (
      this.brokers.find(
        (b) => b.id.toLowerCase() === key || b.company.toLowerCase() === key
      ) || null
    );
  }

  /**
   * Ported from JNI: ServersBase.brokerServersSorted(String company, List outList) @ 0x0032d348
   */
  brokerServersSorted(company, outList = []) {
    const broker = this.getBrokerInfoByIdOrCompany(company);
    if (!broker) return outList;
    const records = broker.getServers().map((s) => this.get(s.serverHash) || this.get(s.name)).filter(Boolean);
    // Sort Demo servers first, then alphabetically (matches MT5 Android dropdown behavior)
    records.sort((a, b) => {
      if (a.demoEnable !== b.demoEnable) return a.demoEnable ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    outList.push(...records);
    return outList;
  }

  /**
   * Ported from JNI: ServersBase.authV2Allowed(int build) @ 0x0032d6f4
   * Controls whether "Trade account" vs "Client account" selector is enabled
   */
  static authV2Allowed(build = 4620) {
    return Number(build) >= 3500;
  }
}

module.exports = { ServersBase };
