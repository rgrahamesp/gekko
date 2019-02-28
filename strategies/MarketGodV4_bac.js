//
// Market God V4 - strategy from Eric Thies
//

//const _ = require('lodash');
//const util = require('util');
//const log = require('../core/log.js');
//const config = require('../core/util.js').getConfig();
//const candleBatcher = require('../core/candleBatcher');
const indicators = require('../modules/IndicatorsPlus.js');

var marketGodStratV4_bac = {};

const longOnly = true;
const onlyCloseLongInProfit = true;
const onlyCloseShortInProfit = false;

const periods = 6;
const smooth = 14;

var PositionState = {
  None: 0,
  Long: 1,
  Short: 2
}
var position = PositionState.None;

var RMA = 0.0;
var prevLow = 0.0;
var prevHigh = 0.0;
var prevClose = 0.0;
var trur = 0.0;
var rmaX1 = 0.0;
var rmaX2 = 0.0;
var rmaX3 = 0.0;
var up1 = 0.0;
var down1 = 0.0;
var pK = 0.0;
var pD = 0.0;
var EMA5 = 0.0;
var EMA10 = 0.0;
var EMA15 = 0.0;
var MA200 = 0.0;
var MA99 = 0.0;
var ema1 = 0.0;
var ema2 = 0.0;
var ad = 0.0;
var prevAd = 0.0;
var r1 = 0.0;
var r4 = 0.0;
var r5 = 0.0;
var rr = 0.0;
var prevRR = 0.0;
var stochVals = [];
var KVals = [];
var candles = [];
var candleCount = 0;
var buy = false;
var sell = false;

marketGodStratV4_bac.init = function (context) {
  if (context === undefined) {
    this.context = this;
  } else {
    this.context = context;
  }

  this.name = 'Market God V4 bac';
}

marketGodStratV4_bac.update = function (candle) {
  candles.push(candle);
  if (candles.length > 16)
    candles.shift();

  var haclose = ((candle.ha.open + candle.ha.high + candle.ha.low + candle.ha.close) / 4); //[smoothing]

  //// RMA
  //RMA = indicators.calc_rma(candleCount, RMA, haclose, 14);

  // ADX    - // var adx = indicators.calc_adx(candles, candleCount, true, 14, 14);
  //var len = 14;
  //var lensig = 14;
  //var up = candle.ha.high - prevHigh;
  //var down = -(candle.ha.low - prevLow);
  //var plusDM = (up > down && up > 0.0) ? up : 0.0;
  //var minusDM = (down > up && down > 0.0) ? down : 0.0;
  //var tr = Math.max(candle.ha.high - candle.ha.low, Math.abs(candle.ha.high - prevClose), Math.abs(candle.ha.low - prevClose));
  //trur = indicators.calc_rma(candleCount, trur, tr, len);
  //rmaX1 = indicators.calc_rma(candleCount, rmaX1, plusDM, len);
  //var plus = 100.0 * rmaX1 / trur;
  //rmaX2 = indicators.calc_rma(candleCount, rmaX2, minusDM, len);
  //var minus = 100.0 * rmaX2 / trur;
  //var sum = plus + minus;
  //rmaX3 = indicators.calc_rma(candleCount, rmaX3, Math.abs(plus - minus) / (sum == 0 ? 1.0 : sum), lensig);
  //var adx = 100.0 * rmaX3;

  // RSI   - // var rsi = indicators.calc_rsi(prevClose, haclose, 9, candleCount);
  //var changeClose = haclose - prevClose;
  //up1 = indicators.calc_rma(candleCount, up1, Math.max(changeClose, 0), 9);
  //down1 = indicators.calc_rma(candleCount, down1, -Math.min(changeClose, 0), 9);
  //var rsi = down1 == 0 ? 100.0 : up1 == 0 ? 0.0 : 100.0 - (100.0 / (1.0 + up1 / down1));
  var sval = indicators.calc_stoch_ha(candles, 14);
  //var day = candle.start.format('M-D');
  //console.log(day + ": " + sval);

  stochVals.push(sval);
  if (stochVals.length > 3)
    stochVals.shift();
  var kval = indicators.calc_sma(stochVals, 3);
  KVals.push(kval);
  if (KVals.length > 3)
    KVals.shift();
  //var D = indicators.calc_sma(KVals, 3);

  // KDJ
  //var hi = indicators.highest_high_candles(candles, 9, true);
  //var lo = indicators.lowest_low_candles(candles, 9, true);
  //var k = 100.0 * ((haclose - candle.low) / (hi - lo));
  //pK = indicators.calc_rma(candleCount, pK, k, 3);
  //pD = indicators.calc_rma(candleCount, pD, pK, 3);
  //var KD = (pK + pD) / 2.0;

  //SLOW RSI
  r1 = indicators.calc_ema(candleCount, r1, haclose, periods);
  var r2 = haclose > r1 ? haclose - r1 : 0.0;
  var r3 = haclose < r1 ? r1 - haclose : 0.0;
  r4 = indicators.calc_wima(candleCount, r4, r2, smooth);
  r5 = indicators.calc_wima(candleCount, r5, r3, smooth);
  prevRR = rr;
  rr = r5 == 0 ? 100.0 : 100.0 - (100.0 / (1.0 + (r4 / r5)));

  //EMA 
  //EMA5 = indicators.calc_ema(candleCount, EMA5, haclose, 5);
  //EMA10 = indicators.calc_ema(candleCount, EMA10, haclose, 10);
  //EMA15 = indicators.calc_ema(candleCount, EMA15, haclose, 15);
  ////MA200 = indicators.calc_sma_candles(candles, 200); // Need to up the candle storage to 200
  ////MA99 = indicators.calc_sma_candles(candles, 99); // Need to up the candle storage to 99

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

  prevClose = haclose;
  prevLow = candle.ha.low;
  prevHigh = candle.ha.high;
  candleCount++;
}

//marketGodStratV4_bac.Buy = function () {
//  if (position == PositionState.None) {
//    this.advice('long');
//    position = PositionState.Long;
//  }
//}

//marketGodStratV4_bac.Sell = function () {
//  if (longOnly && position != PositionState.Long) {
//    return;
//  }

//  if (position == PositionState.Long && onlyCloseLongInProfit) {
//    this.advice.
//  }

//  if (position == PositionState.None) {
//    if (!longOnly)
//    this.advice('short');
//    position = PositionState.Long;
//  }
//}

marketGodStratV4_bac.check = function (candle) {
  if (longOnly)
  {
    if (position == PositionState.None && buy)
    {
      this.advice('long');
      position = PositionState.Long;
    }
    else if (position == PositionState.Long && sell)
    {
      this.advice('short');
      position = PositionState.None;
    }
  }
  else
  {
    if (position == PositionState.None)
    {
      if (buy)
      {
        this.advice('long');
        position = PositionState.Long;
      }
      else if (sell)
      {
        this.advice('short');
        position = PositionState.Short;
      }
    }
    else if (position == PositionState.Long)
    {
      if (sell)
      {
        this.advice('short');
        position = PositionState.None;
      }
    }
    else if (position == PositionState.Short)
    {
      if (buy)
      {
        this.advice('long');
        position = PositionState.None;
      }
    }
  }
}

module.exports = marketGodStratV4_bac;
