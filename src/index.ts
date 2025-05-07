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

let player: AudioPlayer | null = null;
let connection: VoiceConnection | null = null;

client.once(Events.ClientReady, async () => {
    const commands = [
        new SlashCommandBuilder()
            .setName('play')
            .setDescription('Spielt Musik von YouTube!')
            .addStringOption((option) =>
                option.setName('url').setDescription('YouTube-URL').setRequired(true)
            ),
        new SlashCommandBuilder()
            .setName('stop')
            .setDescription('Stoppt die Musik und verlässt den Sprachkanal'),
    ].map((cmd) => cmd.toJSON());

    const rest = new REST({ version: '10' }).setToken(token);
    await rest.put(Routes.applicationCommands(client.user!.id), { body: commands });
    console.log('✅ Slash Commands registriert!');
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'play') {
        const url = interaction.options.getString('url', true);
        const member = interaction.member as any;
        const voiceChannel = member.voice?.channel;

        if (!voiceChannel) {
            await interaction.reply('⚠️ Du musst in einem Sprachkanal sein.');
            return;
        }

        connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        });

        const yt = spawn(ytDlpPath, ['-f', 'bestaudio', '-o', '-', url], {
            stdio: ['ignore', 'pipe', 'ignore'],
        });

        const ffmpegStream = ffmpeg(yt.stdout!)
            .inputFormat('webm')
            .audioCodec('libmp3lame')
            .format('mp3')
            .on('error', (err) => console.error('FFmpeg Fehler:', err.message));

        const audioStream = ffmpegStream.pipe() as Readable;
        const resource = createAudioResource(audioStream, {
            inputType: StreamType.Arbitrary,
        });

        player = createAudioPlayer();
        player.play(resource);
        connection.subscribe(player);

        await interaction.reply('🎶 Spiele Musik ab!');
    }

    if (interaction.commandName === 'stop') {
        if (player) player.stop();
        const existing = getVoiceConnection(interaction.guildId!);
        if (existing) existing.destroy();
        await interaction.reply('⏹️ Musik gestoppt und Sprachkanal verlassen.');
    }
});

client.login(token);
