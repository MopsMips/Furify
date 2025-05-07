import 'dotenv/config';
import {
    Client,
    GatewayIntentBits,
    SlashCommandBuilder,
    REST,
    Routes,
    Events,
} from 'discord.js';
import {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayer,
    StreamType,
    VoiceConnection,
    getVoiceConnection,
    AudioPlayerStatus,
} from '@discordjs/voice';
import { spawn } from 'child_process';
import { Readable } from 'stream';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';

ffmpeg.setFfmpegPath(ffmpegPath!);

const ytDlpPath = 'C:/Users/Eileen/AppData/Local/Programs/Python/Python313/Scripts/yt-dlp.exe';
const token = process.env.TOKEN!;
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

let connections = new Map<string, VoiceConnection>();
let players = new Map<string, AudioPlayer>();
let queues = new Map<string, string[]>();


const playNext = (guildId: string) => {
    const queue = queues.get(guildId);
    const connection = connections.get(guildId);
    if (!queue || queue.length === 0 || !connection) return;

    const url = queue.shift()!;

    const yt = spawn(ytDlpPath, ['-f', 'bestaudio', '-o', '-', url], {
        stdio: ['ignore', 'pipe', 'ignore'],
    });

    const ffmpegStream = ffmpeg(yt.stdout!)
        .inputFormat('webm')
        .audioCodec('libmp3lame')
        .format('mp3')
        .addOption('-reconnect', '1')
        .addOption('-reconnect_streamed', '1')
        .addOption('-reconnect_delay_max', '5')
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

    player.once(AudioPlayerStatus.Idle, () => {
        setTimeout(() => {
            const newQueue = queues.get(guildId);
            const stillIdle = player.state.status === AudioPlayerStatus.Idle;
            if ((!newQueue || newQueue.length === 0) && stillIdle) {
                players.get(guildId)?.stop();
                getVoiceConnection(guildId)?.destroy();
                connections.delete(guildId);
                players.delete(guildId);
                console.log(`👋 Bot hat den Kanal in Guild ${guildId} verlassen (Auto-Leave).`);
            }
        }, 30000); // 30 Sekunden warten

        playNext(guildId);
    });
};

client.once(Events.ClientReady, async () => {
    const commands = [
        new SlashCommandBuilder()
            .setName('queue')
            .setDescription('Zeigt die aktuelle Warteschlange'),
        new SlashCommandBuilder()
            .setName('play')
            .setDescription('Fügt Musik zur Warteschlange hinzu')
            .addStringOption((option) =>
                option.setName('url').setDescription('YouTube-URL').setRequired(true)
            ),
        new SlashCommandBuilder()
            .setName('skip')
            .setDescription('Überspringt den aktuellen Song'),
        new SlashCommandBuilder()
            .setName('stop')
            .setDescription('Stoppt Musik und leert die Warteschlange'),
        new SlashCommandBuilder()
            .setName('pause')
            .setDescription('Pausiert den aktuellen Song'),
        new SlashCommandBuilder()
            .setName('resume')
            .setDescription('Setzt die Wiedergabe fort'),

    ].map((cmd) => cmd.toJSON());

    const rest = new REST({ version: '10' }).setToken(token);
    await rest.put(Routes.applicationCommands(client.user!.id), { body: commands });
    console.log('✅ Slash Commands registriert!');
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const guildId = interaction.guildId!;
    const member = interaction.member as any;
    const voiceChannel = member.voice?.channel;

    if (interaction.commandName === 'play') {
        const url = interaction.options.getString('url', true);
        if (!voiceChannel) {
            await interaction.reply('⚠️ Du musst in einem Sprachkanal sein.');
            return;
        }

        if (!connections.has(guildId)) {
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            });
            connections.set(guildId, connection);
        }

        if (!queues.has(guildId)) queues.set(guildId, []);
        const queue = queues.get(guildId)!;

        const player = players.get(guildId);
        const isPlaying = player?.state.status === AudioPlayerStatus.Playing;

        queue.push(url);

        if (!isPlaying || !player) {
            playNext(guildId);
            await interaction.reply('▶️ Starte Wiedergabe!');
        } else {
            await interaction.reply('🎶 Song zur Warteschlange hinzugefügt!');
        }
    }

    if (interaction.commandName === 'skip') {
        const player = players.get(guildId);
        if (player) {
            player.stop();
            await interaction.reply('⏭️ Song übersprungen!');
        } else {
            await interaction.reply('⚠️ Es läuft gerade keine Musik.');
        }
    }

    if (interaction.commandName === 'stop') {
        players.get(guildId)?.stop();
        queues.set(guildId, []);
        getVoiceConnection(guildId)?.destroy();
        connections.delete(guildId);
        players.delete(guildId);
        await interaction.reply('⏹️ Musik gestoppt und Warteschlange geleert.');
    }

    if (interaction.commandName === 'pause') {
        const player = players.get(guildId);
        if (player?.pause()) {
            await interaction.reply('⏸️ Wiedergabe pausiert.');
        } else {
            await interaction.reply('⚠️ Nichts zu pausieren.');
        }
    }

    if (interaction.commandName === 'resume') {
        const player = players.get(guildId);
        if (player?.unpause()) {
            await interaction.reply('▶️ Wiedergabe fortgesetzt.');
        } else {
            await interaction.reply('⚠️ Nichts wiederzugeben.');
        }
    }


    if (interaction.commandName === 'queue') {
        const queue = queues.get(guildId);
        if (!queue || queue.length === 0) {
            await interaction.reply('📭 Die Warteschlange ist leer.');
        } else {
            const list = queue.map((url, i) => `${i + 1}. ${url}`).join('\n');
            await interaction.reply(`📃 Aktuelle Warteschlange:\n${list}`);
        }
    }
});

client.login(token);