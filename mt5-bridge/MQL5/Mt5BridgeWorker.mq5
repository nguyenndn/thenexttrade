//+------------------------------------------------------------------+
//|                                              Mt5BridgeWorker.mq5 |
//|                        GSN CRM Native C# + MQL5 Background Worker|
//+------------------------------------------------------------------+
#property copyright "GSN CRM"
#property version   "1.00"
#property strict

#import "user32.dll"
   long GetAncestor(long hwnd, uint gaFlags);
   int  ShowWindow(long hwnd, int nCmdShow);
#import

int g_lastDealsUpdateSec = 0;
string g_cachedDealsJson = "[]";
int g_lastCandlesUpdateSec = 0;
string g_cachedCandlesJson = "[]";
string g_activeSymbol = "XAUUSD";
int g_activeTfMinutes = 15;
int g_timerTickCount = 0;

//+------------------------------------------------------------------+
//| Escape JSON string                                               |
//+------------------------------------------------------------------+
string EscapeJson(string s)
{
   string out = s;
   StringReplace(out, "\\", "\\\\");
   StringReplace(out, "\"", "\\\"");
   StringReplace(out, "\r", " ");
   StringReplace(out, "\n", " ");
   StringReplace(out, "\t", " ");
   return out;
}

//+------------------------------------------------------------------+
//| Determine filling mode for symbol                                |
//+------------------------------------------------------------------+
ENUM_ORDER_TYPE_FILLING GetFillingMode(string symbol)
{
   uint filling = (uint)SymbolInfoInteger(symbol, SYMBOL_FILLING_MODE);
   if((filling & SYMBOL_FILLING_FOK) != 0)
      return ORDER_FILLING_FOK;
   if((filling & SYMBOL_FILLING_IOC) != 0)
      return ORDER_FILLING_IOC;
   return ORDER_FILLING_RETURN;
}

//+------------------------------------------------------------------+
//| Convert minutes to ENUM_TIMEFRAMES                               |
//+------------------------------------------------------------------+
ENUM_TIMEFRAMES MinutesToPeriod(int tfMinutes)
{
   if(tfMinutes == 1)    return PERIOD_M1;
   if(tfMinutes == 5)    return PERIOD_M5;
   if(tfMinutes == 15)   return PERIOD_M15;
   if(tfMinutes == 30)   return PERIOD_M30;
   if(tfMinutes == 60)   return PERIOD_H1;
   if(tfMinutes == 240)  return PERIOD_H4;
   if(tfMinutes == 1440) return PERIOD_D1;
   return PERIOD_M15;
}

//+------------------------------------------------------------------+
//| Resolve broker-specific symbol name (handles suffixes like .s/m) |
//+------------------------------------------------------------------+
string ResolveBrokerSymbol(string desired)
{
   if(StringLen(desired) == 0)
      return "";

   if(SymbolSelect(desired, true) && SymbolInfoDouble(desired, SYMBOL_POINT) > 0)
      return desired;

   string upperDesired = desired;
   StringToUpper(upperDesired);

   // 1. Check open positions first
   for(int p = 0; p < PositionsTotal(); p++)
   {
      if(PositionGetTicket(p) > 0)
      {
         string posSym = PositionGetString(POSITION_SYMBOL);
         string upperPos = posSym;
         StringToUpper(upperPos);
         if(StringFind(upperPos, upperDesired) == 0)
         {
            SymbolSelect(posSym, true);
            return posSym;
         }
      }
   }

   // 2. Check MarketWatch symbols
   int mwTotal = SymbolsTotal(true);
   for(int i = 0; i < mwTotal; i++)
   {
      string sym = SymbolName(i, true);
      string upperSym = sym;
      StringToUpper(upperSym);
      if(StringFind(upperSym, upperDesired) == 0)
      {
         SymbolSelect(sym, true);
         return sym;
      }
   }

   // 3. Check all broker symbols
   int allTotal = SymbolsTotal(false);
   for(int i = 0; i < allTotal; i++)
   {
      string sym = SymbolName(i, false);
      string upperSym = sym;
      StringToUpper(upperSym);
      if(StringFind(upperSym, upperDesired) == 0)
      {
         SymbolSelect(sym, true);
         return sym;
      }
   }

   return desired;
}

//+------------------------------------------------------------------+
//| Trim unused MarketWatch symbols to minimize RAM & tick traffic   |
//+------------------------------------------------------------------+
void TrimUnusedMarketWatchSymbols()
{
   string chartSym = ChartSymbol(0);
   int total = SymbolsTotal(true);
   for(int i = total - 1; i >= 0; i--)
   {
      string sym = SymbolName(i, true);
      if(StringLen(sym) == 0) continue;
      if(i == 0 || sym == chartSym || sym == g_activeSymbol || StringFind(sym, "XAUUSD") == 0 || StringFind(sym, "EURUSD") == 0 || StringFind(sym, "GOLD") == 0)
         continue;

      bool hasPos = false;
      for(int p = 0; p < PositionsTotal(); p++)
      {
         if(PositionGetTicket(p) > 0 && PositionGetString(POSITION_SYMBOL) == sym)
         {
            hasPos = true;
            break;
         }
      }
      if(!hasPos)
         SymbolSelect(sym, false);
   }
}

//+------------------------------------------------------------------+
//| Hide top-level MT5 terminal window so no GDI/UI loop runs        |
//+------------------------------------------------------------------+
void HideRootTerminalWindow()
{
   long chartHwnd = ChartGetInteger(0, CHART_WINDOW_HANDLE);
   if(chartHwnd != 0)
   {
      long rootHwnd = GetAncestor(chartHwnd, 2); // GA_ROOT = 2
      if(rootHwnd != 0)
         ShowWindow(rootHwnd, 0); // SW_HIDE = 0
   }
}

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   string chartSym = ChartSymbol(0);
   if(StringLen(chartSym) > 0)
      g_activeSymbol = ResolveBrokerSymbol(chartSym);

   int chartTfSeconds = PeriodSeconds(ChartPeriod(0));
   if(chartTfSeconds >= 60)
      g_activeTfMinutes = chartTfSeconds / 60;

   ChartSetInteger(0, CHART_SHOW, false);
   HideRootTerminalWindow();
   TrimUnusedMarketWatchSymbols();
   EventSetMillisecondTimer(250);
   WriteStateJson();
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   EventKillTimer();
}

//+------------------------------------------------------------------+
//| Timer function                                                   |
//+------------------------------------------------------------------+
void OnTimer()
{
   g_timerTickCount++;
   ProcessCommands();

   // Write state.json every 1000ms (every 4th timer tick) to keep Disk I/O at 0.0 MB/s
   if(g_timerTickCount % 4 == 0)
      WriteStateJson();

   // Re-trim any auto-subscribed symbols every 15s
   if(g_timerTickCount % 60 == 0)
   {
      HideRootTerminalWindow();
      TrimUnusedMarketWatchSymbols();
   }
}

//+------------------------------------------------------------------+
//| Tick function                                                    |
//+------------------------------------------------------------------+
void OnTick()
{
   ProcessCommands();
}

//+------------------------------------------------------------------+
//| Process incoming command from C# Mt5Bridge                       |
//+------------------------------------------------------------------+
void ProcessCommands()
{
   if(!FileIsExist("cmd_req.txt"))
      return;

   int h = FileOpen("cmd_req.txt", FILE_READ | FILE_TXT | FILE_ANSI | FILE_SHARE_READ | FILE_SHARE_WRITE);
   if(h == INVALID_HANDLE)
      return;

   string line = "";
   while(!FileIsEnding(h))
   {
      string part = FileReadString(h);
      if(StringLen(part) > 0)
      {
         line = part;
         break;
      }
   }
   FileClose(h);
   FileDelete("cmd_req.txt");

   if(StringLen(line) == 0)
      return;

   // Format: id|action|ticket|symbol|volume|sl|tp|orderType|comment
   string parts[];
   int count = StringSplit(line, '|', parts);
   if(count < 2)
      return;

   string cmdId     = parts[0];
   string action    = parts[1];
   ulong  ticket    = (count > 2) ? (ulong)StringToInteger(parts[2]) : 0;
   string symbol    = (count > 3) ? parts[3] : "";
   double volume    = (count > 4) ? StringToDouble(parts[4]) : 0.0;
   double sl        = (count > 5) ? StringToDouble(parts[5]) : 0.0;
   double tp        = (count > 6) ? StringToDouble(parts[6]) : 0.0;
   string orderType = (count > 7) ? parts[7] : "";
   string comment   = (count > 8) ? parts[8] : "";

   bool ok = false;
   string msg = "";
   ulong resultOrder = 0;

   if(action == "CLOSE_POSITION")
   {
      if(!PositionSelectByTicket(ticket))
      {
         ok = false;
         msg = "Position #" + IntegerToString(ticket) + " not found";
      }
      else
      {
         string posSym = PositionGetString(POSITION_SYMBOL);
         double posVol = PositionGetDouble(POSITION_VOLUME);
         long posType  = PositionGetInteger(POSITION_TYPE);
         double closeVol = (volume > 0.0 && volume < posVol) ? volume : posVol;

         MqlTradeRequest req;
         MqlTradeResult  res;
         ZeroMemory(req);
         ZeroMemory(res);

         req.action       = TRADE_ACTION_DEAL;
         req.position     = ticket;
         req.symbol       = posSym;
         req.volume       = closeVol;
         req.type         = (posType == POSITION_TYPE_BUY) ? ORDER_TYPE_SELL : ORDER_TYPE_BUY;
         req.price        = (req.type == ORDER_TYPE_SELL) ? SymbolInfoDouble(posSym, SYMBOL_BID) : SymbolInfoDouble(posSym, SYMBOL_ASK);
         req.deviation    = 50;
         req.type_filling = GetFillingMode(posSym);
         req.comment      = StringLen(comment) > 0 ? comment : "Close by GSN CRM";

         if(OrderSend(req, res) && (res.retcode == TRADE_RETCODE_DONE || res.retcode == TRADE_RETCODE_PLACED || res.retcode == TRADE_RETCODE_DONE_PARTIAL))
         {
            ok = true;
            resultOrder = res.order;
            msg = "Closed position #" + IntegerToString(ticket);
         }
         else
         {
            ok = false;
            msg = "OrderSend close failed: retcode=" + IntegerToString(res.retcode) + " " + res.comment;
         }
      }
   }
   else if(action == "MODIFY_POSITION")
   {
      if(!PositionSelectByTicket(ticket))
      {
         ok = false;
         msg = "Position #" + IntegerToString(ticket) + " not found";
      }
      else
      {
         string posSym = PositionGetString(POSITION_SYMBOL);
         int digits    = (int)SymbolInfoInteger(posSym, SYMBOL_DIGITS);

         MqlTradeRequest req;
         MqlTradeResult  res;
         ZeroMemory(req);
         ZeroMemory(res);

         req.action   = TRADE_ACTION_SLTP;
         req.position = ticket;
         req.symbol   = posSym;
         req.sl       = (sl > 0.0) ? NormalizeDouble(sl, digits) : 0.0;
         req.tp       = (tp > 0.0) ? NormalizeDouble(tp, digits) : 0.0;

         if(OrderSend(req, res) && (res.retcode == TRADE_RETCODE_DONE || res.retcode == TRADE_RETCODE_NO_CHANGES))
         {
            ok = true;
            resultOrder = ticket;
            msg = "Modified SL/TP on #" + IntegerToString(ticket);
         }
         else
         {
            ok = false;
            msg = "Modify SL/TP failed: retcode=" + IntegerToString(res.retcode) + " " + res.comment;
         }
      }
   }
   else if(action == "OPEN_ORDER")
   {
      SymbolSelect(symbol, true);
      int digits = (int)SymbolInfoInteger(symbol, SYMBOL_DIGITS);
      bool isBuy = (orderType == "BUY" || orderType == "Buy" || orderType == "0");

      MqlTradeRequest req;
      MqlTradeResult  res;
      ZeroMemory(req);
      ZeroMemory(res);

      req.action       = TRADE_ACTION_DEAL;
      req.symbol       = symbol;
      req.volume       = volume;
      req.type         = isBuy ? ORDER_TYPE_BUY : ORDER_TYPE_SELL;
      req.price        = isBuy ? SymbolInfoDouble(symbol, SYMBOL_ASK) : SymbolInfoDouble(symbol, SYMBOL_BID);
      req.sl           = (sl > 0.0) ? NormalizeDouble(sl, digits) : 0.0;
      req.tp           = (tp > 0.0) ? NormalizeDouble(tp, digits) : 0.0;
      req.deviation    = 50;
      req.type_filling = GetFillingMode(symbol);
      req.comment      = comment;

      if(OrderSend(req, res) && (res.retcode == TRADE_RETCODE_DONE || res.retcode == TRADE_RETCODE_PLACED || res.retcode == TRADE_RETCODE_DONE_PARTIAL))
      {
         ok = true;
         resultOrder = (res.order > 0) ? res.order : res.deal;
         msg = "Opened " + orderType + " " + DoubleToString(volume, 2) + " " + symbol;
      }
      else
      {
         ok = false;
         msg = "Open order failed: retcode=" + IntegerToString(res.retcode) + " " + res.comment;
      }
   }
   else if(action == "SET_CHART")
   {
      if(StringLen(symbol) > 0)
      {
         g_activeSymbol = ResolveBrokerSymbol(symbol);
         SymbolSelect(g_activeSymbol, true);
      }
      if(ticket > 0)
         g_activeTfMinutes = (int)ticket;

      g_lastCandlesUpdateSec = 0;
      g_cachedCandlesJson = "[]";
      ok = true;
      msg = "Switched chart to " + g_activeSymbol + " TF=" + IntegerToString(g_activeTfMinutes);
   }

   // Update state.json FIRST before signaling command completion via cmd_res_<id>.json
   // so C# TryReadFreshState() immediately after SendCommand() always reads the post-command state!
   WriteStateJson();

   string resFile = "cmd_res_" + cmdId + ".json";
   int rh = FileOpen(resFile, FILE_WRITE | FILE_TXT | FILE_ANSI | FILE_SHARE_READ);
   if(rh != INVALID_HANDLE)
   {
      string json = "{\"ok\":" + (ok ? "true" : "false")
                  + ",\"message\":\"" + EscapeJson(msg) + "\""
                  + ",\"orderTicket\":" + IntegerToString(resultOrder) + "}";
      FileWriteString(rh, json);
      FileClose(rh);
   }
}

//+------------------------------------------------------------------+
//| Build and write state.json                                       |
//+------------------------------------------------------------------+
void WriteStateJson()
{
   bool connected   = (TerminalInfoInteger(TERMINAL_CONNECTED) != 0);
   long login       = AccountInfoInteger(ACCOUNT_LOGIN);
   string server    = AccountInfoString(ACCOUNT_SERVER);
   string name      = AccountInfoString(ACCOUNT_NAME);
   string currency  = AccountInfoString(ACCOUNT_CURRENCY);
   string company   = AccountInfoString(ACCOUNT_COMPANY);
   long leverage    = AccountInfoInteger(ACCOUNT_LEVERAGE);
   long tradeMode   = AccountInfoInteger(ACCOUNT_TRADE_MODE);
   double balance   = AccountInfoDouble(ACCOUNT_BALANCE);
   double equity    = AccountInfoDouble(ACCOUNT_EQUITY);
   double margin    = AccountInfoDouble(ACCOUNT_MARGIN);
   double freeMarg  = AccountInfoDouble(ACCOUNT_MARGIN_FREE);
   double margLevel = AccountInfoDouble(ACCOUNT_MARGIN_LEVEL);
   double profit    = AccountInfoDouble(ACCOUNT_PROFIT);

   string posJson = "[";
   int posTotal = PositionsTotal();
   bool firstPos = true;
   string firstPosSymbol = "";
   for(int i = 0; i < posTotal; i++)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket == 0) continue;
      string sym     = PositionGetString(POSITION_SYMBOL);
      if(StringLen(firstPosSymbol) == 0) firstPosSymbol = sym;
      long pType     = PositionGetInteger(POSITION_TYPE);
      double vol     = PositionGetDouble(POSITION_VOLUME);
      double openP   = PositionGetDouble(POSITION_PRICE_OPEN);
      double curP    = PositionGetDouble(POSITION_PRICE_CURRENT);
      double sl      = PositionGetDouble(POSITION_SL);
      double tp      = PositionGetDouble(POSITION_TP);
      double prof    = PositionGetDouble(POSITION_PROFIT);
      double swap    = PositionGetDouble(POSITION_SWAP);
      long magic     = PositionGetInteger(POSITION_MAGIC);
      string comm    = PositionGetString(POSITION_COMMENT);
      long openTime  = PositionGetInteger(POSITION_TIME);
      int digits     = (int)SymbolInfoInteger(sym, SYMBOL_DIGITS);
      if(digits <= 0) digits = 5;
      double cSize   = SymbolInfoDouble(sym, SYMBOL_TRADE_CONTRACT_SIZE);
      double tVal    = SymbolInfoDouble(sym, SYMBOL_TRADE_TICK_VALUE);
      double tSize   = SymbolInfoDouble(sym, SYMBOL_TRADE_TICK_SIZE);

      if(!firstPos) posJson += ",";
      firstPos = false;

      posJson += "{"
         + "\"ticket\":" + IntegerToString(ticket)
         + ",\"symbol\":\"" + EscapeJson(sym) + "\""
         + ",\"type\":\"" + (pType == POSITION_TYPE_BUY ? "BUY" : "SELL") + "\""
         + ",\"volume\":" + DoubleToString(vol, 4)
         + ",\"openPrice\":" + DoubleToString(openP, digits)
         + ",\"currentPrice\":" + DoubleToString(curP, digits)
         + ",\"sl\":" + DoubleToString(sl, digits)
         + ",\"tp\":" + DoubleToString(tp, digits)
         + ",\"profit\":" + DoubleToString(prof, 2)
         + ",\"swap\":" + DoubleToString(swap, 2)
         + ",\"commission\":0"
         + ",\"magic\":" + IntegerToString(magic)
         + ",\"comment\":\"" + EscapeJson(comm) + "\""
         + ",\"openTime\":" + IntegerToString(openTime)
         + ",\"digits\":" + IntegerToString(digits)
         + ",\"contractSize\":" + DoubleToString(cSize, 2)
         + ",\"tickValue\":" + DoubleToString(tVal, 5)
         + ",\"tickSize\":" + DoubleToString(tSize, 8)
         + "}";
   }
   posJson += "]";

   string activeSym = StringLen(g_activeSymbol) > 0
      ? ResolveBrokerSymbol(g_activeSymbol)
      : (StringLen(firstPosSymbol) > 0 ? firstPosSymbol : ChartSymbol(0));
   if(StringLen(activeSym) == 0) activeSym = "XAUUSD";
   SymbolSelect(activeSym, true);
   double activeBid = SymbolInfoDouble(activeSym, SYMBOL_BID);
   double activeAsk = SymbolInfoDouble(activeSym, SYMBOL_ASK);
   if(activeBid <= 0 && StringLen(firstPosSymbol) > 0 && activeSym != firstPosSymbol)
   {
      activeSym = firstPosSymbol;
      SymbolSelect(activeSym, true);
      activeBid = SymbolInfoDouble(activeSym, SYMBOL_BID);
      activeAsk = SymbolInfoDouble(activeSym, SYMBOL_ASK);
   }
   if(activeBid <= 0 && SymbolsTotal(true) > 0)
   {
      string fallbackSym = SymbolName(0, true);
      if(StringLen(fallbackSym) > 0)
      {
         activeSym = fallbackSym;
         activeBid = SymbolInfoDouble(activeSym, SYMBOL_BID);
         activeAsk = SymbolInfoDouble(activeSym, SYMBOL_ASK);
      }
   }
   g_activeSymbol = activeSym;

   int nowSec = (int)TimeLocal();
   if(connected && (nowSec - g_lastCandlesUpdateSec >= 5 || g_cachedCandlesJson == "[]"))
   {
      MqlRates rates[];
      ENUM_TIMEFRAMES tfEnum = MinutesToPeriod(g_activeTfMinutes);
      int copied = CopyRates(activeSym, tfEnum, 0, 200, rates);
      for(int attempt = 0; attempt < 6 && copied <= 0; attempt++)
      {
         Sleep(25);
         copied = CopyRates(activeSym, tfEnum, 0, 200, rates);
      }
      if(copied > 0)
      {
         g_lastCandlesUpdateSec = nowSec;
         int cDigits = (int)SymbolInfoInteger(activeSym, SYMBOL_DIGITS);
         if(cDigits <= 0) cDigits = 2;
         string cJson = "[";
         for(int i = 0; i < copied; i++)
         {
            if(i > 0) cJson += ",";
            cJson += "{"
               + "\"time\":" + IntegerToString((long)rates[i].time)
               + ",\"open\":" + DoubleToString(rates[i].open, cDigits)
               + ",\"high\":" + DoubleToString(rates[i].high, cDigits)
               + ",\"low\":" + DoubleToString(rates[i].low, cDigits)
               + ",\"close\":" + DoubleToString(rates[i].close, cDigits)
               + "}";
         }
         cJson += "]";
         g_cachedCandlesJson = cJson;
      }
   }

   if(connected && login > 0 && (nowSec - g_lastDealsUpdateSec >= 15 || g_cachedDealsJson == "[]"))
   {
      g_lastDealsUpdateSec = nowSec;
      datetime toTime = TimeCurrent() + 86400;
      datetime fromTime = toTime - 30 * 86400;
      if(HistorySelect(fromTime, toTime))
      {
         int totalDeals = HistoryDealsTotal();
         int startIdx = (totalDeals > 80) ? (totalDeals - 80) : 0;
         string dJson = "[";
         bool firstDeal = true;
         for(int i = startIdx; i < totalDeals; i++)
         {
            ulong dTicket = HistoryDealGetTicket(i);
            if(dTicket == 0) continue;
            long dEntry = HistoryDealGetInteger(dTicket, DEAL_ENTRY);
            long dType  = HistoryDealGetInteger(dTicket, DEAL_TYPE);
            if(dType != DEAL_TYPE_BUY && dType != DEAL_TYPE_SELL) continue;
            if(dEntry != DEAL_ENTRY_OUT && dEntry != DEAL_ENTRY_INOUT) continue;

            string dSym   = HistoryDealGetString(dTicket, DEAL_SYMBOL);
            int dDigits   = (int)SymbolInfoInteger(dSym, SYMBOL_DIGITS);
            if(dDigits <= 0) dDigits = 5;
            double dVol   = HistoryDealGetDouble(dTicket, DEAL_VOLUME);
            double dPrice = HistoryDealGetDouble(dTicket, DEAL_PRICE);
            double dProf  = HistoryDealGetDouble(dTicket, DEAL_PROFIT);
            double dSwap  = HistoryDealGetDouble(dTicket, DEAL_SWAP);
            double dComm  = HistoryDealGetDouble(dTicket, DEAL_COMMISSION);
            double dFee   = HistoryDealGetDouble(dTicket, DEAL_FEE);
            long dOrder   = HistoryDealGetInteger(dTicket, DEAL_ORDER);
            long dPosId   = HistoryDealGetInteger(dTicket, DEAL_POSITION_ID);
            long dMagic   = HistoryDealGetInteger(dTicket, DEAL_MAGIC);
            long dTime    = HistoryDealGetInteger(dTicket, DEAL_TIME);
            string dComment = HistoryDealGetString(dTicket, DEAL_COMMENT);

            if(!firstDeal) dJson += ",";
            firstDeal = false;

            dJson += "{"
               + "\"ticket\":" + IntegerToString(dTicket)
               + ",\"order\":" + IntegerToString(dOrder)
               + ",\"positionId\":" + IntegerToString(dPosId)
               + ",\"symbol\":\"" + EscapeJson(dSym) + "\""
               + ",\"type\":\"" + (dType == DEAL_TYPE_BUY ? "BUY" : "SELL") + "\""
               + ",\"volume\":" + DoubleToString(dVol, 4)
               + ",\"price\":" + DoubleToString(dPrice, dDigits)
               + ",\"profit\":" + DoubleToString(dProf, 2)
               + ",\"swap\":" + DoubleToString(dSwap, 2)
               + ",\"commission\":" + DoubleToString(dComm + dFee, 2)
               + ",\"magic\":" + IntegerToString(dMagic)
               + ",\"comment\":\"" + EscapeJson(dComment) + "\""
               + ",\"time\":" + IntegerToString(dTime)
               + "}";
         }
         dJson += "]";
         g_cachedDealsJson = dJson;
      }
   }

   string fullJson = "{"
      + "\"connected\":" + (connected ? "true" : "false")
      + ",\"authorized\":" + (login > 0 ? "true" : "false")
      + ",\"login\":" + IntegerToString(login)
      + ",\"server\":\"" + EscapeJson(server) + "\""
      + ",\"name\":\"" + EscapeJson(name) + "\""
      + ",\"currency\":\"" + EscapeJson(currency) + "\""
      + ",\"company\":\"" + EscapeJson(company) + "\""
      + ",\"leverage\":" + IntegerToString(leverage)
      + ",\"tradeMode\":" + IntegerToString(tradeMode)
      + ",\"balance\":" + DoubleToString(balance, 2)
      + ",\"equity\":" + DoubleToString(equity, 2)
      + ",\"margin\":" + DoubleToString(margin, 2)
      + ",\"freeMargin\":" + DoubleToString(freeMarg, 2)
      + ",\"marginLevel\":" + DoubleToString(margLevel, 2)
      + ",\"profit\":" + DoubleToString(profit, 2)
      + ",\"serverTime\":" + IntegerToString((long)TimeCurrent())
      + ",\"activeSymbol\":\"" + EscapeJson(activeSym) + "\""
      + ",\"activeTimeframe\":" + IntegerToString(g_activeTfMinutes)
      + ",\"activeBid\":" + DoubleToString(activeBid, 5)
      + ",\"activeAsk\":" + DoubleToString(activeAsk, 5)
      + ",\"positions\":" + posJson
      + ",\"candles\":" + g_cachedCandlesJson
      + ",\"deals\":" + g_cachedDealsJson
      + "}";

   int h = FileOpen("state.json", FILE_WRITE | FILE_TXT | FILE_ANSI | FILE_SHARE_READ | FILE_SHARE_WRITE);
   if(h != INVALID_HANDLE)
   {
      FileWriteString(h, fullJson);
      FileClose(h);
   }
}
//+------------------------------------------------------------------+
