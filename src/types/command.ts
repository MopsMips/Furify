import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    MessageComponentInteraction
} from 'discord.js';

export type AnyInteraction = ChatInputCommandInteraction | MessageComponentInteraction;

export interface Command {
    data: SlashCommandBuilder;
    execute: (interaction: AnyInteraction) => Promise<void>;
}

export interface QueueItem {
    url: string;
    title?: string;
    requestedBy?: string;
    duration?: string;
}
