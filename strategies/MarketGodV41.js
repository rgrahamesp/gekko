//
// Market God V4.1 - strategy from Eric Thies
//

const longOnly = true;
const onlyCloseLongInProfit = false;
const indicators = require('../modules/IndicatorsPlus.js');

var marketGodStratV41 = {};

var PositionState = {
  None: 0,
  Long: 1,
  Short: 2
}
var position = PositionState.None;
var lastTrade;

var pK = 0.0;
var pD = 0.0;
var prevPJ = 0.0;
var pJ = 0.0;
var EMA5 = 0.0;
var prevEMA5 = 0.0;
var VOLEMA = 0.0;
var prevVOLEMA = 0.0;
var rr = 0.0;
var prevRR = 0.0;
var candles = [];
var candleCount = 0;
var buy = false;
var sell = false;

marketGodStratV41.onTrade = function (trade) {
  //console.log(trade);
  lastTrade = trade;
}

marketGodStratV41.init = function (context) {
  if (context === undefined) {
    this.context = this;
  } else {
    this.context = context;
  }

  this.name = 'Market God V4.1';
}

marketGodStratV41.update = function (candle) {
  candles.push(candle);
  if (candles.length > 16)
    candles.shift();

  var haclose = ((candle.ha.open + candle.ha.high + candle.ha.low + candle.ha.close) / 4); //[smoothing]

  //KDJ (CREDIT- USER: IAMALTCOIN - KDJ INDICATOR)//
  const ilong = 9;
  const isig = 3;
  var h = indicators.highest_high_candles(candles, ilong, true);
  var l = indicators.lowest_low_candles(candles, ilong, true);
  var RSV = 100.0 * ((haclose - l) / (h - l));
  pK = indicators.calc_bcwsma(pK, RSV, isig, 1);
  pD = indicators.calc_bcwsma(pD, pK, isig, 1);
  prevPJ = pJ;
  pJ = 3.0 * pK - 2.0 * pD;
  //var KD = (pK + pD) / 2.0;

  //EMA
  prevEMA5 = EMA5;
  EMA5 = indicators.calc_ema(candleCount, EMA5, haclose, 5);
  prevVOLEMA = VOLEMA;
  VOLEMA = indicators.calc_ema(candleCount, VOLEMA, candle.volume, 10);

  // SLOW RSI
  prevRR = rr; 
  rr = indicators.calc_slow_rsi(haclose, 6, 14, candleCount);

  //BUY AND SELL CONDITIONS
  var rrRising = rr > prevRR;
  var rrFalling = rr < prevRR;
  var pjRising = pJ > prevPJ;
  var pjFalling = pJ < prevPJ;
  var volRising = VOLEMA > prevVOLEMA;
  var ema5Rising = EMA5 > prevEMA5;
  var ema5Falling = EMA5 < prevEMA5;
  buy = rrRising && pjRising && volRising && ema5Rising;
  sell = rrFalling && pjFalling && volRising && ema5Falling;

  candleCount++;
}

marketGodStratV41.Buy = function (candle) {
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

marketGodStratV41.Sell = function (candle) {
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

marketGodStratV41.check = function (candle) {
  if (buy) {
    this.Buy(candle);
  }
  else if (sell) {
    this.Sell(candle);
  }
}

module.exports = marketGodStratV41;
