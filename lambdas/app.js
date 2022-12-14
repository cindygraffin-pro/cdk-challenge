const AWS = require('aws-sdk')

const dynamo = new AWS.DynamoDB.DocumentClient();
const MY_TABLE = process.env.MY_TABLE

const sendRes = (status, body) => {
    const response = {
        statusCode: status,
        headers: {
            'Content-Type': 'application/json'
        },
        body
    }
    return response;
}

const listQuotes = async () => {
    const params = {
        TableName: MY_TABLE
    };
    return dynamo
                .scan(params)
                .promise()
                .then((data) => {
                    return data.Items
                })
}

const saveQuote = async (data) => {
    const date = new Date();
    const time = date.getTime();

    const quote = {
        id: time.toString(),
        quote: data.quote,
        author: data.author
    }

    const params = {
        TableName: MY_TABLE,
        Item: quote
    }

    return await dynamo
                .put(params)
                .promise()
                .then(() => {
                    return quote;
                })
}

exports.handler = async (event, context) => {
    console.log('Event:::', event);
    const path = event.resource;
    const httpMethod = event.httpMethod;
    const route = httpMethod.concat(' ').concat(path); // ex: GET todos/

    const data = JSON.parse(event.body);

    let body;

    let statusCode =  200;

    try {
        switch(route) {
            case 'GET /quotes':
                body = await listQuotes();
                break;
            case 'POST /quotes':
                body = await saveQuote(data);
                break;
            default:
                throw new Error(`unsupported route: ${route}`);
        }
    } catch (error) {
        console.log(error);
        statusCode = 400;
        body = error.message;
    } finally {
        console.log(body);
        body = JSON.stringify(body);
    }
    return sendRes(statusCode, body);
};
