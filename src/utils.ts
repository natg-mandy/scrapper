import * as rx from 'rxjs';
import * as mmm from 'moment';
import { IMvpData, IReadableMvpData } from 'index';
import { Observable } from 'rxjs';
var moment = mmm;
export class Utils {

  public static notificationThreshold = 20 * 60 * 1000;

  public static secondsLeft(expectedSpawn: Date) {
    const es = moment(expectedSpawn);

    return es.diff(moment(), 'seconds');
  }

  public static constructMessage(mvp: string, minLeft: number, spawnWindow: number, mapName: string, lastKilla: string) {
    minLeft = Math.floor(minLeft);

    spawnWindow = Math.floor(spawnWindow);

    return `${mvp} will spawn at ${mapName} between  ${minLeft} - ${spawnWindow} minutes from now. It was last killed by ${lastKilla}.`;
  }

  /** Returns the time left (in ms) until mvp spawn. This will broadcast the time every 5 minutes */
  public static getTimer(spawnTime: Date, spawnWindow: number): rx.Observable<[number, number, number]> {
    var spawnWindowInMs = spawnWindow ? spawnWindow * 60 * 1000 : null;
    var spawnObs = rx.Observable.from([spawnTime])
      .map(d => d.getTime());

    return Observable.combineLatest(
      spawnObs,
      spawnObs.map(z => z + spawnWindowInMs),
      rx.Observable.timer(0, 1000)
    );
  }

  public static broadcast(webhook, title: string, msg: string) {
    if (process.env.NODE_ENV === 'production') {
      webhook.custom("mvp-bot", msg, 'MVP Spawning Soon', "#0aaf94");
    } else {
      console.log(`${title} - ${msg}`);
    }
  }

  public static getReadable(data: IMvpData): IReadableMvpData {
    return {
      DATE__DEATH: data.when,
      DATE__RESPAWN: data.respawn,
      MAP_NAME: data.mapName,
      MINUTES_UNTIL_RESPAWN: this.msToMinute(data.respawn.getTime() - new Date().getTime()),
      MVP_NAME: data.mvp,
      WHO_KILLED_LAST: data.who
    };
  }

  public static msToMinute(val: number): string {
    return (val / 60 / 1000).toFixed(2);
  }

  public static getKey(mapName: string, mvpName: string): string {
    return `${mapName}${mvpName}`
  }
}