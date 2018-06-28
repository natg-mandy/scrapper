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

export interface IMessyMvpData {
    WHO_KILLED_LAST: string;
    MAP_NAME: string;
    DATE__RESPAWN: Date;
    DATE__DEATH: Date;
    MINUTES_UNTIL_RESPAWN: string;
    MVP_NAME: string;
}

export interface ICleanMvpData {
    Killed_At: string,
    Respawn_At: string;
    Map_Name: string;
    Mvp_Name: string;
    Killed_By: string;
    Minutes_Until_Respawn: string;
  };

export interface IMvpData {
    when: Date;
    who: string;
    mvp: string;
    mapName: string;
    respawn: Date;
    timer$: Observable<[number, number, number]>;
    key: string;
}

const env = process.env.NODE_ENV || 'dev';

const webhookSuffix = process.env.WEBHOOK_URL || '460939241292300299/3SeBHlQ-VjnjYgKlc86YVs9V9aiU4Tekjjz7LETXewDghRxk2wLru5wP3H92r7jegqCq';
const webhookUrl = `https://discordapp.com/api/webhooks/${webhookSuffix}`;

const webhook = new Webhook(webhookUrl);

const whitelistedMaps = Object.keys(metadata.map);

const whitelistedMvps = Object.keys(metadata.mvp);

const PORT = process.env.PORT || 3000;

export const mvpMap = new Map<string, IMvpData>();

/** tells anything listening on this key to stop */
const finishBroadcast$ = new Subject<string>();

const s = new http.Server(async (req, res) => {
    var latest = [];

    mvpMap.forEach(d => {
        latest.push(Utils.getCleanJson(d));
    });

    res.end(JSON.stringify(latest));
});

s.listen(PORT, (err) => {
    if (err) {
        console.error('error', err);
    }
});

function getMvpData(): Promise<IMvpData[]> {
    return new Promise(resolve => {
        var x = Xray();

        x('https://obsidianro.com/panel/?module=ranking&action=mvp', 'table.horizontal-table')((err, table) => {
            if (err) {
                console.error(err);
                throw err;
            }
            var data: IMvpData[] = parse(table);

            return resolve(data);
        });
    });
}

async function getAndUpdate() {
    var data = await getMvpData();
    console.log('latest data', data);

    data.forEach((next) => update(next));
}

export function update(data: IMvpData) {
    let existing = mvpMap.get(data.key);
    let cached = existing && existing.respawn.getTime();

    //if our new spawn time is before our old, update
    if (!cached || cached < data.respawn.getTime()) {
        mvpMap.set(data.key, data);
        var msg = `${data.mvp} was killed by ${data.who} and will respawn ${moment(data.respawn).fromNow()}`;

        Utils.broadcast(webhook, 'MVP Killed', msg);

        beginWatch(data.key, data);
    }
}


Observable.timer(0, 30 * 1000)
    .subscribe(() => {
        console.log('getting and updating data');
        getAndUpdate();
    })

export function beginWatch(key: string, data: IMvpData): void {
    finishBroadcast$.next(key);

    data.timer$
        .takeUntil(finishBroadcast$.filter(k => k === key))
        .switchMap(z => {
            return Promise.resolve(new Date().getTime());
        }, ([minSpawn, maxSpawn], current) => {
            return [(minSpawn - current), maxSpawn - current];
        })
        .subscribe(([minSpawn, maxSpawn]) => {
            var minSpawnInMin = minSpawn / 60 / 1000;
            var maxSpawnInMin = maxSpawn / 60 / 1000;

            var spawnWindow: number = metadata.mvp[data.mvp].window;

            if (minSpawn <= Utils.notificationThreshold) {
                const msg = Utils.constructMessage(data.mvp, minSpawnInMin, maxSpawnInMin, data.mapName, data.who);

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

    var data = chunks.map(([murderTime, whoKilled, MVP, exp/*useless*/, mapName]) => {
        var when = moment.utc(murderTime).toDate();
        var who = whoKilled;
        var mvp = MVP;
        var mapName = mapName;

        if (!whitelistedMaps.some(m => m === mapName)) {
            return null;
        }

        var mvpMeta = metadata.mvp[mvp];
        var timeToRespawn = (mvpMeta && mvpMeta.timer);

        if (!timeToRespawn) {
            return;
        }

        var respawn = moment.utc(when).add(timeToRespawn, 'minutes').toDate();
        var spawnWindow = metadata.mvp[mvp].window
        var data = <IMvpData> {
            mvp,
            when,
            who,
            respawn,
            mapName,
            key: Utils.getKey(mapName, mvp),
            timer$: Utils.getTimer(respawn, spawnWindow)
        };

        return data;
    }).filter(z => !!z);

    return orderBy(data, d => Utils.secondsLeft(d.respawn));
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
