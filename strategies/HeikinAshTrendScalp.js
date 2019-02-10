var strat = {};

var SignalState =
{
	Uninitialized: 0,
	Long: 1,
	Short: 2
}
var prevPrevCandleState = SignalState.Uninitialized;
var prevCandleState = SignalState.Uninitialized;
var position = SignalState.Uninitialized;

strat.init = function() {
  var audio = new Audio('ALARM_Foghorn_full_stereo.wav');
  audio.play();
}


strat.check = function(candle) {
  var candleState = candle.ha.close > candle.ha.open ? SignalState.Long : SignalState.Short;

  if(position == SignalState.Uninitialized && 
     //prevPrevCandleState == SignalState.Long && 
     prevCandleState == SignalState.Long && 
     candleState == SignalState.Long)
  {
    this.advice('long');
    position = SignalState.Long;
  }
  else if(position == SignalState.Long &&
     prevPrevCandleState == SignalState.Short &&
     prevCandleState == SignalState.Short)
  {
    this.advice('short');
    position = SignalState.Uninitialized;
  }

  prevPrevCandleState = prevCandleState;
  prevCandleState = candleState;
}

module.exports = strat;
