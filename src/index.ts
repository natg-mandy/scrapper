import * as http from 'http';
import * as Xray from 'x-ray';
import * as metadata from './metadata';

interface IMvpData {
    when: Date;
    who: string;
    mvp: string;
    where: string;
}

const map = new Map<string, IMvpData>();

const s = new http.Server((req, res) => {

    var x = Xray();

    x('https://obsidianro.com/panel/?module=ranking&action=mvp', 'table.horizontal-table')((err, table) => {
        var items = table.split('\n')
            .map(z => z.trim())
            .filter(z => !!z);
            //no 5
        items.splice(0, 5);

        var chanks: [string, string, string, string, string][] = chunk(items, 5);

        var data = chanks.map(([murderTime, whoKilled, MVP, OL, mapName]) => {
            var when = new Date(murderTime);
            var who = whoKilled;
            var mvp = MVP;
            var mapName = mapName;
            return <IMvpData> {
                 mvp,
                 when,
                 who,
                 where: mapName
            };
        });

        console.log(data);

        res.end(JSON.stringify(data));
    });
});

s.listen(3000, (err) => {
    if (err) {
        console.error('error', err);
    }
});

function chunk(arr, len): [string, string, string, string, string][] {
    var chunks = [],
        i = 0,
        n = arr.length;

    while (i < n) {
        chunks.push(arr.slice(i, i += len));
    }

    return chunks;
}