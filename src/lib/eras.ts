// Era IDs and Latvian names (matches legacy index.html exactly).
export const ERAS = [
  { id: 0,  name: 'Baroks' },
  { id: 1,  name: 'Klasicisms' },
  { id: 2,  name: 'Vācu/austriešu romantisms' },
  { id: 3,  name: 'Franču romantisms' },
  { id: 4,  name: 'Itāļu romantisms/verisms' },
  { id: 5,  name: 'Krievu romantisms' },
  { id: 6,  name: 'Latviešu romantisms' },
  { id: 7,  name: 'Impresionisms' },
  { id: 8,  name: 'XX gs. modernisms' },
  { id: 9,  name: 'Latviešu XX gs.' },
  { id: 10, name: 'Cits' },
] as const;

export type EraId = typeof ERAS[number]['id'];

export function eraName(id: number): string {
  return ERAS.find((e) => e.id === id)?.name ?? 'Nezināms';
}
