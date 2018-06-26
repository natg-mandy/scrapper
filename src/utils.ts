import * as rx from 'rxjs';
import * as mmm from 'moment';
var moment = mmm;
export class Utils {

  private static notificationThreshold = 5 * 60 * 1000;

  public static secondsLeft(expectedSpawn: Date) {
    const es = moment(expectedSpawn);

    return es.diff(moment(), 'seconds');
  }

  public static constructMessage(mvp: string, minLeft: number, mapName: string, lastKilla: string) {
    return `${mvp} spawn at ${mapName} in ${minLeft.toFixed(2)} minutes. It was last killed by ${lastKilla}.`;
  }

  /** Returns the time left (in ms) until mvp spawn. This will broadcast the time every 5 minutes */
  public static getTimer(spawnTime: Date): rx.Observable<[number, number]> {
    return rx.Observable.from([spawnTime])
      .map(d => d.getTime())
      .combineLatest(rx.Observable.timer(0, 1000));
  }

  public static broadcast(webhook, msg: string) {
    webhook.custom("mvp-bot", msg, 'MVP Spawning Soon', "#0aaf94");
  }
}