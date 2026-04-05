// Three hardcoded tracks for the public landing-page demo. Deliberately
// NOT sourced from Firestore — keeps the demo fast and robust.
import type { QuizTrack } from './types';

// ytStart values come verbatim from the legacy exam list. The playback
// component seeks the <audio> element to that offset on loadedmetadata,
// so the full MP3 is served but the user hears the correct excerpt.
export const DEMO_TRACKS: QuizTrack[] = [
  {
    source: 'library',
    title: 'J.S. Bahs — Sv. Mateja pasija: II d. alta ārija (Erbarme Dich)',
    era: 0,
    audioPath: '/audio/demo1.mp3',
    ytStart: 0,
    correctAnswer: 'J.S. Bahs — Sv. Mateja pasija: II d. alta ārija (Erbarme Dich)',
  },
  {
    source: 'library',
    title: 'V.A. Mocarts — 40. simfonija: III d. menueta tēma',
    era: 1,
    audioPath: '/audio/demo2.mp3',
    ytStart: 1807,
    correctAnswer: 'V.A. Mocarts — 40. simfonija: III d. menueta tēma',
  },
  {
    source: 'library',
    title: 'F. Šūberts — dz. cikls Skaistā dzirnavniece: Ceļošana (nr. 1)',
    era: 2,
    audioPath: '/audio/demo3.mp3',
    ytStart: 0,
    correctAnswer: 'F. Šūberts — dz. cikls Skaistā dzirnavniece: Ceļošana (nr. 1)',
  },
];
