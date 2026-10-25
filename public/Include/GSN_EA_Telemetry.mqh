//+------------------------------------------------------------------+
//|                                           GSN_EA_Telemetry.mqh   |
//|                             Copyright 2026, GoldScalperNinja     |
//+------------------------------------------------------------------+
#ifndef __GSN_EA_TELEMETRY_MQH__
#define __GSN_EA_TELEMETRY_MQH__
#ifndef __GSN_TRADESYNC_ENGINE_MQH__
#define __GSN_TRADESYNC_ENGINE_MQH__
#endif

//--- Configuration variables (populated by parent EA via Init)
string g_TradeSync_ApiKey = "";
string g_TradeSync_ApiUrl = "";
int g_HeartbeatInterval = 300; // Heartbeat interval (seconds)
int g_SyncDelay = 5;           // Delay after trade close (seconds)

#ifndef GSN_EA_SLUG
#define GSN_EA_SLUG ""
#endif
#ifndef GSN_EA_NAME
#define GSN_EA_NAME ""
#endif
#ifndef GSN_EA_VERSION
#define GSN_EA_VERSION "2.4.0"
#endif

//--- Product & EA Telemetry Identity (Auto-detected from MQL_PROGRAM_NAME or set via #define GSN_EA_SLUG)
string g_TradeSync_ProductSlug = GSN_EA_SLUG;
string g_TradeSync_EaName      = GSN_EA_NAME;
string g_TradeSync_EaVersion   = GSN_EA_VERSION;

//--- Global variables
datetime g_LastHeartbeat = 0;
datetime g_LastTradeCheck = 0;
datetime g_LastSyncTime = 0;
datetime g_LastTimerRun = 0;

//--- Background Sync Variables
bool g_IsSyncing = false;
ulong g_SyncTickets[];
int g_SyncTotal = 0;
int g_SyncIndex = 0;
int g_SyncBatchSize = 50;
bool g_CheckTradesNow = false;
string g_SyncResultMsg = "";
datetime g_SyncResultTime = 0;

//--- Async Sync Queue (In-memory only per user request)
ulong g_FailedTickets[];

bool TradeSync_IsDealQueued(ulong ticket) {
  int size = ArraySize(g_FailedTickets);
  for (int i = 0; i < size; i++) {
    if (g_FailedTickets[i] == ticket) return true;
  }
  return false;
}

void TradeSync_QueueDeal(ulong ticket) {
  if (ticket == 0 || TradeSync_IsDealQueued(ticket)) return;
  int size = ArraySize(g_FailedTickets);
  ArrayResize(g_FailedTickets, size + 1);
  g_FailedTickets[size] = ticket;
}
bool TradeSync_EnsureOwner();
void TradeSync_ReleaseOwner();
string EscapeJsonString(string str);
bool FindOpeningDealWithSLTP(long positionId, double &openPrice, datetime &openTime,
                             int &tradeType, double &stopLoss, double &takeProfit,
                             double &totalProfit, double &totalCommission, double &totalSwap);
bool FindOpeningDealWithSLTP(long positionId, double &openPrice, datetime &openTime,
                             int &tradeType, double &stopLoss, double &takeProfit);
bool FindOpeningDeal(long positionId, double &openPrice, datetime &openTime, int &tradeType);
int  SyncDateRange(datetime fromDate, datetime toDate);
int  SyncHistoryDeals(datetime fromDate = 0, datetime toDate = 0);
string BuildTradeJson(ulong dealTicket);
string BuildTradesEnvelopeJson(string tradesArrayJson, string accountNumberOverride = "");
bool SyncSingleTrade(ulong dealTicket);
bool SyncSingleTrade(ulong dealTicket, string apiUrl, string apiKey, string accountNumber);
bool SendTradesPayload(string apiUrl, string apiKey, string fullJson);
void FetchEaConfig();
bool ExtractJsonBool(string json, string key, bool defaultVal);

int g_LastHistoryTotal = 0;
bool g_HistoryBaselineInitialized = false;
bool g_IsConnected = false;
bool g_TradeSync_IsOwner = false;
bool g_TradeManagementActive = true;  // Active state of trade management
bool g_IsBalanceEligible = true;      // Minimum balance eligible ($200 USD minimum)
bool g_IsVipActive = false;           // VIP connection active
bool g_SyncOpenTrades = true;         // Sync active open positions (controlled by /api/ea/config)
datetime g_LastConfigFetch = 0;       // Last /api/ea/config fetch timestamp
int g_ConfigRefreshInterval = 900;    // Refresh /api/ea/config every 15 minutes
string g_AccountNumber = "";
int g_TotalSynced = 0;
uint g_LastSyncLatency = 0;
string g_LastError = "";
string g_LastSyncStatus = "Never";
string g_BaseUrl = ""; // Normalized base URL
uint g_LastSyncClickTime = 0;
bool g_ShowPeriodPopup = false; // Period selection popup visible
datetime g_RateLimitUntil = 0;  // Rate limit cooldown timestamp
int g_RetryDelaySeconds = 0;
datetime g_NextAllowedSyncTime = 0;
int g_RateLimitSeconds = 60;    // Default cooldown (seconds)

//+------------------------------------------------------------------+
//| Resolve canonical productSlug, eaName, and eaVersion             |
//+------------------------------------------------------------------+
void TradeSync_ResolveProductIdentity(string productSlug = "", string eaName = "", string eaVersion = "") {
  StringTrimLeft(productSlug);
  StringTrimRight(productSlug);
  StringTrimLeft(eaName);
  StringTrimRight(eaName);
  StringTrimLeft(eaVersion);
  StringTrimRight(eaVersion);

  if (productSlug == "" && GSN_EA_SLUG != "") {
    productSlug = GSN_EA_SLUG;
  }
  if (eaName == "" && GSN_EA_NAME != "") {
    eaName = GSN_EA_NAME;
  }
  if (eaName == "") {
    eaName = MQLInfoString(MQL_PROGRAM_NAME);
    if (eaName == "") eaName = "GoldScalperNinja EA";
  }
  if (eaVersion == "") {
    eaVersion = (GSN_EA_VERSION != "") ? GSN_EA_VERSION : "2.4.0";
  }

  if (productSlug == "") {
    string lowerName = eaName;
    StringToLower(lowerName);
    if (StringFind(lowerName, "trademanager") >= 0 ||
        StringFind(lowerName, "trade manager") >= 0 ||
        StringFind(lowerName, "trade-manager") >= 0) {
      productSlug = "trade-manager";
    } else if (StringFind(lowerName, "shadow matrix") >= 0 ||
               StringFind(lowerName, "shadown matrix") >= 0 ||
               StringFind(lowerName, "phoenix") >= 0 ||
               StringFind(lowerName, "sentinel") >= 0 ||
               StringFind(lowerName, "apex") >= 0 ||
               StringFind(lowerName, "dual grid") >= 0 ||
               StringFind(lowerName, "grid") >= 0) {
      productSlug = "gsn-phoenix-grid";
    } else if (StringFind(lowerName, "goldscalper") >= 0 ||
               StringFind(lowerName, "gold scalper") >= 0 ||
               StringFind(lowerName, "arum") >= 0 ||
               StringFind(lowerName, "oneshot") >= 0 ||
               StringFind(lowerName, "waverider") >= 0 ||
               StringFind(lowerName, "ninja") >= 0) {
      productSlug = "goldscalperninja";
    } else {
      productSlug = lowerName;
      StringReplace(productSlug, " ", "-");
    }
  }

  g_TradeSync_ProductSlug = productSlug;
  g_TradeSync_EaName = eaName;
  g_TradeSync_EaVersion = eaVersion;
}


string TradeSync_OwnerKey() {
  if (g_AccountNumber == "" || g_AccountNumber == "0") return "";
  return "GSN_TSYNC_OWNER_" + g_AccountNumber;
}

double GetTradeSyncInstanceID() {
  static double instance_id = 0;
  if (instance_id == 0) {
    MathSrand(GetTickCount());
    instance_id = (double)GetTickCount() + MathRand();
  }
  return instance_id;
}

bool TradeSync_EnsureOwner() {
  if (g_AccountNumber == "" || g_AccountNumber == "0") return false;

  string key = TradeSync_OwnerKey();
  if (key == "") return false;
  string keyHb = key + "_HB";
  double myOwnerId = GetTradeSyncInstanceID();
  uint now = GetTickCount();

  if (GlobalVariableCheck(key)) {
    double owner = GlobalVariableGet(key);
    uint touchedAt = 0;
    if(GlobalVariableCheck(keyHb)) touchedAt = (uint)GlobalVariableGet(keyHb);

    if (owner == myOwnerId) {
      static uint lastTouch = 0;
      if (now - lastTouch >= 5000 || lastTouch == 0) {
        GlobalVariableSet(key, myOwnerId);
        GlobalVariableSet(keyHb, (double)now);
        lastTouch = now;
      }
      g_TradeSync_IsOwner = true;
      return true;
    }

    if (owner != 0 && (now >= touchedAt) && (now - touchedAt < 15000)) {
      g_TradeSync_IsOwner = false;
      return false;
    }
  }

  GlobalVariableSet(key, myOwnerId);
  GlobalVariableSet(keyHb, (double)now);
  bool acquired = (GlobalVariableGet(key) == myOwnerId);
  if (acquired && !g_TradeSync_IsOwner) {
    g_TradeSync_IsOwner = true;
    Print("Trade Sync: this chart is now the account queue owner.");
  }
  return acquired;
}

void TradeSync_ReleaseOwner() {
  if (g_AccountNumber == "" || g_AccountNumber == "0") return;

  string key = TradeSync_OwnerKey();
  if (key == "") return;
  string keyHb = key + "_HB";
  double myOwnerId = GetTradeSyncInstanceID();
  if (GlobalVariableCheck(key) && GlobalVariableGet(key) == myOwnerId) {
    GlobalVariableDel(key);
    GlobalVariableDel(keyHb);
  }
  g_TradeSync_IsOwner = false;
}

void TradeSync_TakeOwnership() {
  if (g_AccountNumber == "" || g_AccountNumber == "0") {
    long curLogin = AccountInfoInteger(ACCOUNT_LOGIN);
    if (curLogin > 0) g_AccountNumber = IntegerToString(curLogin);
    else g_AccountNumber = "";
  }
  if (g_AccountNumber == "" || g_AccountNumber == "0") return;

  string key = TradeSync_OwnerKey();
  if (key == "") return;
  string keyHb = key + "_HB";
  double myOwnerId = GetTradeSyncInstanceID();
  uint now = GetTickCount();

  GlobalVariableSet(key, myOwnerId);
  GlobalVariableSet(keyHb, (double)now);
  g_TradeSync_IsOwner = true;
  Print("[Trade Sync] This chart took over account queue ownership.");
}



//--- Panel object names
#define PANEL_NAME "GSN_Panel"
#define PANEL_BG "GSN_PanelBG"
#define PANEL_HEADER "GSN_Header"
#define PANEL_STATUS_LABEL "GSN_StatusLabel"
#define PANEL_STATUS_VALUE "GSN_StatusValue"
#define PANEL_ACCOUNT_LABEL "GSN_AccountLabel"
#define PANEL_ACCOUNT_VALUE "GSN_AccountValue"
#define PANEL_SYNCED_LABEL "GSN_SyncedLabel"
#define PANEL_SYNCED_VALUE "GSN_SyncedValue"
#define PANEL_LASTSYNC_LABEL "GSN_LastSyncLabel"
#define PANEL_LASTSYNC_VALUE "GSN_LastSyncValue"
#define PANEL_ERROR_VALUE "GSN_ErrorValue"
#define PANEL_RATELIMIT "GSN_RateLimit"
#define BTN_TEST_CONNECTION "GSN_BtnTest"
#define BTN_SYNC_TRADES "GSN_BtnSyncTrades"

//--- Period Popup object names
#define POPUP_BG "GSN_PopupBG"
#define POPUP_TITLE "GSN_PopupTitle"
#define POPUP_CLOSE "GSN_PopupClose"
#define BTN_TODAY "GSN_BtnToday"
#define BTN_3DAYS "GSN_Btn3Days"
#define BTN_WEEK "GSN_BtnWeek"
#define BTN_MONTH "GSN_BtnMonth"
#define BTN_3MONTHS "GSN_Btn3Months"
#define BTN_6MONTHS "GSN_Btn6Months"
#define BTN_ALL "GSN_BtnAll"
#define LABEL_CUSTOM "GSN_LabelCustom"
#define EDIT_FROM "GSN_EditFrom"
#define EDIT_TO "GSN_EditTo"
#define BTN_SYNC_CUSTOM "GSN_BtnSyncCustom"

//--- Colors - Premium Modern Dark Theme
#define CLR_PANEL_BG C'18,18,24'       // Deep dark background
#define CLR_PANEL_BG2 C'24,24,32'      // Card background
#define CLR_PANEL_BORDER C'45,45,55'   // Subtle border
#define CLR_HEADER_BG C'24,24,32'      // Dark header (no green bar)
#define CLR_HEADER_TEXT C'255,255,255' // White header text
#define CLR_ACCENT C'0,212,140'        // GSN Emerald Green
#define CLR_ACCENT_DIM C'0,170,112'    // Hover state
#define CLR_LABEL C'140,140,155'       // Muted labels
#define CLR_VALUE C'240,240,245'       // Bright values
#define CLR_CONNECTED C'46,204,113'    // Success green
#define CLR_DISCONNECTED C'231,76,60'  // Error red
#define CLR_WARNING C'241,196,15'      // Warning amber
#define CLR_BTN_BG C'32,32,42'         // Button background
#define CLR_BTN_BORDER C'55,55,70'     // Button border
#define CLR_BTN_TEXT C'220,220,230'    // Button text
#define CLR_BTN_PRIMARY C'0,200,130'   // Primary action
#define CLR_POPUP_BG C'22,22,30'       // Popup background
#ifndef CLR_EDIT_BG
#define CLR_EDIT_BG C'16,16,22'        // Input background
#endif
#define CLR_DIVIDER C'45,45,58'        // Subtle divider

//--- Additional panel objects for premium look
#define PANEL_HEADER_BG "GSN_HeaderBG"
#define PANEL_HEADER_LINE "GSN_HeaderLine"
#define PANEL_DIVIDER1 "GSN_Divider1"
#define PANEL_DIVIDER2 "GSN_Divider2"
#define PANEL_STATUS_DOT "GSN_StatusDot"
#define PANEL_LOGO "GSN_Logo"

//+------------------------------------------------------------------+
//| Clear Warning from Chart                                         |

//+------------------------------------------------------------------+
//| Clear Status Badge from Chart                                    |
//+------------------------------------------------------------------+
void ClearChartStatus()
{
   ObjectDelete(0, "GSN_Sync_Status_BG");
   ObjectDelete(0, "GSN_Sync_Status_Label");
   for(int i = ObjectsTotal(0, 0, -1) - 1; i >= 0; i--)
   {
      string name = ObjectName(0, i, 0, -1);
      if(StringFind(name, "GSN_Sync_Status") == 0)
         ObjectDelete(0, name);
   }
   ChartRedraw(0);
}

//+------------------------------------------------------------------+
//| Clear Warning Banner from Chart                                  |
//+------------------------------------------------------------------+
void ClearChartWarning()
{
   ObjectDelete(0, "TNT_Warning_Label");
   ObjectDelete(0, "TNT_Warning_BG");
   ObjectDelete(0, "TNT_Warning_Text");
   ObjectDelete(0, "GSN_Sync_Warning_BG");
   ObjectDelete(0, "GSN_Sync_Warning_Label");
   ObjectDelete(0, "GSN_Sync_Warning_Close");
   ObjectDelete(0, "GSN_Warning_Label");

   for(int i = ObjectsTotal(0, 0, -1) - 1; i >= 0; i--)
   {
      string name = ObjectName(0, i, 0, -1);
      if(StringFind(name, "GSN_Sync_Warning") == 0 || StringFind(name, "TNT_Warning") == 0)
      {
         ObjectDelete(0, name);
      }
   }
   ChartRedraw(0);
}

//--- Flag to ensure Alert pops up strictly ONCE per failure session
static bool   g_TradeSync_HasAlerted = false;
static string g_LastAlertMessage = "";
static uint   g_LastAlertTick = 0;

//+------------------------------------------------------------------+
//| Reset Alert Cooldown (allows immediate alert on user action)     |
//+------------------------------------------------------------------+
void TradeSync_ResetAlertCooldown()
{
   g_TradeSync_HasAlerted = false;
   g_LastAlertMessage = "";
   g_LastAlertTick = 0;
}

//+------------------------------------------------------------------+
//| Format HTTP Error to Generic Description                         |
//+------------------------------------------------------------------+
string TradeSync_FormatHttpErrorDescription(int httpCode)
{
   return "Connection failed. Please check server.";
}

//+------------------------------------------------------------------+
//| Trigger Trade Sync Alert popup (Alert strictly ONCE only)        |
//+------------------------------------------------------------------+
void TradeSync_TriggerAlert(const string text, bool forceImmediate = false)
{
   if(text == "") return;
   // Strictly alert ONCE per failure session unless forceImmediate is explicitly requested (e.g. user clicks CONNECT)
   if(!g_TradeSync_HasAlerted || forceImmediate)
   {
      g_TradeSync_HasAlerted = true;
      g_LastAlertMessage = text;
      g_LastAlertTick = GetTickCount();

      string alertMsg = text;
      StringReplace(alertMsg, "[Trade Sync]", "");
      StringReplace(alertMsg, "Trade Sync: ", "");
      StringReplace(alertMsg, "Trade Sync ", "");
      StringTrimLeft(alertMsg);
      StringTrimRight(alertMsg);

      if(StringFind(alertMsg, "[Trade Manager]") != 0)
         alertMsg = "[Trade Manager] " + alertMsg;

      Alert(alertMsg);
   }
}

//+------------------------------------------------------------------+
//| Display Warning: Convert to Alert popup and clean chart banner   |
//+------------------------------------------------------------------+
void ShowChartWarning(const string text, bool triggerAlert = true)
{
   // Always remove persistent banner objects from chart so they don't block the screen
   ClearChartWarning();

   // Update last error state
   g_LastError = text;

   // Convert error notification to native MT5 Alert popup
   if(triggerAlert)
   {
      TradeSync_TriggerAlert(text);
   }

   ClearChartStatus();
   ChartRedraw(0);
}

//+------------------------------------------------------------------+
//| Display Status Badge on Chart                                    |
//+------------------------------------------------------------------+
void ShowChartStatus(const string text, color clr = clrLimeGreen)
{
   // Disabled per user request: Do not draw any status banner on the chart
   ClearChartStatus();
   ClearChartWarning();
   ChartRedraw(0);
}

//+------------------------------------------------------------------+
//| Disable Trade Management Features                                |
//+------------------------------------------------------------------+
void DisableTradeManagement()
{
   g_TradeManagementActive = false;
   g_IsVipActive = false;
   static datetime lastDisableLog = 0;
   if(TimeCurrent() - lastDisableLog >= 30)
   {
      Print("[Trade Sync] Trade management features DISABLED (Balance < $200 USD required).");
      lastDisableLog = TimeCurrent();
   }
}

//+------------------------------------------------------------------+
//| Enable Trade Management Features                                 |
//+------------------------------------------------------------------+
void EnableTradeManagement()
{
   g_TradeManagementActive = true;
   g_IsBalanceEligible = true;
   static datetime lastEnableLog = 0;
   if(TimeCurrent() - lastEnableLog >= 30)
   {
      Print("[Trade Sync] Trade management features ENABLED.");
      lastEnableLog = TimeCurrent();
   }
}

//+------------------------------------------------------------------+
//| Check if current account is a Cent account                       |
//+------------------------------------------------------------------+
bool IsCentAccount(const string curUpper, const string srvUpper)
{
   return (curUpper == "USC" || curUpper == "EUX" || curUpper == "GBX" || 
           curUpper == "EUC" || curUpper == "GBC" || curUpper == "CHX" || curUpper == "JYX" ||
           StringFind(curUpper, "CENT") >= 0 || StringFind(srvUpper, "CENT") >= 0);
}

//+------------------------------------------------------------------+
//| Get appropriate suffix for a Cent account                        |
//+------------------------------------------------------------------+
string GetCentCurrencySuffix(const string curUpper, const string srvUpper)
{
   if(curUpper == "EUX" || curUpper == "EUC" || curUpper == "EURCENT" || (curUpper == "EUR" && StringFind(srvUpper, "CENT") >= 0))
      return (curUpper == "EUC") ? " EUC" : " EUX";
   if(curUpper == "GBX" || curUpper == "GBC" || curUpper == "GBPCENT" || (curUpper == "GBP" && StringFind(srvUpper, "CENT") >= 0))
      return (curUpper == "GBC") ? " GBC" : " GBX";
   if(curUpper == "CHX" || (curUpper == "CHF" && StringFind(srvUpper, "CENT") >= 0)) return " CHX";
   if(curUpper == "JYX" || (curUpper == "JPY" && StringFind(srvUpper, "CENT") >= 0)) return " JYX";
   if(curUpper != "USD" && curUpper != "USC" && curUpper != "CENT" && curUpper != "USCENT" && curUpper != "")
      return " " + curUpper;
   return " USC";
}

//+------------------------------------------------------------------+
//| Check minimum balance $200 USD (Client-side Fast Check)          |
//+------------------------------------------------------------------+
bool CheckMinBalanceLocal()
{
   // Demo, Contest, Strategy Tester, or unauthenticated terminal startup do not fail $200 requirement
   if(MQLInfoInteger(MQL_TESTER) || AccountInfoInteger(ACCOUNT_LOGIN) <= 0)
   {
      g_IsBalanceEligible = true;
      if(!g_TradeManagementActive)
      {
         EnableTradeManagement();
      }
      return true;
   }

   ENUM_ACCOUNT_TRADE_MODE tradeMode = (ENUM_ACCOUNT_TRADE_MODE)AccountInfoInteger(ACCOUNT_TRADE_MODE);
   if(tradeMode == ACCOUNT_TRADE_MODE_DEMO || tradeMode == ACCOUNT_TRADE_MODE_CONTEST)
   {
      g_IsBalanceEligible = true;
      if(!g_TradeManagementActive)
      {
         EnableTradeManagement();
      }
      return true;
   }

   double balance = AccountInfoDouble(ACCOUNT_BALANCE);
   string currency = AccountInfoString(ACCOUNT_CURRENCY);
   string server = AccountInfoString(ACCOUNT_SERVER);

   // Normalize Cent/USC account: 20,000 USC = $200 USD
   double effectiveUsd = balance;
   StringToUpper(currency);
   StringToUpper(server);
   if(IsCentAccount(currency, server))
   {
      effectiveUsd = balance / 100.0;
   }

   if(NormalizeDouble(effectiveUsd, 2) < 200.0)
   {
      static datetime lastWarnLog = 0;
      bool stateChanged = g_IsBalanceEligible;
      if(TimeCurrent() - lastWarnLog >= 30)
      {
         PrintFormat("[Trade Sync] WARNING: Current balance $%.2f USD < $200 USD required.", effectiveUsd);
         lastWarnLog = TimeCurrent();
      }
      g_IsBalanceEligible = false;
      ShowChartWarning("Account requires minimum $200 to connect GoldScalperNinja VIP", stateChanged);
      DisableTradeManagement();
      return false;
   }

   g_IsBalanceEligible = true;
   if(!g_TradeManagementActive)
   {
      EnableTradeManagement();
   }
   if(ObjectFind(0, "TNT_Warning_Label") >= 0 && (ObjectFind(0, "GSN_Sync_Status_Label") < 0))
   {
      ClearChartWarning();
   }
   return true;
}

//+------------------------------------------------------------------+
//| Format a double with thousand separators and fixed decimals      |
//+------------------------------------------------------------------+
string FormatDoubleWithCommas(double value, int decimals = 2)
{
   double absVal = MathAbs(value);
   string raw = DoubleToString(absVal, decimals);
   double minThreshold = (decimals > 0) ? MathPow(10, -decimals) : 1.0;
   bool isNeg = (value < 0.0 && NormalizeDouble(absVal, decimals) >= minThreshold);
   int dotPos = StringFind(raw, ".");
   string intPart = (dotPos >= 0) ? StringSubstr(raw, 0, dotPos) : raw;
   string decPart = (dotPos >= 0) ? StringSubstr(raw, dotPos) : "";
   
   int len = StringLen(intPart);
   string res = "";
   int count = 0;
   for(int i = len - 1; i >= 0; i--)
   {
      res = StringSubstr(intPart, i, 1) + res;
      count++;
      if(count % 3 == 0 && i > 0)
      {
         res = "," + res;
      }
   }
   return (isNeg ? "-" : "") + res + decPart;
}

//+------------------------------------------------------------------+
//| Get formatted Account Balance string                             |
//+------------------------------------------------------------------+
string GetSyncAccountBalanceString()
{
   double balance = AccountInfoDouble(ACCOUNT_BALANCE);
   string curUpper = AccountInfoString(ACCOUNT_CURRENCY);
   StringToUpper(curUpper);
   string srvUpper = AccountInfoString(ACCOUNT_SERVER);
   StringToUpper(srvUpper);
   bool isCent = IsCentAccount(curUpper, srvUpper);
   
   double absBal = MathAbs(balance);
   string numStr = FormatDoubleWithCommas(absBal, 2);
   bool isNegative = (balance < 0.0 && NormalizeDouble(absBal, 2) >= 0.01);
   
   if(isCent)
   {
      string centSuffix = GetCentCurrencySuffix(curUpper, srvUpper);
      return (isNegative ? "-" : "") + numStr + centSuffix;
   }
   return (isNegative ? "-$" : "$") + numStr;
}

//+------------------------------------------------------------------+
//| Get Account Balance display color                                |
//+------------------------------------------------------------------+
color GetSyncAccountBalanceColor()
{
   ENUM_ACCOUNT_TRADE_MODE tradeMode = (ENUM_ACCOUNT_TRADE_MODE)AccountInfoInteger(ACCOUNT_TRADE_MODE);
   if(tradeMode == ACCOUNT_TRADE_MODE_DEMO || tradeMode == ACCOUNT_TRADE_MODE_CONTEST)
   {
      return C'46,204,113'; // Bright green for Demo / Contest
   }
   
   double balance = AccountInfoDouble(ACCOUNT_BALANCE);
   string curUpper = AccountInfoString(ACCOUNT_CURRENCY);
   StringToUpper(curUpper);
   string srvUpper = AccountInfoString(ACCOUNT_SERVER);
   StringToUpper(srvUpper);
   bool isCent = IsCentAccount(curUpper, srvUpper);
   
   double minBal = isCent ? 20000.0 : 200.0;
   if(NormalizeDouble(balance, 2) >= minBal && g_IsBalanceEligible)
   {
      return C'46,204,113'; // Bright green
   }
   return C'255,50,50';     // Warning red
}

//+------------------------------------------------------------------+
//| Update Sync Balance Display                                      |
//+------------------------------------------------------------------+
void UpdateSyncBalanceDisplay()
{
   if(ObjectFind(0, "Sync_BalanceVal") < 0 && ObjectFind(0, "Sync_ModeVal") < 0) return;

   string balStr = GetSyncAccountBalanceString();
   color balClr = GetSyncAccountBalanceColor();

   if(ObjectFind(0, "Sync_BalanceVal") >= 0)
   {
      ObjectSetString(0, "Sync_BalanceVal", OBJPROP_TEXT, balStr);
      ObjectSetInteger(0, "Sync_BalanceVal", OBJPROP_COLOR, balClr);
   }
   if(ObjectFind(0, "Sync_ModeVal") >= 0)
   {
      ObjectSetString(0, "Sync_ModeVal", OBJPROP_TEXT, balStr);
      ObjectSetInteger(0, "Sync_ModeVal", OBJPROP_COLOR, balClr);
   }

   // Maintain Sync_StatusVal coherence if balance eligibility transitioned
   if(ObjectFind(0, "Sync_StatusVal") >= 0)
   {
      if(!g_IsBalanceEligible)
      {
         ObjectSetString(0, "Sync_StatusVal", OBJPROP_TEXT, "LOW BALANCE");
         ObjectSetInteger(0, "Sync_StatusVal", OBJPROP_COLOR, C'255,50,50');
      }
      else if(ObjectGetString(0, "Sync_StatusVal", OBJPROP_TEXT) == "LOW BALANCE")
      {
         string status_text = g_IsConnected ? "CONNECTED" : (g_TradeSync_ApiKey != "" ? "READY" : "NO API KEY");
         color status_color = g_IsConnected ? C'0,200,0' : C'255,193,7';
         ObjectSetString(0, "Sync_StatusVal", OBJPROP_TEXT, status_text);
         ObjectSetInteger(0, "Sync_StatusVal", OBJPROP_COLOR, status_color);
      }
   }

   ChartRedraw(0);
}

// Backward compatibility aliases
string GetSyncAccountModeString() { return GetSyncAccountBalanceString(); }
color GetSyncAccountModeColor()   { return GetSyncAccountBalanceColor(); }

//+------------------------------------------------------------------+
//| Handle HTTP response from Heartbeat API                         |
//+------------------------------------------------------------------+
void HandleHeartbeatResponse(int httpCode, const string &responseBody)
{
   ENUM_ACCOUNT_TRADE_MODE tradeMode = (ENUM_ACCOUNT_TRADE_MODE)AccountInfoInteger(ACCOUNT_TRADE_MODE);
   bool isReal = (tradeMode == ACCOUNT_TRADE_MODE_REAL);

   if(httpCode == 200)
   {
      // Check if response body indicates low balance even on HTTP 200 (Real accounts only)
      if(isReal && (StringFind(responseBody, "BALANCE_TOO_LOW") >= 0 ||
                    StringFind(responseBody, "INSUFFICIENT_BALANCE") >= 0 ||
                    StringFind(responseBody, "\"balanceEligible\":false") >= 0))
      {
         g_IsConnected = false;
         g_IsVipActive = false;
         g_IsBalanceEligible = false;
         ClearChartStatus();
         Print("[Trade Sync] Connection rejected: Account balance below $200 USD required.");
         ShowChartWarning("Account requires minimum $200 to connect GoldScalperNinja VIP");
         DisableTradeManagement();

         g_LastError = "Balance < $200 USD";
         ObjectSetString(0, "Sync_StatusVal", OBJPROP_TEXT, "LOW BALANCE");
         ObjectSetInteger(0, "Sync_StatusVal", OBJPROP_COLOR, C'255,50,50');

         UpdateSyncBalanceDisplay();
         ChartRedraw(0);
         return;
      }

      ClearChartWarning();
      ClearChartStatus();
      g_IsConnected = true;
      g_IsBalanceEligible = true;
      g_IsVipActive = true;
      EnableTradeManagement();
      g_LastError = "";
      TradeSync_ResetAlertCooldown();

      ObjectSetString(0, "Sync_StatusVal", OBJPROP_TEXT, "CONNECTED");
      ObjectSetInteger(0, "Sync_StatusVal", OBJPROP_COLOR, C'0,200,0');

      UpdateSyncBalanceDisplay();

      PrintFormat("[Trade Sync] Heartbeat OK - Account: %s | Balance: %.2f | Connected",
                  g_AccountNumber, AccountInfoDouble(ACCOUNT_BALANCE));
      ChartRedraw(0);
   }
   else if(httpCode == 403)
   {
      g_IsConnected = false;
      g_IsVipActive = false;
      ClearChartStatus();

      if(isReal && (StringFind(responseBody, "BALANCE_TOO_LOW") >= 0 ||
                    StringFind(responseBody, "INSUFFICIENT_BALANCE") >= 0))
      {
         g_IsBalanceEligible = false;
         Print("[Trade Sync] Connection rejected: Account balance below $200 USD required.");
         ShowChartWarning("Account requires minimum $200 to connect GoldScalperNinja VIP");

         g_LastError = "Balance < $200 USD";
         ObjectSetString(0, "Sync_StatusVal", OBJPROP_TEXT, "LOW BALANCE");
         ObjectSetInteger(0, "Sync_StatusVal", OBJPROP_COLOR, C'255,50,50');
      }
      else if(StringFind(responseBody, "ACCOUNT_MISMATCH") >= 0)
      {
         g_LastError = "API Key mismatch";
         ShowChartWarning("Connection rejected (Account mismatch)");
         ObjectSetString(0, "Sync_StatusVal", OBJPROP_TEXT, "OFFLINE");
         ObjectSetInteger(0, "Sync_StatusVal", OBJPROP_COLOR, C'255,50,50');
         Print("[Trade Manager] Connection rejected: Account mismatch! ", responseBody);
      }
      else
      {
         g_LastError = "Forbidden (403)";
         ShowChartWarning("Connection rejected (HTTP 403)");
         ObjectSetString(0, "Sync_StatusVal", OBJPROP_TEXT, "OFFLINE");
         ObjectSetInteger(0, "Sync_StatusVal", OBJPROP_COLOR, C'255,50,50');
         Print("[Trade Manager] Connection rejected (HTTP 403): ", responseBody);
      }
      UpdateSyncBalanceDisplay();
      ChartRedraw(0);
   }
   else if(httpCode == 401)
   {
      g_IsConnected = false;
      g_IsVipActive = false;
      ClearChartStatus();
      g_LastError = "Invalid API Key";
      ShowChartWarning("Invalid API Key (HTTP 401)");
      ObjectSetString(0, "Sync_StatusVal", OBJPROP_TEXT, "OFFLINE");
      ObjectSetInteger(0, "Sync_StatusVal", OBJPROP_COLOR, C'255,50,50');
      Print("[Trade Manager] ERROR 401: Invalid API Key");
      UpdateSyncBalanceDisplay();
      ChartRedraw(0);
   }
   else if(httpCode == -1)
   {
      int error = GetLastError();
      g_IsConnected = false;
      g_IsVipActive = false;
      ClearChartStatus();
      g_LastError = ErrorDescription(error);
      ObjectSetString(0, "Sync_StatusVal", OBJPROP_TEXT, "OFFLINE");
      ObjectSetInteger(0, "Sync_StatusVal", OBJPROP_COLOR, C'255,50,50');
      if(error == 4014) {
         string warnMsg = "Error 4014: URL not allowed!\nPlease open MT5 -> Tools -> Options -> Experts tab\nand add: " + g_BaseUrl + "/";
         ShowChartWarning(warnMsg);
         PrintFormat("[Trade Manager] Error 4014: URL not allowed! Please open MT5 -> Tools -> Options -> Experts -> check 'Allow WebRequest for listed URL' and add: %s/", g_BaseUrl);
      } else {
         ShowChartWarning("Connection failed. Please check server.");
      }
      PrintFormat("[Trade Manager] Heartbeat failed. Error: %d - %s", error, g_LastError);
      UpdateSyncBalanceDisplay();
      ChartRedraw(0);
   }
   else if(httpCode == 404)
   {
      g_IsConnected = false;
      g_IsVipActive = false;
      ClearChartStatus();
      g_LastError = "Account not found (404)";
      ShowChartWarning("Account #" + g_AccountNumber + " not found on server for this API Key (HTTP 404)");
      ObjectSetString(0, "Sync_StatusVal", OBJPROP_TEXT, "NOT FOUND");
      ObjectSetInteger(0, "Sync_StatusVal", OBJPROP_COLOR, C'255,50,50');
      PrintFormat("[Trade Sync] Heartbeat HTTP 404: Account #%s not found on server: %s", g_AccountNumber, responseBody);
      UpdateSyncBalanceDisplay();
      ChartRedraw(0);
   }
   else
   {
      g_IsConnected = false;
      g_IsVipActive = false;
      ClearChartStatus();
      string errDesc = TradeSync_FormatHttpErrorDescription(httpCode);
      g_LastError = errDesc;
      ShowChartWarning(errDesc);
      ObjectSetString(0, "Sync_StatusVal", OBJPROP_TEXT, "OFFLINE");
      ObjectSetInteger(0, "Sync_StatusVal", OBJPROP_COLOR, C'255,50,50');
      PrintFormat("[Trade Sync] Heartbeat failed: %s (HTTP %d)", errDesc, httpCode);
      UpdateSyncBalanceDisplay();
      ChartRedraw(0);
   }
}

//+------------------------------------------------------------------+
//| Trade Sync API Key Persistent Disk Cache                         |
//+------------------------------------------------------------------+
#define GSN_TRADESYNC_CACHE_FILE "GSN_TradeSync_Cache.ini"

struct STradeSyncIniEntry {
   string key;
   string val;
};

//+------------------------------------------------------------------+
//| Sanitize API Key (strip control chars, whitespace, quotes, etc.) |
//+------------------------------------------------------------------+
string TradeSync_SanitizeApiKey(string rawKey) {
   StringTrimLeft(rawKey);
   StringTrimRight(rawKey);
   StringReplace(rawKey, "\"", "");
   StringReplace(rawKey, "'", "");
   StringReplace(rawKey, "`", "");
   StringReplace(rawKey, " ", "");
   StringReplace(rawKey, "\t", "");
   StringReplace(rawKey, "\r", "");
   StringReplace(rawKey, "\n", "");

   string cleanKey = "";
   int len = StringLen(rawKey);
   if (len > 256) len = 256;
   for (int i = 0; i < len; i++) {
      ushort ch = StringGetCharacter(rawKey, i);
      if (ch >= 33 && ch <= 126 && ch != ';' && ch != '#' && ch != '[' && ch != ']') {
         cleanKey += ShortToString(ch);
      }
   }
   return cleanKey;
}

//+------------------------------------------------------------------+
//| Load Cached Trade Sync API Key from disk                         |
//+------------------------------------------------------------------+
string TradeSync_LoadCachedApiKey(string accountNumber = "") {
   if (accountNumber == "" || accountNumber == "0") {
      long login = AccountInfoInteger(ACCOUNT_LOGIN);
      if (login > 0) accountNumber = IntegerToString(login);
      else if (g_AccountNumber != "" && g_AccountNumber != "0") accountNumber = g_AccountNumber;
      else accountNumber = "";
   }
   StringTrimLeft(accountNumber);
   StringTrimRight(accountNumber);
   if (accountNumber == "0") accountNumber = "";

   string targetAccKey = (accountNumber != "") ? ("API_KEY_" + accountNumber) : "";
   StringToUpper(targetAccKey);

   bool foundAcc = false;
   string foundAccVal = "";
   string foundDefaultVal = "";
   string foundGenericVal = "";

   int fileModes[2] = {
      FILE_READ | FILE_TXT | FILE_ANSI | FILE_SHARE_READ | FILE_SHARE_WRITE,
      FILE_READ | FILE_TXT | FILE_ANSI | FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_COMMON
   };

   for (int m = 0; m < 2; m++) {
      int handle = FileOpen(GSN_TRADESYNC_CACHE_FILE, fileModes[m]);
      if (handle == INVALID_HANDLE) continue;

      while (!FileIsEnding(handle)) {
         string line = FileReadString(handle);
         StringTrimLeft(line);
         StringTrimRight(line);
         if (StringLen(line) == 0 || StringSubstr(line, 0, 1) == "#" || 
             StringSubstr(line, 0, 1) == ";" || StringSubstr(line, 0, 1) == "[")
            continue;

         int eqPos = StringFind(line, "=");
         if (eqPos <= 0) continue;

         string k = StringSubstr(line, 0, eqPos);
         string v = StringSubstr(line, eqPos + 1);
         StringTrimLeft(k);
         StringTrimRight(k);
         v = TradeSync_SanitizeApiKey(v);

         string upperK = k;
         StringToUpper(upperK);

         if (targetAccKey != "" && upperK == targetAccKey) {
            foundAcc = true;
            foundAccVal = v;
         } else if (upperK == "API_KEY_DEFAULT") {
            if (foundDefaultVal == "") foundDefaultVal = v;
         } else if (upperK == "API_KEY" || upperK == "APIKEY" || upperK == "INPSYNCOPTKEY" || upperK == "INPSYNCAPIKEY" || upperK == "TRADESYNC_APIKEY") {
            if (foundGenericVal == "") foundGenericVal = v;
         }
      }
      FileClose(handle);

      if (foundAcc) return foundAccVal;
   }

   if (foundAcc) return foundAccVal;
   if (foundDefaultVal != "") return foundDefaultVal;
   if (foundGenericVal != "") return foundGenericVal;

   return "";
}

//+------------------------------------------------------------------+
//| Save Cached Trade Sync API Key to disk                           |
//+------------------------------------------------------------------+
bool TradeSync_SaveCachedApiKey(string apiKey, string accountNumber = "") {
   apiKey = TradeSync_SanitizeApiKey(apiKey);

   if (accountNumber == "" || accountNumber == "0") {
      long login = AccountInfoInteger(ACCOUNT_LOGIN);
      if (login > 0) accountNumber = IntegerToString(login);
      else if (g_AccountNumber != "" && g_AccountNumber != "0") accountNumber = g_AccountNumber;
      else accountNumber = "";
   }
   StringTrimLeft(accountNumber);
   StringTrimRight(accountNumber);
   if (accountNumber == "0") accountNumber = "";

   // Debounce identical saves within 2 seconds to prevent redundant disk I/O on UI events
   static string s_lastSavedKey = "";
   static string s_lastSavedAcc = "";
   static uint s_lastSaveTick = 0;
   if (apiKey == s_lastSavedKey && accountNumber == s_lastSavedAcc && (GetTickCount() - s_lastSaveTick < 2000)) {
      return true;
   }

   string targetAccKey = (accountNumber != "") ? ("API_KEY_" + accountNumber) : "";
   StringToUpper(targetAccKey);

   STradeSyncIniEntry entries[];
   int readModes[2] = {
      FILE_READ | FILE_TXT | FILE_ANSI | FILE_SHARE_READ | FILE_SHARE_WRITE,
      FILE_READ | FILE_TXT | FILE_ANSI | FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_COMMON
   };

   // Load existing entries across storage locations to preserve other accounts
   for (int m = 0; m < 2; m++) {
      int rHandle = FileOpen(GSN_TRADESYNC_CACHE_FILE, readModes[m]);
      if (rHandle != INVALID_HANDLE) {
         while (!FileIsEnding(rHandle)) {
            string line = FileReadString(rHandle);
            StringTrimLeft(line);
            StringTrimRight(line);
            if (StringLen(line) == 0 || StringSubstr(line, 0, 1) == "#" || 
                StringSubstr(line, 0, 1) == ";" || StringSubstr(line, 0, 1) == "[")
               continue;

            int eqPos = StringFind(line, "=");
            if (eqPos <= 0) continue;

            string k = StringSubstr(line, 0, eqPos);
            string v = StringSubstr(line, eqPos + 1);
            StringTrimLeft(k);
            StringTrimRight(k);
            v = TradeSync_SanitizeApiKey(v);

            string upperK = k;
            StringToUpper(upperK);

            bool duplicate = false;
            for (int i = 0; i < ArraySize(entries); i++) {
               string existingUpper = entries[i].key;
               StringToUpper(existingUpper);
               if (existingUpper == upperK) {
                  duplicate = true;
                  if (entries[i].val == "" && v != "") {
                     entries[i].val = v;
                  }
                  break;
               }
            }
            if (!duplicate) {
               int sz = ArraySize(entries);
               ArrayResize(entries, sz + 1);
               entries[sz].key = k;
               entries[sz].val = v;
            }
         }
         FileClose(rHandle);
      }
   }

   // Update or add entries
   bool accKeyUpdated = false;
   bool defaultUpdated = false;
   bool genericUpdated = false;

   for (int i = 0; i < ArraySize(entries); i++) {
      string upperK = entries[i].key;
      StringToUpper(upperK);

      if (targetAccKey != "" && upperK == targetAccKey) {
         entries[i].val = apiKey;
         accKeyUpdated = true;
      } else if (upperK == "API_KEY_DEFAULT") {
         if (apiKey != "" || accountNumber == "") {
            entries[i].val = apiKey;
         }
         defaultUpdated = true;
      } else if (upperK == "API_KEY") {
         if (apiKey != "" || accountNumber == "") {
            entries[i].val = apiKey;
         }
         genericUpdated = true;
      }
   }

   if (targetAccKey != "" && !accKeyUpdated) {
      int sz = ArraySize(entries);
      ArrayResize(entries, sz + 1);
      entries[sz].key = targetAccKey;
      entries[sz].val = apiKey;
   }

   // If an account key was cleared, determine the best fallback key from remaining accounts
   string fallbackValidKey = "";
   if (accountNumber != "" && apiKey == "") {
      for (int i = 0; i < ArraySize(entries); i++) {
         string upperK = entries[i].key;
         StringToUpper(upperK);
         if (upperK != "API_KEY_DEFAULT" && upperK != "API_KEY" && entries[i].val != "") {
            fallbackValidKey = entries[i].val;
            break;
         }
      }
      for (int i = 0; i < ArraySize(entries); i++) {
         string upperK = entries[i].key;
         StringToUpper(upperK);
         if (upperK == "API_KEY_DEFAULT" || upperK == "API_KEY") {
            entries[i].val = fallbackValidKey;
         }
      }
   }

   if (!defaultUpdated && (apiKey != "" || accountNumber == "" || fallbackValidKey != "")) {
      int sz = ArraySize(entries);
      ArrayResize(entries, sz + 1);
      entries[sz].key = "API_KEY_DEFAULT";
      entries[sz].val = (apiKey != "" || accountNumber == "") ? apiKey : fallbackValidKey;
   }
   if (!genericUpdated && (apiKey != "" || accountNumber == "" || fallbackValidKey != "")) {
      int sz = ArraySize(entries);
      ArrayResize(entries, sz + 1);
      entries[sz].key = "API_KEY";
      entries[sz].val = (apiKey != "" || accountNumber == "") ? apiKey : fallbackValidKey;
   }

   // Write back to both local storage and common storage with retry logic
   int writeModes[2] = {
      FILE_WRITE | FILE_TXT | FILE_ANSI | FILE_SHARE_READ | FILE_SHARE_WRITE,
      FILE_WRITE | FILE_TXT | FILE_ANSI | FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_COMMON
   };

   bool anySaved = false;
   for (int m = 0; m < 2; m++) {
      int wHandle = INVALID_HANDLE;
      for (int retry = 0; retry < 3; retry++) {
         wHandle = FileOpen(GSN_TRADESYNC_CACHE_FILE, writeModes[m]);
         if (wHandle != INVALID_HANDLE) break;
         Sleep(15);
      }
      if (wHandle != INVALID_HANDLE) {
         FileWriteString(wHandle, "# GoldScalperNinja Trade Sync Configuration Cache\r\n");
         FileWriteString(wHandle, "# Last Updated: " + TimeToString(TimeCurrent(), TIME_DATE|TIME_SECONDS) + "\r\n");
         FileWriteString(wHandle, "[TradeSync]\r\n");
         for (int i = 0; i < ArraySize(entries); i++) {
            if (entries[i].key != "")
               FileWriteString(wHandle, entries[i].key + "=" + entries[i].val + "\r\n");
         }
         FileClose(wHandle);
         anySaved = true;
      }
   }

   if (anySaved) {
      s_lastSavedKey = apiKey;
      s_lastSavedAcc = accountNumber;
      s_lastSaveTick = GetTickCount();
      if (apiKey != "") {
         PrintFormat("[Trade Sync] Cached API Key saved successfully (Account: %s)", accountNumber != "" ? accountNumber : "Default");
      } else {
         PrintFormat("[Trade Sync] Cached API Key cleared (Account: %s)", accountNumber != "" ? accountNumber : "Default");
      }
   } else {
      Print("[Trade Sync] Warning: Failed to save API Key cache to disk");
   }

   return anySaved;
}

//+------------------------------------------------------------------+
//| Clear Cached Trade Sync API Key from disk                        |
//+------------------------------------------------------------------+
bool TradeSync_ClearCachedApiKey(string accountNumber = "") {
   return TradeSync_SaveCachedApiKey("", accountNumber);
}

//+------------------------------------------------------------------+
bool g_IsEngineInitialized = false;

int TradeSync_Init(string apiKey, string apiUrl, string productSlug = "", string eaName = "", string eaVersion = "2.4.0", int heartbeatInterval = 300, int syncDelay = 5) {
  g_IsEngineInitialized = true;
  // Resolve product identity for web telemetry
  TradeSync_ResolveProductIdentity(productSlug, eaName, eaVersion);
  g_HeartbeatInterval = (heartbeatInterval > 0) ? heartbeatInterval : 300;
  g_SyncDelay = (syncDelay >= 0) ? syncDelay : 5;

  // Clear any existing chart warnings and status badges immediately on initialization
  ClearChartWarning();
  ClearChartStatus();

  g_IsConnected = false;
  g_LastHeartbeat = 0;
  g_LastConfigFetch = 0;
  g_SyncOpenTrades = true;
  g_LastError = "";

  long login = AccountInfoInteger(ACCOUNT_LOGIN);
  if (login > 0) g_AccountNumber = IntegerToString(login);
  else g_AccountNumber = "";

  apiKey = TradeSync_SanitizeApiKey(apiKey);

  if (apiKey != "") {
     g_TradeSync_ApiKey = apiKey;
     TradeSync_SaveCachedApiKey(apiKey, g_AccountNumber);
  } else {
     g_TradeSync_ApiKey = TradeSync_LoadCachedApiKey(g_AccountNumber);
  }

  // Trim and normalize apiUrl
  StringTrimLeft(apiUrl);
  StringTrimRight(apiUrl);

  // Automatically replace localhost with 127.0.0.1 to avoid MT5 IPv6 / DNS resolution failure
  StringReplace(apiUrl, "localhost", "127.0.0.1");

  g_TradeSync_ApiUrl = apiUrl;
  g_BaseUrl = g_TradeSync_ApiUrl;
  StringTrimLeft(g_BaseUrl);
  StringTrimRight(g_BaseUrl);

  // Strip trailing slashes
  while (StringLen(g_BaseUrl) > 0 &&
         StringSubstr(g_BaseUrl, StringLen(g_BaseUrl) - 1, 1) == "/") {
    g_BaseUrl = StringSubstr(g_BaseUrl, 0, StringLen(g_BaseUrl) - 1);
  }

  // Strip endpoint subpaths if user configured full endpoint instead of base URL
  if (StringFind(g_BaseUrl, "/api/ea/trades") >= 0) {
    int epIdx = StringFind(g_BaseUrl, "/api/ea/trades");
    g_BaseUrl = StringSubstr(g_BaseUrl, 0, epIdx);
  } else if (StringFind(g_BaseUrl, "/api/ea/heartbeat") >= 0) {
    int epIdx = StringFind(g_BaseUrl, "/api/ea/heartbeat");
    g_BaseUrl = StringSubstr(g_BaseUrl, 0, epIdx);
  }
  while (StringLen(g_BaseUrl) > 0 &&
         StringSubstr(g_BaseUrl, StringLen(g_BaseUrl) - 1, 1) == "/") {
    g_BaseUrl = StringSubstr(g_BaseUrl, 0, StringLen(g_BaseUrl) - 1);
  }

  // Ensure scheme prefix if missing (case-insensitive check)
  if (g_BaseUrl != "") {
    string lowerUrl = g_BaseUrl;
    StringToLower(lowerUrl);
    if (lowerUrl == "http:" || lowerUrl == "https:") {
      g_BaseUrl = "";
    } else {
      if (StringFind(lowerUrl, "http://") != 0 && StringFind(lowerUrl, "https://") != 0) {
        if (StringFind(lowerUrl, "localhost") >= 0 || StringFind(lowerUrl, "127.0.0.1") >= 0) {
          g_BaseUrl = "http://" + g_BaseUrl;
        } else {
          g_BaseUrl = "https://" + g_BaseUrl;
        }
      }
      StringReplace(g_BaseUrl, "localhost", "127.0.0.1");
    }
  }
  g_TradeSync_ApiUrl = g_BaseUrl;

  //--- Store account number for validation
  long curLogin = AccountInfoInteger(ACCOUNT_LOGIN);
  if (curLogin > 0) g_AccountNumber = IntegerToString(curLogin);
  else g_AccountNumber = "";
  g_TradeSync_IsOwner = false;
  if (g_AccountNumber != "") TradeSync_EnsureOwner();

  //--- Step 1: Client-side Fast Check for minimum balance $200 USD
  if(!CheckMinBalanceLocal()) {
    g_IsBalanceEligible = false;
    DisableTradeManagement();
  } else {
    g_IsBalanceEligible = true;
    EnableTradeManagement();
  }

  //--- Initial Sync Check & UI Timer
  if (g_SyncDelay > 0)
    EventSetTimer(1); // 1 second timer for UI and checks

  //--- Initialize history deals baseline to prevent processing pre-existing trades as new
  if (HistorySelect(0, TimeCurrent())) {
    g_LastHistoryTotal = HistoryDealsTotal();
    g_HistoryBaselineInitialized = true;
  }

  if (g_TradeSync_ApiKey == "") {
    Print("[Trade Sync] API Key is empty. Enter key in the Sync panel to connect.");
    return (INIT_SUCCEEDED);
  }

  if (!MQLInfoInteger(MQL_TESTER) && g_BaseUrl != "" && g_TradeSync_IsOwner) {
    FetchEaConfig();
  }

  //--- Show initialization info
  Print("==============================================");
  Print("[Trade Sync] Engine initialized");
  Print("Product: ", g_TradeSync_EaName, " (", g_TradeSync_ProductSlug, ") v", g_TradeSync_EaVersion);
  Print("Account: ", g_AccountNumber);
  Print("Broker: ", AccountInfoString(ACCOUNT_COMPANY));
  Print("Server: ", AccountInfoString(ACCOUNT_SERVER));
  Print("API URL: ", g_BaseUrl);
  Print("API Key: ", StringSubstr(g_TradeSync_ApiKey, 0, 8), "...");
  Print("Balance Check: ", g_IsBalanceEligible ? "ELIGIBLE" : "INSUFFICIENT (<$200 USD)");
  Print("==============================================");

  return (INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void TradeSync_OnDeinit(const int reason) {
  if (!g_IsEngineInitialized) return;
  g_IsEngineInitialized = false;
  TradeSync_ReleaseOwner();
  ClearChartWarning();
  ClearChartStatus();
  EventKillTimer();
  Print("[Trade Sync] Engine stopped. Reason: ", reason);
}

void TradeSync_EnsureAutoInit() {
  if (g_IsEngineInitialized) return;
  string autoUrl = (g_TradeSync_ApiUrl != "") ? g_TradeSync_ApiUrl : "http://127.0.0.1:3500/";
  TradeSync_Init(g_TradeSync_ApiKey, autoUrl, "", "", "2.4.0", g_HeartbeatInterval, g_SyncDelay);
}

//+------------------------------------------------------------------+
//| Update Sync Buttons State                                        |
//+------------------------------------------------------------------+
void UpdateSyncButtonsState() {
   if (ObjectFind(0, "Sync_Popup_BtnToday") < 0) return;
   bool disabled = (g_IsSyncing || (GetTickCount() - g_LastSyncClickTime < 3000));
   
   if (disabled) {
      string buttons[] = {
         "Sync_Popup_BtnToday",
         "Sync_Popup_Btn3Days",
         "Sync_Popup_BtnWeek",
         "Sync_Popup_BtnMonth",
         "Sync_Popup_Btn3Months",
         "Sync_Popup_Btn6Months",
         "Sync_Popup_BtnAll",
         "Sync_Popup_BtnSyncCustom"
      };
      int totalButtons = ArraySize(buttons);
      for(int i = 0; i < totalButtons; i++) {
         ObjectSetInteger(0, buttons[i], OBJPROP_BGCOLOR, C'60,65,70');
         ObjectSetInteger(0, buttons[i], OBJPROP_COLOR, C'150,155,160');
         ObjectSetInteger(0, buttons[i], OBJPROP_BORDER_COLOR, C'60,65,70');
      }
   } else {
      string normButtons[] = {
         "Sync_Popup_BtnToday",
         "Sync_Popup_Btn3Days",
         "Sync_Popup_BtnWeek",
         "Sync_Popup_BtnMonth",
         "Sync_Popup_Btn3Months",
         "Sync_Popup_Btn6Months"
      };
      int totalNorm = ArraySize(normButtons);
      for(int i = 0; i < totalNorm; i++) {
         ObjectSetInteger(0, normButtons[i], OBJPROP_BGCOLOR, C'28,32,40');
         ObjectSetInteger(0, normButtons[i], OBJPROP_COLOR, clrWhite);
         ObjectSetInteger(0, normButtons[i], OBJPROP_BORDER_COLOR, C'28,32,40');
      }
      
      ObjectSetInteger(0, "Sync_Popup_BtnAll", OBJPROP_BGCOLOR, C'45,28,28');
      ObjectSetInteger(0, "Sync_Popup_BtnAll", OBJPROP_COLOR, C'255,180,180');
      ObjectSetInteger(0, "Sync_Popup_BtnAll", OBJPROP_BORDER_COLOR, C'80,45,45');
      
      ObjectSetInteger(0, "Sync_Popup_BtnSyncCustom", OBJPROP_BGCOLOR, C'46,125,50');
      ObjectSetInteger(0, "Sync_Popup_BtnSyncCustom", OBJPROP_COLOR, clrWhite);
      ObjectSetInteger(0, "Sync_Popup_BtnSyncCustom", OBJPROP_BORDER_COLOR, C'46,125,50');
   }
   ChartRedraw(0);
}

//+------------------------------------------------------------------+
//| Timer function                                                   |
//+------------------------------------------------------------------+
void TradeSync_OnTimer() {
  g_LastTimerRun = TimeCurrent();
  UpdateSyncButtonsState();

  // Dynamic Account Synchronization & Live Account Switch Detection
  long curLogin = AccountInfoInteger(ACCOUNT_LOGIN);
  string curLoginStr = (curLogin > 0) ? IntegerToString(curLogin) : "";

  if (curLoginStr != "" && curLoginStr != g_AccountNumber) {
     bool isSwitch = (g_AccountNumber != "" && g_AccountNumber != "0");
     if (isSwitch) {
        TradeSync_ReleaseOwner();
        g_IsConnected = false;
        g_LastHeartbeat = 0;
        g_LastConfigFetch = 0;
        g_SyncOpenTrades = true;
     }
     g_AccountNumber = curLoginStr;
     TradeSync_EnsureOwner();
     if (HistorySelect(0, TimeCurrent())) {
        g_LastHistoryTotal = HistoryDealsTotal();
        g_HistoryBaselineInitialized = true;
     }

     // Auto-reload API Key for this account from disk cache
     string recoveredKey = TradeSync_LoadCachedApiKey(g_AccountNumber);
     g_TradeSync_ApiKey = recoveredKey;
     if (recoveredKey != "") {
        PrintFormat("[Trade Sync] API Key restored from disk cache (Account: %s)", g_AccountNumber);
     } else {
        PrintFormat("[Trade Sync] No cached API Key found for Account: %s", g_AccountNumber);
     }
     if (ObjectFind(0, "Sync_Edit_ApiKey") >= 0) {
        ObjectSetString(0, "Sync_Edit_ApiKey", OBJPROP_TEXT, g_TradeSync_ApiKey);
     }
     if (ObjectFind(0, "Sync_StatusVal") >= 0 && !g_IsConnected) {
        if (g_TradeSync_ApiKey != "") {
           ObjectSetString(0, "Sync_StatusVal", OBJPROP_TEXT, "READY");
           ObjectSetInteger(0, "Sync_StatusVal", OBJPROP_COLOR, C'255,193,7');
        } else {
           ObjectSetString(0, "Sync_StatusVal", OBJPROP_TEXT, "NO API KEY");
           ObjectSetInteger(0, "Sync_StatusVal", OBJPROP_COLOR, C'255,193,7');
        }
     }
     if (isSwitch) {
        CheckMinBalanceLocal();
        UpdateSyncBalanceDisplay();
     }
     ChartRedraw(0);
  }
  else if (g_TradeSync_ApiKey == "" && g_AccountNumber != "") {
     string recoveredKey = TradeSync_LoadCachedApiKey(g_AccountNumber);
     if (recoveredKey != "") {
        g_TradeSync_ApiKey = recoveredKey;
        PrintFormat("[Trade Sync] API Key restored from disk cache (Account: %s)", g_AccountNumber);
        if (ObjectFind(0, "Sync_Edit_ApiKey") >= 0) {
           ObjectSetString(0, "Sync_Edit_ApiKey", OBJPROP_TEXT, g_TradeSync_ApiKey);
        }
        if (ObjectFind(0, "Sync_StatusVal") >= 0 && !g_IsConnected) {
           ObjectSetString(0, "Sync_StatusVal", OBJPROP_TEXT, "READY");
           ObjectSetInteger(0, "Sync_StatusVal", OBJPROP_COLOR, C'255,193,7');
        }
        ChartRedraw(0);
     }
  }

  // --- Update Sync Progress Display ---
  string progress = "";
  color progressColor = C'120,140,160';

  if (g_IsSyncing) {
     progress = "SYNCING... " + IntegerToString(g_SyncIndex) + " / " + IntegerToString(g_SyncTotal);
     progressColor = clrYellow;
  } else {
     if (g_SyncResultMsg != "" && (TimeCurrent() - g_SyncResultTime < 5)) {
        progress = g_SyncResultMsg;
        if (StringFind(g_SyncResultMsg, "COMPLETE") >= 0 || StringFind(g_SyncResultMsg, "SYNCED") >= 0) {
           progressColor = clrLime;
        } else if (StringFind(g_SyncResultMsg, "ERROR") >= 0 || StringFind(g_SyncResultMsg, "RATE LIMIT") >= 0 || StringFind(g_SyncResultMsg, "FAIL") >= 0) {
           progressColor = clrRed;
        } else {
           progressColor = C'120,140,160';
        }
     } else {
        progress = "READY";
        progressColor = C'120,140,160';
        if (g_SyncResultMsg != "") g_SyncResultMsg = ""; // Clear after 5 seconds
     }
  }

  if(ObjectFind(0, "Sync_ProgressVal") >= 0)
  {
     ObjectSetString(0, "Sync_ProgressVal", OBJPROP_TEXT, progress);
     ObjectSetInteger(0, "Sync_ProgressVal", OBJPROP_COLOR, progressColor);
  }

  if(ObjectFind(0, "Sync_LastSyncVal") >= 0)
  {
     if(g_IsSyncing)
     {
        ObjectSetString(0, "Sync_LastSyncVal", OBJPROP_TEXT, progress);
        ObjectSetInteger(0, "Sync_LastSyncVal", OBJPROP_COLOR, progressColor);
     }
     else if(g_SyncResultMsg != "" && (TimeCurrent() - g_SyncResultTime < 5))
     {
        ObjectSetString(0, "Sync_LastSyncVal", OBJPROP_TEXT, g_SyncResultMsg);
        ObjectSetInteger(0, "Sync_LastSyncVal", OBJPROP_COLOR, progressColor);
     }
     else
     {
        string lastSyncDisp = (g_LastSyncStatus == "" || g_LastSyncStatus == "WAIT" || g_LastSyncStatus == "Not synced yet") 
                              ? ("WAIT (" + IntegerToString(g_TotalSynced) + " Deals)") 
                              : (g_LastSyncStatus + " (" + IntegerToString(g_TotalSynced) + " Deals)");
        ObjectSetString(0, "Sync_LastSyncVal", OBJPROP_TEXT, lastSyncDisp);
        ObjectSetInteger(0, "Sync_LastSyncVal", OBJPROP_COLOR, clrWhite);
     }
  }
  // Periodic local balance check & UI update on timer (catches deposits/withdrawals/drawdown changes)
  static double s_lastTimerBalance = EMPTY_VALUE;
  double curTimerBal = AccountInfoDouble(ACCOUNT_BALANCE);
  if(s_lastTimerBalance == EMPTY_VALUE || MathAbs(curTimerBal - s_lastTimerBalance) > 0.001)
  {
     s_lastTimerBalance = curTimerBal;
     CheckMinBalanceLocal();
     UpdateSyncBalanceDisplay();
  }

  if (TimeCurrent() < g_NextAllowedSyncTime) return; // Exponential backoff
  if (TimeCurrent() < g_RateLimitUntil) return; // Rate limit cooldown

  if (!TradeSync_EnsureOwner()) {
    g_IsConnected = false;
    g_LastSyncStatus = "WAIT";
    ObjectSetString(0, "Sync_StatusVal", OBJPROP_TEXT, "WAIT");
    ObjectSetInteger(0, "Sync_StatusVal", OBJPROP_COLOR, C'255,193,7');
    string waitDisp = "WAIT (" + IntegerToString(g_TotalSynced) + " Deals)";
    if(ObjectFind(0, "Sync_LastSyncVal") >= 0) ObjectSetString(0, "Sync_LastSyncVal", OBJPROP_TEXT, waitDisp);
    return;
  }

  // 1. Update pending queue count UI
  int pendingSize = ArraySize(g_FailedTickets);
  if(ObjectFind(0, "Sync_PendingVal") >= 0) {
     ObjectSetString(0, "Sync_PendingVal", OBJPROP_TEXT, IntegerToString(pendingSize));
  }

  // 2. Process background batch if active (User manually initiated Sync)
  if (g_IsSyncing) {
     ProcessSyncBatch();
     return; // Skip other checks while busy syncing
  }

  // 3. Initial Auto-Connect & Periodic Heartbeat (runs on startup when API key is configured, and every g_HeartbeatInterval)
  if (!MQLInfoInteger(MQL_TESTER) && g_TradeSync_ApiKey != "" && g_BaseUrl != "" && g_IsBalanceEligible &&
      (g_LastHeartbeat == 0 || (TimeCurrent() - g_LastHeartbeat >= g_HeartbeatInterval))) {
     SendHeartbeat(false);
  }

  // CONNECTION GUARD: Do not attempt trade syncing if server is not CONNECTED
  if (!g_IsConnected) return;

  // 3b. Fetch /api/ea/config on initial connect and periodically (every 15 minutes)
  if (!MQLInfoInteger(MQL_TESTER) && g_TradeSync_ApiKey != "" && g_BaseUrl != "" &&
      (g_LastConfigFetch == 0 || (TimeCurrent() - g_LastConfigFetch >= g_ConfigRefreshInterval))) {
     FetchEaConfig();
  }

  // 4. Process real-time trades if connected (via OnTradeTransaction flag OR periodic g_SyncDelay check)
  int checkInterval = (g_SyncDelay > 0) ? g_SyncDelay : 5;
  if (g_CheckTradesNow || (TimeCurrent() - g_LastTradeCheck >= checkInterval)) {
     g_CheckTradesNow = false;
     g_LastTradeCheck = TimeCurrent();
     CheckNewTrades();
  }

  // 5. Process failed real-time trades from queue if connected
  if (pendingSize > 0) {
     Print("Retrying ", pendingSize, " failed syncs...");
     PrepareBackgroundSync(g_FailedTickets);
     ArrayResize(g_FailedTickets, 0); // Clear queue
  }

}

//+------------------------------------------------------------------+
//| Helper: Extract JSON Value (Simple)                              |
//+------------------------------------------------------------------+
string ExtractJsonValue(string json, string key) {
  string pattern = "\"" + key + "\":\"";
  int start = StringFind(json, pattern);
  if (start < 0)
    return "";

  start += StringLen(pattern);
  int end = StringFind(json, "\"", start);
  if (end < 0)
    return "";

  return StringSubstr(json, start, end - start);
}

//+------------------------------------------------------------------+
//| Helper: Extract JSON Integer Value                               |
//+------------------------------------------------------------------+
int ExtractJsonInt(string json, string key, int defaultVal) {
  // Match "key":123 or "key": 123
  string pattern = "\"" + key + "\":";
  int start = StringFind(json, pattern);
  if (start < 0)
    return defaultVal;

  start += StringLen(pattern);

  // Skip whitespace
  while (start < StringLen(json) && StringSubstr(json, start, 1) == " ")
    start++;

  // Extract number
  string numStr = "";
  for (int i = start; i < StringLen(json); i++) {
    string ch = StringSubstr(json, i, 1);
    if (ch >= "0" && ch <= "9")
      numStr += ch;
    else
      break;
  }

  if (numStr == "")
    return defaultVal;

  return (int)StringToInteger(numStr);
}

//+------------------------------------------------------------------+
//| Helper: Extract JSON Boolean Value                               |
//+------------------------------------------------------------------+
bool ExtractJsonBool(string json, string key, bool defaultVal) {
  string pattern = "\"" + key + "\":";
  int start = StringFind(json, pattern);
  if (start < 0)
    return defaultVal;

  start += StringLen(pattern);
  while (start < StringLen(json) && StringSubstr(json, start, 1) == " ")
    start++;

  if (StringSubstr(json, start, 4) == "true")
    return true;
  if (StringSubstr(json, start, 5) == "false")
    return false;

  return defaultVal;
}

//+------------------------------------------------------------------+
//| Fetch remote EA configuration (/api/ea/config)                   |
//+------------------------------------------------------------------+
void FetchEaConfig() {
  if (g_TradeSync_ApiKey == "" || g_BaseUrl == "") return;
  g_LastConfigFetch = TimeCurrent();

  string accStr = g_AccountNumber;
  if (accStr == "" || accStr == "0") {
    long login = AccountInfoInteger(ACCOUNT_LOGIN);
    if (login > 0) accStr = IntegerToString(login);
  }

  string url = g_BaseUrl + "/api/ea/config";
  if (accStr != "" && accStr != "0") {
    url += "?accountNumber=" + accStr;
  }

  string headers = "Content-Type: application/json\r\n" +
                   "X-Sync-Key: " + g_TradeSync_ApiKey + "\r\n" +
                   "X-API-Key: " + g_TradeSync_ApiKey + "\r\n" +
                   "X-Account-Number: " + accStr + "\r\n" +
                   "X-Broker: " + AccountInfoString(ACCOUNT_COMPANY) + "\r\n" +
                   "X-Server: " + AccountInfoString(ACCOUNT_SERVER) + "\r\n";

  char emptyData[];
  char resultData[];
  string resultHeaders;
  ArrayResize(emptyData, 0);

  ResetLastError();
  int cfgTimeout = (StringFind(url, "localhost") >= 0 || StringFind(url, "127.0.0.1") >= 0) ? 1000 : 2500;
  int res = WebRequest("GET", url, headers, cfgTimeout, emptyData, resultData, resultHeaders);
  if (res == 200 && ArraySize(resultData) > 0) {
    string response = CharArrayToString(resultData, 0, WHOLE_ARRAY, CP_UTF8);
    g_SyncOpenTrades = ExtractJsonBool(response, "syncOpenTrades", g_SyncOpenTrades);
    int remoteHb = ExtractJsonInt(response, "heartbeatInterval", g_HeartbeatInterval);
    if (remoteHb >= 30) g_HeartbeatInterval = remoteHb;
    PrintFormat("[Trade Sync] Config loaded: syncOpenTrades=%s, heartbeatInterval=%d",
                g_SyncOpenTrades ? "true" : "false", g_HeartbeatInterval);
  }
}

void SyncPeriodAndNotify(int days, string periodName) {
  if (!g_IsConnected) {
    if (!g_IsBalanceEligible) {
       g_SyncResultMsg = "MIN $200 REQUIRED";
    } else {
       g_SyncResultMsg = "NOT CONNECTED";
    }
    g_SyncResultTime = TimeCurrent();
    if(ObjectFind(0, "Sync_ProgressVal") >= 0)
    {
       ObjectSetString(0, "Sync_ProgressVal", OBJPROP_TEXT, g_SyncResultMsg);
       ObjectSetInteger(0, "Sync_ProgressVal", OBJPROP_COLOR, clrRed);
    }
    if(ObjectFind(0, "Sync_LastSyncVal") >= 0)
    {
       ObjectSetString(0, "Sync_LastSyncVal", OBJPROP_TEXT, g_SyncResultMsg);
       ObjectSetInteger(0, "Sync_LastSyncVal", OBJPROP_COLOR, clrRed);
    }
    ChartRedraw(0);
    return;
  }

  //--- Check rate limit before syncing
  if (g_RateLimitUntil > TimeCurrent()) {
    int remaining = (int)(g_RateLimitUntil - TimeCurrent());
    g_SyncResultMsg = "RATE LIMIT: Wait " + IntegerToString(remaining) + "s";
    g_SyncResultTime = TimeCurrent();
    if(ObjectFind(0, "Sync_ProgressVal") >= 0)
    {
       ObjectSetString(0, "Sync_ProgressVal", OBJPROP_TEXT, g_SyncResultMsg);
       ObjectSetInteger(0, "Sync_ProgressVal", OBJPROP_COLOR, clrRed);
    }
    if(ObjectFind(0, "Sync_LastSyncVal") >= 0)
    {
       ObjectSetString(0, "Sync_LastSyncVal", OBJPROP_TEXT, g_SyncResultMsg);
       ObjectSetInteger(0, "Sync_LastSyncVal", OBJPROP_COLOR, clrRed);
    }
    ChartRedraw(0);
    return;
  }

  if(ObjectFind(0, "Sync_ProgressVal") >= 0)
  {
     ObjectSetString(0, "Sync_ProgressVal", OBJPROP_TEXT, "SYNCING...");
     ObjectSetInteger(0, "Sync_ProgressVal", OBJPROP_COLOR, clrYellow);
  }
  if(ObjectFind(0, "Sync_LastSyncVal") >= 0)
  {
     ObjectSetString(0, "Sync_LastSyncVal", OBJPROP_TEXT, "SYNCING...");
     ObjectSetInteger(0, "Sync_LastSyncVal", OBJPROP_COLOR, clrYellow);
  }
  ChartRedraw(0);
  Sleep(50);

  Print("Syncing ", periodName, " (", days, " days)...");
  g_LastError = "";

  int syncedCount = 0;
  if (periodName == "Today") {
    // Broker's today: 00:00:00 to 23:59:59
    datetime now = TimeCurrent();
    datetime todayStart = StringToTime(TimeToString(now, TIME_DATE));
    datetime todayEnd = todayStart + 24 * 60 * 60 - 1;
    Print("Syncing today (broker time): ", TimeToString(todayStart), " -> ",
          TimeToString(todayEnd));
    syncedCount = SyncDateRange(todayStart, todayEnd);
  } else {
    syncedCount = SyncRecentTrades(days);
  }
  

  if (syncedCount == 0) {
    g_SyncResultMsg = "NO TRADES TO SYNC";
    g_SyncResultTime = TimeCurrent();
  } else if (syncedCount < 0) {
    g_SyncResultMsg = "ERROR: " + g_LastError;
    g_SyncResultTime = TimeCurrent();
  } else {
    g_SyncResultMsg = "SYNCED " + IntegerToString(syncedCount) + " TRADES";
    g_SyncResultTime = TimeCurrent();
  }
}

//+------------------------------------------------------------------+
//| Sync trades within a date range                                  |
//+------------------------------------------------------------------+
int SyncDateRange(datetime fromDate, datetime toDate) {
  if (!g_IsConnected || !g_IsBalanceEligible) {
    g_LastError = !g_IsBalanceEligible ? "Balance < $200 USD required" : "Not connected to server";
    Print("[Trade Sync] Sync aborted: ", g_LastError);
    return -1;
  }
  if (toDate > 0 && toDate >= fromDate) {
    MqlDateTime dtTo;
    TimeToStruct(toDate, dtTo);
    if (dtTo.hour == 0 && dtTo.min == 0 && dtTo.sec == 0) {
      toDate += 24 * 60 * 60 - 1;
    }
  }
  Print("Selecting history from ", TimeToString(fromDate), " to ",
        TimeToString(toDate));

  if (!HistorySelect(fromDate, toDate)) {
    Print("Failed to select history for date range");
    g_LastError = "Failed to select history";
    return -1;
  }

  int total = HistoryDealsTotal();
  Print("Found ", total, " total deals in date range");

  //--- PASS 1: Collect unique closing deal tickets (deduplicated by Position ID)
  ulong closingTickets[];
  long closingPositionIds[];

  ArrayResize(closingTickets, 0);
  ArrayResize(closingPositionIds, 0);

  int entryInCount = 0;
  int entryOutCount = 0;
  int entryInOutCount = 0;
  int entryOtherCount = 0;

  for (int i = 0; i < total; i++) {
    ulong ticket = HistoryDealGetTicket(i);
    if (ticket > 0) {
      ENUM_DEAL_ENTRY entry =
          (ENUM_DEAL_ENTRY)HistoryDealGetInteger(ticket, DEAL_ENTRY);

      // Count entry types for debugging
      if (entry == DEAL_ENTRY_IN)
        entryInCount++;
      else if (entry == DEAL_ENTRY_OUT || entry == DEAL_ENTRY_OUT_BY)
        entryOutCount++;
      else if (entry == DEAL_ENTRY_INOUT)
        entryInOutCount++;
      else
        entryOtherCount++;

      if (entry == DEAL_ENTRY_OUT || entry == DEAL_ENTRY_INOUT || entry == DEAL_ENTRY_OUT_BY) {
        long posId = HistoryDealGetInteger(ticket, DEAL_POSITION_ID);
        if (posId <= 0) continue;
        int existingIdx = -1;
        for (int k = 0; k < ArraySize(closingPositionIds); k++) {
          if (closingPositionIds[k] == posId) {
            existingIdx = k;
            break;
          }
        }

        if (existingIdx >= 0) {
          // Keep the latest exit deal ticket for the closing details (latest deal time, tiebreak ticket)
          datetime newTime = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);
          datetime oldTime = (datetime)HistoryDealGetInteger(closingTickets[existingIdx], DEAL_TIME);
          if (newTime > oldTime || (newTime == oldTime && ticket > closingTickets[existingIdx])) {
            closingTickets[existingIdx] = ticket;
          }
        } else {
          int idx = ArraySize(closingTickets);
          ArrayResize(closingTickets, idx + 1);
          ArrayResize(closingPositionIds, idx + 1);
          closingTickets[idx] = ticket;
          closingPositionIds[idx] = posId;
        }
      }
    }
  }

  // Debug: Show entry type distribution
  Print("Entry type breakdown: IN=", entryInCount, " OUT=", entryOutCount,
        " INOUT=", entryInOutCount, " OTHER=", entryOtherCount);

  int closingCount = ArraySize(closingTickets);
  Print("Collected ", closingCount, " unique closing positions for processing");

  //--- PASS 2: Now process each closing position using BuildTradeJson
  string tradesJson = "[";
  bool first = true;
  int syncedCount = 0;

  for (int i = 0; i < closingCount; i++) {
    string tradeObj = BuildTradeJson(closingTickets[i]);
    if (tradeObj == "") continue;

    if (!first) tradesJson += ",";
    first = false;
    tradesJson += tradeObj;
    syncedCount++;
  }

   //--- Inject Active Positions (with opening deal commission) when syncOpenTrades is enabled
   if (g_SyncOpenTrades) {
     for(int i = 0; i < PositionsTotal(); i++) {
         ulong posTicket = PositionGetTicket(i);
         if(posTicket > 0) {
             long posId = PositionGetInteger(POSITION_IDENTIFIER);
             // Skip active position if it was already included in closing positions to prevent duplicate ticket collision
             bool alreadyIncluded = false;
             for(int k = 0; k < ArraySize(closingPositionIds); k++) {
                 if(closingPositionIds[k] == posId) {
                     alreadyIncluded = true;
                     break;
                 }
             }
             if(alreadyIncluded) continue;

             string sym = PositionGetString(POSITION_SYMBOL);
             int tType = (PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY) ? 0 : 1;
             double vol = PositionGetDouble(POSITION_VOLUME);
             double opPrice = PositionGetDouble(POSITION_PRICE_OPEN);
             datetime opTime = (datetime)PositionGetInteger(POSITION_TIME);
             double sl = PositionGetDouble(POSITION_SL);
             double tp = PositionGetDouble(POSITION_TP);
             double currProfit = PositionGetDouble(POSITION_PROFIT);
             double currSwap = PositionGetDouble(POSITION_SWAP);

             // Extract opening commission and initial entry volume for active position (2-Tier Fallback)
             double activeComm = 0;
             double entryInVol = 0;
             double partialOutVol = 0;
             bool usedFullActiveHist = false;
             if (!HistorySelectByPosition(posId)) {
               HistorySelect(0, TimeCurrent());
               usedFullActiveHist = true;
             }
             int dTot = HistoryDealsTotal();
             int matchedActiveDeals = 0;
             bool foundActiveEntryIn = false;
             for (int d = 0; d < dTot; d++) {
               ulong dTick = HistoryDealGetTicket(d);
               if (dTick > 0 && HistoryDealGetInteger(dTick, DEAL_POSITION_ID) == posId) {
                 activeComm += HistoryDealGetDouble(dTick, DEAL_COMMISSION);
                 matchedActiveDeals++;
                 ENUM_DEAL_ENTRY actEntry = (ENUM_DEAL_ENTRY)HistoryDealGetInteger(dTick, DEAL_ENTRY);
                 if (actEntry == DEAL_ENTRY_IN) {
                   foundActiveEntryIn = true;
                   entryInVol += HistoryDealGetDouble(dTick, DEAL_VOLUME);
                 } else if (actEntry == DEAL_ENTRY_INOUT) {
                   foundActiveEntryIn = true;
                 } else if (actEntry == DEAL_ENTRY_OUT || actEntry == DEAL_ENTRY_OUT_BY) {
                   partialOutVol += HistoryDealGetDouble(dTick, DEAL_VOLUME);
                 }
               }
             }
             if (!foundActiveEntryIn) {
               matchedActiveDeals = 0;
             }
             if (matchedActiveDeals == 0 && !usedFullActiveHist) {
               HistorySelect(0, TimeCurrent());
               activeComm = 0;
               entryInVol = 0;
               partialOutVol = 0;
               dTot = HistoryDealsTotal();
               for (int d = 0; d < dTot; d++) {
                 ulong dTick = HistoryDealGetTicket(d);
                 if (dTick > 0 && HistoryDealGetInteger(dTick, DEAL_POSITION_ID) == posId) {
                   activeComm += HistoryDealGetDouble(dTick, DEAL_COMMISSION);
                   ENUM_DEAL_ENTRY actEntry = (ENUM_DEAL_ENTRY)HistoryDealGetInteger(dTick, DEAL_ENTRY);
                   if (actEntry == DEAL_ENTRY_IN) {
                     entryInVol += HistoryDealGetDouble(dTick, DEAL_VOLUME);
                   } else if (actEntry == DEAL_ENTRY_OUT || actEntry == DEAL_ENTRY_OUT_BY) {
                     partialOutVol += HistoryDealGetDouble(dTick, DEAL_VOLUME);
                   }
                 }
               }
             }
             double initialVol = (entryInVol > 0.0) ? entryInVol : (vol + partialOutVol);
             if (initialVol <= 0.0) {
               initialVol = vol;
             }
             
             if (!first) tradesJson += ",";
             first = false;
             
             tradesJson += StringFormat(
                 "{"
                 "\"ticket\":\"%I64d\","
                 "\"symbol\":\"%s\","
                 "\"type\":%d,"
                 "\"volume\":%.2f,"
                 "\"initialVolume\":%.2f,"
                 "\"remainingVolume\":%.2f,"
                 "\"openPrice\":%.5f,"
                 "\"openTime\":%I64d,"
                 "\"closePrice\":%.5f,"
                 "\"closeTime\":%I64d,"
                 "\"stopLoss\":%.5f,"
                 "\"takeProfit\":%.5f,"
                 "\"profit\":0.00,"
                 "\"unrealizedPnl\":%.2f,"
                 "\"commission\":%.2f,"
                 "\"swap\":%.2f"
                 "}",
                 posId, sym, tType, initialVol, initialVol, vol, opPrice, 
                 (long)opTime, 0.0, (long)0, sl, tp, 
                 currProfit, activeComm, currSwap);
             
             syncedCount++;
         }
     }
   }

   tradesJson += "]";

   // Clean up history cache to full account history
   HistorySelect(0, TimeCurrent());

   Print("Found ", syncedCount, " closing trades and active positions to sync");

   if (syncedCount == 0) {
     Print("No closing trades or active positions found");
     return 0;
   }

   //--- Build full JSON with product identity & live account telemetry
  string json = BuildTradesEnvelopeJson(tradesJson, g_AccountNumber);

  //--- Send to server
  if (SendTradesToServer(json, syncedCount)) {
    g_TotalSynced += syncedCount;
    g_LastSyncTime = TimeCurrent();
    g_LastSyncStatus = TimeToString(TimeCurrent(), TIME_DATE | TIME_MINUTES);
    if(ObjectFind(0, "Sync_TotalVal") >= 0) ObjectSetString(0, "Sync_TotalVal", OBJPROP_TEXT, IntegerToString(g_TotalSynced));
    string lastSyncDisp = (g_LastSyncStatus == "" || g_LastSyncStatus == "WAIT" || g_LastSyncStatus == "Not synced yet") 
                          ? ("WAIT (" + IntegerToString(g_TotalSynced) + " Deals)") 
                          : (g_LastSyncStatus + " (" + IntegerToString(g_TotalSynced) + " Deals)");
    if(ObjectFind(0, "Sync_LastSyncVal") >= 0) ObjectSetString(0, "Sync_LastSyncVal", OBJPROP_TEXT, lastSyncDisp);
    ChartRedraw(0);
    return syncedCount;
  }

  return -1;
}

//+------------------------------------------------------------------+
//| Sync history deals (range sync alias)                            |
//+------------------------------------------------------------------+
int SyncHistoryDeals(datetime fromDate = 0, datetime toDate = 0) {
  if (toDate == 0) toDate = TimeCurrent();
  return SyncDateRange(fromDate, toDate);
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void TradeSync_OnTick() {
  if (MQLInfoInteger(MQL_TESTER)) return;
  TradeSync_EnsureAutoInit();
  // Fallback if host EA does not run a 1-second timer or timer event was overridden
  if (TimeCurrent() - g_LastTimerRun >= 2) {
    TradeSync_OnTimer();
  }
}

//+------------------------------------------------------------------+
//| Trade transaction handling - Real-time trade detection          |
//+------------------------------------------------------------------+
void TradeSync_OnTradeTransaction(const MqlTradeTransaction &trans,
                        const MqlTradeRequest &request,
                        const MqlTradeResult &result) {
  //--- If deal added (trade executed, closed, deposit, withdrawal, commission)
  if (trans.type == TRADE_TRANSACTION_DEAL_ADD) {
    // 1. Immediately update local balance check and refresh chart UI
    CheckMinBalanceLocal();
    UpdateSyncBalanceDisplay();

    // 2. Server sync requires chart ownership and valid API key
    if (!TradeSync_EnsureOwner() || g_TradeSync_ApiKey == "") return;

    ulong dealTicket = trans.deal;
    if (dealTicket > 0) {
      if (!HistoryDealSelect(dealTicket)) {
        HistorySelect(0, TimeCurrent());
      }
      if (HistoryDealSelect(dealTicket)) {
        ENUM_DEAL_ENTRY entry =
            (ENUM_DEAL_ENTRY)HistoryDealGetInteger(dealTicket, DEAL_ENTRY);

        //--- Only interested in exit deals (closing trades) for server sync
        if (entry == DEAL_ENTRY_OUT || entry == DEAL_ENTRY_INOUT || entry == DEAL_ENTRY_OUT_BY) {
          //--- Flag real-time sync for next timer tick
          g_CheckTradesNow = true;
        }
      }
    }
  }
}

//+------------------------------------------------------------------+
//| Send Heartbeat to Server                                         |
//+------------------------------------------------------------------+
void SendHeartbeat(bool forceConnect = false) {
  if (forceConnect) {
    TradeSync_TakeOwnership();
  }
  else if (!TradeSync_EnsureOwner()) {
    g_IsConnected = false;
    g_LastSyncStatus = "STANDBY";
    ObjectSetString(0, "Sync_StatusVal", OBJPROP_TEXT, "STANDBY");
    ObjectSetInteger(0, "Sync_StatusVal", OBJPROP_COLOR, C'255,193,7');
    string waitDisp = "STANDBY (" + IntegerToString(g_TotalSynced) + " Deals)";
    if(ObjectFind(0, "Sync_LastSyncVal") >= 0) ObjectSetString(0, "Sync_LastSyncVal", OBJPROP_TEXT, waitDisp);
    Print("[Trade Sync] Heartbeat skipped: Another chart is managing Trade Sync for this account.");
    ChartRedraw(0);
    return;
  }

  if (g_TradeSync_ApiKey == "") {
    ObjectSetString(0, "Sync_StatusVal", OBJPROP_TEXT, "NO API KEY");
    ObjectSetInteger(0, "Sync_StatusVal", OBJPROP_COLOR, C'255,193,7');
    ChartRedraw(0);
    Print("[Trade Sync] Cannot send heartbeat: API Key is empty.");
    return;
  }

  if (g_BaseUrl == "") {
    g_IsConnected = false;
    g_IsVipActive = false;
    g_LastError = "Server URL is empty";
    ObjectSetString(0, "Sync_StatusVal", OBJPROP_TEXT, "OFFLINE");
    ObjectSetInteger(0, "Sync_StatusVal", OBJPROP_COLOR, C'255,50,50');
    ShowChartWarning("Server URL is empty. Please configure InpSyncApiUrl in EA Inputs.");
    ChartRedraw(0);
    Print("[Trade Sync] Cannot send heartbeat: Server URL is empty.");
    return;
  }

  long accNum = AccountInfoInteger(ACCOUNT_LOGIN);
  if (accNum <= 0) {
    if (g_AccountNumber != "" && g_AccountNumber != "0") {
      accNum = (long)StringToInteger(g_AccountNumber);
    }
  }
  if (accNum <= 0) {
    Print("[Trade Sync] Heartbeat postponed: Broker account login is not yet authenticated.");
    ObjectSetString(0, "Sync_StatusVal", OBJPROP_TEXT, "CONNECTING...");
    ObjectSetInteger(0, "Sync_StatusVal", OBJPROP_COLOR, clrYellow);
    ChartRedraw(0);
    return;
  }

  g_LastHeartbeat = TimeCurrent(); // Update time immediately to prevent spam on failure

  string url = g_BaseUrl + "/api/ea/heartbeat";
  string headers = "Content-Type: application/json\r\nX-Sync-Key: " + g_TradeSync_ApiKey + "\r\nX-API-Key: " + g_TradeSync_ApiKey + "\r\n";

  // Account trade mode: "REAL", "DEMO", or "CONTEST"
  ENUM_ACCOUNT_TRADE_MODE tradeMode = (ENUM_ACCOUNT_TRADE_MODE)AccountInfoInteger(ACCOUNT_TRADE_MODE);
  string tradeModeStr = "REAL";
  if(tradeMode == ACCOUNT_TRADE_MODE_DEMO) tradeModeStr = "DEMO";
  else if(tradeMode == ACCOUNT_TRADE_MODE_CONTEST) tradeModeStr = "CONTEST";

  // ISO 8601 UTC time string: YYYY-MM-DDTHH:MM:SSZ
  MqlDateTime dt;
  TimeToStruct(TimeGMT(), dt);
  string clientTimeStr = StringFormat("%04d-%02d-%02dT%02d:%02d:%02dZ",
                                      dt.year, dt.mon, dt.day, dt.hour, dt.min, dt.sec);

  int gmtOffsetSeconds = (int)(TimeCurrent() - TimeGMT());

  if (g_TradeSync_ProductSlug == "" || g_TradeSync_EaName == "") {
     TradeSync_ResolveProductIdentity(g_TradeSync_ProductSlug, g_TradeSync_EaName, g_TradeSync_EaVersion);
  }

  string body = StringFormat(
      "{"
      "\"productSlug\":\"%s\","
      "\"eaName\":\"%s\","
      "\"eaVersion\":\"%s\","
      "\"platform\":\"MT5\","
      "\"accountNumber\":%I64d,"
      "\"broker\":\"%s\","
      "\"server\":\"%s\","
      "\"currency\":\"%s\","
      "\"balance\":%.2f,"
      "\"equity\":%.2f,"
      "\"leverage\":%d,"
      "\"accountTradeMode\":\"%s\","
      "\"clientTime\":\"%s\","
      "\"gmtOffset\":%d,"
      "\"isSyncing\":%s"
      "}",
      EscapeJsonString(g_TradeSync_ProductSlug),
      EscapeJsonString(g_TradeSync_EaName),
      EscapeJsonString(g_TradeSync_EaVersion),
      accNum,
      EscapeJsonString(AccountInfoString(ACCOUNT_COMPANY)),
      EscapeJsonString(AccountInfoString(ACCOUNT_SERVER)),
      EscapeJsonString(AccountInfoString(ACCOUNT_CURRENCY)),
      AccountInfoDouble(ACCOUNT_BALANCE),
      AccountInfoDouble(ACCOUNT_EQUITY),
      (int)AccountInfoInteger(ACCOUNT_LEVERAGE),
      tradeModeStr,
      clientTimeStr,
      gmtOffsetSeconds,
      g_IsSyncing ? "true" : "false"
  );

  char postData[];
  char resultData[];
  string resultHeaders;

  StringToCharArray(body, postData, 0, WHOLE_ARRAY, CP_UTF8);
  ArrayResize(postData, ArraySize(postData) - 1); // Remove null terminator

  PrintFormat("[Trade Sync] Sending Heartbeat WebRequest to: %s...", url);
  uint tickStart = GetTickCount();
  ResetLastError();
  int hbTimeout = (StringFind(url, "localhost") >= 0 || StringFind(url, "127.0.0.1") >= 0) ? 1000 : 2500;
  int res = WebRequest("POST", url, headers, hbTimeout, postData, resultData, resultHeaders);
  uint elapsed = GetTickCount() - tickStart;
  PrintFormat("[Trade Sync] Heartbeat finished in %d ms | HTTP: %d | Err: %d", elapsed, res, GetLastError());

  string response = "";
  if(ArraySize(resultData) > 0)
    response = CharArrayToString(resultData, 0, WHOLE_ARRAY, CP_UTF8);

  HandleHeartbeatResponse(res, response);
}

//+------------------------------------------------------------------+
//| Check for new closed trades                                      |
//+------------------------------------------------------------------+
void CheckNewTrades() {
  //--- Select all history
  if (!HistorySelect(0, TimeCurrent())) {
    Print("Failed to select history");
    return;
  }

  int currentTotal = HistoryDealsTotal();

  // Guard: Initialize baseline on first check to prevent flooding old history
  if (!g_HistoryBaselineInitialized) {
    g_LastHistoryTotal = currentTotal;
    g_HistoryBaselineInitialized = true;
    return;
  }

  // Guard: If history total shrank (broker prune or reconnection), adjust baseline
  if (currentTotal < g_LastHistoryTotal) {
    g_LastHistoryTotal = currentTotal;
    return;
  }

  //--- Check if new deals appeared
  if (currentTotal > g_LastHistoryTotal) {
    Print("New deals detected: ", currentTotal - g_LastHistoryTotal);

    //--- PASS 1: Collect unique closing deal tickets (deduplicated by Position ID)
    ulong closingDeals[];
    long closingPositionIds[];
    ArrayResize(closingDeals, 0);
    ArrayResize(closingPositionIds, 0);

    for (int i = g_LastHistoryTotal; i < currentTotal; i++) {
      ulong ticket = HistoryDealGetTicket(i);

      if (ticket > 0) {
        ENUM_DEAL_ENTRY entry =
            (ENUM_DEAL_ENTRY)HistoryDealGetInteger(ticket, DEAL_ENTRY);

        //--- Only process closing deals
        if (entry == DEAL_ENTRY_OUT || entry == DEAL_ENTRY_INOUT || entry == DEAL_ENTRY_OUT_BY) {
          long posId = HistoryDealGetInteger(ticket, DEAL_POSITION_ID);
          if (posId <= 0) continue;
          int existingIdx = -1;
          for (int k = 0; k < ArraySize(closingPositionIds); k++) {
            if (closingPositionIds[k] == posId) {
              existingIdx = k;
              break;
            }
          }
          if (existingIdx >= 0) {
            datetime newTime = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);
            datetime oldTime = (datetime)HistoryDealGetInteger(closingDeals[existingIdx], DEAL_TIME);
            if (newTime > oldTime || (newTime == oldTime && ticket > closingDeals[existingIdx])) {
              closingDeals[existingIdx] = ticket;
            }
          } else {
            int idx = ArraySize(closingDeals);
            ArrayResize(closingDeals, idx + 1);
            ArrayResize(closingPositionIds, idx + 1);
            closingDeals[idx] = ticket;
            closingPositionIds[idx] = posId;
          }
        }
      }
    }

    g_LastHistoryTotal = currentTotal;

    //--- PASS 2: Sync collected unique closing deals (batch into 1 request when multiple orders close together)
    int count = ArraySize(closingDeals);
    if (count == 1) {
      if (!SyncSingleTrade(closingDeals[0])) {
        TradeSync_QueueDeal(closingDeals[0]);
      }
    } else if (count > 1) {
      PrepareBackgroundSync(closingDeals);
      ProcessSyncBatch();
    }

    // Clean up history cache to full account history
    HistorySelect(0, TimeCurrent());
  }
}

//+------------------------------------------------------------------+
//| Build JSON object for a single trade                             |
//+------------------------------------------------------------------+
string BuildTradeJson(ulong dealTicket) {
  if (!HistoryDealSelect(dealTicket)) {
    HistorySelect(0, TimeCurrent());
    if (!HistoryDealSelect(dealTicket)) {
      return "";
    }
  }
  long positionId = HistoryDealGetInteger(dealTicket, DEAL_POSITION_ID);
  if (positionId <= 0) {
    HistorySelect(0, TimeCurrent());
    if (!HistoryDealSelect(dealTicket)) {
      return "";
    }
    positionId = HistoryDealGetInteger(dealTicket, DEAL_POSITION_ID);
    if (positionId <= 0) return "";
  }

  string symbol = HistoryDealGetString(dealTicket, DEAL_SYMBOL);
  ENUM_DEAL_TYPE dealType = (ENUM_DEAL_TYPE)HistoryDealGetInteger(dealTicket, DEAL_TYPE);
  double volume = HistoryDealGetDouble(dealTicket, DEAL_VOLUME);
  double closePrice = HistoryDealGetDouble(dealTicket, DEAL_PRICE);
  datetime closeTime = (datetime)HistoryDealGetInteger(dealTicket, DEAL_TIME);
  double fallbackProfit = HistoryDealGetDouble(dealTicket, DEAL_PROFIT);
  double fallbackComm   = HistoryDealGetDouble(dealTicket, DEAL_COMMISSION);
  double fallbackSwap   = HistoryDealGetDouble(dealTicket, DEAL_SWAP);
  
  double openPrice = 0;
  datetime openTime = 0;
  int tradeType = 0; 
  double stopLoss = HistoryDealGetDouble(dealTicket, DEAL_SL);
  double takeProfit = HistoryDealGetDouble(dealTicket, DEAL_TP);
  double fbSL = 0, fbTP = 0;
  double posProfit = 0, posComm = 0, posSwap = 0;
  bool entryDataMissing = false;

  if (FindOpeningDealWithSLTP(positionId, openPrice, openTime, tradeType, fbSL, fbTP, posProfit, posComm, posSwap)) {
    if (stopLoss == 0) stopLoss = fbSL;
    if (takeProfit == 0) takeProfit = fbTP;
    if (MathAbs(posSwap) < 0.00001 && MathAbs(fallbackSwap) >= 0.00001) posSwap = fallbackSwap;
    if (MathAbs(posComm) < 0.00001 && MathAbs(fallbackComm) >= 0.00001) posComm = fallbackComm;
    if (MathAbs(posProfit) < 0.00001 && MathAbs(fallbackProfit) >= 0.00001) posProfit = fallbackProfit;

    // Aggregate closed volume across all partial/full close deals of this position
    // Exclude opening DEAL_ENTRY_INOUT deals so reversal-opened positions do not double-count volume
    double totalClosedVolume = 0;
    double totalEntryInVolume = 0;
    double closingInOutVolume = 0;
    bool hasEntryIn = false;
    ulong earliestInOutTick = 0;
    datetime earliestInOutTm = 0;

    for (int pass = 0; pass < 2; pass++) {
      if (pass == 1) {
        HistorySelect(0, TimeCurrent());
      }
      totalClosedVolume = 0;
      totalEntryInVolume = 0;
      closingInOutVolume = 0;
      hasEntryIn = false;
      earliestInOutTick = 0;
      earliestInOutTm = 0;

      int dCount = HistoryDealsTotal();
      for (int d = 0; d < dCount; d++) {
        ulong dTick = HistoryDealGetTicket(d);
        if (dTick > 0 && HistoryDealGetInteger(dTick, DEAL_POSITION_ID) == positionId) {
          ENUM_DEAL_ENTRY dEntry = (ENUM_DEAL_ENTRY)HistoryDealGetInteger(dTick, DEAL_ENTRY);
          datetime dTime = (datetime)HistoryDealGetInteger(dTick, DEAL_TIME);
          if (dEntry == DEAL_ENTRY_IN) {
            hasEntryIn = true;
            totalEntryInVolume += HistoryDealGetDouble(dTick, DEAL_VOLUME);
          } else if (dEntry == DEAL_ENTRY_INOUT) {
            if (earliestInOutTick == 0 || (dTime > 0 && (dTime < earliestInOutTm || (dTime == earliestInOutTm && dTick < earliestInOutTick)))) {
              earliestInOutTick = dTick;
              earliestInOutTm = dTime;
            }
          }
        }
      }

      for (int d = 0; d < dCount; d++) {
        ulong dTick = HistoryDealGetTicket(d);
        if (dTick > 0 && HistoryDealGetInteger(dTick, DEAL_POSITION_ID) == positionId) {
          ENUM_DEAL_ENTRY dEntry = (ENUM_DEAL_ENTRY)HistoryDealGetInteger(dTick, DEAL_ENTRY);
          if (dEntry == DEAL_ENTRY_OUT || dEntry == DEAL_ENTRY_OUT_BY) {
            totalClosedVolume += HistoryDealGetDouble(dTick, DEAL_VOLUME);
          } else if (dEntry == DEAL_ENTRY_INOUT) {
            // Only count DEAL_ENTRY_INOUT if it is a closing deal, NOT the opening reversal deal
            if (hasEntryIn || dTick != earliestInOutTick) {
              closingInOutVolume += HistoryDealGetDouble(dTick, DEAL_VOLUME);
            }
          }
        }
      }

      if (totalClosedVolume > 0 || closingInOutVolume > 0) {
        break;
      }
    }

    double aggregatedVol = totalClosedVolume + closingInOutVolume;
    if (hasEntryIn && closingInOutVolume > 0 && totalEntryInVolume > 0 && aggregatedVol > totalEntryInVolume) {
      aggregatedVol = totalEntryInVolume;
    }
    if (aggregatedVol > 0) {
      volume = aggregatedVol;
    }
  } else {
    //--- Opening deal could not be traced: mark entryDataMissing=true so server rejects rather than fabricating
    entryDataMissing = true;
    openPrice = closePrice;
    openTime = closeTime;
    tradeType = (dealType == DEAL_TYPE_SELL) ? 0 : 1; 
    posProfit = fallbackProfit;
    posComm   = fallbackComm;
    posSwap   = fallbackSwap;
  }

  // Restore full history cache so subsequent calls and events have access to all deals
  HistorySelect(0, TimeCurrent());

  string missingField = entryDataMissing ? ",\"entryDataMissing\":true" : "";

  return StringFormat(
      "{"
      "\"ticket\":\"%I64d\","
      "\"symbol\":\"%s\","
      "\"type\":%d,"
      "\"volume\":%.2f,"
      "\"openPrice\":%.5f,"
      "\"openTime\":%I64d,"
      "\"closePrice\":%.5f,"
      "\"closeTime\":%I64d,"
      "\"stopLoss\":%.5f,"
      "\"takeProfit\":%.5f,"
      "\"profit\":%.2f,"
      "\"commission\":%.2f,"
      "\"swap\":%.2f"
      "%s"
      "}",
      positionId, symbol, tradeType, volume, openPrice, (long)openTime,
      closePrice, (long)closeTime, stopLoss, takeProfit, posProfit, posComm, posSwap,
      missingField);
}

//+------------------------------------------------------------------+
//| Build full JSON envelope for /api/ea/trades                      |
//+------------------------------------------------------------------+
string BuildTradesEnvelopeJson(string tradesArrayJson, string accountNumberOverride = "") {
  string accStr = (accountNumberOverride != "") ? accountNumberOverride : g_AccountNumber;
  if (accStr == "" || accStr == "0") {
    long login = AccountInfoInteger(ACCOUNT_LOGIN);
    if (login > 0) accStr = IntegerToString(login);
  }
  ENUM_ACCOUNT_TRADE_MODE tradeMode = (ENUM_ACCOUNT_TRADE_MODE)AccountInfoInteger(ACCOUNT_TRADE_MODE);
  string tradeModeStr = "REAL";
  if(tradeMode == ACCOUNT_TRADE_MODE_DEMO) tradeModeStr = "DEMO";
  else if(tradeMode == ACCOUNT_TRADE_MODE_CONTEST) tradeModeStr = "CONTEST";

  if (g_TradeSync_ProductSlug == "" || g_TradeSync_EaName == "") {
     TradeSync_ResolveProductIdentity(g_TradeSync_ProductSlug, g_TradeSync_EaName, g_TradeSync_EaVersion);
  }

  // ISO 8601 UTC time string: YYYY-MM-DDTHH:MM:SSZ (matches SendHeartbeat)
  MqlDateTime dt;
  TimeToStruct(TimeGMT(), dt);
  string clientTimeStr = StringFormat("%04d-%02d-%02dT%02d:%02d:%02dZ",
                                      dt.year, dt.mon, dt.day, dt.hour, dt.min, dt.sec);
  int gmtOffsetSeconds = (int)(TimeCurrent() - TimeGMT());

  return StringFormat(
      "{"
      "\"trades\":%s,"
      "\"productSlug\":\"%s\","
      "\"eaName\":\"%s\","
      "\"eaVersion\":\"%s\","
      "\"platform\":\"MT5\","
      "\"accountTradeMode\":\"%s\","
      "\"clientTime\":\"%s\","
      "\"gmtOffset\":%d,"
      "\"accountNumber\":\"%s\","
      "\"broker\":\"%s\","
      "\"server\":\"%s\","
      "\"currency\":\"%s\","
      "\"balance\":%.2f,"
      "\"equity\":%.2f,"
      "\"leverage\":%d"
      "}",
      tradesArrayJson,
      EscapeJsonString(g_TradeSync_ProductSlug),
      EscapeJsonString(g_TradeSync_EaName),
      EscapeJsonString(g_TradeSync_EaVersion),
      tradeModeStr,
      clientTimeStr,
      gmtOffsetSeconds,
      EscapeJsonString(accStr),
      EscapeJsonString(AccountInfoString(ACCOUNT_COMPANY)),
      EscapeJsonString(AccountInfoString(ACCOUNT_SERVER)),
      EscapeJsonString(AccountInfoString(ACCOUNT_CURRENCY)),
      AccountInfoDouble(ACCOUNT_BALANCE),
      AccountInfoDouble(ACCOUNT_EQUITY),
      (int)AccountInfoInteger(ACCOUNT_LEVERAGE)
  );
}

//+------------------------------------------------------------------+
//| Sync a single trade to server                                    |
//+------------------------------------------------------------------+
bool SyncSingleTrade(ulong dealTicket) {
  if (!HistoryDealSelect(dealTicket)) {
    HistorySelect(0, TimeCurrent());
    if (!HistoryDealSelect(dealTicket)) {
      Print("Failed to select deal: ", dealTicket);
      g_LastError = "Failed to select deal";
      return false;
    }
  }

  string tradeJson = BuildTradeJson(dealTicket);
  if (tradeJson == "") {
    g_LastError = "Failed to build trade JSON";
    return false;
  }

  string fullJson = BuildTradesEnvelopeJson("[" + tradeJson + "]", g_AccountNumber);

  if (SendTradesToServer(fullJson, 1)) {
    string gvName = "GSN_MaxTicket_" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN));
    ulong maxTicket = 0;
    if (GlobalVariableCheck(gvName)) maxTicket = (ulong)GlobalVariableGet(gvName);
    if (dealTicket > maxTicket) GlobalVariableSet(gvName, (double)dealTicket);

    g_TotalSynced++;
    g_LastSyncTime = TimeCurrent();
    g_LastSyncStatus = TimeToString(TimeCurrent(), TIME_DATE | TIME_MINUTES);
    if(ObjectFind(0, "Sync_TotalVal") >= 0) ObjectSetString(0, "Sync_TotalVal", OBJPROP_TEXT, IntegerToString(g_TotalSynced));
    string lastSyncDisp = (g_LastSyncStatus == "" || g_LastSyncStatus == "WAIT" || g_LastSyncStatus == "Not synced yet")
                          ? ("WAIT (" + IntegerToString(g_TotalSynced) + " Deals)")
                          : (g_LastSyncStatus + " (" + IntegerToString(g_TotalSynced) + " Deals)");
    if(ObjectFind(0, "Sync_LastSyncVal") >= 0) ObjectSetString(0, "Sync_LastSyncVal", OBJPROP_TEXT, lastSyncDisp);
    ChartRedraw(0);
    return true;
  }
  return false;
}

//+------------------------------------------------------------------+
//| Sync a single trade to server (4-param overload per spec 4.2)    |
//+------------------------------------------------------------------+
bool SyncSingleTrade(ulong dealTicket, string apiUrl, string apiKey, string accountNumber) {
  if (!HistoryDealSelect(dealTicket)) {
    HistorySelect(0, TimeCurrent());
    if (!HistoryDealSelect(dealTicket)) {
      Print("Failed to select deal: ", dealTicket);
      g_LastError = "Failed to select deal";
      return false;
    }
  }

  string tradeJson = BuildTradeJson(dealTicket);
  if (tradeJson == "") {
    g_LastError = "Failed to build trade JSON";
    return false;
  }

  string fullJson = BuildTradesEnvelopeJson("[" + tradeJson + "]", accountNumber);

  return SendTradesPayload(apiUrl, apiKey, fullJson);
}

//+------------------------------------------------------------------+
//| Find opening deal for a position                                 |
//+------------------------------------------------------------------+
bool FindOpeningDeal(long positionId, double &openPrice, datetime &openTime,
                     int &tradeType) {
  double sl = 0, tp = 0, totalProfit = 0, totalCommission = 0, totalSwap = 0;
  bool res = FindOpeningDealWithSLTP(positionId, openPrice, openTime, tradeType, sl,
                                     tp, totalProfit, totalCommission, totalSwap);
  HistorySelect(0, TimeCurrent());
  return res;
}

//+------------------------------------------------------------------+
//| Find opening deal, calculate full commission, swap, profit and   |
//| retrieve the latest SL/TP from Order History                     |
//+------------------------------------------------------------------+
bool FindOpeningDealWithSLTP(long positionId, double &openPrice,
                             datetime &openTime, int &tradeType,
                             double &stopLoss, double &takeProfit,
                             double &totalProfit, double &totalCommission,
                             double &totalSwap) {
  //--- Guard against invalid or non-position tickets (e.g. balance transactions)
  if (positionId <= 0) return false;

  //--- 1. Tier 1: Load all deals for this position into memory
  bool usedFullHistory = false;
  if (!HistorySelectByPosition(positionId)) {
    //--- Fallback if broker does not support HistorySelectByPosition
    HistorySelect(0, TimeCurrent());
    usedFullHistory = true;
  }

  stopLoss = 0;
  takeProfit = 0;
  totalProfit = 0;
  totalCommission = 0;
  totalSwap = 0;
  openPrice = 0;
  openTime = 0;
  tradeType = 0;
  bool foundOpening = false;

  ulong earliestInOutTicket = 0;
  datetime earliestInOutTime = 0;
  int positionDealCount = 0;

  //--- PASS 1: Iterate through ALL deals of this position
  int totalDeals = HistoryDealsTotal();
  for (int i = 0; i < totalDeals; i++) {
    ulong ticket = HistoryDealGetTicket(i);
    if (ticket == 0)
      continue;

    long dealPosId = HistoryDealGetInteger(ticket, DEAL_POSITION_ID);
    if (dealPosId != positionId)
      continue;

    positionDealCount++;

    //--- Accumulate gross profit, commission (both Deal IN and Deal OUT), and overnight swap
    totalProfit     += HistoryDealGetDouble(ticket, DEAL_PROFIT);
    totalCommission += HistoryDealGetDouble(ticket, DEAL_COMMISSION);
    totalSwap       += HistoryDealGetDouble(ticket, DEAL_SWAP);

    datetime dTime = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);
    ENUM_DEAL_ENTRY entry =
        (ENUM_DEAL_ENTRY)HistoryDealGetInteger(ticket, DEAL_ENTRY);

    if (entry == DEAL_ENTRY_INOUT) {
      if (earliestInOutTicket == 0 || (dTime > 0 && (dTime < earliestInOutTime || (dTime == earliestInOutTime && ticket < earliestInOutTicket)))) {
        earliestInOutTicket = ticket;
        earliestInOutTime = dTime;
      }
    }

    //--- Identify opening deal (DEAL_ENTRY_IN) to extract open price, time, and type
    if (entry == DEAL_ENTRY_IN && !foundOpening) {
      openPrice = HistoryDealGetDouble(ticket, DEAL_PRICE);
      openTime = dTime;
      ENUM_DEAL_TYPE type =
          (ENUM_DEAL_TYPE)HistoryDealGetInteger(ticket, DEAL_TYPE);
      tradeType = (type == DEAL_TYPE_BUY) ? 0 : 1;
      foundOpening = true;
    }
  }

  //--- Tier 2 (Deep Fallback): If HistorySelectByPosition succeeded initially,
  //--- yet DEAL_ENTRY_IN was missing from the broker's position cache (e.g. archived
  //--- opening deal or partial cache), reload full history and re-scan all deals for
  //--- positionId so opening commission and entry metadata are never lost.
  if (!foundOpening && !usedFullHistory) {
    HistorySelect(0, TimeCurrent());
    usedFullHistory = true;
    totalProfit = 0;
    totalCommission = 0;
    totalSwap = 0;
    earliestInOutTicket = 0;
    earliestInOutTime = 0;
    positionDealCount = 0;

    totalDeals = HistoryDealsTotal();
    for (int i = 0; i < totalDeals; i++) {
      ulong ticket = HistoryDealGetTicket(i);
      if (ticket == 0)
        continue;

      long dealPosId = HistoryDealGetInteger(ticket, DEAL_POSITION_ID);
      if (dealPosId != positionId)
        continue;

      positionDealCount++;

      totalProfit     += HistoryDealGetDouble(ticket, DEAL_PROFIT);
      totalCommission += HistoryDealGetDouble(ticket, DEAL_COMMISSION);
      totalSwap       += HistoryDealGetDouble(ticket, DEAL_SWAP);

      datetime dTime = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);
      ENUM_DEAL_ENTRY entry =
          (ENUM_DEAL_ENTRY)HistoryDealGetInteger(ticket, DEAL_ENTRY);

      if (entry == DEAL_ENTRY_INOUT) {
        if (earliestInOutTicket == 0 || (dTime > 0 && dTime < earliestInOutTime)) {
          earliestInOutTicket = ticket;
          earliestInOutTime = dTime;
        }
      }

      if (entry == DEAL_ENTRY_IN && !foundOpening) {
        openPrice = HistoryDealGetDouble(ticket, DEAL_PRICE);
        openTime = dTime;
        ENUM_DEAL_TYPE type =
            (ENUM_DEAL_TYPE)HistoryDealGetInteger(ticket, DEAL_TYPE);
        tradeType = (type == DEAL_TYPE_BUY) ? 0 : 1;
        foundOpening = true;
      }
    }
  }

  //--- Reversal-Opened Fallback: if position was opened via an instant reversal
  //--- deal (DEAL_ENTRY_INOUT) and subsequently closed, its DEAL_TYPE is the
  //--- new position's opening direction (BUY -> 0, SELL -> 1).
  if (!foundOpening && earliestInOutTicket > 0 && positionDealCount > 1) {
    openPrice = HistoryDealGetDouble(earliestInOutTicket, DEAL_PRICE);
    openTime = earliestInOutTime;
    ENUM_DEAL_TYPE eType = (ENUM_DEAL_TYPE)HistoryDealGetInteger(earliestInOutTicket, DEAL_TYPE);
    tradeType = (eType == DEAL_TYPE_BUY) ? 0 : 1;
    foundOpening = true;
  }

  if (!foundOpening)
    return false;

  //--- PASS 2: Find the latest SL/TP values from order history
  //--- (Includes initial order + any position modification orders)
  int totalOrders = HistoryOrdersTotal();
  if (totalOrders == 0 && !usedFullHistory) {
    HistorySelect(0, TimeCurrent());
    usedFullHistory = true;
    totalOrders = HistoryOrdersTotal();
  }
  datetime lastOrderTime = 0;
  ulong lastOrderTicket = 0;
  int matchedOrders = 0;

  for (int i = 0; i < totalOrders; i++) {
    ulong orderTicket = HistoryOrderGetTicket(i);
    if (orderTicket == 0)
      continue;

    long orderPosId = HistoryOrderGetInteger(orderTicket, ORDER_POSITION_ID);
    if (orderPosId != positionId)
      continue;

    matchedOrders++;

    //--- Get this order's SL/TP (could be modify order)
    double orderSL = HistoryOrderGetDouble(orderTicket, ORDER_SL);
    double orderTP = HistoryOrderGetDouble(orderTicket, ORDER_TP);
    datetime orderTime =
        (datetime)HistoryOrderGetInteger(orderTicket, ORDER_TIME_DONE);
    if (orderTime == 0) {
      orderTime = (datetime)HistoryOrderGetInteger(orderTicket, ORDER_TIME_SETUP);
    }

    //--- Keep the latest order's SL/TP without wiping non-zero values on partial modifies
    if (orderTime > lastOrderTime || (orderTime == lastOrderTime && orderTicket >= lastOrderTicket)) {
      if (orderSL > 0) stopLoss = orderSL;
      if (orderTP > 0) takeProfit = orderTP;
      if (orderSL > 0 || orderTP > 0 || lastOrderTime == 0) {
        lastOrderTime = orderTime;
        lastOrderTicket = orderTicket;
      }
    }
  }

  //--- Order History Fallback: if HistorySelectByPosition returned orders for other tickets or 0 matching orders
  if (matchedOrders == 0 && !usedFullHistory) {
    HistorySelect(0, TimeCurrent());
    usedFullHistory = true;
    totalOrders = HistoryOrdersTotal();
    for (int i = 0; i < totalOrders; i++) {
      ulong orderTicket = HistoryOrderGetTicket(i);
      if (orderTicket == 0)
        continue;

      long orderPosId = HistoryOrderGetInteger(orderTicket, ORDER_POSITION_ID);
      if (orderPosId != positionId)
        continue;

      double orderSL = HistoryOrderGetDouble(orderTicket, ORDER_SL);
      double orderTP = HistoryOrderGetDouble(orderTicket, ORDER_TP);
      datetime orderTime =
          (datetime)HistoryOrderGetInteger(orderTicket, ORDER_TIME_DONE);
      if (orderTime == 0) {
        orderTime = (datetime)HistoryOrderGetInteger(orderTicket, ORDER_TIME_SETUP);
      }

      if (orderTime > lastOrderTime || (orderTime == lastOrderTime && orderTicket >= lastOrderTicket)) {
        if (orderSL > 0) stopLoss = orderSL;
        if (orderTP > 0) takeProfit = orderTP;
        if (orderSL > 0 || orderTP > 0 || lastOrderTime == 0) {
          lastOrderTime = orderTime;
          lastOrderTicket = orderTicket;
        }
      }
    }
  }

  return true;
}

//+------------------------------------------------------------------+
//| Backward compatibility overload for FindOpeningDealWithSLTP      |
//+------------------------------------------------------------------+
bool FindOpeningDealWithSLTP(long positionId, double &openPrice,
                             datetime &openTime, int &tradeType,
                             double &stopLoss, double &takeProfit) {
  double totalProfit = 0, totalCommission = 0, totalSwap = 0;
  bool res = FindOpeningDealWithSLTP(positionId, openPrice, openTime, tradeType,
                                     stopLoss, takeProfit, totalProfit, totalCommission, totalSwap);
  HistorySelect(0, TimeCurrent());
  return res;
}

//+------------------------------------------------------------------+
//| Check JSON response for error or failure keys (whitespace-safe)  |
//+------------------------------------------------------------------+
bool IsSyncJsonErrorResponse(const string &response) {
  string compact = response;
  StringReplace(compact, " ", "");
  StringReplace(compact, "\t", "");
  StringReplace(compact, "\r", "");
  StringReplace(compact, "\n", "");
  if (StringFind(compact, "\"error\":") >= 0 &&
      StringFind(compact, "\"error\":null") < 0 &&
      StringFind(compact, "\"error\":\"\"") < 0)
    return true;
  if (StringFind(compact, "\"success\":false") >= 0)
    return true;
  return false;
}

//+------------------------------------------------------------------+
//| Send trades JSON to server                                       |
//+------------------------------------------------------------------+
bool SendTradesToServer(string json, int tradeCount) {
  if (!TradeSync_EnsureOwner()) {
    g_LastError = "Sync blocked: Another chart is syncing.";
    return false;
}
if (g_TradeSync_ApiKey == "") {
    g_LastError = "API Key is empty.";
    return false;
}
if (g_BaseUrl == "") {
    g_LastError = "Server URL is empty.";
    return false;
}
  
  if (TimeCurrent() < g_NextAllowedSyncTime) {
    g_LastError = "Please wait before syncing again.";
    return false;
}

  string url = g_BaseUrl + "/api/ea/trades";
  string headers = "Content-Type: application/json\r\n" +
                   "X-Sync-Key: " + g_TradeSync_ApiKey + "\r\n" +
                   "X-API-Key: " + g_TradeSync_ApiKey + "\r\n" +
                   "X-Payload-Encoding: zip";

  Print("Sending trades to: ", url); // Debug log

  //--- Prepare request data
  char data[];
  char zipData[];
  char key[];
  char resultData[];
  string resultHeaders;

  StringToCharArray(json, data, 0, WHOLE_ARRAY, CP_UTF8);
  ArrayResize(data, ArraySize(data) - 1); // Remove null terminator

  //--- Compress and Send request
  ResetLastError();
  int res = -1;
  uint tickStart = GetTickCount();
  
  if (CryptEncode(CRYPT_ARCH_ZIP, data, key, zipData)) {
      res = WebRequest("POST", url, headers, 500, zipData, resultData, resultHeaders);
  } else {
      Print("ZIP compression failed. Fallback to uncompressed. Error: ", GetLastError());
      string fallbackHeaders = "Content-Type: application/json\r\nX-Sync-Key: " + g_TradeSync_ApiKey + "\r\nX-API-Key: " + g_TradeSync_ApiKey;
      res = WebRequest("POST", url, fallbackHeaders, 2000, data, resultData, resultHeaders);
  }
  g_LastSyncLatency = GetTickCount() - tickStart;
  if(ObjectFind(0, "Sync_LatencyVal") >= 0) ObjectSetString(0, "Sync_LatencyVal", OBJPROP_TEXT, IntegerToString(g_LastSyncLatency) + " ms");

  if (res == 200 || res == 201) {
    string response = CharArrayToString(resultData, 0, WHOLE_ARRAY, CP_UTF8);
    bool has_json_error = (StringFind(response, "\"error\":") >= 0 && StringFind(response, "\"error\":null") < 0 && StringFind(response, "\"error\":\"\"") < 0) ||
                          (StringFind(response, "\"success\":false") >= 0) ||
                          IsSyncJsonErrorResponse(response);
    if (has_json_error) {
      Print("Trades sync rejected by server payload! Response: ", response);
      g_LastError = "Server returned error payload";
      g_RetryDelaySeconds = (g_RetryDelaySeconds == 0) ? 2 : g_RetryDelaySeconds * 2;
      if (g_RetryDelaySeconds > 60) g_RetryDelaySeconds = 60;
      g_NextAllowedSyncTime = TimeCurrent() + g_RetryDelaySeconds;
      return false;
    }
    Print("Trades synced successfully! Count: ", tradeCount,
          " | Response: ", response);
    g_LastError = "";
    
    // Fix: Show ONLINE on successful sync
    g_IsConnected = true;
    ObjectSetString(0, "Sync_StatusVal", OBJPROP_TEXT, "CONNECTED");
    ObjectSetInteger(0, "Sync_StatusVal", OBJPROP_COLOR, C'0,200,0');
    ChartRedraw(0);

    g_RetryDelaySeconds = 0; // Reset
    g_NextAllowedSyncTime = 0;
    return true;
  } else if (res == 403) {
    string response = CharArrayToString(resultData, 0, WHOLE_ARRAY, CP_UTF8);
    ENUM_ACCOUNT_TRADE_MODE tradeMode = (ENUM_ACCOUNT_TRADE_MODE)AccountInfoInteger(ACCOUNT_TRADE_MODE);
    bool isReal = (tradeMode == ACCOUNT_TRADE_MODE_REAL);
    if (isReal && (StringFind(response, "BALANCE_TOO_LOW") >= 0 || StringFind(response, "INSUFFICIENT_BALANCE") >= 0)) {
      g_IsBalanceEligible = false;
      ShowChartWarning("Account requires minimum $200 to connect Trade Manager");
      g_LastError = "Balance < $200 USD";
      g_IsConnected = false;
      ObjectSetString(0, "Sync_StatusVal", OBJPROP_TEXT, "LOW BALANCE");
      ObjectSetInteger(0, "Sync_StatusVal", OBJPROP_COLOR, C'255,50,50');
      UpdateSyncBalanceDisplay();
      Print("[Trade Manager] Connection rejected: Account balance below $200 USD required.");
      ChartRedraw(0);
    } else {
      Print("[Trade Manager] ERROR 403: Account mismatch! ", response);
      g_LastError = "API Key mismatch";
      ClearChartStatus();
      ShowChartWarning("Connection rejected (Account mismatch)");
      g_IsConnected = false;
      ObjectSetString(0, "Sync_StatusVal", OBJPROP_TEXT, "OFFLINE");
      ObjectSetInteger(0, "Sync_StatusVal", OBJPROP_COLOR, C'255,50,50');
      ChartRedraw(0);
    }
    return false;
  } else if (res == 401) {
    Print("ERROR 401: Invalid API Key");
    g_LastError = "Invalid API Key";
    return false;
  } else if (res == 429) {
    //--- Rate Limited - Extract Retry-After if available
    int retryAfter = g_RateLimitSeconds; // Default
    int retryIdx = StringFind(resultHeaders, "Retry-After:");
    if (retryIdx >= 0) {
      int start = retryIdx + 13;
      string numStr = "";
      for (int i = start; i < StringLen(resultHeaders) && i < start + 5; i++) {
        string ch = StringSubstr(resultHeaders, i, 1);
        if (ch >= "0" && ch <= "9")
          numStr += ch;
        else if (ch == "\r" || ch == "\n")
          break;
      }
      if (numStr != "")
        retryAfter = (int)StringToInteger(numStr);
    }
    g_RateLimitUntil = TimeCurrent() + retryAfter;
    Print("ERROR 429: Rate limited. Retry after ", retryAfter,
          " seconds. Cooldown until: ", TimeToString(g_RateLimitUntil));
    g_LastError = "Rate limited (" + IntegerToString(retryAfter) + "s)";
     // Force update panel immediately
    return false;
  } else if (res == -1) {
    int error = GetLastError();
    Print("[Trade Sync] Trades sync failed. Error: ", error, " - ", ErrorDescription(error));
    g_LastError = ErrorDescription(error);
    if(error == 4014) {
       string warnMsg = "Error 4014: URL not allowed!\nPlease open MT5 -> Tools -> Options -> Experts tab\nand add: " + g_BaseUrl + "/";
       ShowChartWarning(warnMsg);
       PrintFormat("[Trade Sync] Error 4014: URL not allowed! Please open MT5 -> Tools -> Options -> Experts -> check 'Allow WebRequest for listed URL' and add: %s/", g_BaseUrl);
    } else {
       ShowChartWarning("Connection failed (" + g_LastError + ")");
    }

    g_RetryDelaySeconds = (g_RetryDelaySeconds == 0) ? 2 : g_RetryDelaySeconds * 2;
    if (g_RetryDelaySeconds > 60) g_RetryDelaySeconds = 60;
    g_NextAllowedSyncTime = TimeCurrent() + g_RetryDelaySeconds;

    return false;
  } else {
    string response = CharArrayToString(resultData, 0, WHOLE_ARRAY, CP_UTF8);
    string errDesc = TradeSync_FormatHttpErrorDescription(res);
    Print("Trades sync failed: ", errDesc, " (HTTP ", res, ") | Response: ", response);
    g_LastError = errDesc;

    g_RetryDelaySeconds = (g_RetryDelaySeconds == 0) ? 2 : g_RetryDelaySeconds * 2;
    if (g_RetryDelaySeconds > 60) g_RetryDelaySeconds = 60;
    g_NextAllowedSyncTime = TimeCurrent() + g_RetryDelaySeconds;

    return false;
  }
}

//+------------------------------------------------------------------+
//| Send trades payload to server directly (per spec Section 4.2)    |
//+------------------------------------------------------------------+
bool SendTradesPayload(string apiUrl, string apiKey, string fullJson) {
  if (apiKey == "") {
    g_LastError = "API Key is empty.";
    return false;
  }
  string cleanUrl = apiUrl;
  StringTrimLeft(cleanUrl);
  StringTrimRight(cleanUrl);
  while (StringLen(cleanUrl) > 0 &&
         StringSubstr(cleanUrl, StringLen(cleanUrl) - 1, 1) == "/") {
    cleanUrl = StringSubstr(cleanUrl, 0, StringLen(cleanUrl) - 1);
  }
  string lowerClean = cleanUrl;
  StringToLower(lowerClean);
  if (cleanUrl == "" || lowerClean == "http:" || lowerClean == "https:") {
    g_LastError = "Server URL is empty.";
    return false;
  }
  string url = cleanUrl;
  if (StringFind(url, "/api/ea/trades") < 0) {
    url = cleanUrl + "/api/ea/trades";
  }
  string headers = "Content-Type: application/json\r\n" +
                   "X-Sync-Key: " + apiKey + "\r\n" +
                   "X-API-Key: " + apiKey + "\r\n";
  char data[];
  char resultData[];
  string resultHeaders;
  StringToCharArray(fullJson, data, 0, WHOLE_ARRAY, CP_UTF8);
  ArrayResize(data, ArraySize(data) - 1);
  ResetLastError();
  int sendTimeout = (StringFind(url, "localhost") >= 0 || StringFind(url, "127.0.0.1") >= 0) ? 1500 : 4000;
  int res = WebRequest("POST", url, headers, sendTimeout, data, resultData, resultHeaders);
  if (res == 200 || res == 201) {
    string response = CharArrayToString(resultData, 0, WHOLE_ARRAY, CP_UTF8);
    bool has_json_error = (StringFind(response, "\"error\":") >= 0 && StringFind(response, "\"error\":null") < 0 && StringFind(response, "\"error\":\"\"") < 0) ||
                          (StringFind(response, "\"success\":false") >= 0) ||
                          IsSyncJsonErrorResponse(response);
    if (!has_json_error) {
      g_LastError = "";
      return true;
    }
    g_LastError = "Server returned error payload";
    return false;
  }
  int err = GetLastError();
  g_LastError = (err != 0) ? ErrorDescription(err) : ("HTTP " + IntegerToString(res));
  PrintFormat("[Trade Sync] SendTradesPayload failed | HTTP: %d | Err: %d - %s", res, err, g_LastError);
  return false;
}

//+------------------------------------------------------------------+
//| Sync Recent Trades (Manual trigger)                              |
//+------------------------------------------------------------------+
//+------------------------------------------------------------------+
//| Sync Recent Trades (Manual trigger)                              |
//+------------------------------------------------------------------+
int SyncRecentTrades(int days) {
  if (days < 1)
    days = 1;

  // Calculate start of today (Broker time 00:00:00)
  datetime now = TimeCurrent();
  datetime todayStart = StringToTime(TimeToString(now, TIME_DATE));

  // Calculate start date (N days ago, inclusive)
  datetime startTime = todayStart - (days - 1) * 24 * 60 * 60;
  datetime endTime = TimeCurrent(); // Up to now

  Print("Syncing recent trades (Last ", days, " days) from ",
        TimeToString(startTime), " to ", TimeToString(endTime));

  return SyncDateRange(startTime, endTime);
}

//+------------------------------------------------------------------+
//| Prepare trades for background syncing                            |
//+------------------------------------------------------------------+
int PrepareBackgroundSync(ulong &tickets[]) {
   int count = ArraySize(tickets);
   if (count == 0) return 0;
   
   ArrayResize(g_SyncTickets, count);
   for (int i = 0; i < count; i++) {
      g_SyncTickets[i] = tickets[i];
   }
   
   g_SyncTotal = count;
   g_SyncIndex = 0;
   g_IsSyncing = true;
   
   Print("Background Sync Prepared: ", count, " trades.");
   return count;
}

//+------------------------------------------------------------------+
//| Process a batch of trades for background syncing                 |
//+------------------------------------------------------------------+
void ProcessSyncBatch() {
   if (!g_IsSyncing || g_SyncIndex >= g_SyncTotal) {
      g_IsSyncing = false;
      return;
   }
   
    int remaining = g_SyncTotal - g_SyncIndex;
   int batchCount = MathMin(g_SyncBatchSize, remaining);
   
   string tradesJson = "[";
   bool first = true;
   ulong currentChunkMaxTicket = 0;
   int validCount = 0;
   
   for (int i = 0; i < batchCount; i++) {
      ulong dealTicket = g_SyncTickets[g_SyncIndex + i];
      if (dealTicket > currentChunkMaxTicket) currentChunkMaxTicket = dealTicket;
      
      if (!HistoryDealSelect(dealTicket)) {
         HistorySelect(0, TimeCurrent());
         if (!HistoryDealSelect(dealTicket)) {
            Print("Warning: Deal ", dealTicket, " not found in history.");
            continue;
         }
      }

      string tradeObj = BuildTradeJson(dealTicket);
      if (tradeObj == "") continue;

      if (!first) tradesJson += ",";
      first = false;
      tradesJson += tradeObj;
      validCount++;
   }
   
   tradesJson += "]";
   
   if (validCount == 0) {
      g_SyncIndex += batchCount;
      if (g_SyncIndex >= g_SyncTotal) {
         g_IsSyncing = false;
         g_SyncResultMsg = "SYNC COMPLETE!";
         g_SyncResultTime = TimeCurrent();
         Print("Background sync completed.");
      }
      return;
   }

   string json = BuildTradesEnvelopeJson(tradesJson, g_AccountNumber);
      
   if (SendTradesToServer(json, validCount)) {
      string gvName = "GSN_MaxTicket_" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN));
      ulong maxTicket = 0;
      if (GlobalVariableCheck(gvName)) maxTicket = (ulong)GlobalVariableGet(gvName);
      if (currentChunkMaxTicket > maxTicket) {
         GlobalVariableSet(gvName, (double)currentChunkMaxTicket);
      }

      g_SyncIndex += batchCount;
      g_TotalSynced += validCount;
      g_LastSyncTime = TimeCurrent();
      g_LastSyncStatus = TimeToString(TimeCurrent(), TIME_DATE | TIME_MINUTES);
      if(ObjectFind(0, "Sync_TotalVal") >= 0) ObjectSetString(0, "Sync_TotalVal", OBJPROP_TEXT, IntegerToString(g_TotalSynced));
      string lastSyncDisp = (g_LastSyncStatus == "" || g_LastSyncStatus == "WAIT" || g_LastSyncStatus == "Not synced yet") 
                            ? ("WAIT (" + IntegerToString(g_TotalSynced) + " Deals)") 
                            : (g_LastSyncStatus + " (" + IntegerToString(g_TotalSynced) + " Deals)");
      if(ObjectFind(0, "Sync_LastSyncVal") >= 0) ObjectSetString(0, "Sync_LastSyncVal", OBJPROP_TEXT, lastSyncDisp);
      ChartRedraw(0);
      
      Print("Batch synced successfully: ", validCount, " trades. Progress: ", g_SyncIndex, "/", g_SyncTotal);
      
      if (g_SyncIndex >= g_SyncTotal) {
         g_IsSyncing = false;
         g_SyncResultMsg = "SYNC COMPLETE!";
         g_SyncResultTime = TimeCurrent();
         Print("Background sync completed.");
      }
   } else {
      Print("Batch sync failed, will retry on next timer tick.");
   }
}

//+------------------------------------------------------------------+
//| Sync All History (Full sync)                                     |
//+------------------------------------------------------------------+
int SyncAllHistory() {
  if (!g_IsConnected || !g_IsBalanceEligible) {
    g_LastError = !g_IsBalanceEligible ? "Balance < $200 USD required" : "Not connected to server";
    Print("[Trade Sync] Sync aborted: ", g_LastError);
    return -1;
  }
  //--- Select all history from account creation
  if (!HistorySelect(0, TimeCurrent())) {
    g_LastError = "Failed to select history";
    return -1;
  }

  int total = HistoryDealsTotal();
  Print("Scanning ", total, " total deals...");

  string gvName = "GSN_MaxTicket_" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN));
  ulong maxTicket = 0;
  if (GlobalVariableCheck(gvName)) {
      maxTicket = (ulong)GlobalVariableGet(gvName);
  }

  //--- PASS 1: Collect unique closing deal data (deduplicated by Position ID)
  ulong closingTickets[];
  long closingPositionIds[];
  ArrayResize(closingTickets, 0);
  ArrayResize(closingPositionIds, 0);

  for (int pass = 0; pass < 2; pass++) {
    for (int i = 0; i < total; i++) {
      ulong ticket = HistoryDealGetTicket(i);

      if (ticket > maxTicket) {
        ENUM_DEAL_ENTRY entry =
            (ENUM_DEAL_ENTRY)HistoryDealGetInteger(ticket, DEAL_ENTRY);

        //--- Only collect closing deals
        if (entry == DEAL_ENTRY_OUT || entry == DEAL_ENTRY_INOUT || entry == DEAL_ENTRY_OUT_BY) {
          long posId = HistoryDealGetInteger(ticket, DEAL_POSITION_ID);
          if (posId <= 0) continue;
          int existingIdx = -1;
          for (int k = 0; k < ArraySize(closingPositionIds); k++) {
            if (closingPositionIds[k] == posId) {
              existingIdx = k;
              break;
            }
          }
          if (existingIdx >= 0) {
            datetime newTime = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);
            datetime oldTime = (datetime)HistoryDealGetInteger(closingTickets[existingIdx], DEAL_TIME);
            if (newTime > oldTime || (newTime == oldTime && ticket > closingTickets[existingIdx])) {
              closingTickets[existingIdx] = ticket;
            }
          } else {
            int idx = ArraySize(closingTickets);
            ArrayResize(closingTickets, idx + 1);
            ArrayResize(closingPositionIds, idx + 1);
            closingTickets[idx] = ticket;
            closingPositionIds[idx] = posId;
          }
        }
      }
    }

    if (ArraySize(closingTickets) > 0 || maxTicket == 0) {
      break;
    }
    // If no new deals above maxTicket exist on a manual Sync All, re-sync full history
    maxTicket = 0;
  }

  int closingCount = ArraySize(closingTickets);
  Print("Collected ", closingCount, " unique closing positions for processing");

  if (closingCount == 0) {
    Print("No closing trades found");
    return 0;
  }

  //--- PASS 2: Pass to background processor
  PrepareBackgroundSync(closingTickets);
  return closingCount;
}


//+------------------------------------------------------------------+
//| Escape special characters for JSON string                        |
//+------------------------------------------------------------------+
string EscapeJsonString(string str) {
  string result = str;
  StringReplace(result, "\\", "\\\\");
  StringReplace(result, "\"", "\\\"");
  StringReplace(result, "\n", "\\n");
  StringReplace(result, "\r", "\\r");
  StringReplace(result, "\t", "\\t");
  return result;
}

//+------------------------------------------------------------------+
//| Get error description                                            |
//+------------------------------------------------------------------+
string ErrorDescription(int errorCode) {
  switch (errorCode) {
  case 4014:
    return "URL not allowed in Expert Advisors settings";
  case 4024:
    return "WebRequest failed";
  case 5200:
    return "Invalid URL";
  case 5201:
    return "Failed to connect to server";
  case 5202:
    return "Timeout";
  case 5203:
    return "Server error";
  default:
    return "Unknown error";
  }
}

//+------------------------------------------------------------------+
//| Standalone OOP Wrapper for Drop-in Integration Across All EAs    |
//+------------------------------------------------------------------+
class CGSNTradeSyncEngine {
public:
   CGSNTradeSyncEngine() {}
   ~CGSNTradeSyncEngine() {
      if (g_IsEngineInitialized) {
         TradeSync_OnDeinit(0);
      }
   }

   void Init(
      string apiKey,
      string apiUrl,
      string productSlug = "",
      string eaName = "",
      string eaVersion = "2.4.0",
      int heartbeatInterval = 300,
      int syncDelay = 5
   ) {
      TradeSync_Init(apiKey, apiUrl, productSlug, eaName, eaVersion, heartbeatInterval, syncDelay);
   }

   void OnDeinit(const int reason = 0) {
      TradeSync_OnDeinit(reason);
   }

   void OnTimer() {
      TradeSync_EnsureAutoInit();
      TradeSync_OnTimer();
   }

   void OnTick() {
      TradeSync_OnTick();
   }

   void OnTradeTransaction(
      const MqlTradeTransaction &trans,
      const MqlTradeRequest &request,
      const MqlTradeResult &result
   ) {
      TradeSync_OnTradeTransaction(trans, request, result);
   }

   bool SendHeartbeatNow() {
      TradeSync_EnsureAutoInit();
      SendHeartbeat();
      return g_IsConnected;
   }

   int SyncFullHistory() {
      TradeSync_EnsureAutoInit();
      return SyncAllHistory();
   }

   int SyncCustomDateRange(datetime fromDate, datetime toDate) {
      TradeSync_EnsureAutoInit();
      return SyncDateRange(fromDate, toDate);
   }

   bool IsConnected() const { return g_IsConnected; }
   bool IsBalanceEligible() const { return g_IsBalanceEligible; }
   bool IsSyncing() const { return g_IsSyncing; }
   int GetTotalSynced() const { return g_TotalSynced; }
   string GetLastError() const { return g_LastError; }
   string GetProductSlug() const { return g_TradeSync_ProductSlug; }
   string GetEaName() const { return g_TradeSync_EaName; }
   string GetEaVersion() const { return g_TradeSync_EaVersion; }
};

CGSNTradeSyncEngine g_GSNTradeSync;

//--- Optional Zero-Touch Auto-Hook Mode (#define GSN_AUTO_TELEMETRY before #include)
#ifdef GSN_AUTO_TELEMETRY
#ifndef GSN_TELEMETRY_NO_AUTO_INPUTS
input string InpGSNTelemetrySection = "========== GSN Telemetry & Sync ==========";
input string InpGSNSyncApiKey       = "";                          // Trade Sync API Key (Blank = auto-load cached key)
input string InpGSNSyncApiUrl       = "http://127.0.0.1:3500/";    // Trade Sync Server URL
#endif

void GSN_Host_OnTick();
void OnTick() {
#ifndef GSN_TELEMETRY_NO_AUTO_INPUTS
   if (!g_IsEngineInitialized) {
      if (InpGSNSyncApiKey != "" && g_TradeSync_ApiKey == "") g_TradeSync_ApiKey = InpGSNSyncApiKey;
      if (InpGSNSyncApiUrl != "" && g_TradeSync_ApiUrl == "") g_TradeSync_ApiUrl = InpGSNSyncApiUrl;
   }
#endif
   g_GSNTradeSync.OnTick();
   GSN_Host_OnTick();
}
#define OnTick GSN_Host_OnTick
#endif // GSN_AUTO_TELEMETRY

#endif // __GSN_EA_TELEMETRY_MQH__
//+------------------------------------------------------------------+

