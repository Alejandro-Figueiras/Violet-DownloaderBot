require('dotenv').config();
const { Telegraf } = require('telegraf')

console.log(process.env.BOT_TOKEN);

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.start((ctx) => ctx.reply('Bienvenido ' + ctx.from.first_name + ", mi nombre es Violet Evergarden y te ayudaré en el manejo de archivos del lado del servidor"));
bot.help((ctx) => ctx.reply('Send me a sticker'))
bot.on('sticker', (ctx) => ctx.reply('👍'))
bot.hears('hi', (ctx) => ctx.reply('Hey there'))
bot.command('oldschool', (ctx) => ctx.reply('Hello'))
bot.command('hipster', Telegraf.reply('λ'))
bot.launch()
console.log("Iniciando Violet")

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))