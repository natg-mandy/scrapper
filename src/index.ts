import * as http from 'http';
import * as Xray from 'x-ray';
import 'rxjs';
import {metadata} from './metadata';
import * as Webhook from 'webhook-discord';
import * as moment from 'moment';
import 'moment-timezone';
import { Utils } from 'utils';
import { orderBy } from 'lodash';
import { Observable, Subject } from 'rxjs';
import { MvpRecordModel, MvpRecord } from 'model/MvpRecord';
import { InstanceType } from 'typegoose';

export interface ICleanMvpData {
    Killed_At: string,
    Respawn_At: string;
    Map_Name: string;
    Mvp_Name: string;
    Killed_By: string;
    Minutes_Until_Respawn: string;
  };

export interface IMvpData {
    killedAt: Date;
    killedBy: string;
    mvpName: string;
    mapName: string;
}

const env = process.env.NODE_ENV || 'dev';

const webhookSuffix = /* process.env.WEBHOOK_URL ||*/ '460939241292300299/3SeBHlQ-VjnjYgKlc86YVs9V9aiU4Tekjjz7LETXewDghRxk2wLru5wP3H92r7jegqCq';
const webhookUrl = `https://discordapp.com/api/webhooks/${webhookSuffix}`;

const webhook = new Webhook(webhookUrl);

const whitelistedMaps = Object.keys(metadata.map);

const PORT = process.env.PORT || 3000;

export const mvpMap = new Map<string, InstanceType<MvpRecord>>();

/** tells anything listening on this key to stop */
const finishBroadcast$ = new Subject<string>();

const s = new http.Server(async (req, res) => {
    var latest = [];

    mvpMap.forEach(d => {
        latest.push(d.toJSON());
    });

    latest = orderBy(latest, l => l.Respawn_DT);

    res.end(JSON.stringify(latest));
});

s.listen(PORT, (err) => {
    if (err) {
        console.error('error', err);
    }
});

function getMvpData(): Promise<InstanceType<MvpRecord>[]> {
    return new Promise(resolve => {
        var x = Xray();

        x('https://obsidianro.com/panel/?module=ranking&action=mvp', 'table.horizontal-table')((err, table) => {
            if (err) {
                console.error(err);
                throw err;
            }

            var data: IMvpData[] = parse(table);
            var mvprs = data.map(d => {
                return new MvpRecordModel().assignMvpData(d);
            });

            return resolve(mvprs);
        });
    });
}

async function getAndUpdate() {
    var records: InstanceType<MvpRecord>[];
    if (mvpMap.size === 0) {
        records = await Utils.loadMvpRecords();
        records.forEach(r => update(r));
    }

    var data = await getMvpData();

    data.forEach((next) => update(next));

    var latest = [];

    mvpMap.forEach(m => {
        latest.push(m.toJSON());
    })

    console.log('latest data', latest);
}

export function update(data: InstanceType<MvpRecord>) {
    let key = data.getKey();
    let existing = mvpMap.get(key);
    let cached = existing && existing.getMinRespawnTime();

    //if our new spawn time is before our old, update
    if (!cached || cached < data.getMinRespawnTime()) {
        mvpMap.set(key, data);

        if (data.isNew) {
            var msg = `${data.Mvp_Name} was killed by ${data.Killed_By} and will respawn ${moment(data.getMinRespawnTime()).fromNow()}`;
            console.debug('saving new record new');
            Utils.broadcast(webhook, 'MVP Killed', msg);
            data.save();
        }


        beginWatch(key, data);
    }
}

Observable.timer(0, 30 * 1000)
    .subscribe(() => {
        console.log('getting and updating data');
        getAndUpdate();
    })

export function beginWatch(key: string, data: InstanceType<MvpRecord>): void {
    finishBroadcast$.next(key);

    data.getTimer()
        .takeUntil(finishBroadcast$.filter(k => k === key))
        .switchMap(z => {
            return Promise.resolve(new Date().getTime());
        }, ([minSpawn, maxSpawn], current) => {
            return [(minSpawn - current), maxSpawn - current];
        })
        .subscribe(([minSpawn, maxSpawn]) => {
            var minSpawnInMin = minSpawn / 60 / 1000;
            var maxSpawnInMin = maxSpawn / 60 / 1000;

            /** Don't broadcast if the mvp spawned over 10 minutes ago
             * just doing this to fix redeploying mostly. */
            if (minSpawn <= Utils.notificationThreshold && maxSpawn > -10) {
                const msg = Utils.constructMessage(data.Mvp_Name, minSpawnInMin, maxSpawnInMin, data.Map_Name, data.Killed_By);

                Utils.broadcast(webhook, 'MVP Spawning Soon', msg);

                finishBroadcast$.next(key);
            }
        });
}

function parse(table: string) {
    var items = table.split('\n')
        .map(z => z.trim())
        .filter(z => !!z);

    //first 5 are the table headers
    items.splice(0, 5);

    var chunks: [string, string, string, string, string][] = chunk(items, 5);

    var data = chunks.map(([_killedAt, killedBy, mvpName, exp/*useless*/, mapName]) => {
        var killedAt = moment.utc(_killedAt).toDate();
        var killedBy = killedBy;

        if (!whitelistedMaps.some(m => m === mapName)) {
            return null;
        }

        var data = <IMvpData> {
            mvpName,
            killedAt,
            killedBy,
            mapName
        };

        return data;
    }).filter(z => !!z);

    return data;
}


function chunk(arr, len): [string, string, string, string, string][] {
    var chunks = [],
        i = 0,
        n = arr.length;

    while (i < n) {
        chunks.push(arr.slice(i, i += len));
    }

    return chunks;
}
