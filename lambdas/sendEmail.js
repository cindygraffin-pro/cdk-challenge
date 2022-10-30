const AWS = require("aws-sdk");

const ses = new AWS.SES({ region: "eu-west-3" });
const MY_TABLE = process.env.MY_TABLE
const dynamo = new AWS.DynamoDB.DocumentClient();


exports.handler = async () => {
    let bddQuotes = []
    const paramsBDD = {
        TableName: MY_TABLE
    };
    await dynamo
                .scan(paramsBDD)
                .promise()
                .then((data) => {
                    bddQuotes = data.Items
                })
    const bddQuote = bddQuotes[Math.floor(Math.random()* bddQuotes.length)]
                

        var params = {
            Destination: {
                ToAddresses: ["graffincindy@gmail.com"],
            },
            Message: {
                Body: {
                    Text: { Data: bddQuote.quote },
                },

                Subject: { Data: "Quote of the day" },
            },
            Source: "graffincindy@gmail.com",
        };

        return ses.sendEmail(params).promise()
}