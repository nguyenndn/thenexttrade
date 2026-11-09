/**
 * Ported 1:1 from MetaTrader 5 Android APK (classes.dex + lib/arm64-v8a/libcommon.so)
 *
 * Classes ported in this module:
 * - Lnet/metaquotes/metatrader5/types/HistoryPosition;   (DEX @ 0x58d180, JNI @ 0x001c25d8)
 * - Lnet/metaquotes/metatrader5/types/TradeDeal;         (DEX @ 0x590308, JNI @ 0x002beacc, struct 0x2a8 = 680B)
 * - Lnet/metaquotes/metatrader5/types/TradeOrder;        (DEX @ 0x590668, JNI @ 0x002be0a8, struct 0x288 = 648B)
 * - Lnet/metaquotes/metatrader5/types/TradePosition;     (DEX @ 0x590784, JNI @ 0x002be620)
 * - Lnet/metaquotes/metatrader5/types/PositionViewInfo;  (DEX @ 0x58e0a8, JNI @ 0x002bab3c)
 * - Lnet/metaquotes/metatrader5/types/DealsInfoRecord;   (DEX @ 0x58d088, JNI @ 0x002baf4c)
 * - Lnet/metaquotes/metatrader5/types/HistoryInfoRecord; (DEX @ 0x58d0c4, JNI @ 0x002ba9e4)
 * - Lnet/metaquotes/metatrader5/types/TradeInfoRecord;   (DEX @ 0x590400, JNI @ 0x002b8e24)
 * - Lnet/metaquotes/metatrader5/ui/history/period/EntityHistoryPeriod; (DEX @ 0x5838cc)
 * - Loh6; (History Period Date Calculator, DEX @ 0x67f168)
 */

function readUtf16NullTerminated(buf, offset, maxBytes) {
  const slice = buf.subarray(offset, offset + maxBytes);
  let end = 0;
  while (end + 1 < slice.length) {
    if (slice[end] === 0 && slice[end + 1] === 0) break;
    end += 2;
  }
  return slice.subarray(0, end).toString('utf16le');
}

function writeUtf16Fixed(buf, offset, maxBytes, str) {
  buf.fill(0, offset, offset + maxBytes);
  if (!str) return;
  const encoded = Buffer.from(String(str), 'utf16le');
  encoded.copy(buf, offset, 0, Math.min(encoded.length, maxBytes - 2));
}

/**
 * Ported from APK: Lnet/metaquotes/metatrader5/types/TradeDeal;
 * DEX offset: 0x590308
 * Native JNI builder: libcommon.so @ 0x002beacc (reads 0x2a8 = 680-byte MTDeal struct from deals_%04d.%02d.dat)
 */
class TradeDeal {
  static DEAL_BUY = 0;
  static DEAL_SELL = 1;
  static DEAL_BALANCE = 2;
  static DEAL_CREDIT = 3;
  static DEAL_CHARGE = 4;
  static DEAL_CORRECTION = 5;
  static DEAL_BONUS = 6;
  static DEAL_COMMISSION = 7;
  static DEAL_COMMISSION_DAILY = 8;
  static DEAL_COMMISSION_MONTHLY = 9;
  static DEAL_AGENT_DAILY = 10;
  static DEAL_AGENT_MONTHLY = 11;
  static DEAL_INTERESTRATE = 12;
  static DEAL_BUY_CANCELED = 13;
  static DEAL_SELL_CANCELED = 14;
  static DEAL_DIVIDEND = 15;
  static DEAL_DIVIDEND_FRANKED = 16;
  static DEAL_TAX = 17;
  static DEAL_AGENT = 18;
  static DEAL_SO_COMPENSATION = 19;
  static DEAL_SO_COMPENSATION_CREDIT = 20;

  static ENTRY_IN = 0;
  static ENTRY_OUT = 1;
  static ENTRY_INOUT = 2;
  static ENTRY_OUT_BY = 3;

  static STRUCT_SIZE = 0x2a8; // 680 bytes in deals_%04d.%02d.dat (libcommon.so @ 0x1f5118)

  /**
   * DEX: <init>(Ljava/lang/String;, Ljava/lang/String;, J, B, B, D, D, J, D, I, D, D, J, Ljava/lang/String;, J, J, D, D, I, Z, Z)V
   * code_off = 0x590308
   */
  constructor(
    symbol,
    externalId,
    positionId,
    digits,
    digitsCurrency,
    tradeTickSize,
    point,
    volume,
    priceOpen,
    action,
    sl,
    tp,
    date,
    comment,
    order,
    deal,
    commission,
    commissionFee,
    entry,
    canModify = false,
    canTrade = true
  ) {
    this.updated = false;
    this.isAsset = false;
    this.symbol = String(symbol || '');
    this.externalId = String(externalId || '');
    this.positionId = Number(positionId || 0);
    this.digits = Number(digits || 2);
    this.digitsCurrency = Number(digitsCurrency || 2);
    this.tradeTickSize = Number(tradeTickSize || 0.01);
    this.point = Number(point || 0.01);
    this.volume = Number(volume || 0); // In APK native: 1/10000th lot (e.g. 300 = 0.03 lot)
    this.priceOpen = Number(priceOpen || 0);
    this.action = Number(action || 0);
    this.sl = Number(sl || 0);
    this.tp = Number(tp || 0);
    this.date = Number(date || 0); // Epoch ms in APK Java layer
    this.comment = String(comment || '');
    this.order = Number(order || 0);
    this.deal = Number(deal || 0);
    this.commission = Number(commission || 0);
    this.commissionFee = Number(commissionFee || 0);
    this.entry = Number(entry || 0);
    this.canModify = Boolean(canModify);
    this.canTrade = Boolean(canTrade);
    this.priceClose = 0.0;
    this.profit = 0.0;
    this.swap = 0.0;
    this.order_reason = 0;
  }

  /**
   * DEX: update(D, D, D)V @ 0x5903b0 (called by JNI @ 0x2becd0)
   */
  update(priceClose, profit, swap) {
    this.updated =
      this.priceClose !== Number(priceClose) ||
      this.profit !== Number(profit) ||
      this.swap !== Number(swap);
    this.priceClose = Number(priceClose || 0);
    this.profit = Number(profit || 0);
    this.swap = Number(swap || 0);
  }

  /**
   * Native JNI: TradeDeal.getAction(int action) @ 0x002beb20
   */
  static getAction(action) {
    const map = {
      0: 'buy',
      1: 'sell',
      2: 'balance',
      3: 'credit',
      4: 'charge',
      5: 'correction',
      6: 'bonus',
      7: 'commission',
      8: 'daily commission',
      9: 'monthly commission',
      10: 'daily agent',
      11: 'monthly agent',
      12: 'interest rate',
      13: 'canceled buy',
      14: 'canceled sell',
      15: 'dividend',
      16: 'franked dividend',
      17: 'tax',
      18: 'agent',
      19: 'so compensation',
      20: 'so credit compensation'
    };
    return map[Number(action)] || '?';
  }

  /**
   * DEX: TradeDeal.getEntry(int entry) @ 0x5902c4
   */
  static getEntry(entry) {
    switch (Number(entry)) {
      case 0:
        return 'in';
      case 1:
        return 'out';
      case 2:
        return 'in/out';
      case 3:
        return 'out by';
      default:
        return '?';
    }
  }

  getAction() {
    return TradeDeal.getAction(this.action);
  }

  getEntry() {
    return TradeDeal.getEntry(this.entry);
  }

  isBalance() {
    return (
      this.action === TradeDeal.DEAL_BALANCE ||
      this.action === TradeDeal.DEAL_CREDIT ||
      this.action === TradeDeal.DEAL_CHARGE ||
      this.action === TradeDeal.DEAL_CORRECTION ||
      this.action === TradeDeal.DEAL_BONUS
    );
  }

  isBuy() {
    return this.action === TradeDeal.DEAL_BUY;
  }

  getVolumeLots() {
    return this.volume >= 100 ? Number((this.volume / 10000).toFixed(2)) : Number(this.volume.toFixed(2));
  }

  getTimestampSeconds() {
    return this.date > 10000000000 ? Math.floor(this.date / 1000) : Math.floor(this.date);
  }

  /**
   * Ported from libcommon.so @ 0x002beacc:
   * Reads a 0x2a8 (680-byte) MTDeal binary record from deals_%04d.%02d.dat
   */
  static fromNativeStruct(buf, offset = 0) {
    const deal = Number(buf.readBigUInt64LE(offset + 0x00));
    const dateMs = Number(buf.readBigInt64LE(offset + 0x08));
    const positionId = Number(buf.readBigUInt64LE(offset + 0x10));
    const symbol = readUtf16NullTerminated(buf, offset + 0x18, 64);
    const externalId = readUtf16NullTerminated(buf, offset + 0x58, 64);
    const digits = buf.readInt8(offset + 0x98);
    const digitsCurrency = buf.readInt8(offset + 0x9c);
    const order = Number(buf.readBigUInt64LE(offset + 0xa0));
    const priceOpen = buf.readDoubleLE(offset + 0xa8);
    const action = buf.readUInt32LE(offset + 0xb0);
    const volume = Number(buf.readBigUInt64LE(offset + 0xb8));
    const profit = buf.readDoubleLE(offset + 0xc0);
    const swap = buf.readDoubleLE(offset + 0xc8);
    const commission = buf.readDoubleLE(offset + 0xd0);
    const commissionFee = buf.readDoubleLE(offset + 0xd8);
    const entry = buf.readUInt32LE(offset + 0xe0);
    const comment = readUtf16NullTerminated(buf, offset + 0xe4, 64);
    const sl = buf.readDoubleLE(offset + 0x128);
    const tp = buf.readDoubleLE(offset + 0x130);
    const point = Math.pow(10, -Math.max(0, digits));

    const td = new TradeDeal(
      symbol,
      externalId,
      positionId,
      digits,
      digitsCurrency,
      point,
      point,
      volume,
      priceOpen,
      action,
      sl,
      tp,
      dateMs,
      comment,
      order,
      deal,
      commission,
      commissionFee,
      entry,
      false,
      true
    );
    td.update(priceOpen, profit, swap);
    return td;
  }

  /**
   * Serializes this TradeDeal into the exact 0x2a8 (680-byte) MTDeal struct expected by libcommon.so @ 0x1f5118
   */
  toNativeStruct() {
    const buf = Buffer.alloc(TradeDeal.STRUCT_SIZE, 0);
    const dateMs = this.date > 10000000000 ? this.date : this.date * 1000;
    const volUnits = this.volume >= 100 ? Math.round(this.volume) : Math.round(this.volume * 10000);
    buf.writeBigUInt64LE(BigInt(this.deal || 0), 0x00);
    buf.writeBigInt64LE(BigInt(dateMs || 0), 0x08);
    buf.writeBigUInt64LE(BigInt(this.positionId || 0), 0x10);
    writeUtf16Fixed(buf, 0x18, 64, this.symbol);
    writeUtf16Fixed(buf, 0x58, 64, this.externalId);
    buf.writeInt8(this.digits || 2, 0x98);
    buf.writeInt8(this.digitsCurrency || 2, 0x9c);
    buf.writeBigUInt64LE(BigInt(this.order || 0), 0xa0);
    buf.writeDoubleLE(Number(this.priceOpen || 0), 0xa8);
    buf.writeUInt32LE(Number(this.action || 0), 0xb0);
    buf.writeBigUInt64LE(BigInt(volUnits), 0xb8);
    buf.writeDoubleLE(Number(this.profit || 0), 0xc0);
    buf.writeDoubleLE(Number(this.swap || 0), 0xc8);
    buf.writeDoubleLE(Number(this.commission || 0), 0xd0);
    buf.writeDoubleLE(Number(this.commissionFee || 0), 0xd8);
    buf.writeUInt32LE(Number(this.entry || 0), 0xe0);
    writeUtf16Fixed(buf, 0xe4, 64, this.comment);
    buf.writeDoubleLE(Number(this.sl || 0), 0x128);
    buf.writeDoubleLE(Number(this.tp || 0), 0x130);
    return buf;
  }
}

/**
 * Ported from APK: Lnet/metaquotes/metatrader5/types/TradeOrder;
 * DEX offset: 0x590668
 * Native JNI builder: libcommon.so @ 0x002be0a8 (reads 0x288 = 648-byte MTOrder struct from history_%04d.%02d.dat)
 */
class TradeOrder {
  static OP_BUY = 0;
  static OP_SELL = 1;
  static OP_BUY_LIMIT = 2;
  static OP_SELL_LIMIT = 3;
  static OP_BUY_STOP = 4;
  static OP_SELL_STOP = 5;
  static OP_BUY_STOP_LIMIT = 6;
  static OP_SELL_STOP_LIMIT = 7;
  static OP_CLOSE_BY = 8;

  static ORDER_STATE_STARTED = 0;
  static ORDER_STATE_PLACED = 1;
  static ORDER_STATE_CANCELED = 2;
  static ORDER_STATE_PARTIAL = 3;
  static ORDER_STATE_FILLED = 4;
  static ORDER_STATE_REJECTED = 5;
  static ORDER_STATE_EXPIRED = 6;
  static ORDER_STATE_REQUEST_ADD = 7;
  static ORDER_STATE_REQUEST_MODIFY = 8;
  static ORDER_STATE_REQUEST_CANCEL = 9;

  static STRUCT_SIZE = 0x288; // 648 bytes in history_%04d.%02d.dat (libcommon.so @ 0x205ec0)

  /**
   * DEX: <init>(J, Ljava/lang/String;, Ljava/lang/String;, I, B, I, D, D, I, J, J, D, D, D, D, I, J, J, J, Ljava/lang/String;, I, Z, I)V
   * code_off = 0x590668
   */
  constructor(
    order,
    symbol,
    externalId,
    type,
    digits,
    digitsCurrency,
    tradeTickSize,
    point,
    state,
    volumeInitial,
    volumeCurrent,
    priceOpen,
    priceTrigger,
    sl,
    tp,
    expirationType,
    expirationDate,
    dateSetup,
    dateDone,
    comment,
    reason = 0,
    canModify = false,
    fillPolicy = 0,
    positionId = 0
  ) {
    this.updated = false;
    this.order = Number(order || 0);
    this.symbol = String(symbol || '');
    this.externalId = String(externalId || '');
    this.type = Number(type || 0);
    this.digits = Number(digits || 2);
    this.digitsCurrency = Number(digitsCurrency || 2);
    this.tradeTickSize = Number(tradeTickSize || 0.01);
    this.point = Number(point || 0.01);
    this.state = Number(state || 0);
    this.volumeInitial = Number(volumeInitial || 0);
    this.volumeCurrent = Number(volumeCurrent || 0);
    this.priceOpen = Number(priceOpen || 0);
    this.priceTrigger = Number(priceTrigger || 0);
    this.sl = Number(sl || 0);
    this.tp = Number(tp || 0);
    this.expirationType = Number(expirationType || 0);
    this.expirationDate = Number(expirationDate || 0);
    this.dateSetup = Number(dateSetup || 0);
    this.dateDone = Number(dateDone || 0);
    this.comment = String(comment || '');
    this.reason = Number(reason || 0);
    this.canModify = Boolean(canModify);
    this.fillPolicy = Number(fillPolicy || 0);
    this.priceCurrent = Number(priceOpen || 0);
    this.positionId = Number(positionId || 0);
  }

  /**
   * DEX: TradeOrder.getState(int state) @ 0x590540
   */
  static getState(state) {
    switch (Number(state)) {
      case 0:
        return 'started';
      case 1:
        return 'placed';
      case 2:
        return 'canceled';
      case 3:
        return 'partial';
      case 4:
        return 'filled';
      case 5:
        return 'rejected';
      case 6:
        return 'expired';
      case 7:
        return 'request adding';
      case 8:
        return 'request modify';
      case 9:
        return 'request cancel';
      default:
        return '?';
    }
  }

  /**
   * DEX: TradeOrder.getType(int type) @ 0x5905e8
   */
  static getType(type) {
    switch (Number(type)) {
      case 0:
        return 'buy';
      case 1:
        return 'sell';
      case 2:
        return 'buy limit';
      case 3:
        return 'sell limit';
      case 4:
        return 'buy stop';
      case 5:
        return 'sell stop';
      case 6:
        return 'buy stop limit';
      case 7:
        return 'sell stop limit';
      case 8:
        return 'close by';
      default:
        return '?';
    }
  }

  update(priceCurrent) {
    this.updated = this.priceCurrent !== Number(priceCurrent);
    this.priceCurrent = Number(priceCurrent || 0);
  }

  getState() {
    return TradeOrder.getState(this.state);
  }

  getType() {
    return TradeOrder.getType(this.type);
  }

  getFillPolicy() {
    return this.fillPolicy;
  }

  getVolumeInitialLots() {
    return this.volumeInitial >= 100
      ? Number((this.volumeInitial / 10000).toFixed(2))
      : Number(this.volumeInitial.toFixed(2));
  }

  getVolumeFilledLots() {
    const initLots = this.getVolumeInitialLots();
    const curLots =
      this.volumeCurrent >= 100
        ? Number((this.volumeCurrent / 10000).toFixed(2))
        : Number(this.volumeCurrent.toFixed(2));
    return Number(Math.max(0, initLots - curLots).toFixed(2));
  }

  /**
   * Ported from libcommon.so @ 0x002be0a8:
   * Reads a 0x288 (648-byte) MTOrder binary record from history_%04d.%02d.dat
   */
  static fromNativeStruct(buf, offset = 0) {
    const order = Number(buf.readBigUInt64LE(offset + 0x00));
    const symbol = readUtf16NullTerminated(buf, offset + 0x08, 64);
    const externalId = readUtf16NullTerminated(buf, offset + 0x48, 64);
    const type = buf.readUInt32LE(offset + 0x98);
    const digits = buf.readInt8(offset + 0x9c);
    const digitsCurrency = buf.readInt8(offset + 0x9d) || 2;
    const dateSetup = Number(buf.readBigInt64LE(offset + 0xa0));
    const expirationType = buf.readUInt32LE(offset + 0xa8);
    const state = buf.readUInt32LE(offset + 0xac);
    const expirationDate = Number(buf.readBigInt64LE(offset + 0xb0));
    const dateDone = Number(buf.readBigInt64LE(offset + 0xb8));
    const fillPolicy = buf.readUInt32LE(offset + 0xc0);
    const reason = buf.readUInt32LE(offset + 0xc4);
    const priceOpen = buf.readDoubleLE(offset + 0xc8);
    const priceTrigger = buf.readDoubleLE(offset + 0xd0);
    const sl = buf.readDoubleLE(offset + 0xd8);
    const tp = buf.readDoubleLE(offset + 0xe0);
    const comment = readUtf16NullTerminated(buf, offset + 0xec, 64);
    const volumeInitial = Number(buf.readBigUInt64LE(offset + 0x130));
    const volumeCurrent = Number(buf.readBigUInt64LE(offset + 0x138));
    const positionId = Number(buf.readBigUInt64LE(offset + 0x140));
    const point = Math.pow(10, -Math.max(0, digits));

    return new TradeOrder(
      order,
      symbol,
      externalId,
      type,
      digits,
      digitsCurrency,
      point,
      point,
      state,
      volumeInitial,
      volumeCurrent,
      priceOpen,
      priceTrigger,
      sl,
      tp,
      expirationType,
      expirationDate,
      dateSetup,
      dateDone,
      comment,
      reason,
      false,
      fillPolicy,
      positionId
    );
  }

  /**
   * Serializes this TradeOrder into the exact 0x288 (648-byte) MTOrder struct expected by libcommon.so @ 0x205ec0
   */
  toNativeStruct() {
    const buf = Buffer.alloc(TradeOrder.STRUCT_SIZE, 0);
    const setupMs = this.dateSetup > 10000000000 ? this.dateSetup : this.dateSetup * 1000;
    const doneMs = this.dateDone > 10000000000 ? this.dateDone : this.dateDone * 1000;
    const volInitUnits =
      this.volumeInitial >= 100 ? Math.round(this.volumeInitial) : Math.round(this.volumeInitial * 10000);
    const volCurUnits =
      this.volumeCurrent >= 100 ? Math.round(this.volumeCurrent) : Math.round(this.volumeCurrent * 10000);

    buf.writeBigUInt64LE(BigInt(this.order || 0), 0x00);
    writeUtf16Fixed(buf, 0x08, 64, this.symbol);
    writeUtf16Fixed(buf, 0x48, 64, this.externalId);
    buf.writeUInt32LE(Number(this.type || 0), 0x98);
    buf.writeInt8(this.digits || 2, 0x9c);
    buf.writeInt8(this.digitsCurrency || 2, 0x9d);
    buf.writeBigInt64LE(BigInt(setupMs || 0), 0xa0);
    buf.writeUInt32LE(Number(this.expirationType || 0), 0xa8);
    buf.writeUInt32LE(Number(this.state || 0), 0xac);
    buf.writeBigInt64LE(BigInt(this.expirationDate || 0), 0xb0);
    buf.writeBigInt64LE(BigInt(doneMs || 0), 0xb8);
    buf.writeUInt32LE(Number(this.fillPolicy || 0), 0xc0);
    buf.writeUInt32LE(Number(this.reason || 0), 0xc4);
    buf.writeDoubleLE(Number(this.priceOpen || 0), 0xc8);
    buf.writeDoubleLE(Number(this.priceTrigger || 0), 0xd0);
    buf.writeDoubleLE(Number(this.sl || 0), 0xd8);
    buf.writeDoubleLE(Number(this.tp || 0), 0xe0);
    writeUtf16Fixed(buf, 0xec, 64, this.comment);
    buf.writeBigUInt64LE(BigInt(volInitUnits), 0x130);
    buf.writeBigUInt64LE(BigInt(volCurUnits), 0x138);
    buf.writeBigUInt64LE(BigInt(this.positionId || 0), 0x140);
    return buf;
  }
}

/**
 * Ported from APK: Lnet/metaquotes/metatrader5/types/HistoryPosition;
 * DEX offset: 0x58d180
 * Native JNI builder: libcommon.so @ 0x001c25d8 (tradeHistoryPositionAt @ 0x002bb138)
 */
class HistoryPosition {
  /**
   * DEX: <init>(J, Ljava/lang/String;, I, I, J, J, D, I, J, J, D, D, D, D, D, D, D, I, I, Ljava/lang/String;)V
   * code_off = 0x58d180
   */
  constructor(
    id,
    symbol,
    type,
    openReason,
    openVolume,
    openTime,
    openPrice,
    closeReason,
    closeTime,
    closeVolume,
    closePrice,
    commission,
    commission_fee,
    storage,
    profit,
    sl,
    tp,
    digits = 2,
    digitsCurrency = 2,
    comment = ''
  ) {
    this.id = Number(id || 0);
    this.symbol = String(symbol || '');
    this.type = Number(type || 0);
    this.openReason = Number(openReason || 0);
    this.openVolume = Number(openVolume || 0);
    this.openTime = Number(openTime || 0);
    this.openPrice = Number(openPrice || 0);
    this.closeReason = Number(closeReason || 0);
    this.closeTime = Number(closeTime || 0);
    this.closeVolume = Number(closeVolume || 0);
    this.closePrice = Number(closePrice || 0);
    this.commission = Number(commission || 0);
    this.commission_fee = Number(commission_fee || 0);
    this.storage = Number(storage || 0); // swap in MT5 native struct
    this.profit = Number(profit || 0);
    this.sl = Number(sl || 0);
    this.tp = Number(tp || 0);
    this.digits = Number(digits || 2);
    this.digitsCurrency = Number(digitsCurrency || 2);
    this.comment = String(comment || '');
  }

  /**
   * DEX: getType()Ljava/lang/String; @ 0x58d160
   * -> CALL Lnet/metaquotes/metatrader5/types/TradeDeal;->getAction(I)Ljava/lang/String;
   */
  getType() {
    return TradeDeal.getAction(this.type);
  }

  /**
   * DEX: isBalance()Z @ 0x58d0dc
   */
  isBalance() {
    return (
      this.type === TradeDeal.DEAL_BALANCE ||
      this.type === TradeDeal.DEAL_CREDIT ||
      this.type === TradeDeal.DEAL_CHARGE ||
      this.type === TradeDeal.DEAL_CORRECTION ||
      this.type === TradeDeal.DEAL_BONUS
    );
  }

  getCloseVolumeLots() {
    const vol = this.closeVolume > 0 ? this.closeVolume : this.openVolume;
    return vol >= 100 ? Number((vol / 10000).toFixed(2)) : Number(vol.toFixed(2));
  }
}

/**
 * Ported from APK: Lnet/metaquotes/metatrader5/types/TradePosition;
 * DEX offset: 0x590784
 */
class TradePosition {
  constructor(
    symbol,
    id,
    digits,
    digitsCurrency,
    tradeTickSize,
    point,
    volume,
    priceOpen,
    action,
    sl,
    tp,
    date,
    comment = '',
    canModify = true,
    canTrade = true,
    externalId = ''
  ) {
    this.updated = false;
    this.isAsset = false;
    this.symbol = String(symbol || '');
    this.id = Number(id || 0);
    this.digits = Number(digits || 2);
    this.digitsCurrency = Number(digitsCurrency || 2);
    this.tradeTickSize = Number(tradeTickSize || 0.01);
    this.point = Number(point || 0.01);
    this.volume = Number(volume || 0);
    this.priceOpen = Number(priceOpen || 0);
    this.action = Number(action || 0);
    this.sl = Number(sl || 0);
    this.tp = Number(tp || 0);
    this.date = Number(date || 0);
    this.comment = String(comment || '');
    this.canModify = Boolean(canModify);
    this.canTrade = Boolean(canTrade);
    this.externalId = String(externalId || '');
    this.priceClose = Number(priceOpen || 0);
    this.profit = 0.0;
    this.swap = 0.0;
    this.order_reason = 0;
  }

  /**
   * DEX: update(D, D, D, J)V @ 0x590804
   */
  update(priceClose, profit, swap, volume) {
    this.updated =
      this.priceClose !== Number(priceClose) ||
      this.profit !== Number(profit) ||
      this.swap !== Number(swap);
    this.priceClose = Number(priceClose || 0);
    this.profit = Number(profit || 0);
    this.swap = Number(swap || 0);
    if (volume !== undefined) this.volume = Number(volume);
  }

  getAction() {
    return TradeDeal.getAction(this.action);
  }

  isBuy() {
    return this.action === TradeDeal.DEAL_BUY;
  }
}

/**
 * Ported from APK: Lnet/metaquotes/metatrader5/types/PositionViewInfo;
 * DEX offset: 0x58e0a8 (populated via JNI TerminalTrade.tradeHistoryPositionsSummary @ 0x002bab3c)
 */
class PositionViewInfo {
  constructor() {
    this.balance = 0.0;
    this.profit = 0.0;
    this.swap = 0.0;
    this.commission = 0.0;
    this.commission_fee = 0.0;
    this.buysell = 0.0;
    this.credit = 0.0;
    this.deposit = 0.0;
    this.withdrawal = 0.0;
    this.digitsCurrency = 2;
  }

  /**
   * DEX: update(D, D, D, D, D, D, D, D, D, I)V @ 0x58e0f0
   */
  update(
    balance,
    profit,
    swap,
    commission,
    commission_fee,
    buysell,
    credit,
    deposit,
    withdrawal,
    digitsCurrency = 2
  ) {
    this.balance = Number(balance || 0);
    this.profit = Number(profit || 0);
    this.swap = Number(swap || 0);
    this.commission = Number(commission || 0);
    this.commission_fee = Number(commission_fee || 0);
    this.buysell = Number(buysell || 0);
    this.credit = Number(credit || 0);
    this.deposit = Number(deposit || 0);
    this.withdrawal = Number(withdrawal || 0);
    this.digitsCurrency = Number(digitsCurrency || 2);
  }
}

/**
 * Ported from APK: Lnet/metaquotes/metatrader5/types/DealsInfoRecord;
 * DEX offset: 0x58d088 (populated via JNI TerminalTrade.tradeHistoryDealsSummary @ 0x002baf4c)
 */
class DealsInfoRecord {
  constructor() {
    this.balance = 0.0;
    this.buysell = 0.0;
    this.commission = 0.0;
    this.commission_fee = 0.0;
    this.credit = 0.0;
    this.deposit = 0.0;
    this.digits = 2;
    this.profit = 0.0;
    this.swap = 0.0;
    this.withdrawal = 0.0;
  }
}

/**
 * Ported from APK: Lnet/metaquotes/metatrader5/types/HistoryInfoRecord;
 * DEX offset: 0x58d0c4 (populated via JNI TerminalTrade.tradeHistoryOrdersSummary @ 0x002ba9e4)
 */
class HistoryInfoRecord {
  constructor() {
    this.canceled = 0;
    this.filled = 0;
    this.total = 0;
  }
}

/**
 * Ported from APK: Lnet/metaquotes/metatrader5/types/TradeInfoRecord;
 * DEX offset: 0x590400 (populated via JNI TerminalTrade.tradeGetInfo @ 0x002b8e24)
 */
class TradeInfoRecord {
  constructor() {
    this.digits = 2;
    this.balance = 0.0;
    this.credit = 0.0;
    this.margin = 0.0;
    this.marginFree = 0.0;
    this.marginLevel = 0.0;
    this.profit = 0.0;
    this.equity = 0.0;
    this.commission = 0.0;
    this.blocked = 0.0;
    this.marginMaintenance = 0.0;
    this.marginInitial = 0.0;
    this.collateral = 0.0;
    this.assets = 0.0;
    this.liabilities = 0.0;
    this.hasMarginCall = false;
  }

  /**
   * DEX: update(I, D, D, D, D, D, D, D, D, D, D, D, D, D, D, Z)V @ 0x590418
   */
  update(
    digits,
    balance,
    credit,
    margin,
    marginFree,
    marginLevel,
    profit,
    equity,
    commission,
    blocked,
    marginMaintenance,
    marginInitial,
    collateral,
    assets,
    liabilities,
    hasMarginCall = false
  ) {
    this.digits = Number(digits || 2);
    this.balance = Number(balance || 0);
    this.credit = Number(credit || 0);
    this.margin = Number(margin || 0);
    this.marginFree = Number(marginFree || 0);
    this.marginLevel = Number(marginLevel || 0);
    this.profit = Number(profit || 0);
    this.equity = Number(equity || 0);
    this.commission = Number(commission || 0);
    this.blocked = Number(blocked || 0);
    this.marginMaintenance = Number(marginMaintenance || 0);
    this.marginInitial = Number(marginInitial || 0);
    this.collateral = Number(collateral || 0);
    this.assets = Number(assets || 0);
    this.liabilities = Number(liabilities || 0);
    this.hasMarginCall = Boolean(hasMarginCall);
  }
}

/**
 * Ported from APK: Lnet/metaquotes/metatrader5/ui/history/period/EntityHistoryPeriod;
 * DEX offset: 0x5838cc
 */
const EntityHistoryPeriod = Object.freeze({
  TODAY: 'TODAY',
  LAST_WEEK: 'LAST_WEEK',
  LAST_MONTH: 'LAST_MONTH',
  LAST_THREE_MONTHS: 'LAST_THREE_MONTHS',
  CUSTOM: 'CUSTOM'
});

/**
 * Ported from APK: Loh6; (History Period Date Calculator used by HistoryFragment.R0/V0)
 * DEX offset: 0x67f168
 */
class HistoryPeriodCalculator_Loh6 {
  static b(period, customFromMs = 0, customToMs = 0) {
    const now = new Date();
    const endOfToday = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999)
    ).getTime();
    const startOfToday = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0)
    ).getTime();

    switch (period) {
      case EntityHistoryPeriod.TODAY:
        return [startOfToday, endOfToday];
      case EntityHistoryPeriod.LAST_WEEK:
        return [startOfToday - 7 * 86400 * 1000, endOfToday];
      case EntityHistoryPeriod.LAST_MONTH:
        return [startOfToday - 30 * 86400 * 1000, endOfToday];
      case EntityHistoryPeriod.LAST_THREE_MONTHS:
        return [startOfToday - 90 * 86400 * 1000, endOfToday];
      case EntityHistoryPeriod.CUSTOM:
      default:
        return [
          customFromMs > 0 ? customFromMs : startOfToday - 30 * 86400 * 1000,
          customToMs > 0 ? customToMs : endOfToday
        ];
    }
  }
}

module.exports = {
  TradeDeal,
  TradeOrder,
  HistoryPosition,
  TradePosition,
  PositionViewInfo,
  DealsInfoRecord,
  HistoryInfoRecord,
  TradeInfoRecord,
  EntityHistoryPeriod,
  HistoryPeriodCalculator_Loh6,
  readUtf16NullTerminated,
  writeUtf16Fixed
};
