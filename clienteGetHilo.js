/*
apiid
apihash
session
channel
id
hilos
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

  for (const msg of msgs.messages) {
    console.log(msg); 
    console.log(msg.media.document);

    const chunkSize = 1024*1024;
    const total = Math.ceil(msg.media.document.size / chunkSize)

    const hilos = argv.hilos;
    
    if (hilos>total) {
      console.log("necesitas menos hilos");
    } else {
      let cant = Math.floor(total / hilos);
      let agregado = total - (cant * hilos);

      for (let i = 0; i < hilos; i++) {
        console.log(`node clienteHilo.js --channel="${argv.channel}" --id=${argv.id} --offset=${i*cant} --cant=${(i==(hilos-1))?(cant+agregado):cant}`)
      }
    }
    process.exit(0)
    
  }
  
  //end code 
  

})();