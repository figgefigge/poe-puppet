
# Camel Poe

Camel Poe is a TypeScript-based module designed to interact with the Poe AI chatbot. Since GraphQL based alternatives broke every so often and I wanted a node based solution I decided to create this module. I hope it wont break as easily as this uses a normal browser to interact with the chatbot. It uses puppeteer-core to control a headless browser and simulate user interactions with the Poe chatbot. It also uses a logger for detailed logging of operations and errors.

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

You can install these dependencies using npm:

```bash
npm install puppeteer-core path child_process winston
```

or yarn:

```bash
yard add puppeteer-core path child_process winston
```

## Usage

First, import the `camelPoe` class from the module:

```javascript
import camelPoe from './camelPoe';
```

The `camelPoe` class takes an optional configuration object as a parameter in its constructor. The configuration options are:

```typescript
interface CamelPoeOptions {
  headless?: boolean;       // run the browser in headless mode, default is true
  writingSpeed?: number;    // time in ms between each character for simulating typing, default is 10
  delayFactor?: number;     // not implemented yet
  userDataDir?: string;     // path to the user data directory for browser to save cookies and other data, default is './userDataDir'
  browserPath?: string;     // path to the browser executable, default is chrome standard installation path for windows
  chatbot?: string;         // name of the chatbot to use, default is 'Assistant'
  logLevel?: string;        // log level, default is 'info'
}
```

You can then create a new instance of the `camelPoe` class with optional configuration:

```javascript
const myChatbot = new camelPoe({ /* options */ });
```

It's also possible to change options after creating an instance:

```javascript
myChatbot.chatBot = 'ChatGPT';
```

After creating an instance of the `camelPoe` class, use `camelPoe.init()` to initialize the browser and start a new session.
If it's your first time using the module a normal browser will open for you to log in to your poe account. When you are logged in a cookie is stored in `userDataDir` and you wont have to log in again for a while. After logging in, close the browser and the initialization will continue.

To send a message to the chatbot, use `camelPoe.send(message: string)` wich returns a promise with the response from the chatbot.

```javascript
const response = await myChatbot.send('Hello, Poe!');
console.log(response); // Hello, human!
```

To fetch messages in conversation use `camelPoe.getMessages(quantity: number)` wich returns a promise with an array of the latest specified number of messages in the conversation. If no number is specified only the latest message will return. Its possible to specify a large number to get all availible messages. The messages can still be fetched after clearing the context as they are still visible on the page.

```javascript
const messages = await myChatbot.getMessages(1); // last two messages
console.log(messages); // ['Hello, Poe!', 'Hello, human!']
```

To clear the context use `camelPoe.clearContext()` wich returns a promise.

```javascript
await myChatbot.clearContext(); // Will wait until context is cleared
myChatbot.clearContext(); // Will continue without waiting and clear the context in the background
```

## Example

```javascript
import camelPoe from './camelPoe';

async function main() {
  try {
    const myChatbot = new camelPoe({
      headless: false,
      writingSpeed: 10,
      browserPath: 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
      logLevel: 'debug'
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
    await myChatbot.close();

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

- [ ] Add tests
- [ ] Add more documentation
- [ ] Add more examples
- [ ] Implement feature to use webb version of chatGPT, should be pretty similar.

## License

[MIT ↗](https://choosealicense.com/licenses/mit/)
