import PoePuppet from "./src/poe-puppet";

/* async function main() {
    const puppet = new PoePuppet({
        headless: false,
        logLevel: 'debug',
        writingSpeed: 20,
    });
    await puppet.init();
    await puppet.clearContext();
    let response = await puppet.send('Hi, can you tell me about the module tsup?')
    console.log('response: ', response);
}
main(); */

export default PoePuppet;