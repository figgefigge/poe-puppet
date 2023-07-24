// src/camelPoe.ts
import puppeteer, { Browser, Page, ElementHandle } from 'puppeteer-core';
const { spawn } = require('child_process');
import path from 'path';
import { spawnSync } from 'child_process';
import logger from './logger';
import { log } from 'winston';

interface PuppetPoeOptions {
  headless?: boolean;
  writingSpeed?: number;
  delayFactor?: number;
  userDataDir?: string;
  browserPath?: string;
  availibleChatbots?: string[];
  chatbot?: string;
  logLevel?: string;
}

class PoePuppet {
  // Properties
  public browser: Browser | null;
  public page: Page | undefined;
  public isLoggedIn: boolean;
  public chatbot: string;
  public availibleChatbots: string[];
  public headless: boolean;
  public writingSpeed: number;
  public delayFactor: number;
  public userDataDir: string;
  public browserPath: string;
  public logLevel: string;

  constructor(options: PuppetPoeOptions = {}) {
    const {
      headless = true,
      writingSpeed = 10,
      delayFactor = 1000,
      userDataDir = path.join(__dirname, './userDataDir'),
      browserPath = 'C:/Program Files/Google/Chrome/Application/chrome.exe',
      availibleChatbots = [],
      chatbot = 'Assistant',
      logLevel = 'info',
    } = options;

    this.browser = null;
    this.browserPath = browserPath;
    this.page = undefined;
    this.isLoggedIn = false;
    this.chatbot = chatbot;
    this.availibleChatbots = availibleChatbots;
    this.headless = headless;
    this.writingSpeed = writingSpeed;
    this.delayFactor = delayFactor;
    this.userDataDir = userDataDir;
    this.logLevel = logLevel;
    logger.level = this.logLevel;
  }

  async init(): Promise<void> {
    try {
      // start browser and go to poe.com
      this.browser = await this.startBrowser();
      const pages = await this.browser.pages();

      if (!pages[0]) {
        throw new Error('No browser pages found by puppeteer');
      }

      this.page = pages[0];

      logger.debug('Navigating to poe.com');
      await this.page.goto('https://poe.com');

      // Wait for the page to load
      logger.debug('Waiting for page to load');

      // Check if the user is logged in by checking if the page was redirected to the login page
      if (this.page.url().includes('https://poe.com/login')) {
        logger.info('Not logged in to Poe.com, closing browser controlled by puppeteer and opening a normal browser for user to sign in.');
        this.isLoggedIn = false;

        // Open a new browser not controlled by puppeteer and not headless for the user to log in
        this.browser.close();
        const additionalArguments = [
          `--user-data-dir=${path.join(__dirname, this.userDataDir)}`,
          'https://poe.com', // For example, opening Chrome in maximized window
        ];
        logger.info('Please log in manually in the new browser. Close the browser when you are signed in to continue.');
        logger.debug('Starting browser with arguments: ', additionalArguments);
        const childProcess = spawnSync(this.browserPath, additionalArguments);
        logger.debug('Browser closed, restarting init method');
        this.init();
        return;

      } else {
        this.isLoggedIn = true;
        logger.info('User is signed in to Poe.com');
      }

      // fetch available chatbots
      this.availibleChatbots = await this.fetchChatbots();
      // select default this.chatbot
      await this.selectChatbot(this.chatbot);
      logger.info('Init method finished. Ready to interact with Poe.com');

    } catch (err) {
      logger.error(err);
    }
  }

  async startBrowser(): Promise<Browser> {
    logger.debug(`Starting browser ${this.browserPath} with userDataDir: ${this.userDataDir}`);
    const browser = await puppeteer.launch({
      headless: this.headless,
      userDataDir: path.join(this.userDataDir),
      executablePath: this.browserPath,
      defaultViewport: null,
      devtools: true,
    });
    return browser
  }

  async send(message: string): Promise<string> {
    try {
      if (!this.page) { throw new Error('Could not find browser page, forgot to init()?'); };
      logger.debug('Sending message: %s', message);
      // Enter the message into the textarea
      const selector = 'textarea[class^="GrowingTextArea"]';
      const textareaElement = await this.page.$(selector);
      if (!textareaElement) { throw new Error('No textarea found.'); };

      await textareaElement.type(message, { delay: this.writingSpeed })

      // Click on the send button
      const sendButtonSelector = 'button[class*="sendButton"]';
      const sendButtonElement = await this.page.$(sendButtonSelector);
      if (!sendButtonElement) { throw new Error('Could not find send button'); };
      sendButtonElement.click();

      // Wait for response by first waiting for the stop button to appear and then disappear
      logger.debug('Waiting for stop button to appear and disappear to know when the bot is done.');
      const stopButtonSelector = 'button[class*=ChatStopMessageButton]';
      await this.page.waitForSelector(stopButtonSelector);
      logger.debug('Found stop button.');
      await this.page.waitForSelector(stopButtonSelector, { hidden: true });
      logger.debug('Stop button disappeared.');

      const lastMessage = await this.getMessages(1)
      return lastMessage.toString();

    } catch (err) {
      logger.error(err);
      return 'Error';
    }
  }

  async getMessages(qty: number = 1): Promise<string[]> {
    if (!this.page) { throw new Error('Could not find browser page, forgot to init()?'); };

    // Finding all divs with class "Message_row*", grabbing text content of all p elements inside each, and returning an array of messages
    logger.debug('Fetching %s messages.', qty);
    const messages = await this.page.evaluate(() => {
      const messageRows = document.querySelectorAll('[class^="Message_row"]');
      const messagesArray: string[] = [];
  
      messageRows.forEach((row) => {
        if (!row.textContent) return;
        const textContent = row.textContent.trim();
        messagesArray.push(textContent);
      });
  
      return messagesArray;
    });

    logger.debug('Found messages: %s', messages.length);
    return qty > messages.length ? messages : messages.slice(-qty);
  }

  async clearContext(): Promise<void> {
    if (!this.page) { throw new Error('Could not find browser page, forgot to init()?'); };
    // find and click on the clear button
    const clearButtonSelector = 'button[class*="ChatBreakButton"]';
    const clearButton = await this.page.$(clearButtonSelector);
    if (!clearButton) throw new Error('No send button found.');
    await clearButton.click();
  }

  // Function to fetch available chatbots from the page
  async fetchChatbots(): Promise<string[]> {
    if (!this.page) { let err = new Error('Could not find browser page, forgot to init()?'); logger.error(err); throw err };

    logger.debug('Fetching available chatbots...');
    // Fetch available chatbots from div elements with class="BotHeader_title" on the page
    const botSelector = 'div[class*="BotHeader_title"]';
    const botDivs = await this.page.$$(botSelector);
    const botsArray = await Promise.all(
      botDivs.map(async el => {
        const paragraphElement = await el.$('p');
        return paragraphElement ? paragraphElement.evaluate(node => node.textContent || '') : '';
      })
    );
    logger.debug('Found chatbots: %s', botsArray);
    // Return an array of chatbot names
    return botsArray;
  }

  // Function to change chatbot
  async selectChatbot(chatbotName: string): Promise<void> {
    if (!this.page) { throw new Error('Could not find browser page, forgot to init()?'); };

    // Implement the logic to click on the chatbot element based on its name
    const botSelector = `//div[contains(@class, "BotHeader_title") and descendant::p[text()="${chatbotName}"]]`;
    const botElements = await this.page.$x(botSelector);

    if (botElements.length === 0) {
      let err = new Error(`Could not find chatbot: "${chatbotName}".`); logger.error(err); throw err;
    }

    const botElementHandle: ElementHandle<Element> = botElements[0] as ElementHandle<Element>;

    this.chatbot = chatbotName;
    await botElementHandle.click();

    // wait for page to load
    await this.page.waitForNavigation({ waitUntil: 'networkidle0' });

    logger.debug('Chatbot changed to: %s', chatbotName);
  }

  // Function to close browser
  async close(): Promise<void> {
    // close browser
    if (this.browser) {
      await this.browser.close();
    } else {
      throw new Error('Could not find browser to close.');
    }
  }
}

export default PoePuppet;
