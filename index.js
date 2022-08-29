require('dotenv').config();

// NODE MODULES
const { Telegraf } = require('telegraf')
const fs = require('fs');
const path = require('path');
const download = require('download');
const { Storage } = require("megajs")

// YARGS
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers');
const TG2Mega = require('./clienteTG2Mega');
const argv = yargs(hideBin(process.argv)).argv

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

    ctx.reply(`Downloading file: \`${nombre}\` ${(document.file_size / (1024 * 1024)).toFixed(2)}MB`, {parse_mode: "Markdown"});
    await download(file, process.env.OUT_DIR+random);
    fs.renameSync(process.env.OUT_DIR+random+'/'+file.href.split("/").pop().replace(file.search, ''), process.env.OUT_DIR+nombre);
    fs.rmdirSync(process.env.OUT_DIR+random);
    ctx.reply(`Downloaded file: \`${document.file_name}\` ${(document.file_size / (1024 * 1024)).toFixed(2)}MB`, {parse_mode: "Markdown"});
})

bot.command("download", async(ctx) => {
    let link = "";
    const chunks = ctx.message.text.split(" ");
    chunks.shift();
    for (let i = 0; i < chunks.length; i++) {
        link += `${chunks[i]}${(i!=chunks.length-1)?" ":""}`;
    }

    ctx.reply(`Downloading file`, {parse_mode: "Markdown"});
    await download(link, process.env.OUT_DIR);
    ctx.reply(`Downloaded file`, {parse_mode: "Markdown"});
})

const megaLogin = async() => {
    return await new Storage({
        email: process.env.MEGA_EMAIL,
        password: process.env.MEGA_PASSWORD
    }).ready
}

const uploadToMega = async(storage, file, ctx) => {
    ctx.reply(`Uploading to MEGA: \`${path.basename(file)}\``, {parse_mode: "Markdown"});
    await storage.upload({
        name: path.basename(file),
        size: fs.statSync(file).size
    }, fs.createReadStream(file)).complete
    ctx.reply('The file was uploaded!');
    return;
}

const uploadMega = async(ctx, deleteFile) => {
    // MEGA LOGIN
    const storage = await megaLogin();

    // UPLOAD FILE
    let fileName = "";
    const chunks = ctx.message.text.split(" ");
    chunks.shift();
    for (let i = 0; i < chunks.length; i++) {
        fileName += `${chunks[i]}${(i!=chunks.length-1)?" ":""}`;
    }

    let file = process.env.OUT_DIR + fileName;
    if (fs.existsSync(file) && fs.statSync(file).isFile()) {
        await uploadToMega(storage, file, ctx)
        if (deleteFile) fs.rmSync(file);
    } else {
        ctx.reply("undefined file");
    }
}

const uploadMegaAll = async(ctx, deleteFile) => {
    // MEGA LOGIN
    const storage = await megaLogin();
    
    // UPLOADING FILES
    let dir = fs.readdirSync(process.env.OUT_DIR);
    for (const element of dir) {
        let file = process.env.OUT_DIR + element;
        await uploadToMega(storage, file, ctx)
        if (deleteFile) fs.rmSync(file);
    }
}

bot.command("tg2mega", async(ctx) => {
    const chunks = ctx.message.text.split(" ");
    const channel = chunks[1];
    const idstart = parseInt(chunks[2]);
    const idend = parseInt(chunks[3]);
    console.log(channel, idstart, idend);
    TG2Mega(ctx, channel, idstart, idend);
});


bot.command("uploadMega", async(ctx) => await uploadMega(ctx, false));
bot.command("uploadMegaDelete", async(ctx) => await uploadMega(ctx, true));
bot.command("uploadMegaAll", async(ctx) => await uploadMegaAll(ctx, false));
bot.command("uploadMegaAllDelete", async(ctx) => await uploadMegaAll(ctx, true));

bot.hears("ls", async(ctx) => {
    let dir = fs.readdirSync(process.env.OUT_DIR);
    let message = `The output folder has the following files:`;
    for (const file of dir) {
        message += `\n\`${file}\` (${(fs.statSync(process.env.OUT_DIR+file).size / (1024 * 1024)).toFixed(2)}MB)`;
    }
    ctx.reply(message, {parse_mode: "Markdown"})
})

bot.launch()
console.log("Iniciando Violet")

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

// para heroku
const express = require('express')
const PORT = process.env.PORT || 5000
const app = express()

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(PORT, () => {
    console.log(`Violet listening ${PORT}`)
})