import {
    AudioPlayer,
    AudioPlayerStatus,
    createAudioPlayer,
    createAudioResource,
    getVoiceConnection,
    joinVoiceChannel,
    StreamType,
    VoiceConnection,
} from '@discordjs/voice';
import { Readable } from 'stream';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';

import { getYtDlpStream } from '../utils/yt-dlp';
import { AUTO_LEAVE_TIMEOUT } from '../config/botConfig';

ffmpeg.setFfmpegPath(ffmpegPath!);

// Maps für Verbindungen, Player und Warteschlangen
export const connections = new Map<string, VoiceConnection>();
export const players = new Map<string, AudioPlayer>();
export const queues = new Map<string, string[]>();

// 🎵 Nächsten Song aus der Warteschlange abspielen
export const playNext = (guildId: string) => {
    const queue = queues.get(guildId);
    const connection = connections.get(guildId);
    if (!queue || queue.length === 0 || !connection) return;

    const url = queue.shift()!;
    const yt = getYtDlpStream(url);

    const ffmpegStream = ffmpeg(yt.stdout!)
        .inputFormat('webm')
        .audioCodec('libmp3lame')
        .format('mp3')
        .on('error', (err) => console.error('FFmpeg Fehler:', err.message));

    const audioStream = ffmpegStream.pipe() as Readable;
    const resource = createAudioResource(audioStream, {
        inputType: StreamType.Arbitrary,
    });

    let player = players.get(guildId);
    if (!player) {
        player = createAudioPlayer();
        players.set(guildId, player);
        connection.subscribe(player);
    }

    player.play(resource);

    // Automatisch nächsten Titel spielen oder Bot nach Leerlauf verlassen
    player.once(AudioPlayerStatus.Idle, () => {
        setTimeout(() => {
            const stillIdle = player!.state.status === AudioPlayerStatus.Idle;
            const isQueueEmpty = !queues.get(guildId)?.length;

            if (isQueueEmpty && stillIdle) {
                player!.stop();
                getVoiceConnection(guildId)?.destroy();
                players.delete(guildId);
                connections.delete(guildId);
                console.log(`👋 Bot hat den Kanal in Guild ${guildId} verlassen (Auto-Leave).`);
            }
        }, AUTO_LEAVE_TIMEOUT);

        playNext(guildId);
    });
};

// 🔊 Verbindung herstellen und Song starten
export const connectAndPlay = async (voiceChannel: any, url: string, guildId: string) => {
    const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: guildId,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });

    connections.set(guildId, connection);

    if (!queues.has(guildId)) {
        queues.set(guildId, []);
    }

    queues.get(guildId)!.push(url);

    playNext(guildId);
};

// ⏸ Wiedergabe pausieren
export const pause = (guildId: string): boolean => {
    const player = players.get(guildId);
    if (!player) return false;

    if (player.state.status !== AudioPlayerStatus.Playing) return false;

    try {
        return player.pause();
    } catch (error) {
        console.error(`❌ Fehler beim Pausieren in Guild ${guildId}:`, error);
        return false;
    }
};

// ▶ Wiedergabe fortsetzen
export const resume = (guildId: string): boolean => {
    const player = players.get(guildId);
    if (!player) return false;

    if (player.state.status !== AudioPlayerStatus.Paused) return false;

    try {
        return player.unpause();
    } catch (error) {
        console.error(`❌ Fehler beim Fortsetzen in Guild ${guildId}:`, error);
        return false;
    }
};
