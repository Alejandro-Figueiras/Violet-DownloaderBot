require('dotenv').config();
const { Telegraf } = require('telegraf')
const fs = require('fs');

const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers');
const download = require('download');
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

bot.on("document", async(ctx) => {
    let document = ctx.update.message.document;
    let nombre = ctx.update.message.document.file_name;
    let file = await ctx.telegram.getFileLink(document.file_id);
    
    let random = (Math.random()*1000*document.file_size / (1024 * 1024)).toString().replace('.', '');

    ctx.reply(`Downloading file: ${nombre} ${(document.file_size / (1024 * 1024)).toFixed(2)}MB`);
    await download(file, process.env.OUT_DIR+random);
    fs.renameSync(process.env.OUT_DIR+random+'/'+file.href.split("/").pop().replace(file.search, ''), process.env.OUT_DIR+nombre);
    fs.rmdirSync(process.env.OUT_DIR+random);
    ctx.reply(`Downloaded file: ${document.file_name} ${(document.file_size / (1024 * 1024)).toFixed(2)}MB`);
})

bot.launch()
console.log("Iniciando Violet")

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))