import { MongoClient } from "mongodb";

const MONGODB_URL: string = process.env["MONGODB_URL"] || "mongodb+srv://elad-dev:g3gOG7qCRsjzMxcV@cluster0.krgikeg.mongodb.net/test?retryWrites=true&w=majority";
const MONGODB_NAME: string = process.env["MONGODB_NAME"] || "test";

export let dbInstance = undefined;

export const getDbInstance = async function() {
    if (!dbInstance) {
        MongoClient.connect(MONGODB_URL, function (err, db) {
            if (err) throw err;
            dbInstance = db.db(MONGODB_NAME);
        });
    }
    return dbInstance;
};
