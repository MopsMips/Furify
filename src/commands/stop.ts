import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../types/command';
import { connections, players, queues } from '../core/player';
import { getVoiceConnection } from '@discordjs/voice';

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stoppt die Musik und leert die Warteschlange'),

    async execute(interaction) {
        const guildId = interaction.guildId!;

        players.get(guildId)?.stop();
        queues.set(guildId, []);
        getVoiceConnection(guildId)?.destroy();

        players.delete(guildId);
        connections.delete(guildId);

        await interaction.reply('⏹️ Musik gestoppt und Warteschlange geleert.');
    },
};
