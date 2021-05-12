/*


l coolPipeTemp coolingPipe Temperature
l hotPipeTemp coolingPipe Temperature
l currentTemp smeltFurnace Temperature

sub targetTemp maxTemp currentTemp
add targetTemp maxTemp targetTemp

sub coolDiff targetTemp coolPipeTemp
sub hotDiff hotPipeTemp targetTemp
blez hotDiff fullHeat

add mixerRatio coolDiff hotDiff
div mixerRatio 100 mixerRatio
mul mixerRatio mixerRatio hotDiff

s gasMixer Setting mixerRatio

fullHeat:
s gasMixer Setting 100

*/

function gasMixerSpec(coolPipeTemp, hotPipeTemp, currentTemp, maxTemp) {
  let targetTemp = maxTemp - currentTemp;
  targetTemp = maxTemp + targetTemp;
  console.log(`Target Temp: ${targetTemp}`);

  let coolDiff = targetTemp - coolPipeTemp;
  console.log(`Cool Diff: ${coolDiff}`);
  let hotDiff = hotPipeTemp - targetTemp;
  console.log(`Hot Diff: ${hotDiff}`);

  if (hotDiff <= 0) {
    return 100;
  }

  let mixerRatio = coolDiff + hotDiff;
  mixerRatio = 100 / mixerRatio;
  mixerRatio = mixerRatio * hotDiff;
  return mixerRatio;
}

console.log(gasMixerSpec(240, 2000, 1000, 1200));
//assert.equal(gasMixerSpec(240, 2000, 1000, 1200), )