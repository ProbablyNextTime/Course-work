const TelegramBot = require('node-telegram-bot-api');
const user = require('./models/user');
const event = require('./models/event');

// replace the value below with the Telegram token you receive from @BotFather
const token = '885391252:AAGvMLDuOXELn7kKjSb1RI48QW4idPgGw4A';

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/RazmerChlena/, async (msg, match) => {
    const chatId = msg.chat.id;
    try {
        let fetchedUser = await user.findUserByTlegramLogin(msg.from.username);
        if (fetchedUser) {
            const resp = Math.ceil(Math.random() * 32);
            if (fetchedUser.telegramChatId)
                bot.sendMessage(tee, resp);
            else {
                fetchedUser.telegramChatId = chatId;
                let updUser = await user.update(fetchedUser);
            }
            bot.sendMessage(chatId, resp);
        } else {
            bot.sendMessage(chatId, "Enemy spy detected!!! Ruslan ne proidet!!!");
        }
    } catch (err) {
        console.log(err);
    }
});

bot.onText(/\/hello/, (msg, match) => {
    const chatId = msg.chat.id;
    const resp = "Hello, is anybody else there?";
    bot.sendMessage(chatId, resp);
});

bot.onText(/\/events/, async (msg, match) => {
    const chatId = msg.chat.id;
    try {
        let fetchedUser = await user.findUserByTlegramLogin(msg.from.username);
        if (fetchedUser) {
            if (fetchedUser.events.length == 0)
                bot.sendMessage(chatId, "You don`t have any events, please add some on our website!");
            else {

                let events = "\n";
                for (let i = 0; i < fetchedUser.events.length; i++) {
                    events += (`${i + 1} : ` + fetchedUser.events[i].name + "\n");
                }
                const htmlEvents = `
                <strong>Your events : </strong>
                <pre>   
                ${events}
                </pre>
                `
                bot.sendMessage(chatId, htmlEvents, {
                    parse_mode: 'HTML'
                });
            }
        } else {
            bot.sendMessage(chatId, "Enemy spy detected!!! Ruslan ne proidet!!!");
        }
    } catch (err) {
        console.log(err);
    }
});

bot.onText(/\/help/, async (msg, match) => {
    const chatId = msg.chat.id;
    try {
        let fetchedUser = await user.findUserByTlegramLogin(msg.from.username);
        if (fetchedUser) {
            bot.sendMessage(chatId, "To start using bot just edit your telegram username in your profile");
        } else {
            bot.sendMessage(chatId, "Enemy spy detected!!! Ruslan ne proidet!!!");
        }
    } catch (err) {
        console.log(err);
    }
});

bot.onText(/\/start/, async (msg, match) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Hello my young user, to start enjoying your life just edit your profile, kk w8!");
});

module.exports = bot;