
interface IMetadata {
  map: {[index: string]: {
    timer?: number;
    window?: number;
  }};
  mvp: {[index: string]: {
    alias?: string[];
    window?: number;
    timer?: number;
  }}
}
export const metadata: IMetadata = {
  map: {
    'abbey02': {},
    'ama_dun03': {},
    'anthell02': {},
    'beach_dun': {},
    'ein_dun02': {},
    'gef_fild14': {},
    'jupe_core': {},
    'kh_dun02': {},
    'lhz_dun03': {
      timer: 100,
      window: 30
    },
    'lou_dun03': {},
    'mjolnir_04': {},
    'moc_fild22': {},
    'moc_pryd06': {},
    'odin_tem03': {},
    'pay_fild11': {},
    'prt_sewb4': {},
    'ra_san05': {},
    'thor_v03': {},
    'tur_dun04': {}
  },
  mvp: {
    'Amon Ra': {
      window: 10,
      timer: 60
    },
    'Fallen Bishop Hibram': {
      timer: 120,
      window: 10
    },
    'Gloom Under Night': {
      timer: 300,
      window: 10
    },
    'Golden Thief Bug': {
      timer: 60,
      window: 10
    },
    'Ifrit': {
      timer: 660,
      window: 10
    },
    'Kiel D-01': {
      timer: 120,
      window: 60
    },
    'Maya': {
      timer: 120,
      window: 10
    },
    'Mistress': {
      timer: 120,
      window: 10
    },
    'RSX-0806': {
      timer: 125,
      window: 10
    },
    'Samurai Specter': {
      alias: ['Incantation Samurai'],
      timer: 91,
      window: 10
    },
    'Tao Gunka': {
      timer: 300,
      window: 10
    },
    'Turtle General': {
      timer: 60,
      window: 10
    },
    'Valkyrie Randgris': {
      timer: 480,
      window: 10
    },
    'Vesper': {
      timer: 120,
      window: 10
    },
    'Wounded Morroc': {
      timer: 720,
      window: 60
    },
    'White Lady': {
      alias: ['Bacsojin'],
      timer: 117,
      window: 10
    },
  }
}