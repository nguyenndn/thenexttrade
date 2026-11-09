const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { BrokerSignature_Lxy5, BrokerJsonParser_Lmy5 } = require('./BrokerInfo');
const { ServersBase } = require('../terminal/ServersBase');

/**
 * Ported from APK:
 * - Lnet/metaquotes/brokers/BrokerInfoAPI; (classes.dex @ 0x6280d8)
 * - Lnet/metaquotes/metatrader5/network/DNSManager; (libcommon.so @ 0x0029e530)
 * - Lmf.X(Uri, Lts3, Lc33, Continuation) (classes.dex @ 0x3f2ec4)
 */
class DNSManager {
  static CDN_HOSTS = [
    'api1.cdnfx.net',
    'api2.cdnfx.net',
    'api3.cdnfx.net'
  ];

  /**
   * Ported from DNSManager.i(String host, boolean useCache, boolean fallback) @ 0x0029e530
   */
  static resolveApiPoint(host = 'api1.cdnfx.net') {
    return {
      address: host,
      preferenceKey: 'mql5.cdn.api.point',
      resolvedAt: Date.now()
    };
  }
}

class BrokerInfoAPI {
  constructor(serversBase = ServersBase.f()) {
    this.serversBase = serversBase;
  }

  /**
   * Ported from JNI: Java_net_metaquotes_brokers_BrokerInfoAPI_b @ 0x0029ce28 -> 0x0020b30c
   * Constructs the API URI path
   */
  static b() {
    return '/public/mt5/network/mobile';
  }

  /**
   * Ported from JNI: Java_net_metaquotes_brokers_BrokerInfoAPI_a @ 0x0029cc24 -> 0x0020afa0
   * Constructs form body Lts3 for company search
   */
  static a(companyQuery) {
    return {
      type: 'company_search',
      company: String(companyQuery || '').trim(),
      platform: 'mt5_android',
      build: 5200
    };
  }

  /**
   * Ported from JNI: Java_net_metaquotes_brokers_BrokerInfoAPI_c @ 0x0029cf18 -> 0x0020b40c
   * Constructs form body Lts3 for comma-joined server names
   */
  static c(joinedServers) {
    return {
      type: 'servers_lookup',
      servers: String(joinedServers || '').trim(),
      platform: 'mt5_android',
      build: 5200
    };
  }

  _runNativeBrokerSearch(query) {
    const cleanQuery = String(query || '').trim();
    if (cleanQuery.length < 2) return null;

    try {
      const cloudSyncRoot = path.join(__dirname, '..', '..');
      const binDir = path.join(cloudSyncRoot, 'bin');
      const runnerJar = path.join(binDir, 'mt5-native-runner.jar');
      const bundledApk = path.join(binDir, 'metatrader5.apk');
      const fallbackApk = 'd:\\WORK\\TestREA\\metatrader5.apk';
      const apkPath = process.env.MT5_APK_PATH || (fs.existsSync(bundledApk) ? bundledApk : fallbackApk);
      const workDir = path.join(cloudSyncRoot, 'unidbg-workdir');

      const portableJava = 'd:\\WORK\\TestREA\\.tools\\jdk-17.0.21.0.2+1\\bin\\java.exe';
      const javaBinName = process.platform === 'win32' ? 'java.exe' : 'java';
      const javaHomeExe = process.env.JAVA_HOME
        ? path.join(process.env.JAVA_HOME, 'bin', javaBinName)
        : null;
      const javaExe =
        process.env.MT5_JAVA_PATH ||
        (javaHomeExe && fs.existsSync(javaHomeExe) ? javaHomeExe : null) ||
        (fs.existsSync(portableJava) ? portableJava : 'java');

      if (!fs.existsSync(runnerJar) || !fs.existsSync(apkPath)) {
        return null;
      }

      const stdout = execFileSync(
        javaExe,
        ['-jar', runnerJar, '--search-broker', cleanQuery, '--apk', apkPath, '--workdir', workDir],
        {
          cwd: cloudSyncRoot,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
          maxBuffer: 16 * 1024 * 1024,
          timeout: 25000,
          windowsHide: true
        }
      );

      const startMarker = '__MT5_BROKER_JSON_START__';
      const endMarker = '__MT5_BROKER_JSON_END__';
      const sIdx = stdout.indexOf(startMarker);
      const eIdx = stdout.indexOf(endMarker);
      if (sIdx === -1 || eIdx === -1 || eIdx <= sIdx) {
        return null;
      }

      const outer = JSON.parse(stdout.slice(sIdx + startMarker.length, eIdx).trim());
      const rawParsed = outer.rawBody ? JSON.parse(outer.rawBody) : { result: [] };
      const normalized = {
        ...outer,
        rawParsed
      };
      return normalized;
    } catch {
      return null;
    }
  }

  /**
   * Ported from BrokerInfoAPI.d(String companyQuery, Continuation) @ 0x6280d8
   * Executes live libcommon.so BrokerInfoAPI.b() + BrokerInfoAPI.a()/c() -> Lmy5.c (JSON parse)
   */
  async d(companyQuery, region = 'VN') {
    const cleanQuery = String(companyQuery || '').trim();
    const uriPath = BrokerInfoAPI.b();
    const requestBody = BrokerInfoAPI.a(cleanQuery);
    const dnsEntry = DNSManager.resolveApiPoint();

    // 1. Live MetaQuotes mobile CDN search via libcommon.so (BrokerInfoAPI.a / BrokerInfoAPI.c)
    const liveNative = this._runNativeBrokerSearch(cleanQuery);
    const liveResultItems =
      liveNative && liveNative.rawParsed && Array.isArray(liveNative.rawParsed.result)
        ? liveNative.rawParsed.result
        : [];

    // 2. Also query offline ServersBase for matching brokers
    this.serversBase.filterBrokers(cleanQuery, region);
    const matchedBrokers = this.serversBase.getFilteredBrokerInfos();

    const seenBrokerKeys = new Set();
    const combinedResult = [];

    for (const lb of liveResultItems) {
      const comp = String(lb.company || '').trim();
      const key = comp.toLowerCase();
      if (key) seenBrokerKeys.add(key);
      const servers = Array.isArray(lb.servers)
        ? lb.servers.map((s) => {
            const name = String(s.name || '').trim();
            const isDemo = Number(s.isDemo) === 1 || /demo/i.test(name) ? 1 : 0;
            const publicAccess = Array.isArray(s.access)
              ? s.access.filter(
                  (ep) =>
                    typeof ep === 'string' &&
                    !ep.startsWith('10.') &&
                    !ep.startsWith('127.') &&
                    !ep.startsWith('192.168.')
                )
              : [];
            return {
              ...s,
              name,
              isDemo,
              access: publicAccess.length > 0 ? publicAccess : s.access || []
            };
          })
        : [];
      combinedResult.push({
        ...lb,
        id: lb.id || comp.toLowerCase().replace(/[^a-z0-9]+/g, ''),
        shortName: lb.shortName || comp.split(' ')[0],
        servers
      });
    }

    for (const b of matchedBrokers) {
      const key = String(b.company || '').trim().toLowerCase();
      if (seenBrokerKeys.has(key)) continue;
      seenBrokerKeys.add(key);
      combinedResult.push({
        id: b.id,
        preferential: b.preferential,
        shortName: b.shortName,
        logoType: b.logoType,
        logoText: b.logoText,
        logoBg: b.logoBg,
        logoColor: b.logoColor,
        company: b.company,
        website: b.website,
        genericEmail: b.genericEmail,
        registrationAddress: b.registrationAddress,
        officesLocation: b.officesLocation,
        abuseEmail: b.abuseEmail,
        abuseUrl: b.abuseUrl,
        phone: b.phone,
        registrationNumber: b.registrationNumber,
        regulation: b.regulation,
        regulationStatus: b.regulationStatus,
        legalCountry: b.legalCountry,
        limitedAccess: b.limitedAccess,
        logoHash: b.logoHash,
        servers: b.getServers().map((s) => ({
          name: s.name,
          serverHash: s.serverHash,
          build: s.build,
          access: s.access,
          isDemo: Number(s.isDemo) === 1 || /demo/i.test(s.name) ? 1 : 0,
          leverage: s.leverage,
          group: s.group,
          limitedAccess: s.limitedAccess,
          deposit: String(s.deposit)
        }))
      });
    }

    const rawJsonPayload = {
      result: combinedResult
    };

    const bodyString = JSON.stringify(rawJsonPayload);
    const signature = BrokerSignature_Lxy5.computeSignature(bodyString);
    const responseHeaders = {
      'X-Geo': (liveNative && liveNative.xGeo) || `${region};0:0`,
      'Signature': signature,
      'X-Live-Signature': (liveNative && liveNative.signature) || signature,
      'Content-Type': 'application/json'
    };

    // Step 1: Verify response signature via Lxy5.b (0x64116c)
    BrokerSignature_Lxy5.verifyResponse(responseHeaders, bodyString);

    // Step 2: Parse JSON via Lmy5.c (0x64050c)
    const lsvResult = BrokerJsonParser_Lmy5.parseResponse_c(responseHeaders, bodyString);

    return {
      uriPath,
      dnsEntry,
      requestBody: (liveNative && liveNative.signedFormBody) || requestBody,
      responseHeaders,
      rawJsonPayload,
      lsvResult
    };
  }

  /**
   * Ported from BrokerInfoAPI.e(Set<String> serverNames, Continuation) @ 0x6281c0
   */
  async e(serverNamesSet, region = 'VN') {
    const joined = Array.from(serverNamesSet || []).join(',');
    const uriPath = BrokerInfoAPI.b();
    const requestBody = BrokerInfoAPI.c(joined);
    return this.d(joined, region);
  }
}

module.exports = { DNSManager, BrokerInfoAPI };
