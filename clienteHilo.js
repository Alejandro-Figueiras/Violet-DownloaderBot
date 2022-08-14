/*
apiid
apihash
session
channel
id
offset
cant
*/


require('dotenv').config();

const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv)).argv

const { TelegramClient, Api } = require("telegram");
const { StringSession } = require("telegram/sessions");
const fs = require('fs');
const input = require("input"); // npm i input
const { getInputChannel } = require('telegram/Utils');

const prompt = require('prompt');

const apiId = parseInt((argv.apiid)?argv.apiid:process.env.API_ID);
const apiHash = (argv.apihash)?argv.apihash:process.env.API_HASH;
const stringSession = new StringSession((argv.session)?argv.session:process.env.API_TOKEN); // fill this later with the value from session.save()

(async () => {
  console.log("Loading interactive example...");
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
  console.log("You should now be connected.");
  console.log(client.session.save()); // Save this string to avoid logging in again
  
  // app code functionality

  const channel = await client.invoke(new Api.channels.GetFullChannel({
    channel: argv.channel
  }));

  let inp = await getInputChannel(channel.chats[0]);
  
  const msgs = await client.invoke(new Api.channels.GetMessages({
    channel: inp,
    id: [argv.id]
  }));

  let offset = argv.offset;
  let cantidad = argv.cant;

  for (const msg of msgs.messages) {
    const chunkSize = 1024*1024;
    const total = Math.ceil(msg.media.document.size / chunkSize)

    let results = [];
    console.log(`Descargando ${argv.id} offset=${argv.offset} cant=${argv.cant}`);
    for (let i = offset; i < offset+cantidad; i++) {
      try {
        //client.connect();
        results.push(await client.invoke(new Api.upload.GetFile({
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
        })));
        console.log(`Downloaded ${(i+1-offset)/(cantidad)*100}%`);
      } catch (e) {
        //i--;
        console.error(e);
        //continue;
        break;
      }
    }

    prompt.start();

    prompt.get(['Listo para continuar'], async function () {
      for (let i = 0; i < results.length; i++) {
        let s = await fs.appendFileSync(`./out/${msg.media.document.attributes[0].fileName}`, results[i].bytes)
        console.log(s);
      }
      console.log("Agregado");
      process.exit(0)
    });
  }
  
  //end code 
  
    



})();