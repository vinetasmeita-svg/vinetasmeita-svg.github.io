// Three hardcoded tracks for the public landing-page demo. Deliberately
// NOT sourced from Firestore — keeps the demo fast and robust.
import type { QuizTrack } from './types';

export const DEMO_TRACKS: QuizTrack[] = [
  {
    source: 'library',
    title: 'J.S. Bahs — Sv. Mateja pasija: II d. alta ārija (Erbarme Dich)',
    era: 0,
    audioPath: '/audio/demo1.mp3',
    correctAnswer: 'J.S. Bahs — Sv. Mateja pasija: II d. alta ārija (Erbarme Dich)',
  },
  {
    source: 'library',
    title: 'V.A. Mocarts — 40. simfonija: III d. menueta tēma',
    era: 1,
    audioPath: '/audio/demo2.mp3',
    correctAnswer: 'V.A. Mocarts — 40. simfonija: III d. menueta tēma',
  },
  {
    source: 'library',
    title: 'F. Šūberts — dz. cikls Skaistā dzirnavniece: Ceļošana (nr. 1)',
    era: 2,
    audioPath: '/audio/demo3.mp3',
    correctAnswer: 'F. Šūberts — dz. cikls Skaistā dzirnavniece: Ceļošana (nr. 1)',
  },
];
