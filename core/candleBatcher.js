// internally we only use 1m
// candles, this can easily
// convert them to any desired
// size.

// Acts as ~fake~ stream: takes
// 1m candles as input and emits
// bigger candles.
// 
// input are transported candles.

var _ = require('lodash');
var util = require(__dirname + '/util');

var CandleBatcher = function(candleSize) {
  if(!_.isNumber(candleSize))
    throw new Error('candleSize is not a number');

  this.candleSize = candleSize;
  this.smallCandles = [];
  this.calculatedCandles = [];

  _.bindAll(this);
}

util.makeEventEmitter(CandleBatcher);

CandleBatcher.prototype.addHeikinAshi = function(currcandle, prevcandle) {
  var f = function(x) {
    return parseFloat(x).toFixed(2);
  }
  var candle = currcandle;
  if (prevcandle.ha == undefined) {
    // happens on very first candle only
    prevcandle.ha = {
      open: (prevcandle.open + prevcandle.close) / 2,
      close: (prevcandle.open + prevcandle.high + prevcandle.low + prevcandle.close) / 4,
      high: prevcandle.high,
      low: prevcandle.low
    }
  }

  candle.ha = {};
  candle.ha.open = (prevcandle.ha.open + prevcandle.ha.close) / 2;
  candle.ha.close = (candle.open + candle.high + candle.low + candle.close) / 4;
  candle.ha.high = _.max([candle.high, candle.ha.open, candle.ha.close]);
  candle.ha.low = _.min([candle.low, candle.ha.open, candle.ha.close]);

  return candle;
}

CandleBatcher.prototype.write = function(candles) {
  if(!_.isArray(candles)) {
    throw new Error('candles is not an array');
  }

  this.emitted = 0;

  _.each(candles, function(candle) {
    if (this.prevcandle == undefined) this.prevcandle = _.clone(candle);
    candle = this.addHeikinAshi(candle, this.prevcandle);
    this.prevcandle = _.clone(candle);
    this.smallCandles.push(candle);
    this.check();
  }, this);

  return this.emitted;
}

CandleBatcher.prototype.check = function() {
  if(_.size(this.smallCandles) % this.candleSize !== 0)
    return;

  this.emitted++;
  this.calculatedCandles.push(this.calculate());
  this.smallCandles = [];
}

CandleBatcher.prototype.flush = function() {
  _.each(
    this.calculatedCandles,
    candle => this.emit('candle', candle)
  );

  this.calculatedCandles = [];
}

CandleBatcher.prototype.calculate = function() {
  // remove the id property of the small candle
  var { id, ...first } = this.smallCandles.shift();

  first.vwp = first.vwp * first.volume;

  var candle = _.reduce(
    this.smallCandles,
    function(candle, m) {
      candle.high = _.max([candle.high, m.high]);
      candle.ha.high = _.max([candle.ha.high, m.ha.high]);
      candle.low = _.min([candle.low, m.low]);
      candle.ha.low = _.min([candle.ha.low, m.ha.low]);
      candle.close = m.close;
      candle.ha.close = m.ha.close;
      candle.volume += m.volume;
      candle.vwp += m.vwp * m.volume;
      candle.trades += m.trades;
      return candle;
    },
    first
  );

  if(candle.volume)
    // we have added up all prices (relative to volume)
    // now divide by volume to get the Volume Weighted Price
    candle.vwp /= candle.volume;
  else
    // empty candle
    candle.vwp = candle.open;

  candle.start = first.start;
  return candle;
}

module.exports = CandleBatcher;
