import * as mmm from 'moment';
var moment = mmm;
export class Utils {

  public static secondsLeft(expectedSpawn: Date) {
    const es = moment(expectedSpawn);

    return es.diff(moment(), 'seconds');
  }

  public static constructMessage(mvp: string, minLeft: number, mapName: string, lastKilla: string) {
    return `${mvp} spawn at ${mapName} in ${minLeft.toFixed(2)} minutes. It was last killed by ${lastKilla}.`;
  }
}