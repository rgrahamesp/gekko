//
// Market God V5.1 - strategy from Eric Thies
//

const longOnly = false;
const onlyCloseLongInProfit = false;
const indicators = require('../modules/IndicatorsPlus.js');

var marketGodStratV51 = {};

var PositionState = {
  None: 0,
  Long: 1,
  Short: 2
}
var position = PositionState.None;
var lastTrade;

var prevHAClose = 0.0;
var haclose = 0.0;

var k = 0.0;
var prevK = 0.0;
var ema1 = 0.0;
var ema2 = 0.0;
var ema3 = 0.0;
var avda = 0.0;
var prevAvda = 0.0;

var rsi1 = [0.0];
var stoch1 = [0.0];

var candles = [];
var candleCount = 0;
var buy = false;
var sell = false;

marketGodStratV51.onTrade = function (trade) {
  console.log(trade);
  lastTrade = trade;
}

marketGodStratV51.init = function (context) {
  if (context === undefined) {
    this.context = this;
  } else {
    this.context = context;
  }

  this.name = 'Market God V5.1';
}

marketGodStratV51.update = function (candle) {
  candles.push(candle);
  if (candles.length > 16)
    candles.shift();

  prevHAClose = haclose;
  haclose = ((candle.ha.open + candle.ha.high + candle.ha.low + candle.ha.close) / 4); //[smoothing]

  //SRSI
  const smoothK = 3;
  const lengthRSI = 9;
  const lengthStoch = 9;
  var maxLength = Math.max(lengthRSI, lengthStoch);
  var rsi = indicators.calc_rsi(prevHAClose, haclose, lengthRSI, candleCount);
  rsi1.push(rsi);
  if (rsi1.length > maxLength)
    rsi1.shift();

  var stoch = indicators.calc_stoch(rsi1, rsi1, rsi1, lengthStoch);
  stoch1.push(stoch);
  if (stoch1.length > smoothK)
    stoch1.shift();

  prevK = k;
  k = indicators.calc_sma(stoch1, smoothK);

  // DEMA TEMA
  ema1 = indicators.calc_ema(candleCount, ema1, haclose, 9);
  ema2 = indicators.calc_ema(candleCount, ema2, ema1, 9);
  ema3 = indicators.calc_ema(candleCount, ema3, ema2, 9);
  var tema = 3.0 * (ema1 - ema2) + ema3;
  var dema = 2.0 * ema1 - ema2;
  prevAvda = avda;
  avda = (dema + tema) / 2.0;

  var avdaRising = avda > prevAvda;
  var avdaFalling = avda < prevAvda;
  var kRising = k > prevK;
  var kFalling = k < prevK;
  buy = avdaRising && kRising;
  sell = avdaFalling && kFalling;

  candleCount++;
}

marketGodStratV51.Buy = function (candle) {
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

marketGodStratV51.Sell = function (candle) {
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

marketGodStratV51.check = function (candle) {
  if (buy) {
    this.Buy(candle);
  }
  else if (sell) {
    this.Sell(candle);
  }
}

module.exports = marketGodStratV51;
