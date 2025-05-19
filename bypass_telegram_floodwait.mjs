/**
 * Trick to bypass Telegram FloodWait errors when resolving usernames and joining channels.
 * https://github.com/NabiKAZ/bypass-telegram-floodwait
 * https://x.com/NabiKAZ
 * https://t.me/BotSorati
 */

/**
 * Searches for a Telegram channel by username
 * @param {Object} telegramClient - The Telegram client instance
 * @param {string} channelName - The username of the channel to search for
 * @returns {Promise<Object|boolean>} - The found channel object or false if not found
 */
async function searchChannel(telegramClient, channelName) {
    try {
        console.log(`Searching for channel with exact name "${chalk.blueBright(channelName)}"...`);

        // Remove @ if present
        channelName = channelName.replace(/^@/, '');

        // Search for channel using contacts.Search
        const result = await telegramClient.invoke(
            new Api.contacts.Search({
                q: channelName,
                limit: 10, // Higher limit to ensure we find the exact match
            })
        );

        // Find exact match by username
        const channel = result.chats.find(chat =>
            chat.username && chat.username.toLowerCase() === channelName.toLowerCase()
        );

        // Return the first exact match or false
        if (channel) {
            console.log(`Found channel: "${chalk.blueBright(channelName)}"`);
            return channel;
        } else {
            console.log(`No exact match found for "${chalk.blueBright(channelName)}".`);
            return false;
        }

    } catch (error) {
        console.log(chalk.redBright(`Error searching for channel: ${error.message}`));
        return false;
    }
}

/**
 * Attempts to join a Telegram channel by name
 * @param {Object} telegramClient - The Telegram client instance
 * @param {string} channelName - The name of the channel to join
 * @returns {Promise<boolean>} - True if joined successfully, false otherwise
 * @async
 */
async function joinChannel(telegramClient, channelName) {
    try {
        // Log attempt to get channel entity
        console.log(`Getting entity for channel: "${chalk.blueBright(channelName)}"`);
        let inputChannel;
        try {
            // Try to get channel directly by name
            inputChannel = await telegramClient.getInputEntity(channelName);
        } catch (error1) {
            try {
                // Try fallback search method if direct lookup fails
                console.log(chalk.yellow(`⚠️ ${error1.message} , try to seach channel...`));
                inputChannel = await searchChannel(telegramClient, channelName);
            } catch (error2) {
                // Propagate error if search also fails
                throw Error(error2.message);
            }
        }

        if (inputChannel) {
            // Attempt to join the channel if entity was found
            console.log(`Joining Telegram channel: ${chalk.blueBright(channelName)}`);
            await telegramClient.invoke(
                new Api.channels.JoinChannel({
                    channel: inputChannel,
                })
            );
        } else {
            // Throw error if channel entity couldn't be found
            throw Error(`Could not find channel entity for "${chalk.blueBright(channelName)}".`);
        }

        // Log successful join operation
        console.log(chalk.greenBright(` ✓ Channel "${channelName}" joined successfully!`));

        return true;
    } catch (error) {
        // Handle and log any errors during the join process
        console.log(chalk.redBright(`Error joining channel: ${error.message}`));
        return false;
    }
}


/**
 * Example usage
 */

// Import necessary libraries
import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import chalk from 'chalk';

// Target channel name
const targetChannelName = 'BotSorati';

// Initialize Telegram client
const apiId = 123456;      // Get from my.telegram.org
const apiHash = 'your_api_hash';  // Get from my.telegram.org
const session = new StringSession('');  // Load or create session

// Create client
const client = new TelegramClient(session, apiId, apiHash, {
    connectionRetries: 5
});

// Connect to Telegram
await client.connect();

// Join the channel
const success = await joinChannel(client, targetChannelName);
console.log(`Join status: ${success ? chalk.greenBright('Success') : chalk.redBright('Failed')}`);

// Disconnect the client
await client.disconnect();
console.log('Client disconnected.');
