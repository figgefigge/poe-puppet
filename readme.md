
# Poe Puppet

Puppet Poe is a TypeScript-based module designed to interact with the Poe AI chatbot. Since GraphQL based alternatives broke every so often and I wanted a node based solution I decided to create this module. I hope it wont break as easily as this uses a normal browser to interact with the chatbot. It uses puppeteer-core to control a headless browser and simulate user interactions with the Poe chatbot. It also uses a logger for detailed logging of operations and errors.

This module is not affiliated with Poe in any way.

## Features

- Interact with the Poe chatbot trough a headless browser.
- Send and receive messages.
- Fetch available chatbots.
- Select chatbot during the session.
- Clear the chat context.
- Close the browser.

## Installation

This module requires the following dependencies:

- `puppeteer-core`
- `path`
- `child_process`
- `winston`

For building the module you also need:

- `typescript`
- `tsup`

Build with npm run build or yarn build.

You can install these dependencies using npm:

```bash
npm install puppeteer-core path child_process winston
npm install --save-dev typescript tsup
```

or yarn:

```bash
yarn add puppeteer-core path child_process winston
yarn add --dev typescript tsup
```

## Usage

First, import the `PoePuppet` class from the module:

```javascript
import camelPoe from './poe-puppet';
```

The `PoePuppet` class takes an optional configuration object as a parameter in its constructor. The configuration options are:

```typescript
interface PoePuppetOptions {
  headless?: boolean;       // run the browser in headless mode, default is true
  writingSpeed?: number;    // time in ms between each character for simulating typing, default is 10
  delayFactor?: number;     // not implemented yet
  userDataDir?: string;     // path to the user data directory for browser to save cookies and other data, default is './userDataDir'
  browserPath?: string;     // path to the browser executable, default is chrome standard installation path for windows
  chatbot?: string;         // name of the chatbot to use, default is 'Assistant'
  logLevel?: string;        // log level, default is 'info'
}
```

You can then create a new instance of the `PoePuppet` class with optional configuration:

```javascript
const myChatbot = new PoePuppet({ /* options */ });
```

It's also possible to change options after creating an instance:

```javascript
myChatbot.chatBot = 'ChatGPT';
```

After creating an instance of the `PoePuppet` class, use `PoePuppet.init()` to initialize the browser and start a new session.
If it's your first time using the module a normal browser will open for you to log in to your poe account. When you are logged in a cookie is stored in `userDataDir` and you wont have to log in again for a while. After logging in, close the browser and the initialization will continue.

To send a message to the chatbot, use `PoePuppet.send(message: string)` wich returns a promise with the response from the chatbot.

```javascript
const response = await myChatbot.send('Hello, Poe!');
console.log(response); // Hello, human!
```

To fetch messages in conversation use `PoePuppet.getMessages(quantity: number)` wich returns a promise with an array of the latest specified number of messages in the conversation. If no number is specified only the latest message will return. Its possible to specify a large number to get all availible messages. The messages can still be fetched after clearing the context as they are still visible on the page.

```javascript
const messages = await myChatbot.getMessages(1); // last two messages
console.log(messages); // ['Hello, Poe!', 'Hello, human!']
```

To clear the context use `PoePuppet.clearContext()` wich returns a promise.

```javascript
await myChatbot.clearContext(); // Will wait until context is cleared
```

## Example

```javascript
import PoePuppet from './PoePuppet';

async function main() {
  try {
    const myChatbot = new PoePuppet({
      headless: false,
      writingSpeed: 10,
      browserPath: 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
      logLevel: 'debug'
      chatBot: 'Assistant'
    });

    // Change default chatbot to ChatGPT
    myChatbot.chatBot = 'ChatGPT';

    await myChatbot.init();

    // After init() you can see availible chatbots and other properties
    console.log('Availible chatbots: ', myChatbot.availibleChatbots); // Available chatbots: ['Assistant', 'Claude-2-100k', ...]

    // Change chatbot to assistant after init()
    myChatbot.selectChatBot('Assistant'); // or use myChatbot.selectChatBot(myChatbot.availibleChatbots[0]);

    // Clear context in chat (will not clear messages, only make the chatbot forget the conversation)
    await myChatbot.clearContext();

    // Send message and log response
    const response = await myChatbot.send('What is the meaning of life?');
    console.log(response);

    // Fetch 10 latest messages
    const messages = await myChatbot.getMessages(10);

    // Close browser when finished
    await myChatbot.close();

  } 
  catch (error) {
    console.error(error);
  }
}

main();
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## TODO

- [ ] Documentation for all properties and methods
- [ ] Add tests
- [ ] Add better examples
- [ ] Implement feature to use webb version of chatGPT, should be pretty similar.
- [ ] Proxy support would be nice

## License

[MIT ↗](https://choosealicense.com/licenses/mit/)
