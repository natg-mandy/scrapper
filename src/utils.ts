import * as mmm from 'moment';
import { MvpRecordModel, dbconnect } from 'model/MvpRecord';

export class Utils {

  public static notificationThreshold = 5 * 60 * 1000;

  public static constructMessage(mvp: string, minLeft: number, spawnWindow: number, mapName: string, lastKilla: string) {
    minLeft = Math.floor(minLeft);

    spawnWindow = Math.floor(spawnWindow);

    return `${mvp} will spawn at ${mapName} between  ${minLeft} - ${spawnWindow} minutes from now. It was last killed by ${lastKilla}.`;
  }

  public static broadcast(webhook, title: string, msg: string) {
    console.log(`${title} - ${msg}`);

    if (process.env.NODE_ENV === 'production') {
      console.log('broadcasting msg to discord...');
      webhook.custom("mvp-bot", msg, title, "#0aaf94");
    }
  }

  public static async loadMvpRecords()  {
    await dbconnect;

    return MvpRecordModel.find()
      .sort({Killed_At: 1})
      .limit(40)
      .exec();
  }
}