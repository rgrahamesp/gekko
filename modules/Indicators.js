// ADX 
var trur = 0.0;
var rmaX1 = 0.0;
var rmaX2 = 0.0;
var rmaX3 = 0.0;

// RSI
var rsi_up = 0.0;
var rsi_down = 0.0;

// Slow RSI
var r1 = 0.0;
var r4 = 0.0;
var r5 = 0.0;
var rr = 0.0;

module.exports = {
  lowest_low: function (candles, length, useHeikinAsh) {
    var adjLength = candles.length < length ? candles.length : length;
    var start = Math.abs(candles.length - adjLength);

    var lows = [];
    for (var i = start; i < candles.length; i++) {
      lows.push(useHeikinAsh ? candles[i].ha.low : candles[i].low);
    }

    var lowest = Math.min.apply(null, lows);
    return lowest;
  },

  highest_high: function (candles, length, useHeikinAsh) {
    var adjLength = candles.length < length ? candles.length : length;
    var start = Math.abs(candles.length - adjLength);

    var highs = [];
    for (var i = start; i < candles.length; i++) {
      highs.push(useHeikinAsh ? candles[i].ha.high : candles[i].high);
    }

    var highest = Math.max.apply(null, highs);
    return highest;
  },

  calc_sma: function (prices, length) {
    var val = 0.0;
    var adjLength = prices.length < length ? prices.length : length;
    var start = Math.abs(prices.length - adjLength);

    for (var i = start; i < prices.length; i++) {
      val += prices[i];
    }
    val /= adjLength;

    return val;
  },

  calc_sma_candles: function (candles, length) {
    var val = 0.0;
    var adjLength = candles.length < length ? candles.length : length;
    var start = Math.abs(candles.length - adjLength);

    for (var i = start; i < candles.length; i++) {
      val += candles[i].ha.close;
    }
    val /= adjLength;

    return val;
  },

  calc_ema: function (candleIndex, prevEma, source, length) {
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
      if (candleIndex == length - 1)
        val /= length;
    }

    return val;
  },

  calc_rma: function (candleIndex, prevRma, source, length) {
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
  },

  calc_wima: function (candleIndex, prevWima, source, length) {
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
  },

  calc_stoch: function (candles, length, useHeikinAsh) {
    var lowest = this.lowest_low(candles, length, useHeikinAsh);
    var highest = this.highest_high(candles, length, useHeikinAsh);
    var haclose = useHeikinAsh ? candles[candles.length - 1].ha.close : candles[candles.length - 1].close;
    var val = 100.0 * (haclose - lowest) / (highest - lowest);

    return val;
  },

  calc_stoch_ha_smoothed: function (candles, length) {
    var lowest = this.lowest_low(candles, length, true);
    var highest = this.highest_high(candles, length, true);
    var candle = candles[candles.length - 1];
    var haclose = ((candle.ha.open + candle.ha.high + candle.ha.low + candle.ha.close) / 4);
    var val = 100.0 * (haclose - lowest) / (highest - lowest);

    return val;
  },

  calc_adx: function (candles, candleCount, useHekinAsh, len, lenSig) {
    if (candles.length > 1) {
      var prevCandle = candles[candles.length - 2];
      var candle = candles[candles.length - 1];
      var prevLow = useHekinAsh ? prevCandle.ha.low : prevCandle.low;
      var prevHigh = useHeikinAsh ? prevCandle.ha.high : prevCandle.high;
      var prevClose = useHekinAsh ? prevCandle.ha.close : prevCandle.close;
      var low = useHekinAsh ? candle.ha.low : candle.low;
      var high = useHeikinAsh ? candle.ha.high : candle.high;

      var up = high - prevHigh;;
      var down = -(low - prevLow);
      var plusDM = (up > down && up > 0.0) ? up : 0.0;
      var minusDM = (down > up && down > 0.0) ? down : 0.0;
      var tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
      trur = this.calc_rma(candleCount, trur, tr, len);
      rmaX1 = this.calc_rma(candleCount, rmaX1, plusDM, len);
      var plus = 100.0 * rmaX1 / trur;
      rmaX2 = this.calc_rma(candleCount, rmaX2, minusDM, len);
      var minus = 100.0 * rmaX2 / trur;
      var sum = plus + minus;
      rmaX3 = this.calc_rma(candleCount, rmaX3, Math.abs(plus - minus) / (sum == 0 ? 1.0 : sum), lensig);

      var adx = 100.0 * rmaX3;
      return adx;
    }
    else
      return 0.0;
  },

  calc_rsi: function (prevSource, source, candleCount) {
    var changeSource = source - prevSource;
    rsi_up = this.calc_rma(candleCount, rsi_up, Math.max(changeSource, 0), 9);
    rsi_down = this.calc_rma(candleCount, rsi_down, -Math.min(changeSource, 0), 9);
    var rsi = rsi_down == 0 ? 100.0 : rsi_up == 0 ? 0.0 : 100.0 - (100.0 / (1.0 + rsi_up / rsi_down));
    return rsi;
  },

  calc_slow_rsi: function (price, periods, smooth, candleCount) {
    r1 = this.calc_ema(candleCount, r1, price, periods);
    var r2 = price > r1 ? price - r1 : 0.0;
    var r3 = price < r1 ? r1 - price : 0.0;
    r4 = this.calc_wima(candleCount, r4, r2, smooth);
    r5 = this.calc_wima(candleCount, r5, r3, smooth);

    rr = r5 == 0 ? 100.0 : 100.0 - (100.0 / (1.0 + (r4 / r5)));
    return rr;
  }
}
