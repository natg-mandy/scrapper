import { prop, Typegoose, ModelType, InstanceType, instanceMethod, staticMethod } from 'typegoose';
import * as mongoose from 'mongoose';
import { metadata } from 'metadata';
import * as rx from 'rxjs';
import * as moment from 'moment';
import { IMvpData, mvpMap, serverTimezone } from 'index';
interface ITimer {
    timer?: number;
    window?: number;
}
const db = process.env.DATABASE_URL || 'mongodb://admin:admin69@ds219181.mlab.com:19181/mvp_mandy';
console.log(`attempting to connect to '${db}'`);

export const dbconnect = mongoose.connect(db);

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
        var meta = this.getMeta();
        var mvpname = (meta.mvp && meta.mvp.timer && this.Mvp_Name) || '';

        return MvpRecord.getKey(this.Map_Name, mvpname);
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
        try {
            var tts = meta.map.timer || (meta.mvp && meta.mvp.timer) || Infinity;
            return ka + (tts * 60 * 1000);
        } catch(e) {
            console.log("error while getting min respawn time", this.Mvp_Name, this.Map_Name);
            return Infinity;
        }
    }

    @instanceMethod
    /** Get timestamp for respawn */
    getMaxRespawnTime(): number {
        return this.getMinRespawnTime() + (this.getWindow() * 60 * 1000);
    }

    @instanceMethod
    private getWindow() {
        var m = this.getMeta();
        try {
            return m.map.window || m.mvp.window;
        } catch(e) {
            console.log('error while getting time window', this.Mvp_Name, this.Map_Name);
            return Infinity;
        }
    }

    @instanceMethod
    private getMeta(): {map: ITimer; mvp: ITimer} {
        return {
            map: metadata.map[this.Map_Name],
            mvp: metadata.mvp[this.Mvp_Name]
        };
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
            Killed_At: moment(this.Killed_At).tz(serverTimezone).format('LT z'),
            Respawn_At: moment(this.getMinRespawnTime()).tz(serverTimezone).format('LT z'),
            Respawn_DT: this.getMinRespawnTime()
          };
    }

    @instanceMethod
    /** return whether or not it's possible for the mvp to currently spawn */
    isWithinWindow() {
        var now = new Date().getTime();
        return this.getMinRespawnTime() < now && now < this.getMaxRespawnTime();
    }
}

export const MvpRecordModel = new MvpRecord().getModelForClass(MvpRecord);
