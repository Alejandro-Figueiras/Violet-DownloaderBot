const { TelegramClient, Api } = require("telegram");
const { StringSession } = require("telegram/sessions");
const fs = require('fs');
const input = require("input"); // npm i input
const { getInputChannel } = require('telegram/Utils');
const path = require('path');

const apiId = parseInt(process.env.API_ID);
const apiHash = process.env.API_HASH;
const stringSession = new StringSession(process.env.API_TOKEN); // fill this later with the value from session.save()

// mega
const { Storage } = require('megajs')

let storage;

const upload = async(file, ctx) => {
	storage = await new Storage({
		email: process.env.MEGA_EMAIL,
		password: process.env.MEGA_PASSWORD
	}).ready

    ctx.reply("Uploading to MEGA:", path.basename(file));
    await storage.upload({
        name: path.basename(file),
        size: fs.statSync(file).size
    }, fs.createReadStream(file)).complete
    ctx.reply('The file was uploaded!');
    return;
}

const startClient = async() => {
	const client = new TelegramClient(stringSession, apiId, apiHash, {
		connectionRetries: 30,
	});
	await client.start({
		phoneNumber: async () => await input.text("Please enter your number: "),
		password: async () => await input.text("Please enter your password: "),
		phoneCode: async () =>
			await input.text("Please enter the code you received: "),
		onError: (err) => console.log(err),
	});
	if (!process.env.API_TOKEN) {
		console.log("You should now be connected. Save this token for the next time:");
		console.log(client.session.save());
	} // Save this string to avoid logging in again
	return client;
}

const TG2Mega = async (ctx, canal, idstart, idend) => {
	const client = await startClient();
	// app code functionality

	const channel = await client.invoke(new Api.channels.GetFullChannel({
		channel: canal
	}));
	
	let inp = await getInputChannel(channel.chats[0]);

	let ids = [];
	for (let k = idstart; k <= idend; k++) {
		ids.push(k);
	}

	const msgs = await client.invoke(new Api.channels.GetMessages({
		channel: inp,
		id: ids
	}));

	for (const msg of msgs.messages) {
		ctx.reply(`Downloading ${msg.media.document.attributes[0].fileName} (${msg.media.document.size/(1024*1024)}MB)`);

		const chunkSize = 1024*1024;
		const total = Math.ceil(msg.media.document.size / chunkSize)
		let ultimoPorciento = 0;
		let error = false;
		for (let i = 0; i < total; i++) {
			try {
				let result;
				const sender = await client.getSender(msg.media.document.dcId);
				result = await sender.send(new Api.upload.GetFile({
					location: new Api.InputDocumentFileLocation({
						id: msg.media.document.id,
						accessHash: msg.media.document.accessHash,
						fileReference: msg.media.document.fileReference,
						thumbSize: ""
					}),
					offset: i*chunkSize,
					limit: chunkSize,
					precise: true,
					cdnSupported: true
				}));

				if (i==0) {
					fs.writeFileSync(`${(process.env.OUT_DIR)?process.env.OUT_DIR:"./out/"}${msg.media.document.attributes[0].fileName}`, result.bytes);
				} else {
					fs.appendFileSync(`${(process.env.OUT_DIR)?process.env.OUT_DIR:"./out/"}${msg.media.document.attributes[0].fileName}`, result.bytes)
				}

				let porciento = parseInt((i+1)/total*100);
				if (porciento != ultimoPorciento) {
					ultimoPorciento = porciento;
					let barra = "";
					for (let n = 0; n < (porciento/5)+0.01; n++) barra += "=";
					for (let n = porciento/5; n < 20; n++) barra += "-";
					ctx.reply(`Downloaded [${barra}] ${porciento}%`);
				}
				if (error) {
					ctx.reply(`Successfully downloaded i=${i}`);
					error = false;
				}
			} catch (e) {
				i--;
				ctx.reply(`ERROR FROM i=${i}`);
				error = true;
				ctx.reply(e)
				console.error(e);
				continue;
			}
		}

		// upload
		await upload(`${(process.env.OUT_DIR)?process.env.OUT_DIR:"./out/"}${msg.media.document.attributes[0].fileName}`, ctx);
	}
	//end code 
	return;
};

module.exports = TG2Mega;