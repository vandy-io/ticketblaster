const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

const messageOnEscape = "The availability was found, try your luck now!";
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
const executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const honkGUID = '<YOUR HONK GUID>';
const particularDate = "2025-01-11T00:00:00-08:00"

function findAvailabilityByHashid(data, targetHashid) {
  for (const [date, blocks] of Object.entries(data.data.publicParkingAvailability)) {
    if (date === particularDate) {
      for (const [key, block] of Object.entries(blocks)) {
        if (block.hashid === targetHashid) {
          return { date, availability: block.available };
        }
      }
    }
  }
  return null; // Return null if not found
}

// Function to fetch parking availability data using Puppeteer
async function fetchParkingAvailabilityWithBrowser() {
  const browser = await puppeteer.launch({ headless, args, executablePath });
  const page = await browser.newPage();
  await page.setUserAgent(userAgent);
  await page.setExtraHTTPHeaders(headers);

  try {
    await page.goto(`https://platform.honkmobile.com/graphql?honkGUID=${honkGUID}`, {
      waitUntil,
      timeout: navigationTimeout
    });

    const response = await page.evaluate(async () => {
      const honkId = 'YOUR HONK ID';
      const data = {
        operationName: 'PublicParkingAvailability',
        variables: {
          id: honkId,
          cartStartTime: '2025-01-09T09:00:00-08:00',
          startDay: 1,
          endDay: 59,
          year: 2025
        },
        query: `query PublicParkingAvailability($id: ID!, $cartStartTime: String!, $startDay: Int!, $endDay: Int!, $year: Int!) {
          publicParkingAvailability(
            id: $id
            cartStartTime: $cartStartTime
            startDay: $startDay
            endDay: $endDay
            year: $year
          )
        }`
      };

      const rawResponse = await fetch(`https://platform.honkmobile.com/graphql?honkGUID=${honkGUID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-authentication': 'LOOK IN THE DEBUG TOOLS ON A REQUEST AFTER USING THE CALENDAR PICKER'
        },
        body: JSON.stringify(data)
      });

      // Ensure body is only read once
      if (!rawResponse.ok) {
        throw new Error(`HTTP error! status: ${rawResponse.status}`);
      }

      return rawResponse.json(); // Parse the body only once
    });

    // Find the availability for a specific hashid  this value changes based on the parking lot and resort eg aqYVvHP
    const targetHashid = 'YOUR TARGET HASH ID';
    const availabilitySearch = findAvailabilityByHashid(response, targetHashid);

    return availabilitySearch;


    //console.log('Response data:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Error fetching parking availability with Puppeteer:', error);
  } finally {
    await browser.close();
  }
}

const parkingSearch = async () => {
  // Run the function
  while (true) {
    const availabilitySearch = await fetchParkingAvailabilityWithBrowser();
    if (availabilitySearch?.availability) {
      throw new Error(messageOnEscape);
    }
    console.log(`${JSON.stringify(availabilitySearch)} Sleeping for ${waitTime}ms before retrying...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
}

// look for parking availability
parkingSearch();

