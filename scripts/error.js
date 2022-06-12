require('dotenv').config();
const fs = require('fs')
const moment = require('moment')
const sendgrid = require('@sendgrid/mail')
sendgrid.setApiKey(process.env.SENDGRID_API)

const writeErrorReport = async (error, location) => {
    try {
        let current_error = fs.readFileSync('./error.json')
        let json_error = JSON.parse(current_error);
        json_error.push({
            time: moment().format('Do MMMM YYYY, h:mm:ss a'),
            error: error,
            location: location
        });

        fs.writeFileSync('./error.json', JSON.stringify(json_error))
    } catch (err) {
        fs.writeFileSync('./error.json', JSON.stringify([
            {
                time: moment().format('Do MMMM YYYY, h:mm:ss a'),
                error: error,
                location: location
            }, {
                time: moment().format('Do MMMM YYYY, h:mm:ss a'),
                error: err,
                location: 'error.js 19'
            }
        ]))
    }
    return
}

const sendErrorReport = async () => {
    let errors = fs.readFileSync('./error.json')
    if (errors.length === 0) {
        const msg = {
            to: process.env.RECIEVER_EMAIL,
            from: {
                name: "Bus API Error Reporting",
                email: process.env.SENDER_EMAIL
            },
            subject: 'Error Reporting',
            text: "No Error to be reported"
        }

        sendgrid.send(msg)
            .then((response) => {
                console.log(response)
            }).catch((error) => {
                console.error(error)
            })

        return;
    }

    const msg = {
        to: process.env.RECIEVER_EMAIL,
        from: {
            name: "Bus API Error Reporting",
            email: process.env.SENDER_EMAIL
        },
        subject: 'Error Reporting',
        text: `${errors}`
    }
    
    sendgrid.send(msg)
        .then((response) => {
            console.log(response)
        }).catch((error) => {
            console.error(error)
        })
}

module.exports = {
    writeErrorReport,
    sendErrorReport
}