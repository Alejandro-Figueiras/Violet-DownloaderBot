/*
apiid
apihash
session
channel
idstart
idend
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

const apiId = parseInt(argv.apiid | process.env.API_ID);
const apiHash = argv.apihash | process.env.API_HASH;
const stringSession = new StringSession(argv.session | process.env.API_TOKEN); // fill this later with the value from session.save()

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

  let ids = [];
  for (let k = argv.idstart; k <= argv.idend; k++) {
    ids.push(k);
  }

  const msgs = await client.invoke(new Api.channels.GetMessages({
    channel: inp,
    id: ids
  }));

  for (const msg of msgs.messages) {
    console.log(msg); 
    console.log(msg.media.document);

    const chunkSize = 1024*1024;
    const total = Math.ceil(msg.media.document.size / chunkSize)
    for (let i = 0; i < total; i++) {
      try {
        const result = await client.invoke(new Api.upload.GetFile({
          location: new Api.InputDocumentFileLocation({
            id: msg.media.document.id,
            accessHash: msg.media.document.accessHash,
            fileReference: msg.media.document.fileReference,
            thumbSize: ""+msg.media.document.thumbs[1].size
          }),
          offset: i*chunkSize,
          limit: chunkSize,
          precise: true,
          cdnSupported: true
        }));
          if (i==0) {
            fs.writeFileSync(`./out/${msg.media.document.attributes[0].fileName}`, result.bytes);
          } else {
            fs.appendFileSync(`./out/${msg.media.document.attributes[0].fileName}`, result.bytes)
          }
          console.log(`Downloaded ${(i+1)/total*100}%`);
      } catch (e) {
        i--;
        console.error(e);
        continue;
      }
    }
  }
  
  //end code 
  
    



})();