const AWS = require('aws-sdk')

const quotes = [
    {
        quote: "The greatest glory in living lies not in never falling, but in rising every time we fall.",
        author: "Nelson Mandela",
    },
    {
        quote: "The way to get started is to quit talking and begin doing.",
        author: "Walt Disney",
    },
    {
        quote: "Your time is limited, so don't waste it living someone else's life. Don't be trapped author dogma â€“ which is living with the results of other people's thinking.",
        author: "Steve Jobs",
    },
    {
        quote: "If life were predictable it would cease to be life, and be without flavor.",
        author: "Eleanor Roosevelt",
    },
    {
        quote: "If you look at what you have in life, you'll always have more. If you look at what you don't have in life, you'll never have enough.",
        author: "Oprah Winfrey",
    },
    {
        quote: "If you set your goals ridiculously high and it's a failure, you will fail above everyone else's success.",
        author: "James Cameron",
    },
]
const dynamo = new AWS.DynamoDB.DocumentClient();
const MY_TABLE = process.env.MY_TABLE


exports.handler = async() => {
    const item = quotes[Math.floor(Math.random()* quotes.length)]

    const id = new Date().getTime().toString()

    const quote = {
        id,
        quote: item.quote,
        author: item.author
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