require('dotenv').config();
const { Telegraf } = require('telegraf')
const fs = require('fs');

const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv)).argv

console.log(argv.token | process.env.BOT_TOKEN);

const bot = new Telegraf((argv.token)?argv.token:process.env.BOT_TOKEN)
bot.start((ctx) => ctx.reply('Bienvenido ' + ctx.from.first_name + ", mi nombre es Violet y te ayudaré en el manejo de archivos del lado del servidor"));
bot.help((ctx) => ctx.reply('Send me a sticker'))
bot.on('sticker', (ctx) => ctx.reply('👍'))
bot.hears('hi', (ctx) => ctx.reply('Hey there'))
bot.command('oldschool', (ctx) => ctx.reply('Hello'))
bot.command('hipster', Telegraf.reply('λ'))

bot.command("id", async(ctx) => {
    let splitted = ctx.message.text.split(" ");
    let chatInfo = await ctx.telegram.getChat(`@${splitted[1]}`)
    //console.log(chatInfo);
    ctx.reply(chatInfo)
    ctx.reply(chatInfo.id)
    console.log(ctx.telegram);
})

bot.command("uploadOutFiles", async(ctx) => {
    const fatherPath = (argv.out)?argv.out:"./out/";
    let dir = fs.readdirSync(fatherPath);

    let salida = "Encontrados los siguientes archivos:";
    for (const file of dir) {
        salida += `\n${file}`;
    }
    ctx.reply(salida);
    ctx.reply("Comenzando la subida");
    for (const file of dir) {
        console.log(`Subiendo ${file}`);
        // subir
        await ctx.replyWithDocument({
            source: fatherPath+file
        });
        //eliminar
        fs.rmSync(fatherPath+file);
    }
})
bot.launch()
console.log("Iniciando Violet")

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))