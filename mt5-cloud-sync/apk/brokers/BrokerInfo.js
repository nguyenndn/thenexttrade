const crypto = require('crypto');

/**
 * Ported from APK: Llv; (Server endpoint item inside BrokerInfo.servers)
 * Parsed by Lmy5.d(JSONObject) @ 0x64040c
 */
class ServerEndpoint_Llv {
  constructor({
    name = '',
    access = [],
    isDemo = 1,
    leverage = '1:500',
    group = '',
    deposit = 10000,
    limitedAccess = false,
    redirect = null,
    serverHash = '',
    build = 4620
  } = {}) {
    this.name = name;
    this.access = Array.isArray(access) ? access : [];
    this.isDemo = Number(isDemo);
    this.leverage = leverage;
    this.group = group;
    this.deposit = typeof deposit === 'string' ? parseInt(deposit, 10) || 0 : Number(deposit) || 0;
    this.limitedAccess = Boolean(limitedAccess);
    this.redirect = redirect;
    this.serverHash = serverHash || '0x' + crypto.createHash('md5').update(name).digest('hex').slice(0, 16);
    this.build = build || 4620;
  }
}

/**
 * Ported from APK: Lnet/metaquotes/brokers/BrokerInfo;
 * Parsed by Lmy5.b(JSONObject) @ 0x6406b4
 */
class BrokerInfo {
  constructor({
    id = '',
    preferential = false,
    shortName = '',
    logoType = 'text',
    logoText = '',
    logoBg = '#1f6feb',
    logoColor = '#ffffff',
    company = '',
    website = '',
    genericEmail = '',
    registrationAddress = '',
    officesLocation = '',
    abuseEmail = '',
    abuseUrl = '',
    phone = '',
    registrationNumber = '',
    regulation = false,
    regulationStatus = '',
    legalCountry = '',
    limitedAccess = false,
    logoHash = '',
    servers = [],
    redirect = null
  } = {}) {
    this.id = id || company.toLowerCase().replace(/[^a-z0-9]+/g, '');
    this.preferential = Boolean(preferential);
    this.shortName = shortName || company.split(' ')[0];
    this.logoType = logoType;
    this.logoText = logoText;
    this.logoBg = logoBg;
    this.logoColor = logoColor;

    this.company = company;
    this.website = website;
    this.genericEmail = genericEmail;
    this.registrationAddress = registrationAddress;
    this.officesLocation = officesLocation;
    this.abuseEmail = abuseEmail;
    this.abuseUrl = abuseUrl;
    this.phone = phone;
    this.registrationNumber = registrationNumber;
    this.regulation = Boolean(regulation);
    this.regulationStatus = regulationStatus;
    this.legalCountry = legalCountry;
    this.limitedAccess = Boolean(limitedAccess);
    this.logoHash = logoHash;
    this.servers = (servers || []).map((s) =>
      s instanceof ServerEndpoint_Llv ? s : new ServerEndpoint_Llv(s)
    );
    this.redirect = redirect;
  }

  getCompany() {
    return this.company;
  }

  getServers() {
    return this.servers;
  }
}

/**
 * Ported from APK: Lnet/metaquotes/tools/BrokerSignature; & Lxy5;
 * DEX offset: 0x64116c (Lxy5.b), JNI: Java_net_metaquotes_tools_BrokerSignature_a (0x0029d150)
 */
class BrokerSignature_Lxy5 {
  static computeSignature(bodyString) {
    return crypto.createHash('md5').update(String(bodyString || '')).digest('hex');
  }

  /**
   * Ported from Lxy5.b(LinkedHashMap headers, String body) @ 0x64116c
   */
  static verifyResponse(headers = {}, bodyString = '') {
    const normalized = {};
    for (const [k, v] of Object.entries(headers)) {
      normalized[k.toLowerCase()] = v;
    }
    const serverSig = normalized['signature'];
    if (!serverSig) {
      throw new Error('[Signature] header not found.');
    }
    const clientSig = BrokerSignature_Lxy5.computeSignature(bodyString);
    if (!clientSig) {
      throw new Error("Can't generate client signature.");
    }
    if (clientSig.toLowerCase() !== String(serverSig).toLowerCase()) {
      throw new Error(`Client [${clientSig}] and server [${serverSig}] signatures do not match.`);
    }
    return true;
  }
}

/**
 * Ported from APK: Lmy5; (JSON Parser for BrokerInfoAPI responses)
 * DEX offsets:
 * - Lmy5.c(headers, body) @ 0x64050c
 * - Lmy5.b(JSONObject)    @ 0x6406b4
 * - Lmy5.d(JSONObject)    @ 0x64040c
 */
class BrokerJsonParser_Lmy5 {
  static parseServer_d(jsonObj) {
    if (!jsonObj) return null;
    return new ServerEndpoint_Llv({
      name: jsonObj.name || '',
      access: Array.isArray(jsonObj.access) ? jsonObj.access : [],
      isDemo: Number(jsonObj.isDemo ?? 0),
      leverage: jsonObj.leverage || '1:500',
      group: jsonObj.group || '',
      limitedAccess: Boolean(jsonObj.limitedAccess),
      deposit: parseInt(String(jsonObj.deposit ?? '0'), 10) || 0,
      redirect: jsonObj.redirect ? BrokerJsonParser_Lmy5.parseServer_d(jsonObj.redirect) : null,
      serverHash: jsonObj.serverHash,
      build: jsonObj.build
    });
  }

  static parseBroker_b(jsonObj) {
    if (!jsonObj) return null;
    const servers = Array.isArray(jsonObj.servers)
      ? jsonObj.servers.map((s) => BrokerJsonParser_Lmy5.parseServer_d(s)).filter(Boolean)
      : [];
    return new BrokerInfo({
      ...jsonObj,
      company: jsonObj.company || '',
      website: jsonObj.website || '',
      genericEmail: jsonObj.genericEmail || '',
      registrationAddress: jsonObj.registrationAddress || '',
      officesLocation: jsonObj.officesLocation || '',
      abuseEmail: jsonObj.abuseEmail || '',
      abuseUrl: jsonObj.abuseUrl || '',
      phone: jsonObj.phone || '',
      registrationNumber: jsonObj.registrationNumber || '',
      regulation: Boolean(jsonObj.regulation),
      regulationStatus: jsonObj.regulationStatus || '',
      legalCountry: jsonObj.legalCountry || '',
      limitedAccess: Boolean(jsonObj.limitedAccess),
      logoHash: jsonObj.logoHash || '',
      servers,
      redirect: jsonObj.redirect ? BrokerJsonParser_Lmy5.parseBroker_b(jsonObj.redirect) : null
    });
  }

  /**
   * Ported from Lmy5.c(LinkedHashMap headers, String body) @ 0x64050c
   * Returns Lsv { a: ArrayList<BrokerInfo>, b: GeoInfo }
   */
  static parseResponse_c(headers = {}, bodyString = '{}') {
    const parsed = typeof bodyString === 'string' ? JSON.parse(bodyString) : bodyString;
    const resultArr = Array.isArray(parsed.result) ? parsed.result : [];
    const brokers = resultArr.map((item) => BrokerJsonParser_Lmy5.parseBroker_b(item)).filter(Boolean);

    const xGeo = headers['X-Geo'] || headers['x-geo'] || 'VN;0:0';
    const geoParts = String(xGeo).split(';');
    return {
      a: brokers,
      b: {
        countryCode: geoParts[0] || 'VN',
        rawGeo: xGeo
      }
    };
  }
}

module.exports = {
  ServerEndpoint_Llv,
  BrokerInfo,
  BrokerSignature_Lxy5,
  BrokerJsonParser_Lmy5
};
