const puppeteer = require('puppeteer');
const fs = require('fs');
const fsPromises = fs.promises;

const biri = process.argv[2];
if (!biri) {
  throw new Error("argüman olarak suser adı giriniz.")
}
const url = `https://eksisozluk.com/biri/${biri.replace(/\s/g, '-')}`
console.log(`${url} açılacak.`);

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(url);
  console.log("Sayfa yüklendi.")
  console.log("Entryler yükleniyor...");
  const entryler = await page.evaluate(() => {
    async function yukle() {
      //buton gizli olmadikca yukle
      var elem = $("a.load-more-entries")[0]
      while($("a.load-more-entries")[0].getAttribute("class").indexOf("hidden") == -1 ) {
        elem.click()
        await new Promise(r => setTimeout(r, 500)); 
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


