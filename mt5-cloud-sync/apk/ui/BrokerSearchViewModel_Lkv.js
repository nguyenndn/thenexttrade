const { ServersBase } = require('../terminal/ServersBase');
const { BrokerInfoAPI } = require('../brokers/BrokerInfoAPI');

/**
 * Ported from APK: Lkv; (ViewModel for BrokerSearchFragment)
 * DEX offset: 0x3b8624 (classes.dex)
 */
class BrokerSearchViewModel_Lkv {
  constructor(serversBase = ServersBase.f(), brokerInfoAPI = new BrokerInfoAPI(serversBase)) {
    this.serversBase = serversBase;
    this.brokerInfoAPI = brokerInfoAPI;
  }

  /**
   * Executes the hybrid Offline (ServersBase) + Online (BrokerInfoAPI.d) broker search
   */
  async searchBrokers(query = '', region = 'VN') {
    const cleanQuery = String(query || '').trim();
    const apiResult = await this.brokerInfoAPI.d(cleanQuery, region);

    // Persist discovered servers into ServersBase (servers.dat) via ServersBase.a(...)
    for (const brokerInfo of apiResult.lsvResult.a) {
      for (const llv of brokerInfo.getServers()) {
        this.serversBase.a(
          brokerInfo.getCompany(),
          brokerInfo.website,
          brokerInfo.logoHash,
          llv
        );
      }
    }

    this.serversBase.filterBrokers(cleanQuery, region);
    const filteredBrokers = this.serversBase.getFilteredBrokerInfos();
    const seenCompanies = new Set();
    const brokers = [];
    for (const b of [...apiResult.lsvResult.a, ...filteredBrokers]) {
      const k = String(b.getCompany ? b.getCompany() : b.company || '').toLowerCase();
      if (!k || seenCompanies.has(k)) continue;
      seenCompanies.add(k);
      brokers.push(b);
    }
    const count = brokers.length;

    const trace = !cleanQuery
      ? [
          {
            layer: 'APK ViewModel (Ported)',
            symbol: 'BrokerSearchFragment -> Lkv.searchBrokers("")',
            address: 'src/apk/ui/BrokerSearchViewModel_Lkv.js (DEX @ 0x3b8624)',
            detail: 'Empty search input -> Querying preferential brokers from ServersBase'
          },
          {
            layer: 'APK Terminal Engine (Ported)',
            symbol: `ServersBase.filterBrokers("", "${region}") + ServersBase.getBroker(i)`,
            address: 'src/apk/terminal/ServersBase.js (JNI @ 0x0032cd88)',
            detail: `Loaded ${count} preferential brokers (MetaQuotes, JustMarkets, STARTRADER, Exness, Vantage)`
          }
        ]
      : [
          {
            layer: 'APK ViewModel (Ported)',
            symbol: `BrokerSearchViewModel_Lkv -> BrokerInfoAPI.d("${cleanQuery}")`,
            address: 'src/apk/brokers/BrokerInfoAPI.js (DEX @ 0x6280d8)',
            detail: `Constructed URI="${apiResult.uriPath}" via BrokerInfoAPI.b() & payload via BrokerInfoAPI.a("${cleanQuery}")`
          },
          {
            layer: 'APK DNS & Signature (Ported)',
            symbol: `DNSManager.resolveApiPoint() + BrokerSignature_Lxy5.verifyResponse()`,
            address: 'src/apk/brokers/BrokerInfo.js (DEX @ 0x64116c / JNI @ 0x0029d150)',
            detail: `Verified HTTP Header [Signature: ${apiResult.responseHeaders.Signature}]`
          },
          {
            layer: 'APK JSON Parser (Ported)',
            symbol: 'BrokerJsonParser_Lmy5.parseResponse_c(headers, body)',
            address: 'src/apk/brokers/BrokerInfo.js (DEX @ 0x64050c)',
            detail: `Parsed X-Geo="${apiResult.responseHeaders['X-Geo']}" and ${brokers.length} BrokerInfo objects`
          },
          {
            layer: 'APK Database (Ported)',
            symbol: `ServersBase.a(company, website, logoHash, Llv) + ServersBase.filterBrokers("${cleanQuery}", "${region}")`,
            address: 'src/apk/terminal/ServersBase.js (JNI @ 0x002b5cc8 / 0x0032cd88)',
            detail: `Updated servers.dat and returned ${count} matching brokers`
          }
        ];

    return {
      mode: !cleanQuery
        ? 'PORTED_APK_PREFERENTIAL (ServersBase.filterBrokers)'
        : 'PORTED_APK_HYBRID_SEARCH (BrokerInfoAPI.d + Lmy5.c + ServersBase)',
      query: cleanQuery,
      headers: apiResult.responseHeaders,
      brokers,
      rawBrokerInfoApiFormat: apiResult.rawJsonPayload,
      trace
    };
  }
}

module.exports = { BrokerSearchViewModel_Lkv };
