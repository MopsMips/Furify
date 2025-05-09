import 'dotenv/config';
import { client } from './core/client';
import { Player } from './core/player';
import './commands';

client.player = new Player(client);
console.time('BotStart');
client.once('ready', () => {
    console.timeEnd('BotStart');
});

client.login(process.env.TOKEN!);
