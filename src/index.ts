import * as http from 'http';
import * as Xray from 'x-ray';

const s = new http.Server((req, res) => {

    var x = Xray();

    x('https://obsidianro.com/panel/?module=ranking&action=mvp', 'table.horizontal-table')((err, table) => {
        //it is to be a remov of the           but cant forget about OL before end or before
        var items = table.split('\n')
            .map(z => z.trim())
            .filter(z => !!z);
            //no 5
        items.splice(0, 5);

        var chunky: [string, string, string, string, string][] = chunk(items, 5);

        chunky.map(([murderTime, whoKillt, MVP, OL, where]) => {
            return {
                when: new Date(murderTime),//it is of wrong time
                who: whoKillt,
                mvp: MVP,
                where: where
            };
        });

        console.log(chunky);
    });
});

s.listen(3000, (err) => {
    if (err) {
        console.error('error', err);
    }
});


//i borrow from freind of overeflowed dstack ty freind
function chunk(arr, len): [string, string, string, string, string][] {
    var chunks = [],
        i = 0,
        n = arr.length;

    while (i < n) {
      chunks.push(arr.slice(i, i += len));
    }

    return chunks;
  }