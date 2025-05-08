import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
} from 'discord.js';
import type { Command } from '../types/command';
import {
    connections,
    queues,
    players,
    playNext,
} from '../core/player';
import {
    joinVoiceChannel,
    AudioPlayerStatus,
} from '@discordjs/voice';

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Fügt Musik zur Warteschlange hinzu')
        .addStringOption((opt) =>
            opt.setName('url').setDescription('YouTube-URL').setRequired(true)
        ) as SlashCommandBuilder, // 👈 Typ fix!

    async execute(interaction: ChatInputCommandInteraction) {
        const guildId = interaction.guildId!;
        const url = interaction.options.getString('url', true);
        const member = interaction.member as any;
        const voiceChannel = member.voice?.channel;

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
        const isPlaying =
            player?.state.status === AudioPlayerStatus.Playing;

        queue.push(url);

        if (!isPlaying || !player) {
            playNext(guildId);
            await interaction.reply('▶️ Starte Wiedergabe!');
        } else {
            await interaction.reply('🎶 Zur Warteschlange hinzugefügt!');
        }
    },
};
