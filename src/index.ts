import 'dotenv/config';
import { client } from './core/client';
import './commands';


console.time('BotStart');
client.once('ready', () => {
    console.timeEnd('BotStart');
});

client.login(process.env.TOKEN!);