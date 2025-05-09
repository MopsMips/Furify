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
import { getYtDlpStream, getSongFromUrl } from '../utils/yt-dlp';
import { AUTO_LEAVE_TIMEOUT } from '../config/botConfig';
import {
    Client,
    TextBasedChannel,
    Message
} from 'discord.js';
import { renderPlaybackUI } from '../utils/renderPlaybackUI';
import { FurifyClient } from './client';

ffmpeg.setFfmpegPath(ffmpegPath!);

interface Track {
    title: string;
    url: string;
    duration: number;
}

export class Player {
    private connections = new Map<string, VoiceConnection>();
    private players = new Map<string, AudioPlayer>();
    private queues = new Map<string, Track[]>();
    private currentMessages = new Map<string, Message>();

    constructor(private client: Client) { }

    public getQueue(guildId: string): { tracks: { title: string; url: string }[] } | undefined {
        const queue = this.queues.get(guildId);
        if (!queue) return undefined;

        return {
            tracks: queue.map(track => ({
                title: track.title,
                url: track.url,
            })),
        };
    }

    public async connectAndPlay(
        voiceChannel: any,
        url: string,
        guildId: string,
        textChannel?: TextBasedChannel
    ): Promise<'started' | 'queued' | 'failed'> {
        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: guildId,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        });

        this.connections.set(guildId, connection);

        const song = await getSongFromUrl(url);
        if (!song) {
            console.error('❌ Song konnte nicht geladen werden:', url);
            return 'failed';
        }

        if (!this.queues.has(guildId)) {
            this.queues.set(guildId, []);
        }

        this.queues.get(guildId)!.push(song);

        const player = this.players.get(guildId);
        if (!player || player.state.status === AudioPlayerStatus.Idle) {
            await this.playNext(guildId, textChannel);
            return 'started';
        }

        return 'queued';
    }

    private async playNext(guildId: string, textChannel?: TextBasedChannel) {
        const queue = this.queues.get(guildId);
        const connection = this.connections.get(guildId);
        if (!queue || queue.length === 0 || !connection) return;

        const track = queue.shift()!;
        const yt = getYtDlpStream(track.url);

        yt.stderr?.on('data', (data) => {
            console.error(`yt-dlp stderr: ${data}`);
        });

        if (!yt.stdout) {
            console.error(`❌ Kein Audio-Stream für ${track.url}`);
            return;
        }

        const ffmpegStream = ffmpeg(yt.stdout)
            .inputFormat('webm')
            .audioCodec('libmp3lame')
            .format('mp3')
            .on('error', (err) => console.error('FFmpeg Fehler:', err.message));

        let audioStream: Readable;
        try {
            audioStream = ffmpegStream.pipe() as Readable;
        } catch (error) {
            console.error(`❌ Fehler beim Verarbeiten von FFmpeg-Stream:`, error);
            return;
        }

        const resource = createAudioResource(audioStream, {
            inputType: StreamType.Arbitrary,
        });

        let player = this.players.get(guildId);
        if (!player) {
            player = createAudioPlayer();
            this.players.set(guildId, player);
            connection.subscribe(player);
        }

        player.play(resource);

        const oldMsg = this.currentMessages.get(guildId);
        if (oldMsg) {
            try {
                await oldMsg.delete();
            } catch (e) {
                console.warn(`⚠️ Alte Nachricht konnte nicht gelöscht werden:`, e);
            }
        }

        if (
            textChannel &&
            'send' in textChannel &&
            typeof textChannel.send === 'function'
        ) {
            try {
                const newMsg = await renderPlaybackUI(textChannel, track, guildId, this.client as FurifyClient);
                this.currentMessages.set(guildId, newMsg);
            } catch (e) {
                console.warn('⚠️ Konnte neues Playback-UI nicht senden.');
                console.error(e);
            }
        } else {
            console.warn('⚠️ Kein sendbarer Channel übergeben – UI wird übersprungen.');
        }

        player.once(AudioPlayerStatus.Idle, () => {
            setTimeout(async () => {
                const stillIdle = player.state.status === AudioPlayerStatus.Idle;
                const isQueueEmpty = !this.queues.get(guildId)?.length;

                if (isQueueEmpty && stillIdle) {
                    player.stop();
                    getVoiceConnection(guildId)?.destroy();
                    this.players.delete(guildId);
                    this.connections.delete(guildId);
                    this.currentMessages.delete(guildId);

                    const furify = this.client as FurifyClient;
                    const uiMsg = furify.uiMessages?.get(guildId);
                    if (uiMsg && uiMsg.deletable) {
                        try {
                            await uiMsg.delete();
                        } catch (err) {
                            console.warn('⚠️ Konnte UI-Nachricht beim Auto-Leave nicht löschen:', err);
                        }
                    }
                    furify.uiMessages?.delete(guildId);

                    console.log(`👋 Bot hat den Sprachkanal in Guild ${guildId} verlassen (Auto-Leave).`);
                }
            }, AUTO_LEAVE_TIMEOUT);

            this.playNext(guildId, textChannel);
        });
    }

    public pause(guildId: string): boolean {
        const player = this.players.get(guildId);
        if (!player || player.state.status !== AudioPlayerStatus.Playing) return false;
        try {
            return player.pause();
        } catch (error) {
            console.error(`❌ Fehler beim Pausieren in Guild ${guildId}:`, error);
            return false;
        }
    }

    public resume(guildId: string): boolean {
        const player = this.players.get(guildId);
        if (!player || player.state.status !== AudioPlayerStatus.Paused) return false;
        try {
            return player.unpause();
        } catch (error) {
            console.error(`❌ Fehler beim Fortsetzen in Guild ${guildId}:`, error);
            return false;
        }
    }

    public skip(guildId: string): boolean {
        const player = this.players.get(guildId);
        if (!player) return false;
        try {
            player.stop();
            return true;
        } catch (error) {
            console.error(`❌ Fehler beim Skippen in Guild ${guildId}:`, error);
            return false;
        }
    }

    public clearQueue(guildId: string): void {
        this.queues.set(guildId, []);
    }
}