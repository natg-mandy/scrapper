import * as rx from 'rxjs';
import * as mmm from 'moment';
import { IMvpData, ICleanMvpData } from 'index';
import { Observable } from 'rxjs';
import { MvpRecordModel } from 'model/MvpRecord';
var moment = mmm;
export class Utils {

  public static notificationThreshold = 5 * 60 * 1000;

  public static constructMessage(mvp: string, minLeft: number, spawnWindow: number, mapName: string, lastKilla: string) {
    minLeft = Math.floor(minLeft);

    spawnWindow = Math.floor(spawnWindow);

    return `${mvp} will spawn at ${mapName} between  ${minLeft} - ${spawnWindow} minutes from now. It was last killed by ${lastKilla}.`;
  }

  public static broadcast(webhook, title: string, msg: string) {
    if (process.env.NODE_ENV === 'production') {
      webhook.custom("mvp-bot", msg, 'MVP Spawning Soon', "#0aaf94");
    } else {
      console.log(`${title} - ${msg}`);
    }
  }

  public static loadMvpRecords()  {
    return MvpRecordModel.find()
      .sort({Killed_At: 1})
      .limit(40)
      .exec();
  }
}