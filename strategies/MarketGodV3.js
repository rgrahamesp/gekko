//
// Market God V3 - strategy from Eric Thies
//

const _ = require('lodash');
const util = require('util');
const log = require('../core/log.js');
const config = require('../core/util.js').getConfig();
const candleBatcher = require('../core/candleBatcher');

var marketGodStratV3 = {};

const periods = 6;
const smooth = 14;

var obj;
var up1 = 0.0;
var down1 = 0.0;
var r1 = 0.0;
var r4 = 0.0;
var r5 = 0.0;
var rr = 0.0;
var prevRR = 0.0;
var pK = 0.0;
var pD = 0.0;
var prevClose = 0.0;
var prevLow = 0.0;
var prevHigh = 0.0;
var avgHigh = 0.0;
var avgLow = 0.0;
var uptrend;
var downtrend;
var buy = false;
var sell = false;
var areLong = false;
var candleCount = 0;
var candles = [];

// EMA TEST
//var prices = [
//  22.27,
//  22.19,
//  22.08,
//  22.17,
//  22.18,
//  22.13,
//  22.23,
//  22.43,
//  22.24,
//  22.29,
//  22.15,
//  22.39,
//  22.38,
//  22.61,
//  23.36,
//  24.05,
//  23.75,
//  23.83,
//  23.95,
//  23.63,
//  23.82,
//  23.87,
//  23.65,
//  23.19,
//  23.10,
//  23.33,
//  22.68,
//  23.10,
//  22.40,
//  22.17
//];

//var results = [
//  22.22,  // 10
//  22.21,
//  22.24,
//  22.27,
//  22.33,
//  22.52,
//  22.80,
//  22.97,
//  23.13,
//  23.28,
//  23.34,
//  23.43,
//  23.51,
//  23.54,
//  23.47,
//  23.40,
//  23.39,
//  23.26,
//  23.23,
//  23.08,
//  22.92
//];

marketGodStratV3.init = function (context) {
  if (context === undefined) {
    this.context = this;
  } else {
    this.context = context;
  }

  obj = this;
  this.name = 'Market God V3';

  //// TEST EMA
  //var emaVal = 0.0;
  //for (var i = 0; i < prices.length; i++) {
  //  emaVal = calc_ema(i, emaVal, prices[i], 10);
  //  console.log("ema[" + (i + 1) + "]: " + emaVal);
  //}
}

//function rma(source, length) {
//  var alpha = 1 / length;
//  var sum = 0.0;
//  for (i = length; i >= 0; i--) {
//    if (sum == 0.0) {
//      sum = source[i];
//    } else {
//      sum += alpha * source[i] + (1 - alpha) * sum;
//    }
//  }

//  return sum;
//}

function calc_ema(candleIndex, prevEma, source, length) {
  var val = 0.0;
  if (candleIndex >= length) {
    var alpha = 2.0 / (length + 1);
    val = alpha * source + (1 - alpha) * prevEma;
    if (isNaN(val)) {
      val = 0.0;
    }
  }
  else {
    val = prevEma + source;
    if (candleIndex == length-1)
      val /= length;
  }

  return val;
}

function calc_rma(candleIndex, prevRma, source, length) {
  var val = 0.0;
  if (candleIndex >= length) {
    var alpha = 1.0 / length;
    val = alpha * source + (1 - alpha) * prevRma;
    if (isNaN(val)) {
      val = 0.0;
    }
  }
  else {
    val = prevRma + source;
    if (candleIndex == length - 1)
      val /= length;
  }

  return val;
}

function calc_wima(candleIndex, prevWima, source, length) {
  var val = 0.0;
  if (candleIndex >= length) {
    val = (source + (prevWima * (length - 1))) / length;
    if (isNaN(val)) {
      val = 0.0;
    }
  }
  else {
    val = prevWima + source;
    if (candleIndex == length - 1)
      val /= length;
  }

  return val;
}

marketGodStratV3.update = function (candle) {
  candles.push(candle);
  if (candles.length > 9)
    candles.shift();

  // RSI
  var changeClose = candle.ha.close - prevClose;
  up1 = calc_rma(candleCount, up1, Math.max(changeClose, 0.0), 9);
  down1 = calc_rma(candleCount, down1, -Math.min(changeClose, 0.0), 9);
  var rsi = down1 == 0 ? 100 : up1 == 0 ? 0 : 100 - (100 / (1 + up1 / down1));

  //console.log("rsi: ", rsi);

  // KJD
  var hi = Math.max.apply(null, candles);
  var lo = Math.min.apply(null, candles);
  var k = 100 * ((candle.ha.close - lo) / (hi - lo));
  pK = calc_rma(candleCount, pK, k, 3);
  pD = calc_rma(candleCount, pD, pK, 3);
  var pJ = 3 * pK - 2 * pD;
  var KD = (pK + pD) / 2;

  //SLOW RSI
  r1 = calc_ema(candleCount, r1, candle.ha.close, periods);
  //console.log("r1: ", r1);
  var r2 = candle.ha.close > r1 ? candle.ha.close - r1 : 0;
  var r3 = candle.ha.close < r1 ? r1 - candle.ha.close : 0;
  r4 = calc_wima(candleCount, r4, r2, smooth);
  r5 = calc_wima(candleCount, r5, r3, smooth);
  prevRR = rr;
  rr = r5 == 0 ? 100 : 100 - (100 / (1 + (r4 / r5)));

  // GANN Trend
  avgHigh = calc_ema(candleCount, avgHigh, candle.high, 10);
  avgLow = calc_ema(candleCount, avgLow, candle.low, 10);

  //console.log("avgHigh: ", avgHigh);
  //console.log("avgLow: ", avgLow);

  uptrend = candle.high > avgHigh;
  downtrend = candle.low < avgLow;

  //BUY AND SELL CONDITIONS
  buy = rr > prevRR && pK < pJ && candle.low > prevLow && uptrend;
  sell = rr < prevRR && pK > pJ && candle.low < prevLow && downtrend;

  console.log("buy: " + buy);
  console.log("sell: " + sell);

  prevClose = candle.ha.close;
  prevLow = candle.low;
  prevHigh = candle.high;
  candleCount++;
}

marketGodStratV3.check = function (candle) {
  if (!areLong && buy) {
    this.advice('long');
    areLong = true;
  } else if (areLong && sell) {
    this.advice('short');
    areLong = false;
  }
}

module.exports = marketGodStratV3;
