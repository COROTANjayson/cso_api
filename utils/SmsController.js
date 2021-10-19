const passport = require("passport");
require('../middlewares/passport')(passport);
const SMS = require("../models/SMSMessage");
const { nlpFunction } = require("../utils/nlp/nlp");
const Query = require("../models/Query");
const axios = require('axios');
const Student = require('../models/Student');


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

        const sms = await SMS.find().sort({_id: -1});
        const studentNumList = findStudentNumList(sms);
        // const previewMessage = recentPreviewMessage(studentNumList);
        // const smsONe = await SMS.findOne({student_phone:'639953856593'}).sort({_id: -1});
        // console.log(prreviewMessage);
    
        res.json({
            SMS_list: sms,
            studentNumList: studentNumList,
            succes: true
        });
    } catch (error) {
        // Implement logger function (winston)
        return res.status(500).json({
            message: "Unable to Find SMS Messages",
            success: false
        });
    }
}

const GetCurrentMessage = async(req, res,phone_num) => {
    try {
        const sms = await SMS.find();
        const currentMessageList = currentMessageStudentList(sms,phone_num);
        res.json({
            currentMessageList:currentMessageList,
            succes: true
        });
    } catch (error) {
        // Implement logger function (winston)
        return res.status(500).json({
            message: "Unable to Find Current SMS Messages",
            success: false
        });
    }
}

const GetUnreadCurrentMessage = async(req,res) => {
    try {

        const sms = await SMS.find({type:'recieve'}).limit(10).sort({$natural:-1})
    
        res.json({
            SMS_list: sms,
            succes: true
        });
    } catch (error) {
        // Implement logger function (winston)
        return res.status(500).json({
            message: "Unable to Find SMS Messages",
            success: false
        });
    }
}

function findStudentNumList(sms){
    numList = [];
    sms.forEach(element=>{
        const found = this.numList.find(e => e == element.student_phone);
        if(!found) {
            numList.push(element.student_phone)
        }
    })


    return numList;

}

function currentMessageStudentList(sms,student_num){
    messageList = [];

    sms.forEach(element=>{
        if(element.student_phone == student_num){
            messageList.push(element);
        }
    })

    return messageList;
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
                                student_id:null,
                                chatBotReplyID:null
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

    // Check if socket is on or not
    let socketIsOff = true;
    // Counting how many reply
    let countReply = 1;
    console.log('here inside io');

    // Run when client connects
    io.on('connection',(socket) => {
        socketIsOff = false

        if(countReply == 1){
            modem.on('onNewMessage', messageDetails =>{  
                countReply++;  
                console.log(`Reply count here1113: ${countReply}`)
                try {
                    modem.getOwnNumber((phone)=>{
                        
                        const newSMS = new SMS({
                            message:messageDetails.message,
                            officer_phone:phone.data.number,
                            student_phone:messageDetails.sender,
                            type:'recieve',
                            isChatbot:false,
                            student_id:null,
                            chatBotReplyID:null,
                        });
                        (async()=>{
                            
                            modem.deleteAllSimMessages();
                            const newData = await SMS.find();
                            const nlpReply = await nlpFunction(messageDetails.message);
                            const findStudentViaNum = await findStudent(messageDetails.sender);
    
                            if(!findStudentViaNum.success){
                                try{
                                    const response = await axios.get(`http://localhost:5001/api/students/show/${messageDetails.sender}`);
                                    
                                    const newStudent = new Student({
                                        student_id: response.data.Student.student_id,
                                        email: response.data.Student.email,
                                        first_name: response.data.Student.first_name,
                                        last_name: response.data.Student.last_name,
                                        middle_name: response.data.Student.middle_name,
                                        phone_number: response.data.Student.phone_number,
                                        gender: response.data.Student.gender,
                                        address: response.data.Student.address,
                                        school: response.data.Student.school,
                                        course: response.data.Student.course,
                                        year: response.data.Student.year
                                    });
    
                                    const studentNew = await newStudent.save();
                                    if(response.data.succes){
                                        newSMS.student_id = studentNew._id;
                                    }
    
                                }catch(err){console.log(err)}
                            }else{
                                newSMS.student_id = findStudentViaNum.data._id;
                            }
                
                            const newSMSStduent = await newSMS.save();
    
                            if(nlpReply.success) {
                                // console.log(nlpReply.answer.answer);
                                modem.initializeModem((data)=>{
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
                                                        student_id:null,
                                                        chatBotReplyID:newSMSStduent._id,
                                                    });
                        
                                                    // console.log(newSMS);
                                                    newSMS.save((data1)=>{
                                                        
                                                        const newQuery = new Query({
                                                            sender_id:newSMSStduent.student_id,
                                                            category_id:nlpReply.categoryId,
                                                            query_name:messageDetails.message,
                                                            possible_answer:data.data.message,
                                                            faq_id:nlpReply.faqID,
                                                            status:"1",
                                                            phone_num:data.data.recipient
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
                                })
                            } else {
                                modem.initializeModem((data)=>{
                                    modem.sendSMS(messageDetails.sender, 'No Possible Answer Found',  false, (data)=>{
                                    if(data.request == 'SendSMS'){
                                        try{
                                            modem.getOwnNumber((phone)=>{
                                                const newSMS = new SMS({
                                                    message:data.data.message,
                                                    officer_phone:phone.data.number,
                                                    student_phone:data.data.recipient,
                                                    type:'send',
                                                    isChatbot:true,
                                                    student_id:null,
                                                    chatBotReplyID:newSMSStduent._id,
                                                });
                    
                                                newSMS.save((data1)=>{
                                                    const newQuery = new Query({
                                                        sender_id:newSMSStduent.student_id,
                                                        category_id:nlpReply.categoryId,
                                                        query_name:messageDetails.message,
                                                        possible_answer:'N/A',
                                                        faq_id:nlpReply.faqID,
                                                        status:"1",
                                                        phone_num:data.data.recipient
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
                                })
                            }
        
                        })();
                    });
                } catch(err) {
                    console.log(err)
                }
            });
        }

        countReply = 0;
        console.log(`Here outside reset111 ${countReply}`)
    });

    if(socketIsOff){
        console.log('inside out')
        if(countReply == 1){
            modem.on('onNewMessage', messageDetails =>{  
                countReply++;  
                console.log(`Reply count here1113: ${countReply}`)
                try {
                    modem.getOwnNumber((phone)=>{
                        
                        const newSMS = new SMS({
                            message:messageDetails.message,
                            officer_phone:phone.data.number,
                            student_phone:messageDetails.sender,
                            type:'recieve',
                            isChatbot:false,
                            student_id:null,
                            chatBotReplyID:null,
                        });
                        (async()=>{
                            
                            modem.deleteAllSimMessages();
                            const newData = await SMS.find();
                            const nlpReply = await nlpFunction(messageDetails.message);
                            const findStudentViaNum = await findStudent(messageDetails.sender);
    
                            if(!findStudentViaNum.success){
                                try{
                                    const response = await axios.get(`http://localhost:5001/api/students/show/${messageDetails.sender}`);
                                    
                                    const newStudent = new Student({
                                        student_id: response.data.Student.student_id,
                                        email: response.data.Student.email,
                                        first_name: response.data.Student.first_name,
                                        last_name: response.data.Student.last_name,
                                        middle_name: response.data.Student.middle_name,
                                        phone_number: response.data.Student.phone_number,
                                        gender: response.data.Student.gender,
                                        address: response.data.Student.address,
                                        school: response.data.Student.school,
                                        course: response.data.Student.course,
                                        year: response.data.Student.year
                                    });
    
                                    const studentNew = await newStudent.save();
                                    if(response.data.succes){
                                        newSMS.student_id = studentNew._id;
                                    }
    
                                }catch(err){console.log(err)}
                            }else{
                                newSMS.student_id = findStudentViaNum.data._id;
                            }
                
                            const newSMSStduent = await newSMS.save();
    
                            if(nlpReply.success) {
                                // console.log(nlpReply.answer.answer);
                                modem.initializeModem((data)=>{
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
                                                        student_id:null,
                                                        chatBotReplyID:newSMSStduent._id,
                                                    });
                        
                                                    // console.log(newSMS);
                                                    newSMS.save((data1)=>{
                                                        
                                                        const newQuery = new Query({
                                                            sender_id:newSMSStduent.student_id,
                                                            category_id:nlpReply.categoryId,
                                                            query_name:messageDetails.message,
                                                            possible_answer:data.data.message,
                                                            faq_id:nlpReply.faqID,
                                                            status:"1",
                                                            phone_num:data.data.recipient
                                                        });
        
                                                        console.log('Query Save not other')
        
                                                        newQuery.save((data2) => {
                                                            modem.deleteAllSimMessages()
                                        
                                                        })
                                                    });
                        
                                                });
                                                }catch(err){
                                                console.log(err)
                                                }
                                        }
                                    })
                                })
                            } else {
                                modem.initializeModem((data)=>{
                                    modem.sendSMS(messageDetails.sender, 'No Possible Answer Found',  false, (data)=>{
                                    if(data.request == 'SendSMS'){
                                        try{
                                            modem.getOwnNumber((phone)=>{
                                                const newSMS = new SMS({
                                                    message:data.data.message,
                                                    officer_phone:phone.data.number,
                                                    student_phone:data.data.recipient,
                                                    type:'send',
                                                    isChatbot:true,
                                                    student_id:null,
                                                    chatBotReplyID:newSMSStduent._id,
                                                });
                    
                                                newSMS.save((data1)=>{
                                                    const newQuery = new Query({
                                                        sender_id:newSMSStduent.student_id,
                                                        category_id:nlpReply.categoryId,
                                                        query_name:messageDetails.message,
                                                        possible_answer:'N/A',
                                                        faq_id:nlpReply.faqID,
                                                        status:"1",
                                                        phone_num:data.data.recipient
                                                    });
    
                                                    console.log('Query Save other')
                                                    newQuery.save((data2) => {
                                                        modem.deleteAllSimMessages()
                                                       
                                                    })
                                                });
                    
                                            });
                                            }catch(err){
                                            console.log(err)
                                            }
                                    }
                                    
                                })
                                })
                            }
        
                        })();
                    });
                } catch(err) {
                    console.log(err)
                }
            });
        }

        countReply = 0;
        console.log(`Here outside reset111 ${countReply}`)
    }
};

const findStudent = async(phone_num) => {
    try{
        const student = await Student.find({phone_number:phone_num})
        console.log('here');
        console.log(student)
        console.log(student.length);
        message = {data:'123',success:false};
        if(student.length < 1){
            message.data = null;
            message.success = false
            return message
        }

        message.data = student[0];
        message.success = true;

        console.log(message);
        return message
    }catch(err){console.log(err)}
}

modem.on('onMemoryFull', result => { console.log(result) })

module.exports = {SendSms, GetAllSms,listenReply,GetCurrentMessage,GetUnreadCurrentMessage }