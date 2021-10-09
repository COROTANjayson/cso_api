const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const dotenv = require('dotenv')
require('../middlewares/passport')(passport);
const { SECRET } = require("../config");
const SMS = require("../models/SMSMessage");


// Serial port gsm
const serialportgsm = require('serialport-gsm')
const modem = serialportgsm.Modem()

// Opening GSM module
const options = {
    baudRate: 9600,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
    rtscts: false,
    xon: false,
    xoff: false,
    xany: false,
    autoDeleteOnReceive: false,
    enableConcatenation: true,
    incomingCallIndication: true,
    incomingSMSIndication: true,
    pin: '',
    customInitCommand: '',
    logger: console
}
  
modem.open('COM4', options, (data)=>{console.log(data)});
modem.on('open', data => {	
console.log('Modem is open');
modem.initializeModem((data)=>{
    console.log('Modem is Initialized');
})
})

const GetAllSms = async(req, res) => {
    try {
        await SMS.find(function (err, sms) {
            if (err) return next(err);
            res.json({
                SMS_list: sms,
                succes: true
            });

        });
    } catch (error) {
        // Implement logger function (winston)
        return res.status(500).json({
            message: "Unable to Find SMS Messages",
            success: false
        });
    }
}


// Create new Sender
const SendSms = async (req,  res) => {
    try {
        modem.initializeModem((data)=>{
            console.log('Modem is Initialized');
            
            const to = req.number;
            const text = req.text;


            // Send Messages
            modem.sendSMS(to, text, false, (data)=>{
                console.log(data);
                if(data.request == 'SendSMS'){
                    try{

                        modem.getOwnNumber((phone)=>{
                            // console.log(phone.data.number);

                            const newSMS = new SMS({
                                message:data.data.message,
                                officer_phone:phone.data.number,
                                student_phone:data.data.recipient,
                                type:'send',
                            });

                            // console.log(newSMS);
                            newSMS.save((data)=>{
                                // console.log(newSMS);
                                modem.deleteAllSimMessages()
                                return res.status(201).json({
                                    message: newSMS,
                                    success: true
                                });
                            });

                        });
                      }catch(err){
                        
                        
                        
                        return res.status(500).json({
                            message: "Send SMS Error",
                            success: false
                        });
                      }
                }
                
            })
    
        })

        modem.on('onSendingMessage', result => { 
            console.log(result);
         })

        
    } catch (err) {
        console.log(err);
    }

};

const listenReply = (io) => {
    // modem.on('onNewMessage', messageDetails => {
    //     console.log(messageDetails);
    // });
    // Run when client connects
    io.on('connection',(socket) => {
        modem.on('onNewMessage', messageDetails => {
            console.log(messageDetails.message);
            
            try {
                modem.getOwnNumber((phone)=>{
                    const newSMS = new SMS({
                        message:messageDetails.message,
                        officer_phone:phone.data.number,
                        student_phone:messageDetails.sender,
                        type:'recieve',
                    });
                    newSMS.save(()=>{
                        SMS.find(function (err, sms) {
                            modem.deleteAllSimMessages()
                            socket.broadcast.emit("newdata", sms); 
                        })
                    });
                });
            } catch(err) {
                console.log(err)
            }
        });
    });
};

modem.on('onMemoryFull', result => { console.log(result) })

module.exports = {SendSms, GetAllSms,listenReply }