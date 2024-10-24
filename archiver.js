// puppeteer-extra is a drop-in replacement for puppeteer,
// it augments the installed puppeteer with plugin functionality
const puppeteer = require('puppeteer-extra')
// require executablePath from puppeteer
const {executablePath} = require('puppeteer')
// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

const fs = require('fs');
const fsPromises = fs.promises;

const biri = process.argv[2];
if (!biri) {
  throw new Error("argüman olarak suser adı giriniz.")
}
const url = `https://eksisozluk.com/biri/${biri.replace(/\s/g, '-')}`
console.log(`${url} açılacak.`);

(async () => {
  const browser = await puppeteer.launch({
    devtools: false, // not needed so far, we can see websocket frames and xhr responses without that.
    defaultViewport: { //--window-size in args
      width: 1280,
      height: 882
    },
    args: [
      '--enable-webgl',
      '--mute-audio',
      '--no-first-run',
      '--disable-infobars',
      '--disable-breakpad',
      '--window-size=1280,1024', // see defaultViewport
      '--disable-setuid-sandbox'
    ],
    headless: false,
    executablePath: executablePath(),
  })
  const page = await browser.newPage()
  page.on('console', async (msg) => {
    const msgArgs = msg.args();
    for (let i = 0; i < msgArgs.length; ++i) {
      console.log("[Browser log]", await msgArgs[i].jsonValue());
    }
  })

  await page.goto(url)
  await page.waitForSelector("#user-profile-title")
  console.log("Sayfa yüklendi.")
  await new Promise(r => setTimeout(r, 500))
  console.log("Entryler yükleniyor...");
  const entryler = await page.evaluate(() => {
    async function yukle() {
      //buton gizli olmadikca yukle
      let elem = document.querySelector("a.load-more-entries")
      while(elem?.getAttribute("class")?.indexOf("hidden") == -1 ) {
        elem.click()
        await new Promise(r => setTimeout(r, 500))
        elem = document.querySelector("a.load-more-entries")
        console.log("Bir sonraki sayfa yükleniyor...");
      }
      console.log("Entryler yüklendi.");
      //get all entries in json object format
      return Array.from(document.querySelectorAll("div.topic-item")).map(function(elem, index, arr) {
        var title = elem.querySelector("#title").innerText
        var entry = elem.querySelector("#entry-item-list .content").innerText
        var tarih = elem.querySelector("#entry-item-list .entry-date").innerText
        var link = elem.querySelector("#entry-item-list .entry-date").href
        return {title, entry, tarih, link}
      })
    }

    return yukle()
  });

  console.log("Dosyaya yazılıyor.")
  await fsPromises.writeFile(`${biri}.json`, JSON.stringify(entryler, null, 2))

  await browser.close();
})();


