import { prop, Typegoose, ModelType, InstanceType, instanceMethod, staticMethod } from 'typegoose';
import * as mongoose from 'mongoose';
import { metadata } from 'metadata';
import * as rx from 'rxjs';
import * as moment from 'moment';
import { IMvpData } from 'index';

const db = process.env.DATABASE_URL || 'mongodb://admin:admin69@ds219181.mlab.com:19181/mvp_mandy';
mongoose.connect(db);

export class MvpRecord extends Typegoose {
    @prop()
    Mvp_Name: string;

    @prop()
    Killed_At: Date;

    @prop()
    Map_Name: string;

    @prop()
    Killed_By: string;

    @staticMethod
    public static getKey(mapName: string, mvpName: string) {
        return `${mapName}${mvpName}`;
    }

    @instanceMethod
    assignMvpData(data: IMvpData): this {
        this.Killed_At = data.killedAt;
        this.Killed_By = data.killedBy;
        this.Mvp_Name = data.mvpName;
        this.Map_Name = data.mapName;

        return this;
    }

    @instanceMethod
    getKey() {
        return MvpRecord.getKey(this.Map_Name, this.Mvp_Name);
    }


    @instanceMethod
    /** this is in minutes */
    timeUntilSpawn() {
        const inMilliseconds = this.getMinRespawnTime() - new Date().getTime();
        return inMilliseconds / 60 / 1000;
    }

    @instanceMethod
    /** Get timestamp for respawn */
    getMinRespawnTime(): number {
        var meta = this.getMeta();
        var ka = this.Killed_At.getTime();
        return ka + (meta.timer * 60 * 1000);
    }

    @instanceMethod
    /** Get timestamp for respawn */
    getMaxRespawnTime(): number {
        return this.getMinRespawnTime() + (this.getMeta().window * 60 * 1000);
    }

    @instanceMethod
    private getMeta() {
        return metadata.mvp[this.Mvp_Name];
    }

    @instanceMethod
    getTimer(): rx.Observable<[number, number, number]> {
        var minSpawnObs = rx.Observable.from([this.getMinRespawnTime()]);

        var maxSpawnObs = rx.Observable.from([this.getMaxRespawnTime()]);

        return rx.Observable.combineLatest(
          minSpawnObs,
          maxSpawnObs,
          rx.Observable.timer(0, 1000)
        );
    }

    @instanceMethod
    toJSON() {
        return {
            Mvp_Name: this.Mvp_Name,
            Map_Name: this.Map_Name,
            Minutes_Until_Respawn: this.timeUntilSpawn().toFixed(2),
            Killed_By: this.Killed_By,
            Killed_At: moment(this.Killed_At).tz('America/New_York').format('LT z'),
            Respawn_At: moment(this.getMinRespawnTime()).tz('America/New_York').format('LT z'),
            Respawn_DT: this.getMinRespawnTime()
          };
    }
}

export const MvpRecordModel = new MvpRecord().getModelForClass(MvpRecord);
