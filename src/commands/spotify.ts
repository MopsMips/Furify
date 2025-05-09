import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    GuildMember,
    TextBasedChannel
} from 'discord.js';
import {
    handleSpotifyPlaylist,
    handleSpotifyTrack,
    handleSpotifyAlbum
} from '../modules/spotifyHandler';
import { FurifyClient } from '../core/client';

export const data = new SlashCommandBuilder()
    .setName('spotify')
    .setDescription('Spielt einen Spotify-Track, ein Album oder eine Playlist ab')
    .addStringOption(option =>
        option.setName('link')
            .setDescription('Spotify-Link (Playlist, Track oder Album)')
            .setRequired(true)
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    const url = interaction.options.getString('link', true);
    const member = interaction.member as GuildMember;
    const voiceChannel = member?.voice?.channel;
    const client = interaction.client as FurifyClient;

    if (!voiceChannel) {
        return interaction.reply({
            content: '❌ Du musst in einem Sprachkanal sein!',
            ephemeral: true
        });
    }

    await interaction.reply({ content: '🔄 Lade Spotify-Link...' });

    let urls: string[] = [];

    try {
        if (url.includes('/playlist/')) {
            urls = await handleSpotifyPlaylist(url);
        } else if (url.includes('/album/')) {
            urls = await handleSpotifyAlbum(url);
        } else if (url.includes('/track/')) {
            urls = await handleSpotifyTrack(url);
        } else {
            return interaction.editReply('❌ Ungültiger Spotify-Link.');
        }

        if (urls.length === 0) {
            return interaction.editReply('⚠️ Keine Songs gefunden.');
        }

        const textChannel = interaction.channel?.isTextBased()
            ? (interaction.channel as TextBasedChannel)
            : undefined;

        for (const ytUrl of urls) {
            await client.player.connectAndPlay(
                voiceChannel,
                ytUrl,
                interaction.guildId!,
                textChannel
            );
        }

        return interaction.editReply(`✅ ${urls.length} Songs wurden zur Warteschlange hinzugefügt.`);
    } catch (err) {
        console.error(err);
        return interaction.editReply('❌ Fehler beim Verarbeiten des Spotify-Links.');
    }
}
