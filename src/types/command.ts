import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

export interface Command {
    data: SlashCommandBuilder;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export interface QueueItem {
    url: string;
    title?: string;
    requestedBy?: string;
    duration?: string;
}