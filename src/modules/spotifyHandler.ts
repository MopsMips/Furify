import { getSpotifyApi } from '../auth/auth';
import ytSearch from 'yt-search';

export async function handleSpotifyPlaylist(url: string): Promise<string[]> {
    const spotifyApi = await getSpotifyApi();
    const playlistId = extractSpotifyId(url, 'playlist');
    const results: string[] = [];

    let offset = 0;
    const limit = 100;

    while (true) {
        const { body } = await spotifyApi.getPlaylistTracks(playlistId, { offset, limit });
        for (const item of body.items) {
            const track = item.track as SpotifyApi.TrackObjectFull;
            const ytUrl = await searchYoutube(`${track.artists[0].name} - ${track.name}`);
            if (ytUrl) results.push(ytUrl);
        }
        if (body.items.length < limit) break;
        offset += limit;
    }

    return results;
}

export async function handleSpotifyTrack(url: string): Promise<string[]> {
    const spotifyApi = await getSpotifyApi();
    const trackId = extractSpotifyId(url, 'track');
    const { body } = await spotifyApi.getTrack(trackId);
    const query = `${body.artists[0].name} - ${body.name}`;
    const ytUrl = await searchYoutube(query);
    return ytUrl ? [ytUrl] : [];
}

export async function handleSpotifyAlbum(url: string): Promise<string[]> {
    const spotifyApi = await getSpotifyApi();
    const albumId = extractSpotifyId(url, 'album');
    const album = await spotifyApi.getAlbum(albumId);
    const tracks = await spotifyApi.getAlbumTracks(albumId);
    const results: string[] = [];

    for (const track of tracks.body.items) {
        const artist = album.body.artists[0].name;
        const query = `${artist} - ${track.name}`;
        const ytUrl = await searchYoutube(query);
        if (ytUrl) results.push(ytUrl);
    }

    return results;
}

function extractSpotifyId(url: string, type: 'track' | 'album' | 'playlist'): string {
    const match = url.match(new RegExp(`${type}/([a-zA-Z0-9]+)`));
    if (!match) throw new Error(`Ungültiger Spotify-${type}-Link`);
    return match[1];
}

async function searchYoutube(query: string): Promise<string | null> {
    const result = await ytSearch(query);
    return result.videos[0]?.url ?? null;
}
