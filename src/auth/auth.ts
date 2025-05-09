import SpotifyWebApi from 'spotify-web-api-node';

const api = new SpotifyWebApi();
console.log('Spotify Web API erfolgreich geladen!');

const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID!,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
});

export async function getSpotifyApi(): Promise<SpotifyWebApi> {
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body.access_token);
    return spotifyApi;
}
