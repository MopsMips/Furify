import {
    Client,
    Collection,
    GatewayIntentBits,
    Partials,
} from 'discord.js';
import type { Command } from '../types/command';

export class FurifyClient extends Client {
    public commands: Collection<string, Command> = new Collection();

    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
            ],
            partials: [Partials.Channel],
        });
    }
}

export const client = new FurifyClient();
