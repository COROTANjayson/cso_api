const passport = require("passport");
require('../middlewares/passport')(passport);
const SMS = require("../models/SMSMessage");
const { nlpFunction } = require("../utils/nlp/nlp");
const Query = require("../models/Query");


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
                                isChatbot:false,
                                student_id:null
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
  
    // Run when client connects
    io.on('connection',(socket) => {
        modem.on('onNewMessage', messageDetails =>{    
            try {
                modem.getOwnNumber((phone)=>{
                   
                    const newSMS = new SMS({
                        message:messageDetails.message,
                        officer_phone:phone.data.number,
                        student_phone:messageDetails.sender,
                        type:'recieve',
                        isChatbot:false,
                        student_id:null
                    });
                    (async()=>{
                        await newSMS.save();
                        modem.deleteAllSimMessages();
                        const newData = await SMS.find();
                        const nlpReply = await nlpFunction(messageDetails.message);
                        
                        console.log(nlpReply);

                        if(nlpReply.success) {
                            // console.log(nlpReply.answer.answer);
                            modem.sendSMS(messageDetails.sender, nlpReply.answer.answer, false, (data)=>{
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
                                                isChatbot:true,
                                                student_id:null
                                            });
                
                                            // console.log(newSMS);
                                            newSMS.save((data1)=>{
                                                
                                                const newQuery = new Query({
                                                    sender_id:null,
                                                    category_id:nlpReply.categoryId,
                                                    query_name:messageDetails.message,
                                                    possible_answer:data.data.message,
                                                    faq_id:nlpReply.faqID,
                                                    status:"1"
                                                });
                                                console.log('Query Save not other')

                                                newQuery.save((data2) => {
                                                    modem.deleteAllSimMessages()
                                                    socket.broadcast.emit("newdata", newData);
                                                })
                                            });
                
                                        });
                                        }catch(err){
                                        console.log(err)
                                        }
                                }
                                
                            })
                        } else {
                            modem.sendSMS(messageDetails.sender, 'No Possible Answer Found',  false, (data)=>{
                             
                                if(data.request == 'SendSMS'){
                                    try{
                
                                        modem.getOwnNumber((phone)=>{
                                            // console.log(phone.data.number);
                
                                            const newSMS = new SMS({
                                                message:data.data.message,
                                                officer_phone:phone.data.number,
                                                student_phone:data.data.recipient,
                                                type:'send',
                                                isChatbot:true,
                                                student_id:null
                                            });
                
                                            // console.log(newSMS);
                                            newSMS.save((data)=>{
                                                
                                                const newQuery = new Query({
                                                    sender_id:null,
                                                    category_id:nlpReply.categoryId,
                                                    query_name:messageDetails.message,
                                                    possible_answer:'N/A',
                                                    faq_id:nlpReply.faqID,
                                                    status:"1"
                                                });

                                                console.log('Query Save other')
                                                newQuery.save((data2) => {
                                                    modem.deleteAllSimMessages()
                                                    socket.broadcast.emit("newdata", newData);
                                                })
                                            });
                
                                        });
                                        }catch(err){
                                        console.log(err)
                                        }
                                }
                                
                            })
                        }
   
                    })();
                });
            } catch(err) {
                console.log(err)
            }
        });
    });
};

modem.on('onMemoryFull', result => { console.log(result) })

module.exports = {SendSms, GetAllSms,listenReply }