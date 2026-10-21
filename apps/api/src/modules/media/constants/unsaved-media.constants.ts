// id for a movie/series row built from TMDB on a read path but never inserted (ids are
// serial, so it matches nothing). Plain page views must not write to the DB.
export const UNSAVED_MEDIA_ID = 0;
