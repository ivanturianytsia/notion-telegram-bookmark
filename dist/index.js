"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const telegraf_1 = require("telegraf");
const client_1 = require("@notionhq/client");
const BOOK_DATABASE_ID = 'c50dd28e9a3a420b991261359efc205d';
const READING_SESSIONS_DATABASE_ID = '9339fc34a20d401881f43a33570936f5';
if (!process.env.BOT_TOKEN || !process.env.NOTION_TOKEN) {
    throw new Error('BOT_TOKEN or NOTION_TOKEN not set');
}
const bot = new telegraf_1.Telegraf(process.env.BOT_TOKEN);
const notion = new client_1.Client({
    auth: process.env.NOTION_TOKEN,
});
bot.on('text', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pageNumber = parseInt(ctx.message.text);
        if (!isNaN(pageNumber)) {
            const currentBooks = yield getCurrentBooks();
            if (currentBooks.results.length > 0) {
                const book = currentBooks.results[0];
                yield createBookmark(book, pageNumber);
                const progress = getProgress(book, pageNumber);
                ctx.telegram.sendMessage(ctx.message.chat.id, `Bookmarking page ${pageNumber} of ${getBookTitle(book)}.${progress ? `\nYou are at ${progress}%` : ''}`);
            }
            else {
                ctx.telegram.sendMessage(ctx.message.chat.id, 'You currently have no books in progress. Log into notion.so and mark a book as \'In Progress\'.');
            }
        }
        else {
            ctx.telegram.sendMessage(ctx.message.chat.id, 'Please specify a page number.');
        }
    }
    catch (err) {
        console.error(err);
    }
}));
if (process.env.WEBHOOK_HOST && process.env.PORT) {
    bot.launch({
        webhook: {
            host: process.env.WEBHOOK_HOST,
            port: parseInt(process.env.PORT),
        }
    });
}
else {
    bot.launch();
}
function getCurrentBooks() {
    return notion.databases.query({
        database_id: BOOK_DATABASE_ID,
        filter: {
            property: 'Status',
            select: {
                equals: 'In Progress',
            },
        },
    });
}
function getBookTitle(book) {
    return book.properties.Name.type === 'title'
        ? `"${getPlainText(book.properties.Name.title)}"`
        : 'the current book';
}
function getPlainText(richText) {
    return richText.map(clause => clause.plain_text).join();
}
function createBookmark(book, pageNumber) {
    return notion.pages.create({
        parent: {
            database_id: READING_SESSIONS_DATABASE_ID,
        },
        properties: {
            Name: {
                type: 'title',
                title: [
                    {
                        type: 'text',
                        text: {
                            content: '',
                        }
                    },
                ],
            },
            'Date': {
                type: 'date',
                date: {
                    start: (new Date()).toISOString()
                }
            },
            'End Page': {
                type: 'number',
                number: pageNumber,
            },
            'Book': {
                type: 'relation',
                relation: [{
                        id: book.id,
                    }],
            },
        },
    });
}
function getProgress(book, pageNumber) {
    const pageTotal = getBookPageTotal(book);
    return pageTotal ? Math.ceil(pageNumber * 100 / pageTotal) : null;
}
function getBookPageTotal(book) {
    return book.properties.Pages.type === 'number'
        ? book.properties.Pages.number
        : 0;
}
