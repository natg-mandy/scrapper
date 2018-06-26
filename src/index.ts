import * as http from 'http';
import * as Xray from 'x-ray';
import {metadata} from './metadata';
import * as Webhook from 'webhook-discord';
import * as moment from 'moment';
import { Utils } from 'utils';
import { orderBy } from 'lodash';

interface IMvpData {
    when: Date;
    who: string;
    mvp: string;
    mapName: string;
    respawn: Date;
    /** minutes left */
    timeLeft?: number;
}
const webhookUrl = `https://discordapp.com/api/webhooks/460939241292300299/3SeBHlQ-VjnjYgKlc86YVs9V9aiU4Tekjjz7LETXewDghRxk2wLru5wP3H92r7jegqCq`;

const webhook = new Webhook(webhookUrl);

const whitelistedMaps = Object.keys(metadata.map);

const whitelistedMvps = Object.keys(metadata.mvp);

const PORT = process.env.PORT || 3000;

const mvpMap = new Map<string, IMvpData>();

const s = new http.Server(async (req, res) => {
    var data = await getMvpData();
    var newData = data.map(d => {
        var newD = Object.assign({}, d);
        newD.timeLeft = Utils.secondsLeft(d.respawn);
        return newD;
    })
    res.end(JSON.stringify(newData));
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
                    mapName
                };

                return data;
            }).filter(z => !!z);

            data = orderBy(data, d => Utils.secondsLeft(d.respawn));

            return resolve(data);
        });
    });
}

async function getAndUpdate() {
    var data = await getMvpData();
    console.log('latest data', data);

    data.forEach(next => {
        mvpMap.set(`${next.mapName}${next.mvp}`, next);
    });

    mvpMap.forEach(val => {
        val.timeLeft = Utils.secondsLeft(val.respawn);
    });

    const almostSpawning = data.filter(z => z.timeLeft >= 0 && z.timeLeft < 300);

    if (almostSpawning.length) {
        var msgs = almostSpawning.map(z => Utils.constructMessage(z.mvp, z.timeLeft / 60, z.mapName, z.who));
        webhook.custom("mvp-bot", msgs.join('\n\n'), 'MVPs Spawning Soon', "#0aaf94");
    }

    console.log(`${almostSpawning.length} are about to spawn`);
}

getAndUpdate();

setInterval(() => {
    console.log('getting and updating data');
    getAndUpdate();
    //do this every 5 minutes
}, 5 * 60 * 1000);


function chunk(arr, len): [string, string, string, string, string][] {
    var chunks = [],
        i = 0,
        n = arr.length;

    while (i < n) {
        chunks.push(arr.slice(i, i += len));
    }

    return chunks;
}