//+------------------------------------------------------------------+
//|                                              GSN_EA_License.mqh  |
//|                             Copyright 2026, GoldScalperNinja     |
//|     3-Tier EA License Validator (Web Primary + GitHub Backup)    |
//+------------------------------------------------------------------+
#ifndef __GSN_EA_LICENSE_MQH__
#define __GSN_EA_LICENSE_MQH__

#property copyright "Copyright 2026, GoldScalperNinja"
#property link      "https://thenexttrade.com"
#property version   "2.00"

//+------------------------------------------------------------------+
//| License state (tri-state)                                        |
//|                                                                  |
//| CORE PRINCIPLE: only a DEFINITIVE answer from the license server |
//| may revoke a license. A network / HTTP / parse failure is        |
//| UNKNOWN, never REVOKED - an EA holding open positions must not   |
//| be shut down because of a temporary network hiccup.              |
//+------------------------------------------------------------------+
#ifndef __ENUM_LICENSE_STATE_DEFINED__
#define __ENUM_LICENSE_STATE_DEFINED__
enum ENUM_LICENSE_STATE
{
   LICENSE_STATE_UNKNOWN = -1,  // Cannot determine (network/HTTP/parse error)
   LICENSE_STATE_REVOKED =  0,  // Definitive: unauthorized / mismatch / not under IB
   LICENSE_STATE_VALID   =  1   // Definitive: authorized
};
#endif

//+------------------------------------------------------------------+
//| Default Endpoints                                                |
//+------------------------------------------------------------------+
#ifndef GSN_DEFAULT_WEB_URL
#define GSN_DEFAULT_WEB_URL "http://127.0.0.1:3500"
#endif

#ifndef GSN_DEFAULT_GITHUB_CSV_URL
#define GSN_DEFAULT_GITHUB_CSV_URL "https://raw.githubusercontent.com/nguyenndn/ea-accounts/main/accounts.csv"
#endif

#ifndef GSN_LICENSE_CACHE_SALT
#define GSN_LICENSE_CACHE_SALT "TNT_GSN_IB_SALT_2026_V2"
#endif

//+------------------------------------------------------------------+
//| CGSNLicenseValidator - 3-Tier High-Availability OOP Validator    |
//|   Tier 1: Web Server API (/api/ea/license/verify)                |
//|   Tier 2: GitHub Backup Server (accounts.csv via API / Raw URL)  |
//|   Tier 3: Signed Local Cache (72h Offline Grace Window)          |
//+------------------------------------------------------------------+
class CGSNLicenseValidator
{
private:
   string            m_web_base_url;
   string            m_github_csv_url;
   string            m_license_key;
   bool              m_is_validated;
   datetime          m_last_check_time;
   int               m_check_interval;
   long              m_current_account;

   // --- Robustness & diagnostic state ---
   ENUM_LICENSE_STATE m_state;
   datetime          m_last_valid_time;
   int               m_fail_count;
   int               m_grace_seconds;
   bool              m_allow_unknown;
   string            m_last_reject_reason;
   string            m_last_verify_tier;

   // --- Internal helpers ---
   void              SyncAccountLoginSwitch(void) const;
   void              AutoLoadCachedCredentials(void);
   string            NormalizeBaseUrl(string url) const;
   double            ComputeLicenseSignature(long account_number, datetime timestamp) const;
   bool              HasFreshPersistedState(ENUM_LICENSE_STATE expected_state) const;
   ENUM_LICENSE_STATE VerifyViaWebServer(long account_number, int &http_code);
   ENUM_LICENSE_STATE VerifyViaGitHubBackup(long account_number, int &http_code);
   bool              DownloadGitHubCSV(string &csv_data, int &http_code);
   ENUM_LICENSE_STATE ParseGitHubCSV(string csv_data, long account_number);
   datetime          StringToDateTime(string date_str) const;
   string            ExtractJsonStringField(string json, string field_name) const;
   string            EscapeJson(string text) const;
   void              LogMessage(string message, bool is_error = false) const;
   void              AlertWebRequestBlocked(string blocked_url, int err_code) const;
   ENUM_LICENSE_STATE ResolveState(ENUM_LICENSE_STATE fetched);
   void              LoadPersistedState(void);
   void              SavePersistedState(ENUM_LICENSE_STATE st);

public:
                     CGSNLicenseValidator(void);
                     CGSNLicenseValidator(string url, int interval_seconds = 1800, string license_key = "");
   virtual          ~CGSNLicenseValidator(void);

   // --- Configuration ---
   bool              SetValidationURL(string url);
   bool              SetWebServerURL(string url);
   bool              SetGitHubBackupURL(string url);
   void              SetLicenseKey(string key);
   string            GetLicenseKey(void) const { return m_license_key; }
   bool              SetCheckInterval(int seconds);

   // --- Core Verification ---
   bool              ValidateAccount(void);
   bool              ValidateAccount(long account_number);
   bool              IsAccountValid(void) const;
   bool              CanOpenNewTrades(void) const { return IsAccountValid(); }
   bool              CanManageExistingTrades(void) const { return true; }
   bool              ShouldRevalidate(void) const;

   // --- State & Diagnostics ---
   string            GetValidationURL(void) const { return m_github_csv_url; }
   string            GetWebServerURL(void) const { return m_web_base_url; }
   datetime          GetLastCheckTime(void) const { return m_last_check_time; }
   ENUM_LICENSE_STATE GetLicenseState(void) const;
   string            GetLastRejectReason(void) const { return m_last_reject_reason; }
   string            GetLastVerifyTier(void) const { return m_last_verify_tier; }
   bool              IsTransientFailure(void) const { return (m_state == LICENSE_STATE_UNKNOWN); }
   bool              WasEverValidated(void) const { return (m_last_valid_time > 0); }
   int               GetFailCount(void) const { return m_fail_count; }
   void              SetOfflineGraceSeconds(int seconds);
   void              SetAllowUnknown(bool allow) { m_allow_unknown = allow; }
   static string     StateName(ENUM_LICENSE_STATE st);
   static bool       IsWebRequestAllowed(string url) { return true; }
   static string     ExtractDomain(string url);
};

//+------------------------------------------------------------------+
//| Drop-in alias for backward compatibility with CAccountValidator  |
//+------------------------------------------------------------------+
class CAccountValidator : public CGSNLicenseValidator
{
public:
   CAccountValidator(void) : CGSNLicenseValidator() {}
   CAccountValidator(string url, int interval_seconds = 1800, string license_key = "")
      : CGSNLicenseValidator(url, interval_seconds, license_key) {}
};

//+------------------------------------------------------------------+
//| Base64 decode helper for GitHub REST API payload                 |
//+------------------------------------------------------------------+
string GSN_Lic_Base64Decode(string encoded)
{
   string base64_chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
   string decoded = "";

   StringReplace(encoded, "\n", "");
   StringReplace(encoded, "\r", "");
   StringReplace(encoded, " ", "");

   int len = StringLen(encoded);
   int i = 0;

   while(i < len)
   {
      int b1 = StringFind(base64_chars, StringSubstr(encoded, i, 1));
      int b2 = StringFind(base64_chars, StringSubstr(encoded, i + 1, 1));
      int b3 = StringFind(base64_chars, StringSubstr(encoded, i + 2, 1));
      int b4 = StringFind(base64_chars, StringSubstr(encoded, i + 3, 1));

      if(b1 < 0) b1 = 0;
      if(b2 < 0) b2 = 0;
      if(b3 < 0) b3 = 0;
      if(b4 < 0) b4 = 0;

      int triple = (b1 << 18) | (b2 << 12) | (b3 << 6) | b4;

      decoded += CharToString((uchar)((triple >> 16) & 0xFF));
      if(StringSubstr(encoded, i + 2, 1) != "=")
         decoded += CharToString((uchar)((triple >> 8) & 0xFF));
      if(StringSubstr(encoded, i + 3, 1) != "=")
         decoded += CharToString((uchar)(triple & 0xFF));

      i += 4;
   }

   return decoded;
}

//+------------------------------------------------------------------+
//| Default Constructor                                              |
//+------------------------------------------------------------------+
CGSNLicenseValidator::CGSNLicenseValidator(void)
   : m_web_base_url(GSN_DEFAULT_WEB_URL),
     m_github_csv_url(GSN_DEFAULT_GITHUB_CSV_URL),
     m_license_key(""),
     m_is_validated(false),
     m_last_check_time(0),
     m_check_interval(1800),
     m_current_account(0),
     m_state(LICENSE_STATE_UNKNOWN),
     m_last_valid_time(0),
     m_fail_count(0),
     m_grace_seconds(259200), // 72h offline grace
     m_allow_unknown(false),
     m_last_reject_reason(""),
     m_last_verify_tier("NONE")
{
   m_current_account = AccountInfoInteger(ACCOUNT_LOGIN);
   AutoLoadCachedCredentials();
   LoadPersistedState();
}

//+------------------------------------------------------------------+
//| Parameterized Constructor                                        |
//+------------------------------------------------------------------+
CGSNLicenseValidator::CGSNLicenseValidator(string url, int interval_seconds = 1800, string license_key = "")
   : m_web_base_url(GSN_DEFAULT_WEB_URL),
     m_github_csv_url(GSN_DEFAULT_GITHUB_CSV_URL),
     m_license_key(license_key),
     m_is_validated(false),
     m_last_check_time(0),
     m_check_interval(interval_seconds < 30 ? 30 : interval_seconds),
     m_current_account(0),
     m_state(LICENSE_STATE_UNKNOWN),
     m_last_valid_time(0),
     m_fail_count(0),
     m_grace_seconds(259200),
     m_allow_unknown(false),
     m_last_reject_reason(""),
     m_last_verify_tier("NONE")
{
   m_current_account = AccountInfoInteger(ACCOUNT_LOGIN);
   if(StringLen(url) > 0)
      SetValidationURL(url);
   AutoLoadCachedCredentials();
   LoadPersistedState();
}

//+------------------------------------------------------------------+
//| Destructor                                                       |
//+------------------------------------------------------------------+
CGSNLicenseValidator::~CGSNLicenseValidator(void)
{
}

//+------------------------------------------------------------------+
//| Auto-load cached License Key & Web URL from GSN_EA_Telemetry     |
//| or COMMON file cache so user only needs 1 key across the terminal|
//+------------------------------------------------------------------+
void CGSNLicenseValidator::AutoLoadCachedCredentials(void)
{
#ifdef __GSN_EA_TELEMETRY_MQH__
   if(StringLen(m_license_key) == 0 && StringLen(g_TradeSync_ApiKey) > 0)
      m_license_key = g_TradeSync_ApiKey;
   if(StringLen(g_TradeSync_ApiUrl) > 0)
      m_web_base_url = NormalizeBaseUrl(g_TradeSync_ApiUrl);
#endif

   if(StringLen(m_license_key) == 0 || m_web_base_url == GSN_DEFAULT_WEB_URL)
   {
      string filename = "GSN_TradeSync_Cache.ini";
      if(FileIsExist(filename, FILE_COMMON))
      {
         int handle = FileOpen(filename, FILE_READ | FILE_TXT | FILE_COMMON | FILE_ANSI);
         if(handle != INVALID_HANDLE)
         {
            while(!FileIsEnding(handle))
            {
               string line = FileReadString(handle);
               int eq = StringFind(line, "=");
               if(eq > 0)
               {
                  string k = StringSubstr(line, 0, eq);
                  string v = StringSubstr(line, eq + 1);
                  StringTrimLeft(k); StringTrimRight(k);
                  StringTrimLeft(v); StringTrimRight(v);
                  if(k == "API_KEY" && StringLen(m_license_key) == 0 && StringLen(v) > 0)
                     m_license_key = v;
                  else if(k == "API_URL" && StringLen(v) > 0)
                     m_web_base_url = NormalizeBaseUrl(v);
               }
            }
            FileClose(handle);
         }
      }
   }
}

//+------------------------------------------------------------------+
//| Normalize base URL (strip trailing slash and /api/...)           |
//+------------------------------------------------------------------+
string CGSNLicenseValidator::NormalizeBaseUrl(string url) const
{
   string clean = url;
   StringTrimLeft(clean);
   StringTrimRight(clean);
   while(StringLen(clean) > 0 && StringSubstr(clean, StringLen(clean) - 1, 1) == "/")
      clean = StringSubstr(clean, 0, StringLen(clean) - 1);

   int api_pos = StringFind(clean, "/api/");
   if(api_pos > 0)
      clean = StringSubstr(clean, 0, api_pos);

   return clean;
}

//+------------------------------------------------------------------+
//| Set Validation URL (smartly distinguishes GitHub vs Web URL)     |
//+------------------------------------------------------------------+
bool CGSNLicenseValidator::SetValidationURL(string url)
{
   if(StringLen(url) == 0)
      return false;

   if(StringFind(url, "github") >= 0 || StringFind(url, ".csv") >= 0)
      m_github_csv_url = url;
   else
      m_web_base_url = NormalizeBaseUrl(url);

   m_is_validated = false;
   m_state = LICENSE_STATE_UNKNOWN;
   m_last_check_time = 0;
   m_fail_count = 0;
   return true;
}

bool CGSNLicenseValidator::SetWebServerURL(string url)
{
   if(StringLen(url) == 0)
      return false;
   m_web_base_url = NormalizeBaseUrl(url);
   return true;
}

bool CGSNLicenseValidator::SetGitHubBackupURL(string url)
{
   if(StringLen(url) == 0)
      return false;
   m_github_csv_url = url;
   return true;
}

void CGSNLicenseValidator::SetLicenseKey(string key)
{
   StringTrimLeft(key);
   StringTrimRight(key);
   m_license_key = key;
#ifdef __GSN_EA_TELEMETRY_MQH__
   if(StringLen(key) > 0 && StringLen(g_TradeSync_ApiKey) == 0)
      g_TradeSync_ApiKey = key;
#endif
}

bool CGSNLicenseValidator::SetCheckInterval(int seconds)
{
   if(seconds < 30)
      return false;
   m_check_interval = seconds;
   return true;
}

//+------------------------------------------------------------------+
//| Detect Hot Account Switch in MT5 Terminal without Chart Reload   |
//+------------------------------------------------------------------+
void CGSNLicenseValidator::SyncAccountLoginSwitch(void) const
{
   long live_account = AccountInfoInteger(ACCOUNT_LOGIN);
   if(live_account > 0 && m_current_account > 0 && live_account != m_current_account)
   {
      Print("[GSN License] Hot account switch detected (#", m_current_account,
            " -> #", live_account, "). Forcing immediate license re-verification.");
      CGSNLicenseValidator* self = (CGSNLicenseValidator*)GetPointer(this);
      self.m_current_account = live_account;
      self.m_is_validated    = false;
      self.m_state           = LICENSE_STATE_UNKNOWN;
      self.m_last_check_time = 0;
      self.m_fail_count      = 0;
   }
}

bool CGSNLicenseValidator::IsAccountValid(void) const
{
   SyncAccountLoginSwitch();
   return m_is_validated;
}

ENUM_LICENSE_STATE CGSNLicenseValidator::GetLicenseState(void) const
{
   SyncAccountLoginSwitch();
   return m_state;
}

bool CGSNLicenseValidator::ShouldRevalidate(void) const
{
   SyncAccountLoginSwitch();

   if(m_last_check_time == 0)
      return true;

   int effective = m_check_interval;
   int steps = (m_fail_count > 4) ? 4 : m_fail_count;
   for(int i = 0; i < steps; i++)
      effective *= 2;

   return ((TimeCurrent() - m_last_check_time) > effective);
}

//+------------------------------------------------------------------+
//| Validate current MT5 account                                     |
//+------------------------------------------------------------------+
bool CGSNLicenseValidator::ValidateAccount(void)
{
   long live_account = AccountInfoInteger(ACCOUNT_LOGIN);
   if(live_account > 0)
      m_current_account = live_account;
   return ValidateAccount(m_current_account);
}

//+------------------------------------------------------------------+
//| Validate specific account across 3-Tier HA Chain                 |
//+------------------------------------------------------------------+
bool CGSNLicenseValidator::ValidateAccount(long account_number)
{
   AutoLoadCachedCredentials();

   if(account_number <= 0)
      account_number = AccountInfoInteger(ACCOUNT_LOGIN);
   m_current_account = account_number;

   // Strategy Tester / Demo Account free bypass
   ENUM_ACCOUNT_TRADE_MODE account_mode = (ENUM_ACCOUNT_TRADE_MODE)AccountInfoInteger(ACCOUNT_TRADE_MODE);
   if(account_mode == ACCOUNT_TRADE_MODE_DEMO || MQLInfoInteger(MQL_TESTER))
   {
      m_is_validated    = true;
      m_state           = LICENSE_STATE_VALID;
      m_last_valid_time = TimeCurrent();
      m_last_check_time = TimeCurrent();
      m_fail_count      = 0;
      m_last_verify_tier = "DEMO_OR_TESTER";
      return true;
   }

   int http_code_web = 0;
   int http_code_gh  = 0;

   // ================================================================
   // TIER 1: Primary Web Server (/api/ea/license/verify)
   // ================================================================
   ENUM_LICENSE_STATE fetched = VerifyViaWebServer(account_number, http_code_web);
   if(fetched != LICENSE_STATE_UNKNOWN)
   {
      m_last_verify_tier = "TIER1_WEB_SERVER";
   }
   else
   {
      // =============================================================
      // TIER 2: GitHub Backup Server (accounts.csv)
      // Triggered automatically when Web Server is down / unreachable
      // =============================================================
      LogMessage("Primary Web Server unreachable (http=" + IntegerToString(http_code_web) +
                 ") - switching to Tier 2 GitHub Backup Server...");
      fetched = VerifyViaGitHubBackup(account_number, http_code_gh);
      if(fetched != LICENSE_STATE_UNKNOWN)
         m_last_verify_tier = "TIER2_GITHUB_BACKUP";
      else
         m_last_verify_tier = "TIER3_LOCAL_GRACE_CACHE";
   }

   // ================================================================
   // TIER 3: Resolve with Signed Offline Grace Cache
   // ================================================================
   m_state           = ResolveState(fetched);
   m_is_validated    = (m_state == LICENSE_STATE_VALID);
   m_last_check_time = TimeCurrent();

   if(m_state == LICENSE_STATE_VALID)
   {
      LogMessage("Account #" + IntegerToString(account_number) +
                 " VALID via " + m_last_verify_tier);
   }
   else if(m_state == LICENSE_STATE_REVOKED)
   {
      string reason_suffix = (StringLen(m_last_reject_reason) > 0)
                             ? (" (" + m_last_reject_reason + ")")
                             : "";
      LogMessage("Account #" + IntegerToString(account_number) +
                 " REVOKED via " + m_last_verify_tier + reason_suffix, true);
   }
   else
   {
      LogMessage("Account #" + IntegerToString(account_number) +
                 " UNVERIFIABLE - keeping state " + StateName(m_state), true);
   }

   return m_is_validated;
}

//+------------------------------------------------------------------+
//| Tier 1: Verify via Primary Web Server (/api/ea/license/verify)   |
//+------------------------------------------------------------------+
ENUM_LICENSE_STATE CGSNLicenseValidator::VerifyViaWebServer(long account_number, int &http_code)
{
   http_code = 0;
   if(StringLen(m_web_base_url) == 0)
      return LICENSE_STATE_UNKNOWN;

   string verify_url = m_web_base_url + "/api/ea/license/verify";
   string headers    = "Content-Type: application/json\r\n";
   if(StringLen(m_license_key) > 0)
      headers += "X-License-Key: " + m_license_key + "\r\n";

   string broker   = AccountInfoString(ACCOUNT_COMPANY);
   string server   = AccountInfoString(ACCOUNT_SERVER);
   string currency = AccountInfoString(ACCOUNT_CURRENCY);
   double balance  = AccountInfoDouble(ACCOUNT_BALANCE);
   double equity   = AccountInfoDouble(ACCOUNT_EQUITY);
   int    mode     = (int)AccountInfoInteger(ACCOUNT_TRADE_MODE);
   string ea_name  = MQLInfoString(MQL_PROGRAM_NAME);

   string product_slug = "";
#ifdef __GSN_EA_TELEMETRY_MQH__
   product_slug = g_TradeSync_ProductSlug;
#endif

   string payload = "{";
   payload += "\"accountNumber\":\"" + IntegerToString(account_number) + "\",";
   payload += "\"licenseKey\":\"" + EscapeJson(m_license_key) + "\",";
   payload += "\"broker\":\"" + EscapeJson(broker) + "\",";
   payload += "\"server\":\"" + EscapeJson(server) + "\",";
   payload += "\"currency\":\"" + EscapeJson(currency) + "\",";
   payload += "\"accountTradeMode\":" + IntegerToString(mode) + ",";
   payload += "\"balance\":" + DoubleToString(balance, 2) + ",";
   payload += "\"equity\":" + DoubleToString(equity, 2) + ",";
   payload += "\"platform\":\"MT5\",";
   payload += "\"productSlug\":\"" + EscapeJson(product_slug) + "\",";
   payload += "\"eaName\":\"" + EscapeJson(ea_name) + "\"";
   payload += "}";

   char post_data[];
   int payload_len = StringToCharArray(payload, post_data, 0, WHOLE_ARRAY, CP_UTF8);
   if(payload_len > 0)
      ArrayResize(post_data, payload_len - 1); // strip null terminator

   char result[];
   string result_headers = "";
   ResetLastError();
   int res = WebRequest("POST", verify_url, headers, 5000, post_data, result, result_headers);
   http_code = res;

   if(res == -1)
   {
      int err = GetLastError();
      if(err == 4014 || err == 4060)
      {
         AlertWebRequestBlocked(m_web_base_url, err);
      }
      return LICENSE_STATE_UNKNOWN;
   }

   // Server errors (5xx / 404 / 429) are treated as transient -> fallback to Tier 2 GitHub
   if(res != 200 && res != 401 && res != 403)
      return LICENSE_STATE_UNKNOWN;

   string response_json = CharArrayToString(result, 0, WHOLE_ARRAY, CP_UTF8);
   string state_str     = ExtractJsonStringField(response_json, "state");
   string msg_str       = ExtractJsonStringField(response_json, "message");
   string code_str      = ExtractJsonStringField(response_json, "code");

   if(state_str == "VALID" || StringFind(response_json, "\"valid\":true") >= 0)
   {
      m_last_reject_reason = "";
      return LICENSE_STATE_VALID;
   }

   if(state_str == "REVOKED" || res == 403 || res == 401)
   {
      m_last_reject_reason = (StringLen(msg_str) > 0) ? msg_str : code_str;
      return LICENSE_STATE_REVOKED;
   }

   return LICENSE_STATE_UNKNOWN;
}

//+------------------------------------------------------------------+
//| Tier 2: Verify via GitHub Backup Server (accounts.csv)           |
//+------------------------------------------------------------------+
ENUM_LICENSE_STATE CGSNLicenseValidator::VerifyViaGitHubBackup(long account_number, int &http_code)
{
   string csv_data = "";
   if(!DownloadGitHubCSV(csv_data, http_code))
      return LICENSE_STATE_UNKNOWN;

   return ParseGitHubCSV(csv_data, account_number);
}

//+------------------------------------------------------------------+
//| Download accounts.csv from GitHub API (no cache) + Raw Fallback  |
//+------------------------------------------------------------------+
bool CGSNLicenseValidator::DownloadGitHubCSV(string &csv_data, int &http_code)
{
   string headers = NULL;
   char post_data[];
   char result[];
   string result_headers;
   int timeout = 5000;

   http_code = 0;
   csv_data  = "";

   if(StringLen(m_github_csv_url) == 0)
      return false;

   string api_url = m_github_csv_url;
   StringReplace(api_url, "raw.githubusercontent.com/", "api.github.com/repos/");
   StringReplace(api_url, "/main/", "/contents/");
   StringReplace(api_url, "/master/", "/contents/");

   ResetLastError();
   int res = WebRequest("GET", api_url, headers, timeout, post_data, result, result_headers);
   http_code = res;

   if(res == -1)
   {
      int err = GetLastError();
      if(err == 4014 || err == 4060)
         AlertWebRequestBlocked("https://api.github.com", err);
   }

   if(res == 200)
   {
      string json_response = CharArrayToString(result);
      int key_pos = StringFind(json_response, "\"content\":");
      if(key_pos >= 0)
      {
         int content_start = StringFind(json_response, "\"", key_pos + 10);
         if(content_start >= 0)
         {
            content_start++;
            int content_end = StringFind(json_response, "\"", content_start);
            if(content_end > content_start)
            {
               string base64_content = StringSubstr(json_response, content_start, content_end - content_start);
               StringReplace(base64_content, "\\n", "");
               csv_data = GSN_Lic_Base64Decode(base64_content);
               if(StringLen(csv_data) > 0)
                  return true;
            }
         }
      }
   }

   // Fallback to Raw GitHub URL with cache buster
   string cache_buster = IntegerToString(GetTickCount()) + "_" + IntegerToString(MathRand());
   string url_with_cb  = m_github_csv_url + "?_=" + cache_buster;

   ArrayResize(result, 0);
   ResetLastError();
   res = WebRequest("GET", url_with_cb, headers, timeout, post_data, result, result_headers);
   http_code = res;

   if(res == -1)
   {
      int err = GetLastError();
      if(err == 4014 || err == 4060)
         AlertWebRequestBlocked("https://raw.githubusercontent.com", err);
   }

   if(res == 200)
   {
      csv_data = CharArrayToString(result);
      return (StringLen(csv_data) > 0);
   }

   return false;
}

//+------------------------------------------------------------------+
//| Parse GitHub accounts.csv and validate account_number            |
//+------------------------------------------------------------------+
ENUM_LICENSE_STATE CGSNLicenseValidator::ParseGitHubCSV(string csv_data, long account_number)
{
   string account_str = IntegerToString(account_number);
   string lines[];
   int line_count = StringSplit(csv_data, StringGetCharacter("\n", 0), lines);

   if(line_count < 2)
      return LICENSE_STATE_UNKNOWN;

   int rows_parsed = 0;

   for(int i = 1; i < line_count; i++)
   {
      string line = lines[i];
      StringReplace(line, "\r", "");
      if(StringLen(line) < 3)
         continue;

      string fields[];
      int field_count = StringSplit(line, StringGetCharacter(",", 0), fields);
      if(field_count < 4)
         continue;

      rows_parsed++;

      string csv_account = fields[0];
      string end_date    = fields[2];
      string status      = fields[3];

      StringTrimLeft(csv_account); StringTrimRight(csv_account);
      StringTrimLeft(end_date);    StringTrimRight(end_date);
      StringTrimLeft(status);      StringTrimRight(status);

      if(StringCompare(csv_account, account_str) == 0)
      {
         if(StringCompare(status, "active", false) != 0)
         {
            m_last_reject_reason = "Account status on backup server is " + status;
            return LICENSE_STATE_REVOKED;
         }

         datetime expiry = StringToDateTime(end_date);
         if(expiry > 0 && TimeCurrent() > expiry)
         {
            m_last_reject_reason = "License expired on " + end_date;
            return LICENSE_STATE_REVOKED;
         }

         m_last_reject_reason = "";
         return LICENSE_STATE_VALID;
      }
   }

   if(rows_parsed == 0)
      return LICENSE_STATE_UNKNOWN;

   m_last_reject_reason = "Account #" + account_str + " not found in license list";
   return LICENSE_STATE_REVOKED;
}

//+------------------------------------------------------------------+
//| Resolve effective license state with fail-safe grace window      |
//+------------------------------------------------------------------+
ENUM_LICENSE_STATE CGSNLicenseValidator::ResolveState(ENUM_LICENSE_STATE fetched)
{
   if(fetched == LICENSE_STATE_VALID)
   {
      m_fail_count      = 0;
      m_last_valid_time = TimeCurrent();
      SavePersistedState(LICENSE_STATE_VALID);
      return LICENSE_STATE_VALID;
   }

   if(fetched == LICENSE_STATE_REVOKED)
   {
      m_fail_count = 0;
      SavePersistedState(LICENSE_STATE_REVOKED);
      return LICENSE_STATE_REVOKED;
   }

   // Transient failure (both Web and GitHub unreachable): preserve last known good state
   m_fail_count++;

   if(m_state == LICENSE_STATE_REVOKED)
   {
      return LICENSE_STATE_REVOKED;
   }

   if(HasFreshPersistedState(LICENSE_STATE_VALID))
   {
      m_state = LICENSE_STATE_VALID;
      return LICENSE_STATE_VALID;
   }

   if(m_state == LICENSE_STATE_VALID)
   {
      m_last_reject_reason = "Signed offline cache expired or invalid.";
   }

   if(m_allow_unknown)
      return LICENSE_STATE_VALID;

   return LICENSE_STATE_UNKNOWN;
}

//+------------------------------------------------------------------+
//| Compute Anti-Spoofing Signature for MT5 GlobalVariable Cache     |
//| Prevents users from pressing F3 in MT5 and setting 1.0 manually  |
//+------------------------------------------------------------------+
double CGSNLicenseValidator::ComputeLicenseSignature(long account_number, datetime timestamp) const
{
   uint hash = (uint)2166136261;
   string payload = "GSN_SIG_V3_"
                    + IntegerToString(account_number) + "|"
                    + IntegerToString((long)timestamp) + "|"
                    + m_license_key + "|"
                    + GSN_LICENSE_CACHE_SALT;
   int len = StringLen(payload);
   for(int i = 0; i < len; i++)
   {
      hash ^= (uint)StringGetCharacter(payload, i);
      hash *= (uint)16777619;
   }
   return (double)((hash & 0x7FFFFFFF) + 1);
}

bool CGSNLicenseValidator::HasFreshPersistedState(ENUM_LICENSE_STATE expected_state) const
{
   if(m_current_account <= 0 ||
      (expected_state != LICENSE_STATE_VALID &&
       expected_state != LICENSE_STATE_REVOKED))
      return false;

   string gv_sig  = "GSN_Lic_Sig_" + IntegerToString(m_current_account);
   string gv_time = "GSN_Lic_Time_" + IntegerToString(m_current_account);

   if(!GlobalVariableCheck(gv_sig) || !GlobalVariableCheck(gv_time))
      return false;

   double stored_sig = GlobalVariableGet(gv_sig);
   datetime timestamp = (datetime)GlobalVariableGet(gv_time);
   datetime now = TimeCurrent();
   if(timestamp <= 0 || timestamp > now + 300)
      return false;

   long age_seconds = (long)(now - timestamp);
   if(age_seconds > (long)m_grace_seconds)
      return false;

   double expected_sig = ComputeLicenseSignature(m_current_account, timestamp);
   if(expected_state == LICENSE_STATE_VALID)
      return (MathAbs(stored_sig - expected_sig) < 0.5);

   return (MathAbs(stored_sig + expected_sig) < 0.5);
}

void CGSNLicenseValidator::LoadPersistedState(void)
{
   if(m_current_account <= 0)
      return;

   string gv_sig  = "GSN_Lic_Sig_" + IntegerToString(m_current_account);
   string gv_time = "GSN_Lic_Time_" + IntegerToString(m_current_account);

   if(!GlobalVariableCheck(gv_sig) || !GlobalVariableCheck(gv_time))
   {
      if(GlobalVariableCheck(gv_sig))
         GlobalVariableDel(gv_sig);
      if(GlobalVariableCheck(gv_time))
         GlobalVariableDel(gv_time);
      return;
   }

   datetime t = (datetime)GlobalVariableGet(gv_time);

   if(HasFreshPersistedState(LICENSE_STATE_VALID))
   {
      m_state = LICENSE_STATE_VALID;
      if(t > m_last_valid_time)
         m_last_valid_time = t;
   }
   else if(HasFreshPersistedState(LICENSE_STATE_REVOKED))
   {
      m_state = LICENSE_STATE_REVOKED;
   }
   else
   {
      GlobalVariableDel(gv_sig);
      GlobalVariableDel(gv_time);
   }
}

void CGSNLicenseValidator::SavePersistedState(ENUM_LICENSE_STATE st)
{
   if(m_current_account <= 0)
      return;

   string gv_sig  = "GSN_Lic_Sig_" + IntegerToString(m_current_account);
   string gv_time = "GSN_Lic_Time_" + IntegerToString(m_current_account);

   if(st != LICENSE_STATE_VALID && st != LICENSE_STATE_REVOKED)
   {
      if(GlobalVariableCheck(gv_sig))
         GlobalVariableDel(gv_sig);
      if(GlobalVariableCheck(gv_time))
         GlobalVariableDel(gv_time);
      return;
   }

   datetime timestamp = TimeCurrent();
   double signature = ComputeLicenseSignature(m_current_account, timestamp);
   if(st == LICENSE_STATE_VALID)
      GlobalVariableSet(gv_sig, signature);
   else
      GlobalVariableSet(gv_sig, -signature);

   GlobalVariableSet(gv_time, (double)timestamp);
}

void CGSNLicenseValidator::SetOfflineGraceSeconds(int seconds)
{
   m_grace_seconds = (seconds < 0) ? 0 : seconds;
}

string CGSNLicenseValidator::StateName(ENUM_LICENSE_STATE st)
{
   switch(st)
   {
      case LICENSE_STATE_VALID:   return "VALID";
      case LICENSE_STATE_REVOKED: return "REVOKED";
      default:                    return "UNKNOWN";
   }
}

datetime CGSNLicenseValidator::StringToDateTime(string date_str) const
{
   if(StringLen(date_str) < 10)
      return 0;

   string parts[];
   int count = StringSplit(date_str, StringGetCharacter("-", 0), parts);
   if(count != 3)
      return 0;

   int year  = (int)StringToInteger(parts[0]);
   int month = (int)StringToInteger(parts[1]);
   int day   = (int)StringToInteger(parts[2]);

   if(year > 2050)
      return D'2099.01.01 00:00:00';

   MqlDateTime dt;
   dt.year = year;
   dt.mon  = month;
   dt.day  = day;
   dt.hour = 23;
   dt.min  = 59;
   dt.sec  = 59;

   return StructToTime(dt);
}

string CGSNLicenseValidator::ExtractJsonStringField(string json, string field_name) const
{
   string pattern = "\"" + field_name + "\":\"";
   int start = StringFind(json, pattern);
   if(start < 0)
      return "";
   start += StringLen(pattern);
   int end = StringFind(json, "\"", start);
   if(end <= start)
      return "";
   return StringSubstr(json, start, end - start);
}

string CGSNLicenseValidator::EscapeJson(string text) const
{
   string res = text;
   StringReplace(res, "\\", "\\\\");
   StringReplace(res, "\"", "\\\"");
   StringReplace(res, "\r", "");
   StringReplace(res, "\n", " ");
   return res;
}

void CGSNLicenseValidator::LogMessage(string message, bool is_error = false) const
{
   string prefix = is_error ? "[GSN License ERROR] " : "[GSN License] ";
   Print(prefix + message);
}

void CGSNLicenseValidator::AlertWebRequestBlocked(string blocked_url, int err_code) const
{
   string msg = "WebRequest is blocked by MetaTrader (Error " + IntegerToString(err_code) +
                ") for URL: " + blocked_url +
                ". Please go to MT5 -> Tools -> Options -> Expert Advisors -> Check 'Allow WebRequest for listed URL' and add: " +
                m_web_base_url + " , https://api.github.com , https://raw.githubusercontent.com";
   LogMessage(msg, true);

   static datetime s_last_webrequest_alert = 0;
   if(TimeCurrent() - s_last_webrequest_alert >= 300)
   {
      s_last_webrequest_alert = TimeCurrent();
      Alert("[TheNextTrade EA] " + msg);
   }
}

string CGSNLicenseValidator::ExtractDomain(string url)
{
   string domain = url;
   int pos = StringFind(domain, "://");
   if(pos >= 0)
      domain = StringSubstr(domain, pos + 3);
   pos = StringFind(domain, "/");
   if(pos >= 0)
      domain = StringSubstr(domain, 0, pos);
   return domain;
}

#endif // __GSN_EA_LICENSE_MQH__
//+------------------------------------------------------------------+
