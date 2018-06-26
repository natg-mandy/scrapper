import * as http from 'http';
import * as Xray from 'x-ray';
import {metadata} from './metadata';
import * as Webhook from 'webhook-discord';
import * as moment from 'moment';
import { Utils } from 'utils';
import { orderBy } from 'lodash';
import { Observable, Subject } from 'rxjs';

interface IMvpData {
    when: Date;
    who: string;
    mvp: string;
    mapName: string;
    respawn: Date;
    timer: Observable<[number, number]>;
    key: string;
}
const webhookUrl = `https://discordapp.com/api/webhooks/460939241292300299/3SeBHlQ-VjnjYgKlc86YVs9V9aiU4Tekjjz7LETXewDghRxk2wLru5wP3H92r7jegqCq`;

const webhook = new Webhook(webhookUrl);

const whitelistedMaps = Object.keys(metadata.map);

const whitelistedMvps = Object.keys(metadata.mvp);

const PORT = process.env.PORT || 3000;

const mvpMap = new Map<string, IMvpData>();

/** tells anything listening on this key to stop */
const finishBroadcast$ = new Subject<string>();

const s = new http.Server(async (req, res) => {
    var latest = [];

    mvpMap.forEach(d => {
        latest.push(d);
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
            var data: IMvpData[] = parse(table);

            return resolve(data);
        });
    });
}

async function getAndUpdate() {
    var data = await getMvpData();
    console.log('latest data', data);

    data.forEach(async (next) => {
        let existing = mvpMap.get(next.key);
        let cached = existing && existing.respawn.getTime();
        if (cached !== next.respawn.getTime()) {
            mvpMap.set(next.key, next);
            beginWatch(next.key, next);
        }
    });
}

Observable.timer(0, 5 * 60 * 1000)
    .subscribe(() => {
        console.log('getting and updating data');
        getAndUpdate();
    })

function beginWatch(key: string, data: IMvpData): void {
    finishBroadcast$.next(key);

    data.timer
        .takeUntil(finishBroadcast$.filter(k => k === key))
        .switchMap(z => {
            return Promise.resolve(new Date().getTime());
        }, ([spawn], current) => {
            return (spawn - current);
        })
        .subscribe((ms) => {
            var secs = secs = ms / 1000;
            var mins = secs / 60;

            if (ms <= 5 * 60 * 1000) {
                const msg = Utils.constructMessage(data.mvp, mins, data.mapName, data.who);
                console.log(msg);
                Utils.broadcast(webhook, msg);
                finishBroadcast$.next(key);
            }
        });
}

function parse(table: string) {
    var items = table.split('\n')
        .map(z => z.trim())
        .filter(z => !!z);
        //no 5
    items.splice(0, 5);

    var chanks: [string, string, string, string, string][] = chunk(items, 5);

    var data = chanks.map(([murderTime, whoKilled, MVP, OL, mapName]) => {
        var when = moment.utc(murderTime).toDate();
        var who = whoKilled;
        var mvp = MVP;
        var mapName = mapName;

        if (!(whitelistedMaps.some(m => m === mapName) && whitelistedMvps.some(m => m === mvp))) {
            return null;
        }

        var timeToRespawn = metadata.mvp[mvp].timer;

        var respawn = moment.utc(when).add(timeToRespawn, 'minutes').toDate();

        var data = <IMvpData> {
            mvp,
            when,
            who,
            respawn,
            mapName,
            key: `${mapName}${mvp}`,
            timer: Utils.getTimer(respawn)
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