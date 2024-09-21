const puppeteer = require('puppeteer')
const fs = require('fs')
const ObjectsToCSV = require('objects-to-csv')

async function run(searchQuery) {
    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: false
    })
    const page = await browser.newPage()
    await page.goto("https://www.ebay.com/", {
        waitUntil: "domcontentloaded"
    })

    await page.type('#gh-ac', searchQuery)
    await page.click('#gh-btn');
    await page.waitForNavigation();


    let items = []

    try {
        const page1_items = await extractItemsPerPage(page, 1)
        items = items.concat(page1_items)
    } catch (e) {
        console.error("error extracting data page:", 1)
    }

    try {
        const page2_items = await extractItemsPerPage(page, 2)
        items = items.concat(page2_items)
    } catch (e) {
        console.error("error extracting data page:", 2)
    }

    try {
        const page3_items = await extractItemsPerPage(page, 3)
        items = items.concat(page3_items)
    } catch (e) {
        console.error("error extracting data page:", 3)
    }
    console.log(items)
    await saveToCSV(items)

    await browser.close()
}
async function extractItemsPerPage(page, pageNumber) {
    let currentUrl = page.url();

    let newUrl = new URL(currentUrl);

    newUrl.searchParams.set('_ipg', '240');
    newUrl.searchParams.set('_pgn', pageNumber);

    await page.goto(newUrl.toString(), {
        waitUntil: "domcontentloaded"
    })

    const items = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.s-item')).map(item => ({
            title: item.querySelector('.s-item__title')?.innerText,
            price: item.querySelector('.s-item__price')?.innerText,
            link: item.querySelector('.s-item__link')?.href,
            image: item.querySelector('img')?.src,
            status: item.querySelector('span.SECONDARY_INFO')?.innerText,
            location: item.querySelector('.s-item__itemLocation')?.innerText.slice(5),
            shippingPrice: item.querySelector('.s-item__shipping')?.innerText
        }));
    });
    return items
}
async function saveToCSV(items) {
    const csv = new ObjectsToCSV(items);
    await csv.toDisk('./data.csv', {
        allColumns: true
    });
}
run("Nike Air Jordan")


