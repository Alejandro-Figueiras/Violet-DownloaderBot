require('dotenv').config();

const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv)).argv

const { TelegramClient, Api } = require("telegram");
const { StringSession } = require("telegram/sessions");
const fs = require('fs');
const input = require("input"); // npm i input
const { getInputChannel } = require('telegram/Utils');
const path = require('path');

const apiId = parseInt((argv.apiid)?argv.apiid:process.env.API_ID);
const apiHash = (argv.apihash)?argv.apihash:process.env.API_HASH;
const stringSession = new StringSession((argv.session)?argv.session:process.env.API_TOKEN); // fill this later with the value from session.save()

// mega
const { Storage } = require('megajs')

let storage;

const upload = async(file) => {
  console.log("Uploading to MEGA:", path.basename(file));
  await storage.upload({
    name: path.basename(file),
    size: fs.statSync(file).size
  }, fs.createReadStream(file)).complete
  console.log('The file was uploaded!');
  return;
}

(async () => {
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
  console.log("You should now be connected. Save this token for the next time:");
  console.log(client.session.save()); // Save this string to avoid logging in again
  
  // app code functionality

  // mega login
  storage = await new Storage({
    email: process.env.MEGA_EMAIL,
    password: process.env.MEGA_PASSWORD
  }).ready

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
    console.log(`Downloading ${msg.media.document.attributes[0].fileName} (${msg.media.document.size/(1024*1024)}MB)`);

    const chunkSize = 1024*1024;
    const total = Math.ceil(msg.media.document.size / chunkSize)
    for (let i = 0; i < total; i++) {
      try {
        let result;
        if (argv.useDcId) {
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
        } else {
          result = await client.invoke(new Api.upload.GetFile({
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
        }


          if (i==0) {
            fs.writeFileSync(`${(argv.out)?argv.out:"./out/"}${msg.media.document.attributes[0].fileName}`, result.bytes);
          } else {
            fs.appendFileSync(`${(argv.out)?argv.out:"./out/"}${msg.media.document.attributes[0].fileName}`, result.bytes)
          }
          console.log(`Downloaded ${(i+1)/total*100}%`);
      } catch (e) {
        i--;
        console.error(e);
        continue;
      }
    }

    // upload
    await upload(`${(argv.out)?argv.out:"./out/"}${msg.media.document.attributes[0].fileName}`);
  }
  //end code 

})();