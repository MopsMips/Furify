import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
    ButtonStyle,
    ActionRowBuilder,
    ButtonBuilder,
    MessageComponentInteraction,
    ComponentType,
    MessageFlags
} from 'discord.js';
import { connectAndPlay } from '../core/player';
import { getSongFromUrl } from '../utils/yt-dlp';
import { FurifyClient } from '../core/client';

export default {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Spielt einen Song von YouTube ab')
        .addStringOption(option =>
            option.setName('url').setDescription('YouTube-URL des Songs').setRequired(true),
        ),
    async execute(interaction: ChatInputCommandInteraction) {
        const url = interaction.options.getString('url', true);

        const member = interaction.member as any;
        const voiceChannel = member?.voice?.channel;

        if (!voiceChannel) {
            return interaction.reply({
                content: '❌ Du musst in einem Sprachkanal sein!',
                flags: MessageFlags.Ephemeral
            });
        }

        await interaction.reply({ content: '🔄 Lade den Song...' });

        let song;
        try {
            song = await getSongFromUrl(url);
        } catch (error) {
            console.error('Fehler beim Laden des Songs:', error);
            return interaction.editReply({ content: '❌ Fehler beim Laden des Songs.' });
        }

        if (!song) {
            return interaction.editReply({ content: '❌ Ungültige YouTube-URL oder Song konnte nicht gefunden werden.' });
        }

        try {
            await connectAndPlay(voiceChannel, url, interaction.guildId!);
        } catch (error) {
            console.error('Fehler beim Abspielen:', error);
            return interaction.editReply({ content: '❌ Fehler beim Abspielen des Songs.' });
        }

        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('🎶 Jetzt spielt:')
            .setDescription(`**[${song.title}](${song.url})**`)
            .setFooter({ text: '⏯ Pause/Play | ⏭ Skip | ⏹ Stop' });

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId('pause')
                .setLabel('⏯ Pause/Play')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('skip')
                .setLabel('⏭ Skip')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('stop')
                .setLabel('⏹ Stop')
                .setStyle(ButtonStyle.Danger),
        );

        const controlMessage = await interaction.editReply({
            content: '',
            embeds: [embed],
            components: [row],
        });

        const filter = (i: MessageComponentInteraction) =>
            i.componentType === ComponentType.Button &&
            ['pause', 'skip', 'stop'].includes(i.customId);

        const collector = controlMessage.createMessageComponentCollector({
            filter,
            time: 600000, // 10 Minuten
        });

        collector.on('collect', async (i: MessageComponentInteraction) => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({
                    content: '⚠️ Nur der ursprüngliche Nutzer kann die Musik steuern.',
                    flags: MessageFlags.Ephemeral
                });
            }

            const client = interaction.client as FurifyClient;

            try {
                // WICHTIG: Button-Klicks müssen mit i übergeben werden
                switch (i.customId) {
                    case 'pause':
                        await client.commands.get('pause')?.execute(i);
                        break;
                    case 'skip':
                        await client.commands.get('skip')?.execute(i);
                        break;
                    case 'stop':
                        await client.commands.get('stop')?.execute(i);
                        collector.stop();
                        break;
                }
            } catch (error) {
                console.error('Fehler bei Button-Interaktion:', error);
                if (!i.replied && !i.deferred) {
                    await i.reply({
                        content: '❌ Fehler bei der Ausführung.',
                        flags: MessageFlags.Ephemeral
                    });
                }
            }
        });

        collector.on('end', () => {
            console.log('⏳ Collector beendet.');
        });
    },
};
