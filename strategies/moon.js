var strat = {};

var SignalState =
{
	Uninitialized: 0,
	Long: 1,
	Short: 2
}
var smaState = SignalState.Uninitialized;
var position = SignalState.Uninitialized;

strat.init = function() {
  console.log('init');
  this.addTulipIndicator('smaSlow', 'sma', {
  	optInTimePeriod: this.settings.slow_value;
  });

  
  ///-----------------------------------------------
  // Debug stop so we can inspect output
  ///-----------------------------------------------
  console.log(this.settings.slow_value);


  this.addTulipIndicator('smaFast', 'sma', {
  	optInTimePeriod: this.settings.fast_value;
  });
}

//check { start: moment("2019-01-29T05:01:00.000"),
//  open: 3421.93,
//  high: 3442,
//  low: 3349.92,
//  close: 3416.15,
//  vwp: 3400.718836610886,
//  volume: 29527.957590999962,
//  trades: 179440,
//  ha:
//   { open: 3421.611306424128,
//     close: 3415.4825,
//     high: 3442,
//     low: 3349.92 } }
strat.check = function(candle) {
  //console.log('check', candle);

  // //console.log(this.tulipIndicators);
  const smaSlow = this.tulipIndicators.smaSlow.result.result;
  const smaFast = this.tulipIndicators.smaFast.result.result;

  var candleState = candle.ha.close > candle.ha.open ? SignalState.Long : SignalState.Short;

  if(smaSlow > smaFast && candleState == SignalState.Long && position == SignalState.Uninitialized)
  {
  	///
  	// Add a trailing stop to the buy (don't need to close now...)
  	///
  	this.advice({
  		direction: 'long',
  		trigger: {
  			type: 'trailingStop',
  			trailPercentage: 8
  		}
  	});
  	
  	position = SignalState.Long;
  }
  else if(position == SignalState.Long && candleState == SignalState.Short)
  {
  	this.advice('short');
  	position = SignalState.Uninitialized;
  }

  // if(smaState == SignalState.Short)
  // {
  // 	if(smaSlow > smaFast)
  // 	{
  // 		smaState = SignalState.Long;	// Long crossover

  // 	    // If the candle is green, long
  // 	    if(candleState == SignalState.Long)
  // 	    {
  // 	       this.advice('long');
  // 	       position = SignalState.Long;
  // 	    }
	 // }
  // }
  // else if(smaState == SignalState.Long)
  // {
  //    if(smaSlow <= smaFast)
  // 	 {
  // 		smaState = SignalState.Short;	// Short cross over
	 // }
  // }
  // else
  // {
  // 	smaState = smaSlow > smaFast ? SignalState.Long : SignalState.Short;
  // }

  // if(position == SignalState.Long && candleState == SignalState.Short)
  // {
  // 	// Close the position
  // 	this.advice('short');
  // 	position = SignalState.Uninitialized;
  // }

  //console.log({smaSlow, sma20});
}

module.exports = strat;
