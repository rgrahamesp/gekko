//
// Market God V4 - strategy from Eric Thies
//

const longOnly = true;
const onlyCloseLongInProfit = false;
const indicators = require('../modules/Indicators.js');

var marketGodStratV4 = {};

var PositionState = {
  None: 0,
  Long: 1,
  Short: 2
}
var position = PositionState.None;
var lastTrade;

var ema1 = 0.0;
var ema2 = 0.0;
var ad = 0.0;
var prevAd = 0.0;
var rr = 0.0;
var prevRR = 0.0;
var stochVals = [];
var KVals = [];
var candles = [];
var candleCount = 0;
var buy = false;
var sell = false;

  marketGodStratV4.onTrade = function (trade) {
    lastTrade = trade;
  }

marketGodStratV4.init = function (context) {
  if (context === undefined) {
    this.context = this;
  } else {
    this.context = context;
  }

  this.name = 'Market God V4';
}

marketGodStratV4.update = function (candle) {
  candles.push(candle);
  if (candles.length > 16)
    candles.shift();

  var haclose = ((candle.ha.open + candle.ha.high + candle.ha.low + candle.ha.close) / 4); //[smoothing]

  // Stoch SMA
  var sval = indicators.calc_stoch(candles, 14, true);
  stochVals.push(sval);
  if (stochVals.length > 3)
    stochVals.shift();
  var kval = indicators.calc_sma(stochVals, 3);
  KVals.push(kval);
  if (KVals.length > 3)
    KVals.shift();

  //SLOW RSI
  prevRR = rr; 
  rr = indicators.calc_slow_rsi(haclose, 6, 14, candleCount);

  // EMA
  ema1 = indicators.calc_ema(candleCount, ema1, haclose, 10);
  ema2 = indicators.calc_ema(candleCount, ema2, ema1, 10);
  var d = ema1 - ema2;
  var zlema = ema1 + d;

  //AD
  prevAd = ad;
  ad = ((candle.ha.close == candle.ha.high && candle.ha.close == candle.ha.low) || candle.ha.high == candle.ha.low ? 0.0 : ((2.0 * candle.ha.close - candle.ha.low - candle.ha.high) / (candle.ha.high - candle.ha.low)) * candle.volume);

  //BUY AND SELL CONDITIONS
  var adRising = ad > prevAd;
  var adFalling = ad < prevAd;
  var rrRising = rr > prevRR;
  var rrFalling = rr < prevRR;
  var KRising = KVals.length > 1 ? KVals[KVals.length - 1] > KVals[KVals.length - 2] : false;
  var KFalling = KVals.length > 1 ? KVals[KVals.length - 1] < KVals[KVals.length - 2] : false;
  buy = adRising && haclose > zlema && rrRising && KRising;
  sell = adFalling && haclose < zlema && rrFalling && KFalling;

  candleCount++;
}

marketGodStratV4.Buy = function (candle) {
  if (position == PositionState.Short) {
    this.advice('long');
    position = PositionState.None;
  }
  else if (position == PositionState.None) {
    this.advice('long');
    position = PositionState.Long;
  }
  //else {
  //  //this.advice('long');
  //  console.log("ERROR: Trying to long while already long!!");
  //}
}

marketGodStratV4.Sell = function (candle) {
  if (position == PositionState.None) {
    if (!longOnly) {
      this.advice('short');
      position = PositionState.Short;
    }
  }
  else if (position == PositionState.Long) {
    if (!onlyCloseLongInProfit || candle.close >= lastTrade.price) {
      this.advice('short');
      position = PositionState.None;
    }
  }
  //else if (position == PositionState.Short) {
  //  console.log("ERROR: Trying to short while already short!!");
  //}
}

marketGodStratV4.check = function (candle) {
  if (buy) {
    this.Buy(candle);
  }
  else if (sell) {
    this.Sell(candle);
  }

  //if (longOnly)
  //{
  //  if (position == PositionState.None && buy)
  //  {
  //    this.advice('long');
  //    position = PositionState.Long;
  //    entry = candle.close;
  //  }
  //  else if (position == PositionState.Long && sell)
  //  {
  //    this.advice('short');
  //    position = PositionState.None;
  //    entry = candle.close;
  //  }
  //}
  //else
  //{
  //  if (position == PositionState.None)
  //  {
  //    if (buy)
  //    {
  //      this.advice('long');
  //      position = PositionState.Long;
  //    }
  //    else if (sell)
  //    {
  //      this.advice('short');
  //      position = PositionState.Short;
  //    }
  //  }
  //  else if (position == PositionState.Long)
  //  {
  //    if (sell)
  //    {
  //      this.advice('short');
  //      position = PositionState.None;
  //    }
  //  }
  //  else if (position == PositionState.Short)
  //  {
  //    if (buy)
  //    {
  //      this.advice('long');
  //      position = PositionState.None;
  //    }
  //  }
  //}
}

module.exports = marketGodStratV4;
