//+------------------------------------------------------------------+
//|                                                GSN_TradeSync.mq5 |
//|                                     Copyright 2026, GSN Platform |
//|                                       https://gsn-crm.vercel.app |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, GSN Platform"
#property link "https://gsn-crm.vercel.app"
#property version "1.05"
#property description "Auto sync closed trades to GSN Trading Journal"

//--- Input parameters
input string InpApiKey =
    "7f354055-b66a637f-2cdb0a8d-79a21638-df7d11c9-2e2f6269"; // API Key from GSN
                                                             // Dashboard
input string InpApiUrl = "http://127.0.0.1:3000";            // Server URL
input int InpHeartbeatInterval = 300; // Heartbeat interval (seconds)
input int InpSyncDelay = 5;           // Delay after trade close (seconds)
input bool InpShowPanel = true;       // Show Status Panel
input int InpPanelX = 20;             // Panel X Position
input int InpPanelY = 30;             // Panel Y Position

//--- Global variables
datetime g_LastHeartbeat = 0;
datetime g_LastTradeCheck = 0;
datetime g_LastSyncTime = 0;
int g_LastHistoryTotal = 0;
bool g_IsConnected = false;
string g_AccountNumber = "";
int g_TotalSynced = 0;
string g_LastError = "";
string g_LastSyncStatus = "Not synced yet";
string g_BaseUrl = "";          // Normalized base URL
bool g_ShowPeriodPopup = false; // Period selection popup visible
datetime g_RateLimitUntil = 0;  // Rate limit cooldown timestamp
int g_RateLimitSeconds = 60;    // Default cooldown (seconds)

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
#define CLR_EDIT_BG C'16,16,22'        // Input background
#define CLR_DIVIDER C'45,45,58'        // Subtle divider

//--- Additional panel objects for premium look
#define PANEL_HEADER_BG "GSN_HeaderBG"
#define PANEL_HEADER_LINE "GSN_HeaderLine"
#define PANEL_DIVIDER1 "GSN_Divider1"
#define PANEL_DIVIDER2 "GSN_Divider2"
#define PANEL_STATUS_DOT "GSN_StatusDot"
#define PANEL_LOGO "GSN_Logo"

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit() {
  //--- Validate API key
  if (InpApiKey == "") {
    Alert("GSN Trade Sync: Please enter your API Key!");
    Print("Error: API Key is required. Get it from GSN Dashboard > Trading "
          "Accounts");
    return (INIT_FAILED);
  }

  //--- Normalize base URL (remove trailing slash)
  g_BaseUrl = InpApiUrl;
  while (StringLen(g_BaseUrl) > 0 &&
         StringSubstr(g_BaseUrl, StringLen(g_BaseUrl) - 1, 1) == "/") {
    g_BaseUrl = StringSubstr(g_BaseUrl, 0, StringLen(g_BaseUrl) - 1);
  }

  //--- Store account number for validation
  g_AccountNumber = IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN));

  //--- Initial Sync Check
  if (InpSyncDelay > 0)
    EventSetTimer(1); // 1 second timer for UI and checks

  //--- Show initialization info
  Print("==============================================");
  Print("GSN Trade Sync EA v1.05 initialized");
  Print("Account: ", g_AccountNumber);
  Print("Broker: ", AccountInfoString(ACCOUNT_COMPANY));
  Print("Server: ", AccountInfoString(ACCOUNT_SERVER));
  Print("API Key: ", StringSubstr(InpApiKey, 0, 8), "...");
  Print("==============================================");

  //--- Create UI Panel
  if (InpShowPanel)
    CreatePanel();

  return (INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason) {
  EventKillTimer();
  DeletePanel();
  DeletePeriodPopup();
  Print("GSN Trade Sync EA stopped. Reason: ", reason);
}

//+------------------------------------------------------------------+
//| Timer function                                                   |
//+------------------------------------------------------------------+
void OnTimer() {
  // UI Update
  if (InpShowPanel)
    UpdatePanel();

  // Heartbeat check
  if (TimeCurrent() - g_LastHeartbeat >= InpHeartbeatInterval) {
    SendHeartbeat();
  }

  // Remote Command Poll (Every 5 seconds)
  static datetime lastPoll = 0;
  if (TimeCurrent() - lastPoll >= 5) {
    CheckRemoteCommands();
    lastPoll = TimeCurrent();
  }
}

//+------------------------------------------------------------------+
//| Check Remote Commands (Spec 14)                                  |
//+------------------------------------------------------------------+
void CheckRemoteCommands() {
  string url = g_BaseUrl + "/api/ea/commands/pending";
  string headers =
      "X-API-Key: " + InpApiKey + "\r\nContent-Type: application/json";
  char postData[];
  char result[];
  string resultHeaders;

  int res =
      WebRequest("GET", url, headers, 1000, postData, result, resultHeaders);

  if (res == 200) {
    string json = CharArrayToString(result);

    // Simple JSON parsing to find command ID and Type
    // Note: MQL5 doesn't have native JSON, doing basic string search for this
    // example In production, use a proper JSON parser lib

    // Check if we have a command
    int cmdIdx = StringFind(json, "\"id\":\"");
    if (cmdIdx > 0) {
      string cmdId = ExtractJsonValue(json, "id");
      string type = ExtractJsonValue(json, "type");

      Print("Received Remote Command: ", type, " (ID: ", cmdId, ")");

      // Process Command
      bool success = false;
      string msg = "";
      int syncedCount = 0;

      if (type == "SYNC_TRADES" || type == "SYNC_ALL") {
        // Parse params from JSON
        // Format: {"params":{"days":30}} or
        // {"params":{"fromDate":"2025.01.01","toDate":"2025.01.31"}}

        if (type == "SYNC_ALL") {
          Print("Remote: Syncing entire history...");
          syncedCount = SyncAllHistory();
        } else {
          // Check for custom date range first
          string fromDate = ExtractJsonValue(json, "fromDate");
          string toDate = ExtractJsonValue(json, "toDate");

          if (fromDate != "" && toDate != "") {
            // Custom date range sync
            datetime dtFrom = StringToTime(fromDate);
            datetime dtTo =
                StringToTime(toDate) + 24 * 60 * 60; // Include end date
            Print("Remote: Syncing date range ", fromDate, " to ", toDate);
            syncedCount = SyncDateRange(dtFrom, dtTo);
          } else {
            // Days-based sync
            int days = ExtractJsonInt(json, "days", 7); // Default 7 days
            Print("Remote: Syncing last ", days, " days...");
            syncedCount = SyncRecentTrades(days);
          }
        }

        if (syncedCount >= 0) {
          success = true;
          msg =
              "Synced " + IntegerToString(syncedCount) + " trades successfully";
        } else {
          success = false;
          msg = g_LastError;
        }
      } else if (type == "TEST_CONNECTION") {
        SendHeartbeat();
        success = g_IsConnected;
        msg = g_IsConnected ? "Connection OK" : "Connection Failed";
      }

      // Report Result
      ReportCommandResult(cmdId, success, msg, syncedCount);
    }
  }
}

//+------------------------------------------------------------------+
//| Report Command Result                                            |
//+------------------------------------------------------------------+
void ReportCommandResult(string cmdId, bool success, string message,
                         int count) {
  string url = g_BaseUrl + "/api/ea/commands/" + cmdId;
  string headers =
      "X-API-Key: " + InpApiKey + "\r\nContent-Type: application/json";

  string status = success ? "COMPLETED" : "FAILED";
  string json = "{\"status\":\"" + status +
                "\", \"result\":{\"success\":" + (success ? "true" : "false") +
                ", \"message\":\"" + message +
                "\", \"syncedCount\":" + IntegerToString(count) + "}}";

  if (!success) {
    json = "{\"status\":\"FAILED\", \"errorMessage\":\"" + message + "\"}";
  }

  char postData[];
  StringToCharArray(json, postData, 0, StringLen(json), CP_UTF8);
  char result[];
  string resultHeaders;

  WebRequest("PATCH", url, headers, 3000, postData, result, resultHeaders);
  Print("Reported command result: ", status);
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

void CreatePanel() {
  int panelWidth = 280;
  int panelHeight = 310; // Increased for rate limit text
  int x = InpPanelX;
  int y = InpPanelY;
  int padding = 16;
  int rowHeight = 28;

  //--- Main Panel Background with rounded corner effect
  ObjectCreate(0, PANEL_BG, OBJ_RECTANGLE_LABEL, 0, 0, 0);
  ObjectSetInteger(0, PANEL_BG, OBJPROP_XDISTANCE, x);
  ObjectSetInteger(0, PANEL_BG, OBJPROP_YDISTANCE, y);
  ObjectSetInteger(0, PANEL_BG, OBJPROP_XSIZE, panelWidth);
  ObjectSetInteger(0, PANEL_BG, OBJPROP_YSIZE, panelHeight);
  ObjectSetInteger(0, PANEL_BG, OBJPROP_BGCOLOR, CLR_PANEL_BG);
  ObjectSetInteger(0, PANEL_BG, OBJPROP_BORDER_COLOR, CLR_PANEL_BORDER);
  ObjectSetInteger(0, PANEL_BG, OBJPROP_BORDER_TYPE, BORDER_FLAT);
  ObjectSetInteger(0, PANEL_BG, OBJPROP_CORNER, CORNER_LEFT_UPPER);
  ObjectSetInteger(0, PANEL_BG, OBJPROP_WIDTH, 1);
  ObjectSetInteger(0, PANEL_BG, OBJPROP_BACK, false);
  ObjectSetInteger(0, PANEL_BG, OBJPROP_SELECTABLE, false);

  //--- Header area (no colored bar - minimal design)
  ObjectCreate(0, PANEL_HEADER_BG, OBJ_RECTANGLE_LABEL, 0, 0, 0);
  ObjectSetInteger(0, PANEL_HEADER_BG, OBJPROP_XDISTANCE, x + 1);
  ObjectSetInteger(0, PANEL_HEADER_BG, OBJPROP_YDISTANCE, y + 1);
  ObjectSetInteger(0, PANEL_HEADER_BG, OBJPROP_XSIZE, panelWidth - 2);
  ObjectSetInteger(0, PANEL_HEADER_BG, OBJPROP_YSIZE, 42);
  ObjectSetInteger(0, PANEL_HEADER_BG, OBJPROP_BGCOLOR, CLR_HEADER_BG);
  ObjectSetInteger(0, PANEL_HEADER_BG, OBJPROP_BORDER_TYPE, BORDER_FLAT);
  ObjectSetInteger(0, PANEL_HEADER_BG, OBJPROP_CORNER, CORNER_LEFT_UPPER);
  ObjectSetInteger(0, PANEL_HEADER_BG, OBJPROP_BACK, false);
  ObjectSetInteger(0, PANEL_HEADER_BG, OBJPROP_SELECTABLE, false);

  //--- Green accent line at top (3px)
  CreateDivider(PANEL_HEADER_LINE, x + 1, y + 1, panelWidth - 2);
  ObjectSetInteger(0, PANEL_HEADER_LINE, OBJPROP_YSIZE, 3);
  ObjectSetInteger(0, PANEL_HEADER_LINE, OBJPROP_BGCOLOR, CLR_ACCENT);

  //--- Header Title with icon
  CreateLabel(PANEL_HEADER, x + padding, y + 15, "GSN TRADE SYNC",
              CLR_HEADER_TEXT, 11, true);

  //--- Version badge (right aligned)
  CreateLabel(PANEL_LOGO, x + panelWidth - 48, y + 17, "v1.05", CLR_LABEL, 9,
              false);

  //--- Content area starts after header
  int contentY = y + 50;

  //--- Status Row with dot indicator
  CreateLabel(PANEL_STATUS_LABEL, x + padding, contentY, "Status", CLR_LABEL,
              10, false);
  CreateStatusDot(PANEL_STATUS_DOT, x + panelWidth - padding - 95,
                  contentY + 1);
  CreateLabel(PANEL_STATUS_VALUE, x + panelWidth - padding - 82, contentY,
              "Checking...", CLR_WARNING, 10, true);
  contentY += rowHeight;

  //--- Account Row
  CreateLabel(PANEL_ACCOUNT_LABEL, x + padding, contentY, "Account", CLR_LABEL,
              10, false);
  CreateLabel(PANEL_ACCOUNT_VALUE, x + panelWidth - padding - 95, contentY,
              "#" + g_AccountNumber, CLR_VALUE, 10, true);
  contentY += rowHeight;

  //--- Trades Synced Row
  CreateLabel(PANEL_SYNCED_LABEL, x + padding, contentY, "Trades Synced",
              CLR_LABEL, 10, false);
  CreateLabel(PANEL_SYNCED_VALUE, x + panelWidth - padding - 30, contentY, "0",
              CLR_ACCENT, 11, true);
  contentY += rowHeight;

  //--- Last Sync Row
  CreateLabel(PANEL_LASTSYNC_LABEL, x + padding, contentY, "Last Sync",
              CLR_LABEL, 10, false);
  CreateLabel(PANEL_LASTSYNC_VALUE, x + panelWidth - padding - 55, contentY,
              "Never", CLR_VALUE, 10, false);
  contentY += rowHeight + 4;

  //--- Divider line before buttons
  CreateDivider(PANEL_DIVIDER1, x + padding, contentY,
                panelWidth - padding * 2);
  contentY += 12;

  //--- Rate Limit Warning (above buttons, hidden by default)
  CreateLabel(PANEL_RATELIMIT, x + padding, contentY, " ", CLR_WARNING, 9,
              true);
  contentY += 16;

  //--- Error Row (hidden by default)
  CreateLabel(PANEL_ERROR_VALUE, x + padding, contentY, " ", CLR_DISCONNECTED,
              9, false);

  //--- Buttons section
  int btnY = contentY + 4;
  int btnWidth = panelWidth - padding * 2;
  int btnHeight = 36;
  int btnGap = 8;

  CreatePremiumButton(BTN_TEST_CONNECTION, x + padding, btnY, btnWidth,
                      btnHeight, "Test Connection", false);
  CreatePremiumButton(BTN_SYNC_TRADES, x + padding, btnY + btnHeight + btnGap,
                      btnWidth, btnHeight, "Sync Trades", true);

  //--- Second divider (not used in new design)
  ObjectCreate(0, PANEL_DIVIDER2, OBJ_RECTANGLE_LABEL, 0, 0, 0);
  ObjectSetInteger(0, PANEL_DIVIDER2, OBJPROP_XDISTANCE, -100);
  ObjectSetInteger(0, PANEL_DIVIDER2, OBJPROP_YDISTANCE, -100);
  ObjectSetInteger(0, PANEL_DIVIDER2, OBJPROP_XSIZE, 1);
  ObjectSetInteger(0, PANEL_DIVIDER2, OBJPROP_YSIZE, 1);

  ChartRedraw();
}

//+------------------------------------------------------------------+
//| Create Status Dot Indicator                                      |
//+------------------------------------------------------------------+
void CreateStatusDot(string name, int x, int y) {
  ObjectCreate(0, name, OBJ_LABEL, 0, 0, 0);
  ObjectSetInteger(0, name, OBJPROP_XDISTANCE, x);
  ObjectSetInteger(0, name, OBJPROP_YDISTANCE, y);
  ObjectSetInteger(0, name, OBJPROP_COLOR, CLR_WARNING);
  ObjectSetInteger(0, name, OBJPROP_FONTSIZE, 10);
  ObjectSetString(0, name, OBJPROP_FONT, "Wingdings");
  ObjectSetString(0, name, OBJPROP_TEXT, CharToString(108)); // Circle dot
  ObjectSetInteger(0, name, OBJPROP_CORNER, CORNER_LEFT_UPPER);
  ObjectSetInteger(0, name, OBJPROP_SELECTABLE, false);
}

//+------------------------------------------------------------------+
//| Create Divider Line                                              |
//+------------------------------------------------------------------+
void CreateDivider(string name, int x, int y, int width) {
  ObjectCreate(0, name, OBJ_RECTANGLE_LABEL, 0, 0, 0);
  ObjectSetInteger(0, name, OBJPROP_XDISTANCE, x);
  ObjectSetInteger(0, name, OBJPROP_YDISTANCE, y);
  ObjectSetInteger(0, name, OBJPROP_XSIZE, width);
  ObjectSetInteger(0, name, OBJPROP_YSIZE, 1);
  ObjectSetInteger(0, name, OBJPROP_BGCOLOR, CLR_DIVIDER);
  ObjectSetInteger(0, name, OBJPROP_BORDER_TYPE, BORDER_FLAT);
  ObjectSetInteger(0, name, OBJPROP_CORNER, CORNER_LEFT_UPPER);
  ObjectSetInteger(0, name, OBJPROP_SELECTABLE, false);
}

//+------------------------------------------------------------------+
//| Create Premium Button                                            |
//+------------------------------------------------------------------+
void CreatePremiumButton(string name, int x, int y, int width, int height,
                         string text, bool isPrimary) {
  ObjectCreate(0, name, OBJ_BUTTON, 0, 0, 0);
  ObjectSetInteger(0, name, OBJPROP_XDISTANCE, x);
  ObjectSetInteger(0, name, OBJPROP_YDISTANCE, y);
  ObjectSetInteger(0, name, OBJPROP_XSIZE, width);
  ObjectSetInteger(0, name, OBJPROP_YSIZE, height);

  if (isPrimary) {
    ObjectSetInteger(0, name, OBJPROP_BGCOLOR, CLR_ACCENT);
    ObjectSetInteger(0, name, OBJPROP_COLOR, C'10,10,15');
    ObjectSetInteger(0, name, OBJPROP_BORDER_COLOR, CLR_ACCENT);
  } else {
    ObjectSetInteger(0, name, OBJPROP_BGCOLOR, CLR_BTN_BG);
    ObjectSetInteger(0, name, OBJPROP_COLOR, CLR_VALUE);
    ObjectSetInteger(0, name, OBJPROP_BORDER_COLOR, CLR_BTN_BORDER);
  }

  ObjectSetInteger(0, name, OBJPROP_FONTSIZE, 10);
  ObjectSetString(0, name, OBJPROP_FONT, "Segoe UI Semibold");
  ObjectSetString(0, name, OBJPROP_TEXT, text);
  ObjectSetInteger(0, name, OBJPROP_CORNER, CORNER_LEFT_UPPER);
  ObjectSetInteger(0, name, OBJPROP_SELECTABLE, false);
}

//+------------------------------------------------------------------+
//| Create Period Selection Popup - Premium Design                   |
//+------------------------------------------------------------------+
void CreatePeriodPopup() {
  if (g_ShowPeriodPopup)
    return;

  int popupWidth = 260;
  int popupHeight = 420;
  int x = InpPanelX + 290; // Position next to main panel
  int y = InpPanelY;
  int padding = 14;

  //--- Popup Background
  ObjectCreate(0, POPUP_BG, OBJ_RECTANGLE_LABEL, 0, 0, 0);
  ObjectSetInteger(0, POPUP_BG, OBJPROP_XDISTANCE, x);
  ObjectSetInteger(0, POPUP_BG, OBJPROP_YDISTANCE, y);
  ObjectSetInteger(0, POPUP_BG, OBJPROP_XSIZE, popupWidth);
  ObjectSetInteger(0, POPUP_BG, OBJPROP_YSIZE, popupHeight);
  ObjectSetInteger(0, POPUP_BG, OBJPROP_BGCOLOR, CLR_POPUP_BG);
  ObjectSetInteger(0, POPUP_BG, OBJPROP_BORDER_COLOR, CLR_PANEL_BORDER);
  ObjectSetInteger(0, POPUP_BG, OBJPROP_BORDER_TYPE, BORDER_FLAT);
  ObjectSetInteger(0, POPUP_BG, OBJPROP_CORNER, CORNER_LEFT_UPPER);
  ObjectSetInteger(0, POPUP_BG, OBJPROP_WIDTH, 1);
  ObjectSetInteger(0, POPUP_BG, OBJPROP_BACK, false);
  ObjectSetInteger(0, POPUP_BG, OBJPROP_SELECTABLE, false);

  //--- Green accent line at top
  CreateDivider("GSN_PopupAccent", x + 1, y + 1, popupWidth - 2);
  ObjectSetInteger(0, "GSN_PopupAccent", OBJPROP_YSIZE, 3);
  ObjectSetInteger(0, "GSN_PopupAccent", OBJPROP_BGCOLOR, CLR_ACCENT);

  //--- Title
  CreateLabel(POPUP_TITLE, x + padding, y + 14, "Select Period", CLR_VALUE, 11,
              true);

  //--- Close button (minimal style)
  CreatePremiumButton(POPUP_CLOSE, x + popupWidth - 32, y + 8, 24, 24, "x",
                      false);
  ObjectSetInteger(0, POPUP_CLOSE, OBJPROP_BGCOLOR, CLR_BTN_BG);
  ObjectSetInteger(0, POPUP_CLOSE, OBJPROP_BORDER_COLOR, CLR_BTN_BORDER);
  ObjectSetInteger(0, POPUP_CLOSE, OBJPROP_COLOR, CLR_LABEL);
  ObjectSetInteger(0, POPUP_CLOSE, OBJPROP_FONTSIZE, 10);

  //--- Period Buttons (compact layout)
  int btnY = y + 44;
  int btnHeight = 34;
  int btnSpacing = 38;
  int btnWidth = popupWidth - padding * 2;

  CreatePopupButton(BTN_TODAY, x + padding, btnY, btnWidth, btnHeight, "Today");
  btnY += btnSpacing;

  CreatePopupButton(BTN_3DAYS, x + padding, btnY, btnWidth, btnHeight,
                    "Last 3 Days");
  btnY += btnSpacing;

  CreatePopupButton(BTN_WEEK, x + padding, btnY, btnWidth, btnHeight,
                    "Last Week");
  btnY += btnSpacing;

  CreatePopupButton(BTN_MONTH, x + padding, btnY, btnWidth, btnHeight,
                    "Last Month");
  btnY += btnSpacing;

  CreatePopupButton(BTN_3MONTHS, x + padding, btnY, btnWidth, btnHeight,
                    "Last 3 Months");
  btnY += btnSpacing;

  CreatePopupButton(BTN_6MONTHS, x + padding, btnY, btnWidth, btnHeight,
                    "Last 6 Months");
  btnY += btnSpacing;

  //--- Entire History (warning style)
  CreatePopupButton(BTN_ALL, x + padding, btnY, btnWidth, btnHeight,
                    "Entire History");
  ObjectSetInteger(0, BTN_ALL, OBJPROP_BGCOLOR, C'45,28,28');
  ObjectSetInteger(0, BTN_ALL, OBJPROP_BORDER_COLOR, C'80,45,45');
  ObjectSetInteger(0, BTN_ALL, OBJPROP_COLOR, C'255,180,180');
  btnY += btnSpacing + 6;

  //--- Divider
  CreateDivider("GSN_PopupDivider", x + padding, btnY, btnWidth);
  btnY += 10;

  //--- Custom Date Section
  CreateLabel(LABEL_CUSTOM, x + padding, btnY, "Custom Range", CLR_LABEL, 9,
              false);
  btnY += 22;

  //--- Date inputs row
  CreateLabel("GSN_LabelFrom", x + padding, btnY + 4, "From", CLR_LABEL, 9,
              false);
  CreatePremiumEdit(EDIT_FROM, x + padding + 38, btnY, 75, 24,
                    TimeToString(TimeCurrent() - 7 * 24 * 60 * 60, TIME_DATE));

  CreateLabel("GSN_LabelTo", x + padding + 122, btnY + 4, "To", CLR_LABEL, 9,
              false);
  CreatePremiumEdit(EDIT_TO, x + padding + 142, btnY, 75, 24,
                    TimeToString(TimeCurrent(), TIME_DATE));
  btnY += 32;

  //--- Sync Custom Button
  CreatePremiumButton(BTN_SYNC_CUSTOM, x + padding, btnY, btnWidth, btnHeight,
                      "Sync Range", true);

  g_ShowPeriodPopup = true;
  ChartRedraw();
}

//+------------------------------------------------------------------+
//| Create Popup Button Style                                        |
//+------------------------------------------------------------------+
void CreatePopupButton(string name, int x, int y, int width, int height,
                       string text) {
  ObjectCreate(0, name, OBJ_BUTTON, 0, 0, 0);
  ObjectSetInteger(0, name, OBJPROP_XDISTANCE, x);
  ObjectSetInteger(0, name, OBJPROP_YDISTANCE, y);
  ObjectSetInteger(0, name, OBJPROP_XSIZE, width);
  ObjectSetInteger(0, name, OBJPROP_YSIZE, height);
  ObjectSetInteger(0, name, OBJPROP_BGCOLOR, CLR_BTN_BG);
  ObjectSetInteger(0, name, OBJPROP_COLOR, CLR_VALUE);
  ObjectSetInteger(0, name, OBJPROP_BORDER_COLOR, CLR_BTN_BORDER);
  ObjectSetInteger(0, name, OBJPROP_FONTSIZE, 10);
  ObjectSetString(0, name, OBJPROP_FONT, "Segoe UI");
  ObjectSetString(0, name, OBJPROP_TEXT, text);
  ObjectSetInteger(0, name, OBJPROP_CORNER, CORNER_LEFT_UPPER);
  ObjectSetInteger(0, name, OBJPROP_SELECTABLE, false);
}

//+------------------------------------------------------------------+
//| Create Premium Edit Box                                          |
//+------------------------------------------------------------------+
void CreatePremiumEdit(string name, int x, int y, int width, int height,
                       string text) {
  ObjectCreate(0, name, OBJ_EDIT, 0, 0, 0);
  ObjectSetInteger(0, name, OBJPROP_XDISTANCE, x);
  ObjectSetInteger(0, name, OBJPROP_YDISTANCE, y);
  ObjectSetInteger(0, name, OBJPROP_XSIZE, width);
  ObjectSetInteger(0, name, OBJPROP_YSIZE, height);
  ObjectSetInteger(0, name, OBJPROP_BGCOLOR, CLR_EDIT_BG);
  ObjectSetInteger(0, name, OBJPROP_COLOR, CLR_VALUE);
  ObjectSetInteger(0, name, OBJPROP_BORDER_COLOR, CLR_BTN_BORDER);
  ObjectSetInteger(0, name, OBJPROP_FONTSIZE, 9);
  ObjectSetString(0, name, OBJPROP_FONT, "Consolas");
  ObjectSetString(0, name, OBJPROP_TEXT, text);
  ObjectSetInteger(0, name, OBJPROP_CORNER, CORNER_LEFT_UPPER);
  ObjectSetInteger(0, name, OBJPROP_ALIGN, ALIGN_CENTER);
}

//+------------------------------------------------------------------+
//| Delete Period Popup                                              |
//+------------------------------------------------------------------+
void DeletePeriodPopup() {
  ObjectDelete(0, POPUP_BG);
  ObjectDelete(0, "GSN_PopupAccent");
  ObjectDelete(0, POPUP_TITLE);
  ObjectDelete(0, POPUP_CLOSE);
  ObjectDelete(0, BTN_TODAY);
  ObjectDelete(0, BTN_3DAYS);
  ObjectDelete(0, BTN_WEEK);
  ObjectDelete(0, BTN_MONTH);
  ObjectDelete(0, BTN_3MONTHS);
  ObjectDelete(0, BTN_6MONTHS);
  ObjectDelete(0, BTN_ALL);
  ObjectDelete(0, LABEL_CUSTOM);
  ObjectDelete(0, "GSN_LabelFrom");
  ObjectDelete(0, "GSN_LabelTo");
  ObjectDelete(0, EDIT_FROM);
  ObjectDelete(0, EDIT_TO);
  ObjectDelete(0, BTN_SYNC_CUSTOM);
  ObjectDelete(0, "GSN_PopupDivider");
  g_ShowPeriodPopup = false;
  ChartRedraw();
}

//+------------------------------------------------------------------+
//| Create Label Helper - Premium Style                              |
//+------------------------------------------------------------------+
void CreateLabel(string name, int x, int y, string text, color clr,
                 int fontSize, bool bold) {
  ObjectCreate(0, name, OBJ_LABEL, 0, 0, 0);
  ObjectSetInteger(0, name, OBJPROP_XDISTANCE, x);
  ObjectSetInteger(0, name, OBJPROP_YDISTANCE, y);
  ObjectSetInteger(0, name, OBJPROP_COLOR, clr);
  ObjectSetInteger(0, name, OBJPROP_FONTSIZE, fontSize);
  ObjectSetString(0, name, OBJPROP_FONT,
                  bold ? "Segoe UI Semibold" : "Segoe UI");
  ObjectSetString(0, name, OBJPROP_TEXT, text);
  ObjectSetInteger(0, name, OBJPROP_CORNER, CORNER_LEFT_UPPER);
  ObjectSetInteger(0, name, OBJPROP_SELECTABLE, false);
}

//+------------------------------------------------------------------+
//| Create Button Helper (legacy, kept for compatibility)            |
//+------------------------------------------------------------------+
void CreateButton(string name, int x, int y, int width, int height,
                  string text) {
  CreatePopupButton(name, x, y, width, height, text);
}

//+------------------------------------------------------------------+
//| Delete Panel UI                                                  |
//+------------------------------------------------------------------+
void DeletePanel() {
  ObjectDelete(0, PANEL_BG);
  ObjectDelete(0, PANEL_HEADER_BG);
  ObjectDelete(0, PANEL_HEADER_LINE);
  ObjectDelete(0, PANEL_HEADER);
  ObjectDelete(0, PANEL_LOGO);
  ObjectDelete(0, PANEL_STATUS_LABEL);
  ObjectDelete(0, PANEL_STATUS_VALUE);
  ObjectDelete(0, PANEL_STATUS_DOT);
  ObjectDelete(0, PANEL_DIVIDER1);
  ObjectDelete(0, PANEL_DIVIDER2);
  ObjectDelete(0, PANEL_ACCOUNT_LABEL);
  ObjectDelete(0, PANEL_ACCOUNT_VALUE);
  ObjectDelete(0, PANEL_SYNCED_LABEL);
  ObjectDelete(0, PANEL_SYNCED_VALUE);
  ObjectDelete(0, PANEL_LASTSYNC_LABEL);
  ObjectDelete(0, PANEL_LASTSYNC_VALUE);
  ObjectDelete(0, PANEL_ERROR_VALUE);
  ObjectDelete(0, PANEL_RATELIMIT);
  ObjectDelete(0, BTN_TEST_CONNECTION);
  ObjectDelete(0, BTN_SYNC_TRADES);
  ChartRedraw();
}

//+------------------------------------------------------------------+
//| Update Panel Values - Premium Style                              |
//+------------------------------------------------------------------+
void UpdatePanel() {
  if (!InpShowPanel)
    return;

  //--- Update Status with dot indicator
  if (g_IsConnected) {
    ObjectSetString(0, PANEL_STATUS_VALUE, OBJPROP_TEXT, "Connected");
    ObjectSetInteger(0, PANEL_STATUS_VALUE, OBJPROP_COLOR, CLR_CONNECTED);
    ObjectSetInteger(0, PANEL_STATUS_DOT, OBJPROP_COLOR, CLR_CONNECTED);
  } else {
    ObjectSetString(0, PANEL_STATUS_VALUE, OBJPROP_TEXT, "Disconnected");
    ObjectSetInteger(0, PANEL_STATUS_VALUE, OBJPROP_COLOR, CLR_DISCONNECTED);
    ObjectSetInteger(0, PANEL_STATUS_DOT, OBJPROP_COLOR, CLR_DISCONNECTED);
  }

  //--- Update Synced Count with emphasis
  ObjectSetString(0, PANEL_SYNCED_VALUE, OBJPROP_TEXT,
                  IntegerToString(g_TotalSynced));

  //--- Update Last Sync Time OR Rate Limit Countdown
  if (g_RateLimitUntil > TimeCurrent()) {
    //--- Show rate limit countdown in Last Sync row
    int remaining = (int)(g_RateLimitUntil - TimeCurrent());
    string cooldownText = "Wait " + IntegerToString(remaining) + "s";
    ObjectSetString(0, PANEL_LASTSYNC_LABEL, OBJPROP_TEXT, "Cooldown");
    ObjectSetString(0, PANEL_LASTSYNC_VALUE, OBJPROP_TEXT, cooldownText);
    ObjectSetInteger(0, PANEL_LASTSYNC_LABEL, OBJPROP_COLOR, CLR_WARNING);
    ObjectSetInteger(0, PANEL_LASTSYNC_VALUE, OBJPROP_COLOR, CLR_WARNING);
  } else if (g_LastSyncTime > 0) {
    int secondsAgo = (int)(TimeCurrent() - g_LastSyncTime);
    string timeAgo;
    if (secondsAgo < 60)
      timeAgo = IntegerToString(secondsAgo) + "s ago";
    else if (secondsAgo < 3600)
      timeAgo = IntegerToString(secondsAgo / 60) + "m ago";
    else if (secondsAgo < 86400)
      timeAgo = IntegerToString(secondsAgo / 3600) + "h ago";
    else
      timeAgo = IntegerToString(secondsAgo / 86400) + "d ago";

    ObjectSetString(0, PANEL_LASTSYNC_LABEL, OBJPROP_TEXT, "Last Sync");
    ObjectSetString(0, PANEL_LASTSYNC_VALUE, OBJPROP_TEXT, timeAgo);
    ObjectSetInteger(0, PANEL_LASTSYNC_LABEL, OBJPROP_COLOR, CLR_LABEL);
    ObjectSetInteger(0, PANEL_LASTSYNC_VALUE, OBJPROP_COLOR, CLR_ACCENT);
  } else {
    ObjectSetString(0, PANEL_LASTSYNC_LABEL, OBJPROP_TEXT, "Last Sync");
    ObjectSetString(0, PANEL_LASTSYNC_VALUE, OBJPROP_TEXT, "Never");
    ObjectSetInteger(0, PANEL_LASTSYNC_LABEL, OBJPROP_COLOR, CLR_LABEL);
    ObjectSetInteger(0, PANEL_LASTSYNC_VALUE, OBJPROP_COLOR, CLR_LABEL);
  }

  //--- Update Error Message
  if (g_LastError != "") {
    ObjectSetString(0, PANEL_ERROR_VALUE, OBJPROP_TEXT, g_LastError);
  } else {
    ObjectSetString(0, PANEL_ERROR_VALUE, OBJPROP_TEXT, " ");
  }

  //--- Rate limit label (backup, hidden)
  ObjectSetString(0, PANEL_RATELIMIT, OBJPROP_TEXT, " ");

  ChartRedraw();
}

//+------------------------------------------------------------------+
//| Chart Event Handler - Button Clicks                              |
//+------------------------------------------------------------------+
void OnChartEvent(const int id, const long &lparam, const double &dparam,
                  const string &sparam) {
  if (id == CHARTEVENT_OBJECT_CLICK) {
    //--- Test Connection Button
    if (sparam == BTN_TEST_CONNECTION) {
      ObjectSetInteger(0, BTN_TEST_CONNECTION, OBJPROP_STATE, false);
      Print("Testing connection...");
      g_LastError = "";
      SendHeartbeat();
      UpdatePanel();

      if (g_IsConnected)
        MessageBox("Connection successful!\n\nAccount: #" + g_AccountNumber +
                       "\nServer: " + AccountInfoString(ACCOUNT_SERVER),
                   "GSN Trade Sync", MB_ICONINFORMATION);
      else
        MessageBox("Connection failed!\n\n" + g_LastError +
                       "\n\nMake sure URL is added to:\nTools > Options > "
                       "Expert Advisors > Allow WebRequest",
                   "GSN Trade Sync", MB_ICONERROR);
    }

    //--- Sync Trades Button - Open Period Popup
    if (sparam == BTN_SYNC_TRADES) {
      ObjectSetInteger(0, BTN_SYNC_TRADES, OBJPROP_STATE, false);
      if (g_ShowPeriodPopup)
        DeletePeriodPopup();
      else
        CreatePeriodPopup();
    }

    //--- Close Popup Button
    if (sparam == POPUP_CLOSE) {
      ObjectSetInteger(0, POPUP_CLOSE, OBJPROP_STATE, false);
      DeletePeriodPopup();
    }

    //--- Today Button
    if (sparam == BTN_TODAY) {
      ObjectSetInteger(0, BTN_TODAY, OBJPROP_STATE, false);
      DeletePeriodPopup();
      SyncPeriodAndNotify(1, "Today");
    }

    //--- Last 3 Days Button
    if (sparam == BTN_3DAYS) {
      ObjectSetInteger(0, BTN_3DAYS, OBJPROP_STATE, false);
      DeletePeriodPopup();
      SyncPeriodAndNotify(3, "Last 3 Days");
    }

    //--- Last Week Button
    if (sparam == BTN_WEEK) {
      ObjectSetInteger(0, BTN_WEEK, OBJPROP_STATE, false);
      DeletePeriodPopup();
      SyncPeriodAndNotify(7, "Last Week");
    }

    //--- Last Month Button
    if (sparam == BTN_MONTH) {
      ObjectSetInteger(0, BTN_MONTH, OBJPROP_STATE, false);
      DeletePeriodPopup();
      SyncPeriodAndNotify(30, "Last Month");
    }

    //--- Last 3 Months Button
    if (sparam == BTN_3MONTHS) {
      ObjectSetInteger(0, BTN_3MONTHS, OBJPROP_STATE, false);
      DeletePeriodPopup();
      SyncPeriodAndNotify(90, "Last 3 Months");
    }

    //--- Last 6 Months Button
    if (sparam == BTN_6MONTHS) {
      ObjectSetInteger(0, BTN_6MONTHS, OBJPROP_STATE, false);
      DeletePeriodPopup();
      SyncPeriodAndNotify(180, "Last 6 Months");
    }

    //--- Entire History Button
    if (sparam == BTN_ALL) {
      ObjectSetInteger(0, BTN_ALL, OBJPROP_STATE, false);
      DeletePeriodPopup();

      int result = MessageBox("This will sync ALL trades in history.\nThis may "
                              "take a while.\n\nContinue?",
                              "GSN Trade Sync", MB_YESNO | MB_ICONQUESTION);

      if (result == IDYES) {
        Print("Syncing entire history...");
        g_LastError = "";

        int syncedCount = SyncAllHistory();
        UpdatePanel();

        if (syncedCount >= 0)
          MessageBox("Sync complete!\n\nTotal trades synced: " +
                         IntegerToString(syncedCount),
                     "GSN Trade Sync", MB_ICONINFORMATION);
        else
          MessageBox("Sync failed!\n\n" + g_LastError, "GSN Trade Sync",
                     MB_ICONERROR);
      }
    }

    //--- Sync Custom Period Button
    if (sparam == BTN_SYNC_CUSTOM) {
      ObjectSetInteger(0, BTN_SYNC_CUSTOM, OBJPROP_STATE, false);

      string fromStr = ObjectGetString(0, EDIT_FROM, OBJPROP_TEXT);
      string toStr = ObjectGetString(0, EDIT_TO, OBJPROP_TEXT);

      datetime fromDate = StringToTime(fromStr);
      datetime toDate = StringToTime(toStr);

      //--- Add 1 day to toDate to include the end date
      toDate += 24 * 60 * 60;

      if (fromDate == 0 || toDate == 0) {
        MessageBox("Invalid date format!\n\nUse format: YYYY.MM.DD\nExample: "
                   "2025.01.15",
                   "GSN Trade Sync", MB_ICONERROR);
        return;
      }

      if (fromDate > toDate) {
        MessageBox("From date must be before To date!", "GSN Trade Sync",
                   MB_ICONERROR);
        return;
      }

      DeletePeriodPopup();

      Print("Syncing custom period: ", fromStr, " to ", toStr);
      g_LastError = "";

      int syncedCount = SyncDateRange(fromDate, toDate);
      UpdatePanel();

      if (syncedCount >= 0)
        MessageBox("Sync complete!\n\nPeriod: " + fromStr + " to " + toStr +
                       "\nTrades synced: " + IntegerToString(syncedCount),
                   "GSN Trade Sync", MB_ICONINFORMATION);
      else
        MessageBox("Sync failed!\n\n" + g_LastError, "GSN Trade Sync",
                   MB_ICONERROR);
    }
  }
}

//+------------------------------------------------------------------+
//| Sync Period Helper with Notification                             |
//+------------------------------------------------------------------+
void SyncPeriodAndNotify(int days, string periodName) {
  //--- Check rate limit before syncing
  if (g_RateLimitUntil > TimeCurrent()) {
    int remaining = (int)(g_RateLimitUntil - TimeCurrent());
    MessageBox("Please wait " + IntegerToString(remaining) +
                   " seconds before syncing again.\n\nRate limit protection is "
                   "active.",
               "GSN Trade Sync", MB_ICONWARNING);
    return;
  }

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
  UpdatePanel();

  if (syncedCount >= 0)
    MessageBox("Sync complete!\n\nPeriod: " + periodName +
                   "\nTrades synced: " + IntegerToString(syncedCount),
               "GSN Trade Sync", MB_ICONINFORMATION);
  else
    MessageBox("Sync failed!\n\n" + g_LastError, "GSN Trade Sync",
               MB_ICONERROR);
}

//+------------------------------------------------------------------+
//| Sync trades within a date range                                  |
//+------------------------------------------------------------------+
int SyncDateRange(datetime fromDate, datetime toDate) {
  Print("Selecting history from ", TimeToString(fromDate), " to ",
        TimeToString(toDate));

  if (!HistorySelect(fromDate, toDate)) {
    Print("Failed to select history for date range");
    g_LastError = "Failed to select history";
    return -1;
  }

  int total = HistoryDealsTotal();
  Print("Found ", total, " total deals in date range");

  //--- PASS 1: Collect all closing deal tickets and their data FIRST
  //--- (before FindOpeningDealWithSLTP resets the history cache)
  ulong closingTickets[];
  string closingSymbols[];
  int closingDealTypes[];
  double closingVolumes[];
  double closingPrices[];
  datetime closingTimes[];
  double closingProfits[];
  double closingCommissions[];
  double closingSwaps[];
  long closingPositionIds[];

  int entryInCount = 0;
  int entryOutCount = 0;
  int entryInOutCount = 0;
  int entryOtherCount = 0;

  ArrayResize(closingTickets, 0);
  ArrayResize(closingSymbols, 0);
  ArrayResize(closingDealTypes, 0);
  ArrayResize(closingVolumes, 0);
  ArrayResize(closingPrices, 0);
  ArrayResize(closingTimes, 0);
  ArrayResize(closingProfits, 0);
  ArrayResize(closingCommissions, 0);
  ArrayResize(closingSwaps, 0);
  ArrayResize(closingPositionIds, 0);

  for (int i = 0; i < total; i++) {
    ulong ticket = HistoryDealGetTicket(i);
    if (ticket > 0) {
      ENUM_DEAL_ENTRY entry =
          (ENUM_DEAL_ENTRY)HistoryDealGetInteger(ticket, DEAL_ENTRY);

      // Count entry types for debugging
      if (entry == DEAL_ENTRY_IN)
        entryInCount++;
      else if (entry == DEAL_ENTRY_OUT)
        entryOutCount++;
      else if (entry == DEAL_ENTRY_INOUT)
        entryInOutCount++;
      else
        entryOtherCount++;

      if (entry == DEAL_ENTRY_OUT || entry == DEAL_ENTRY_INOUT) {
        int idx = ArraySize(closingTickets);
        ArrayResize(closingTickets, idx + 1);
        ArrayResize(closingSymbols, idx + 1);
        ArrayResize(closingDealTypes, idx + 1);
        ArrayResize(closingVolumes, idx + 1);
        ArrayResize(closingPrices, idx + 1);
        ArrayResize(closingTimes, idx + 1);
        ArrayResize(closingProfits, idx + 1);
        ArrayResize(closingCommissions, idx + 1);
        ArrayResize(closingSwaps, idx + 1);
        ArrayResize(closingPositionIds, idx + 1);

        closingTickets[idx] = ticket;
        closingSymbols[idx] = HistoryDealGetString(ticket, DEAL_SYMBOL);
        ENUM_DEAL_TYPE dealType =
            (ENUM_DEAL_TYPE)HistoryDealGetInteger(ticket, DEAL_TYPE);
        closingDealTypes[idx] = (dealType == DEAL_TYPE_SELL) ? 1 : 0;
        closingVolumes[idx] = HistoryDealGetDouble(ticket, DEAL_VOLUME);
        closingPrices[idx] = HistoryDealGetDouble(ticket, DEAL_PRICE);
        closingTimes[idx] = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);
        closingProfits[idx] = HistoryDealGetDouble(ticket, DEAL_PROFIT);
        closingCommissions[idx] = HistoryDealGetDouble(ticket, DEAL_COMMISSION);
        closingSwaps[idx] = HistoryDealGetDouble(ticket, DEAL_SWAP);
        closingPositionIds[idx] =
            HistoryDealGetInteger(ticket, DEAL_POSITION_ID);
      }
    }
  }

  // Debug: Show entry type distribution
  Print("Entry type breakdown: IN=", entryInCount, " OUT=", entryOutCount,
        " INOUT=", entryInOutCount, " OTHER=", entryOtherCount);

  int closingCount = ArraySize(closingTickets);
  Print("Collected ", closingCount, " closing trades for processing");

  if (closingCount == 0) {
    Print("No closing trades found in date range");
    return 0;
  }

  //--- PASS 2: Now process each closing deal (FindOpeningDealWithSLTP can reset
  // cache safely)
  string tradesJson = "[";
  bool first = true;
  int syncedCount = 0;

  for (int i = 0; i < closingCount; i++) {
    long positionId = closingPositionIds[i];
    double closePrice = closingPrices[i];
    datetime closeTime = closingTimes[i];
    int fallbackType = closingDealTypes[i];

    double openPrice = 0;
    datetime openTime = 0;
    int tradeType = 0;

    //--- Extract SL/TP directly from closing deal first (MT5 build 2300+)
    double stopLoss = HistoryDealGetDouble(closingTickets[i], DEAL_SL);
    double takeProfit = HistoryDealGetDouble(closingTickets[i], DEAL_TP);

    double fbSL = 0;
    double fbTP = 0;

    if (!FindOpeningDealWithSLTP(positionId, openPrice, openTime, tradeType,
                                 fbSL, fbTP)) {
      openPrice = closePrice;
      openTime = closeTime;
      tradeType = fallbackType;
    }

    //--- Fallback if DEAL_SL/TP is 0
    if (stopLoss == 0) stopLoss = fbSL;
    if (takeProfit == 0) takeProfit = fbTP;

    if (!first)
      tradesJson += ",";
    first = false;

    tradesJson += StringFormat(
        "{"
        "\"ticket\":\"%d\","
        "\"symbol\":\"%s\","
        "\"type\":%d,"
        "\"volume\":%.2f,"
        "\"openPrice\":%.5f,"
        "\"openTime\":%d,"
        "\"closePrice\":%.5f,"
        "\"closeTime\":%d,"
        "\"stopLoss\":%.5f,"
        "\"takeProfit\":%.5f,"
        "\"profit\":%.2f,"
        "\"commission\":%.2f,"
        "\"swap\":%.2f"
        "}",
        positionId, closingSymbols[i], tradeType, closingVolumes[i], openPrice,
        (long)openTime, closePrice, (long)closeTime, stopLoss, takeProfit,
        closingProfits[i], closingCommissions[i], closingSwaps[i]);

    syncedCount++;
  }

  tradesJson += "]";

  Print("Found ", syncedCount, " closing trades to sync");

  //--- Build full JSON
  string json = StringFormat(
      "{\"trades\":%s,\"eaVersion\":\"1.05\",\"clientTime\":\"%s\","
      "\"accountNumber\":\"%s\"}",
      tradesJson, TimeToString(TimeCurrent(), TIME_DATE | TIME_SECONDS),
      g_AccountNumber);

  //--- Send to server
  if (SendTradesToServer(json, syncedCount)) {
    g_TotalSynced += syncedCount;
    g_LastSyncTime = TimeCurrent();
    return syncedCount;
  }

  return -1;
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick() {
  datetime now = TimeCurrent();

  //--- Check for new closed trades periodically
  if (now - g_LastTradeCheck >= InpSyncDelay) {
    CheckNewTrades();
    g_LastTradeCheck = now;
  }
}

//+------------------------------------------------------------------+
//| Trade transaction handling - Real-time trade detection          |
//+------------------------------------------------------------------+
void OnTradeTransaction(const MqlTradeTransaction &trans,
                        const MqlTradeRequest &request,
                        const MqlTradeResult &result) {
  //--- If deal added (trade executed)
  if (trans.type == TRADE_TRANSACTION_DEAL_ADD) {
    ulong dealTicket = trans.deal;

    if (dealTicket > 0 && HistoryDealSelect(dealTicket)) {
      ENUM_DEAL_ENTRY entry =
          (ENUM_DEAL_ENTRY)HistoryDealGetInteger(dealTicket, DEAL_ENTRY);

      //--- Only interested in exit deals (closing trades)
      if (entry == DEAL_ENTRY_OUT || entry == DEAL_ENTRY_INOUT) {
        //--- Small delay to ensure all data is available
        Sleep(1000);
        if (SyncSingleTrade(dealTicket)) {
          g_TotalSynced++;
          g_LastSyncTime = TimeCurrent();
          g_LastError = "";
        }
        UpdatePanel();
      }
    }
  }
}

//+------------------------------------------------------------------+
//| Send Heartbeat to Server                                         |
//+------------------------------------------------------------------+
void SendHeartbeat() {
  string url = g_BaseUrl + "/api/ea/heartbeat";
  string headers = "Content-Type: application/json\r\nX-API-Key: " + InpApiKey;

  Print("Sending heartbeat to: ", url); // Debug log

  //--- Collect all account info to send to server (auto-collect)
  //--- Calculate broker GMT offset (seconds): TimeCurrent = Broker Server Time
  int gmtOffsetSeconds = (int)(TimeCurrent() - TimeGMT());
  
  string body = StringFormat(
      "{"
      "\"eaVersion\":\"1.05\","
      "\"accountNumber\":\"%s\","
      "\"balance\":%.2f,"
      "\"equity\":%.2f,"
      "\"broker\":\"%s\","
      "\"server\":\"%s\","
      "\"currency\":\"%s\","
      "\"leverage\":%d,"
      "\"gmtOffset\":%d"
      "}",
      g_AccountNumber, AccountInfoDouble(ACCOUNT_BALANCE),
      AccountInfoDouble(ACCOUNT_EQUITY),
      EscapeJsonString(AccountInfoString(ACCOUNT_COMPANY)), // Broker name
      EscapeJsonString(AccountInfoString(ACCOUNT_SERVER)),  // Server name
      AccountInfoString(ACCOUNT_CURRENCY),                  // Account currency
      (int)AccountInfoInteger(ACCOUNT_LEVERAGE),            // Leverage
      gmtOffsetSeconds                                      // GMT offset (seconds)
  );

  //--- Prepare request data
  char postData[];
  char resultData[];
  string resultHeaders;

  StringToCharArray(body, postData, 0, WHOLE_ARRAY, CP_UTF8);
  ArrayResize(postData, ArraySize(postData) - 1); // Remove null terminator

  //--- Send request
  ResetLastError();
  int res = WebRequest("POST", url, headers, 5000, postData, resultData,
                       resultHeaders);

  if (res == 200) {
    g_IsConnected = true;
    g_LastHeartbeat = TimeCurrent();
    g_LastError = "";
    Print("Heartbeat OK - Account: ", g_AccountNumber, " | Balance: ",
          DoubleToString(AccountInfoDouble(ACCOUNT_BALANCE), 2));
  } else if (res == 403) {
    //--- Account mismatch - API key linked to different account
    string response = CharArrayToString(resultData, 0, WHOLE_ARRAY, CP_UTF8);
    Print("ERROR 403: Account mismatch! ", response);
    g_LastError = "API Key mismatch";
    g_IsConnected = false;
  } else if (res == 401) {
    Print("ERROR 401: Invalid API Key");
    g_LastError = "Invalid API Key";
    g_IsConnected = false;
  } else if (res == -1) {
    int error = GetLastError();
    Print("Heartbeat failed. Error: ", error, " - ", ErrorDescription(error));
    g_LastError = ErrorDescription(error);
    g_IsConnected = false;
  } else {
    Print("Heartbeat failed. HTTP Code: ", res);
    g_LastError = "HTTP Error: " + IntegerToString(res);
    g_IsConnected = false;
  }
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

  //--- Check if new deals appeared
  if (currentTotal > g_LastHistoryTotal) {
    Print("New deals detected: ", currentTotal - g_LastHistoryTotal);

    //--- Process each new deal
    for (int i = g_LastHistoryTotal; i < currentTotal; i++) {
      ulong ticket = HistoryDealGetTicket(i);

      if (ticket > 0) {
        ENUM_DEAL_ENTRY entry =
            (ENUM_DEAL_ENTRY)HistoryDealGetInteger(ticket, DEAL_ENTRY);

        //--- Only process closing deals
        if (entry == DEAL_ENTRY_OUT || entry == DEAL_ENTRY_INOUT) {
          SyncSingleTrade(ticket);
        }
      }
    }

    g_LastHistoryTotal = currentTotal;
  }
}

//+------------------------------------------------------------------+
//| Sync a single trade to server                                    |
//+------------------------------------------------------------------+
bool SyncSingleTrade(ulong dealTicket) {
  if (!HistoryDealSelect(dealTicket)) {
    Print("Failed to select deal: ", dealTicket);
    g_LastError = "Failed to select deal";
    return false;
  }

  //--- Get deal info
  string symbol = HistoryDealGetString(dealTicket, DEAL_SYMBOL);
  ENUM_DEAL_TYPE dealType =
      (ENUM_DEAL_TYPE)HistoryDealGetInteger(dealTicket, DEAL_TYPE);
  double volume = HistoryDealGetDouble(dealTicket, DEAL_VOLUME);
  double closePrice = HistoryDealGetDouble(dealTicket, DEAL_PRICE);
  datetime closeTime = (datetime)HistoryDealGetInteger(dealTicket, DEAL_TIME);
  double profit = HistoryDealGetDouble(dealTicket, DEAL_PROFIT);
  double commission = HistoryDealGetDouble(dealTicket, DEAL_COMMISSION);
  double swap = HistoryDealGetDouble(dealTicket, DEAL_SWAP);
  long positionId = HistoryDealGetInteger(dealTicket, DEAL_POSITION_ID);

  //--- Find opening deal for this position (with SL/TP)
  double openPrice = 0;
  datetime openTime = 0;
  int tradeType = 0; // 0=BUY, 1=SELL
  
  //--- MT5 build 2300+ stores SL/TP in the closing deal
  double stopLoss = HistoryDealGetDouble(dealTicket, DEAL_SL);
  double takeProfit = HistoryDealGetDouble(dealTicket, DEAL_TP);
  
  double fbSL = 0;
  double fbTP = 0;

  if (FindOpeningDealWithSLTP(positionId, openPrice, openTime, tradeType,
                              fbSL, fbTP)) {
    if (stopLoss == 0) stopLoss = fbSL;
    if (takeProfit == 0) takeProfit = fbTP;
                              
    Print("Found opening deal - Price: ", openPrice,
          " Time: ", TimeToString(openTime), " SL: ", stopLoss,
          " TP: ", takeProfit);
  } else {
    //--- Fallback: use close price as open price
    openPrice = closePrice;
    openTime = closeTime;
    tradeType = (dealType == DEAL_TYPE_SELL)
                    ? 0
                    : 1; // Reverse because close deal is opposite
    Print("Warning: Could not find opening deal for position ", positionId);
  }

  //--- Build JSON (with SL/TP)
  string json = StringFormat(
      "{"
      "\"trades\":[{"
      "\"ticket\":\"%d\","
      "\"symbol\":\"%s\","
      "\"type\":%d,"
      "\"volume\":%.2f,"
      "\"openPrice\":%.5f,"
      "\"openTime\":%d,"
      "\"closePrice\":%.5f,"
      "\"closeTime\":%d,"
      "\"stopLoss\":%.5f,"
      "\"takeProfit\":%.5f,"
      "\"profit\":%.2f,"
      "\"commission\":%.2f,"
      "\"swap\":%.2f"
      "}],"
      "\"eaVersion\":\"1.05\","
      "\"clientTime\":\"%s\","
      "\"accountNumber\":\"%s\""
      "}",
      positionId, symbol, tradeType, volume, openPrice, (long)openTime,
      closePrice, (long)closeTime, stopLoss, takeProfit, profit, commission,
      swap, TimeToString(TimeCurrent(), TIME_DATE | TIME_SECONDS),
      g_AccountNumber);

  //--- Send to server
  return SendTradesToServer(json, 1);
}

//+------------------------------------------------------------------+
//| Find opening deal for a position                                 |
//+------------------------------------------------------------------+
bool FindOpeningDeal(long positionId, double &openPrice, datetime &openTime,
                     int &tradeType) {
  double sl = 0, tp = 0;
  return FindOpeningDealWithSLTP(positionId, openPrice, openTime, tradeType, sl,
                                 tp);
}

//+------------------------------------------------------------------+
//| Find opening deal with SL/TP for a position                      |
//| SL/TP is taken from the LAST order that modified the position    |
//+------------------------------------------------------------------+
bool FindOpeningDealWithSLTP(long positionId, double &openPrice,
                             datetime &openTime, int &tradeType,
                             double &stopLoss, double &takeProfit) {
  //--- Select all history for this position
  if (!HistorySelectByPosition(positionId)) {
    //--- Fallback to full history
    HistorySelect(0, TimeCurrent());
  }

  stopLoss = 0;
  takeProfit = 0;
  bool foundOpening = false;

  //--- PASS 1: Find opening deal info
  int totalDeals = HistoryDealsTotal();
  for (int i = 0; i < totalDeals; i++) {
    ulong ticket = HistoryDealGetTicket(i);
    if (ticket == 0)
      continue;

    long dealPosId = HistoryDealGetInteger(ticket, DEAL_POSITION_ID);
    if (dealPosId != positionId)
      continue;

    ENUM_DEAL_ENTRY entry =
        (ENUM_DEAL_ENTRY)HistoryDealGetInteger(ticket, DEAL_ENTRY);

    //--- Found opening deal
    if (entry == DEAL_ENTRY_IN) {
      openPrice = HistoryDealGetDouble(ticket, DEAL_PRICE);
      openTime = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);
      ENUM_DEAL_TYPE type =
          (ENUM_DEAL_TYPE)HistoryDealGetInteger(ticket, DEAL_TYPE);
      tradeType = (type == DEAL_TYPE_BUY) ? 0 : 1;
      foundOpening = true;
      break;
    }
  }

  if (!foundOpening)
    return false;

  //--- PASS 2: Find the LAST SL/TP values from order history
  //--- This includes: opening order + any modify orders
  int totalOrders = HistoryOrdersTotal();
  datetime lastOrderTime = 0;

  for (int i = 0; i < totalOrders; i++) {
    ulong orderTicket = HistoryOrderGetTicket(i);
    if (orderTicket == 0)
      continue;

    long orderPosId = HistoryOrderGetInteger(orderTicket, ORDER_POSITION_ID);
    if (orderPosId != positionId)
      continue;

    //--- Get this order's SL/TP (could be modify order)
    double orderSL = HistoryOrderGetDouble(orderTicket, ORDER_SL);
    double orderTP = HistoryOrderGetDouble(orderTicket, ORDER_TP);
    datetime orderTime =
        (datetime)HistoryOrderGetInteger(orderTicket, ORDER_TIME_DONE);

    //--- Keep the latest order's SL/TP
    if (orderTime >= lastOrderTime) {
      if (orderSL > 0 || orderTP > 0 || lastOrderTime == 0) {
        stopLoss = orderSL;
        takeProfit = orderTP;
        lastOrderTime = orderTime;
      }
    }
  }

  return true;
}

//+------------------------------------------------------------------+
//| Send trades JSON to server                                       |
//+------------------------------------------------------------------+
bool SendTradesToServer(string json, int tradeCount) {
  string url = g_BaseUrl + "/api/ea/trades";
  string headers = "Content-Type: application/json\r\nX-API-Key: " + InpApiKey;

  Print("Sending trades to: ", url); // Debug log

  //--- Prepare request data
  char postData[];
  char resultData[];
  string resultHeaders;

  StringToCharArray(json, postData, 0, WHOLE_ARRAY, CP_UTF8);
  ArrayResize(postData, ArraySize(postData) - 1); // Remove null terminator

  //--- Send request
  ResetLastError();
  int res = WebRequest("POST", url, headers, 10000, postData, resultData,
                       resultHeaders);

  if (res == 200) {
    string response = CharArrayToString(resultData, 0, WHOLE_ARRAY, CP_UTF8);
    Print("Trades synced successfully! Count: ", tradeCount,
          " | Response: ", response);
    g_LastError = "";
    //--- Set cooldown 60s after successful sync
    g_RateLimitUntil = TimeCurrent() + 10;
    return true;
  } else if (res == 403) {
    string response = CharArrayToString(resultData, 0, WHOLE_ARRAY, CP_UTF8);
    Print("ERROR 403: Account mismatch! ", response);
    g_LastError = "API Key mismatch";
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
    UpdatePanel(); // Force update panel immediately
    return false;
  } else if (res == -1) {
    int error = GetLastError();
    Print("Trades sync failed. Error: ", error, " - ", ErrorDescription(error));
    g_LastError = ErrorDescription(error);
    return false;
  } else {
    string response = CharArrayToString(resultData, 0, WHOLE_ARRAY, CP_UTF8);
    Print("Trades sync failed. HTTP Code: ", res, " | Response: ", response);
    g_LastError = "HTTP Error: " + IntegerToString(res);
    return false;
  }
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

  // Use generic sync function which handles all closing deals (Deal Ticket)
  // properly without Position ID deduplication
  return SyncDateRange(startTime, endTime);
}

//+------------------------------------------------------------------+
//| Sync All History (Full sync)                                     |
//+------------------------------------------------------------------+
int SyncAllHistory() {
  //--- Select all history from account creation
  if (!HistorySelect(0, TimeCurrent())) {
    g_LastError = "Failed to select history";
    return -1;
  }

  int total = HistoryDealsTotal();
  Print("Scanning ", total, " total deals...");

  //--- PASS 1: Collect all closing deal data FIRST
  ulong closingTickets[];
  string closingSymbols[];
  int closingDealTypes[];
  double closingVolumes[];
  double closingPrices[];
  datetime closingTimes[];
  double closingProfits[];
  double closingCommissions[];
  double closingSwaps[];
  long closingPositionIds[];

  ArrayResize(closingTickets, 0);
  ArrayResize(closingSymbols, 0);
  ArrayResize(closingDealTypes, 0);
  ArrayResize(closingVolumes, 0);
  ArrayResize(closingPrices, 0);
  ArrayResize(closingTimes, 0);
  ArrayResize(closingProfits, 0);
  ArrayResize(closingCommissions, 0);
  ArrayResize(closingSwaps, 0);
  ArrayResize(closingPositionIds, 0);

  for (int i = 0; i < total; i++) {
    ulong ticket = HistoryDealGetTicket(i);

    if (ticket > 0) {
      ENUM_DEAL_ENTRY entry =
          (ENUM_DEAL_ENTRY)HistoryDealGetInteger(ticket, DEAL_ENTRY);

      //--- Only collect closing deals
      if (entry == DEAL_ENTRY_OUT || entry == DEAL_ENTRY_INOUT) {
        int idx = ArraySize(closingTickets);
        ArrayResize(closingTickets, idx + 1);
        ArrayResize(closingSymbols, idx + 1);
        ArrayResize(closingDealTypes, idx + 1);
        ArrayResize(closingVolumes, idx + 1);
        ArrayResize(closingPrices, idx + 1);
        ArrayResize(closingTimes, idx + 1);
        ArrayResize(closingProfits, idx + 1);
        ArrayResize(closingCommissions, idx + 1);
        ArrayResize(closingSwaps, idx + 1);
        ArrayResize(closingPositionIds, idx + 1);

        closingTickets[idx] = ticket;
        closingSymbols[idx] = HistoryDealGetString(ticket, DEAL_SYMBOL);
        ENUM_DEAL_TYPE dealType =
            (ENUM_DEAL_TYPE)HistoryDealGetInteger(ticket, DEAL_TYPE);
        closingDealTypes[idx] = (dealType == DEAL_TYPE_SELL) ? 1 : 0;
        closingVolumes[idx] = HistoryDealGetDouble(ticket, DEAL_VOLUME);
        closingPrices[idx] = HistoryDealGetDouble(ticket, DEAL_PRICE);
        closingTimes[idx] = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);
        closingProfits[idx] = HistoryDealGetDouble(ticket, DEAL_PROFIT);
        closingCommissions[idx] = HistoryDealGetDouble(ticket, DEAL_COMMISSION);
        closingSwaps[idx] = HistoryDealGetDouble(ticket, DEAL_SWAP);
        closingPositionIds[idx] =
            HistoryDealGetInteger(ticket, DEAL_POSITION_ID);
      }
    }
  }

  int closingCount = ArraySize(closingTickets);
  Print("Collected ", closingCount, " closing trades for processing");

  if (closingCount == 0) {
    Print("No closing trades found");
    return 0;
  }

  //--- PASS 2: Process and send in batches
  int syncedCount = 0;
  string tradesJson = "[";
  bool first = true;
  int batchCount = 0;
  int maxBatch = 100;

  for (int i = 0; i < closingCount; i++) {
    long positionId = closingPositionIds[i];
    double closePrice = closingPrices[i];
    datetime closeTime = closingTimes[i];
    int fallbackType = closingDealTypes[i];

    double openPrice = 0;
    datetime openTime = 0;
    int tradeType = 0;
    double stopLoss = 0;
    double takeProfit = 0;

    if (!FindOpeningDealWithSLTP(positionId, openPrice, openTime, tradeType,
                                 stopLoss, takeProfit)) {
      openPrice = closePrice;
      openTime = closeTime;
      tradeType = fallbackType;
    }

    if (!first)
      tradesJson += ",";
    first = false;

    tradesJson += StringFormat(
        "{"
        "\"ticket\":\"%d\","
        "\"symbol\":\"%s\","
        "\"type\":%d,"
        "\"volume\":%.2f,"
        "\"openPrice\":%.5f,"
        "\"openTime\":%d,"
        "\"closePrice\":%.5f,"
        "\"closeTime\":%d,"
        "\"stopLoss\":%.5f,"
        "\"takeProfit\":%.5f,"
        "\"profit\":%.2f,"
        "\"commission\":%.2f,"
        "\"swap\":%.2f"
        "}",
        positionId, closingSymbols[i], tradeType, closingVolumes[i], openPrice,
        (long)openTime, closePrice, (long)closeTime, stopLoss, takeProfit,
        closingProfits[i], closingCommissions[i], closingSwaps[i]);

    syncedCount++;
    batchCount++;

    //--- Send batch if reached limit
    if (batchCount >= maxBatch) {
      tradesJson += "]";
      string json = StringFormat(
          "{\"trades\":%s,\"eaVersion\":\"1.05\",\"clientTime\":\"%s\","
          "\"accountNumber\":\"%s\"}",
          tradesJson, TimeToString(TimeCurrent(), TIME_DATE | TIME_SECONDS),
          g_AccountNumber);

      if (!SendTradesToServer(json, batchCount)) {
        return -1;
      }

      Print("Batch synced: ", batchCount, " trades");
      tradesJson = "[";
      first = true;
      batchCount = 0;
      Sleep(20000); // 20 second delay between batches
    }
  }

  //--- Send remaining trades
  if (batchCount > 0) {
    tradesJson += "]";
    string json = StringFormat(
        "{\"trades\":%s,\"eaVersion\":\"1.05\",\"clientTime\":\"%s\","
        "\"accountNumber\":\"%s\"}",
        tradesJson, TimeToString(TimeCurrent(), TIME_DATE | TIME_SECONDS),
        g_AccountNumber);

    if (!SendTradesToServer(json, batchCount)) {
      return -1;
    }
  }

  if (syncedCount > 0) {
    g_TotalSynced += syncedCount;
    g_LastSyncTime = TimeCurrent();
  }

  return syncedCount;
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
