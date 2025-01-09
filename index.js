const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const escapement = false;
const keyWordToLookFor = "Sorry";
const messageOnEscape = "The keyword was found, try your luck now!";
const waitUntil = "networkidle2";
const waitTime = 3000;
const navigationTimeout = 120000;
const headless = true;
const args = ["--no-sandbox"];
const userAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";
const headers = {
    "Accept-Language": "en-US,en;q=0.9",
    Referer: "https://google.com/",
};
let content = null;
let browser = null;

const attemptToRenderPage = async (url) => {
    try {
        console.log(`Attempt to Render page: ${url}`);
        puppeteer.use(StealthPlugin());
        // Launch a new browser with puppeteer and stealth mode using a headless browser and no sandbox
        browser = await puppeteer.launch({ 
            headless, 
            args, 
            executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' // Specify the path to your Chrome executable on Mac
        });
        // Create a new page
        const page = await browser.newPage();
        // Set user agent
        await page.setUserAgent(userAgent);
        // Set extra headers
        await page.setExtraHTTPHeaders(headers);
        // Set the default navigation timeout to 60 seconds
        page.setDefaultNavigationTimeout(navigationTimeout);
        // Navigate to the page
        await page.goto(url, { waitUntil: [waitUntil] });
        // Wait for the page to load
        const content = await page.content(); // Get page content
        // Close the browser
        return content;
    } catch (error) {
        console.log(`Error rendering the page: ${error.message}`);
        throw error;
    } finally {
        await browser.close();
    }
};

const ticketblaster = async (context, req) => {
    console.log('ticketblaster started');   
    // URL to render, can be dynamic based on input
    const url = req.query.url || req.body?.url;

    if (!url) {
        context.res = {
            status: 400,
            body: "Please pass a URL on the query string or in the request body",
        };
        return;
    }

    try {
        while (escapement === false) {
            content = await attemptToRenderPage(url);
            if (content.indexOf(keyWordToLookFor) === -1) {
                throw new Error(messageOnEscape);
            }
            //sleep for some time before retrying
            console.log(`Sleeping for ${waitTime}ms before retrying...`);
            await new Promise((r) => setTimeout(r, waitTime));
            await browser.close();
        }

        context.res = {
            status: 200 /* Defaults to 200 */,
            body: content,
            headers: {
                "Content-Type": "text/html",
            },
        };
    } catch (error) {
        context.res = {
            status: 500,
            body: `Error rendering the page: ${error.message}`,
        };
    } finally {
        await browser.close();
    }
};

const url = 'https://www.campspot.com/book/trianglervparknorth/site/29005/2025-01-14/2025-02-14/guests2,1,0?campsiteCategory=RV%20Sites&location=533171';

// this program is not to be used for any malicious purposes, it is just a proof of concept and for educational purposes to show how to use puppeteer with recurring requests to render a page and check for a keyword.
ticketblaster({}, { query: { url } });