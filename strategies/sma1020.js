var strat = {};

var SignalState =
{
	Uninitialized: 0,
	Long: 1,
	Short: 2
}
var position = SignalState.Uninitialized;

strat.init = function() {
  console.log('init');
  this.addTulipIndicator('sma10', 'sma', {
  	optInTimePeriod: 10
  });

  this.addTulipIndicator('sma20', 'sma', {
  	optInTimePeriod: 20
  });
}

//stratMain.onCandle = async function (candle) {
//  console.log(candle);
//}

strat.check = function (candle) {
  const sma10 = this.tulipIndicators.sma10.result.result;
  const sma20 = this.tulipIndicators.sma20.result.result;

  var candleState = candle.ha.close > candle.ha.open ? SignalState.Long : SignalState.Short;

  if(sma10 > sma20 && candleState == SignalState.Long && position == SignalState.Uninitialized)
  {
  	this.advice('long');
  	position = SignalState.Long;
  }
  else if(position == SignalState.Long && candleState == SignalState.Short)
  {
  	this.advice('short');
  	position = SignalState.Uninitialized;
  }
}

module.exports = strat;
