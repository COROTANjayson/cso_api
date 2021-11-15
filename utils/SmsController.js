const passport = require("passport");
require('../middlewares/passport')(passport);
const SMS = require("../models/SMSMessage");
const mongoose = require("mongoose");
const { nlpFunction,nlpFunctionV2 } = require("../utils/nlp/nlp");
const Query = require("../models/Query");
const Category = require("../models/Category");
const axios = require('axios');
const Student = require('../models/Student');
const {SelectBroadcast} = require('./StudentsController');
const ObjectId = mongoose.Types.ObjectId;


// Serial port gsm
const serialportgsm = require('serialport-gsm')
const modem = serialportgsm.Modem()

const OpenAndInitializeGSMModule = (io) => {
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
        autoDeleteOnReceive: true,
        enableConcatenation: true,
        incomingCallIndication: true,
        incomingSMSIndication: true,
        pin: '',
        customInitCommand: '',
        logger: console
    }
    
    modem.open('COM4', options, (data)=>{
        console.log(data);
    });
    modem.on('open', data => {	
        console.log('Modem is open');
        modem.initializeModem((data)=>{
            console.log('Modem is Initialized');
        })
    })
}

const GetAllSms = async(req, res) => {
    try {

        const sms = await SMS.find({'student_phone':{$nin:["AutoLoadMAX","TM",'8080']}}).sort({_id: -1});

        const studentNumList = findStudentNumList(sms);
        const previewMessage = findPreviewMessages(sms);
        
        res.json({
            SMS_list: sms,
            studentNumList: studentNumList,
            previewMessage: previewMessage,
            succes: true
        });
    } catch (error) {
        console.log(error)
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

        const sms = await SMS.find({'type':'recieve','student_phone':{$nin:["AutoLoadMAX","TM",'8080']}}).limit(10).sort({$natural:-1})
        const unread_sms = await SMS.find({'is_read':false,'student_phone':{$nin:["AutoLoadMAX","TM",'8080']}}).limit(10).sort({$natural:-1})
        res.json({
            SMS_list: sms,
            unread_sms_list: unread_sms,
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

function findPreviewMessages(sms){
    numList = findStudentNumList (sms);
    prevMessageList = []

    // element => element.student_phone === e && element.type === 'recieve'
    numList.forEach(e=>{
        let index = sms.findIndex(
            element => element.student_phone === e
        );

        if(sms[index] == undefined){
            prevMessageList.push('')
        }else{
            prevMessageList.push(sms[index])
        }
    })

    return prevMessageList;
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
const SendSms = async (req,  res, io) => {
    try {    
        const to = req.number;
        let text = req.text;
        
        if(text.length > 140){

            const tempWord = text;
            const wordArr = [];

            while(text.length != 0){
                wordArr.push(text.substr(0,140))
                if(text.length < 140){
                    text = text.slice(text.length);
                }else{
                    text = text.slice(140);
                }
            }
            
            wordArr.forEach(e=>{
                modem.sendSMS(to, e, false, (data)=>{
                    console.log(data);
                })

                modem.on('onSendingMessage', result => { 
                    console.log(result);
                 })
            })

            modem.getOwnNumber(phone=>{
                const newSMS = new SMS({
                    message:tempWord,
                    officer_phone:phone.data.number,
                    student_phone:to,
                    type:'send',
                    isChatbot:false,
                    student_id:null,
                    chatBotReplyID:null,
                    is_read:true
                });

                newSMS.save((data)=>{
                    // console.log(newSMS);
                    modem.getSimInbox(data=>console.log(data))
                    modem.deleteAllSimMessages()
                    io.sockets.emit('newSMSFromOfficer');
                    return res.status(201).json({
                        message: newSMS,
                        success: true
                    });
                });
            })
        }else{
            // Send Messages
            modem.sendSMS(to, text, false, (data)=>{
                modem.on('onNewMessage', messageDetails =>{ console.log(messageDetails) })
                // console.log(data);
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
                            chatBotReplyID:null,
                            is_read:true
                        });

                        // console.log(newSMS);
                        newSMS.save((data)=>{
                            // console.log(newSMS);
                            modem.deleteAllSimMessages()
                            io.sockets.emit('newSMSFromOfficer');
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

            
            modem.on('onSendingMessage', result => { 
                console.log(result);
             })
        }

    } catch (err) {
        console.log(err);
    }
};


const sendBroadcastMessage = async (req,res, io) => {
    try{

        let text = req.message;
        const result = await SelectBroadcast(req,res);
    
        if(result.list.length == 0){
            return res.status(404).json({
                message: "No Contact Found",
                success: false
            });
        }

        result.list.forEach(e=>{
            let tempNum = e.phone_number
            if(tempNum.substring(0,1) == 0){
                tempNum = '63'+e.phone_number.substring(1);
            }
            if(e.phone_number.substring)
            if(text.length > 140){

                const tempWord = text;
                const wordArr = [];
    
                while(text.length != 0){
                    wordArr.push(text.substr(0,140))
                    if(text.length < 140){
                        text = text.slice(text.length);
                    }else{
                        text = text.slice(140);
                    }
                }
                
                wordArr.forEach(e=>{
                    modem.sendSMS(tempNum, e, false, (data)=>{
                        console.log(data);
                    })
    
                    modem.on('onSendingMessage', result => { 
                        console.log(result);
                     })
                })
    
                modem.getOwnNumber(phone=>{
                    const newSMS = new SMS({
                        message:tempWord,
                        officer_phone:phone.data.number,
                        student_phone:tempNum,
                        type:'send',
                        isChatbot:false,
                        student_id:null,
                        chatBotReplyID:null,
                        is_read:true
                    });
    
                    newSMS.save((data)=>{

                        modem.deleteAllSimMessages()
                    });
                })
            }else{
                // Send Messages
                modem.sendSMS(tempNum, text, false, (data)=>{
                    modem.on('onNewMessage', messageDetails =>{ console.log(messageDetails) })
                    // console.log(data);
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
                                    chatBotReplyID:null,
                                    is_read:true
                                });
        
                                // console.log(newSMS);
                                newSMS.save((data)=>{
                                    // console.log(newSMS);
                                    modem.deleteAllSimMessages()
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
    
                
                modem.on('onSendingMessage', result => { 
                    console.log(result);
                 })
            }
        })

        setTimeout(function() {
            return res.json({
                message: 'Broadcast Send',
                succes: true
            });
        }, 2000);

    }catch (err){
        console.log(err);
        return res.status(500).json({
            message: "Server Error",
            success: false
        });
    }
}

const SendQueryAnswer = async(req,res,io)=>{
    const {message,query_info} = req
    console.log(req);
    try{
        await Query.updateOne(
            { _id: ObjectId(query_info._id)},
            { $set: { possible_answer:message}}
        )
        
        let text = message;
        const to = query_info.phone_num;
        if(text.length > 140){

            const tempWord = text;
            const wordArr = [];

            while(text.length != 0){
                wordArr.push(text.substr(0,140))
                if(text.length < 140){
                    text = text.slice(text.length);
                }else{
                    text = text.slice(140);
                }
            }
            
            wordArr.forEach(e=>{
                modem.sendSMS(to, e, false, (data)=>{
                    console.log(data);
                })

                modem.on('onSendingMessage', result => { 
                    console.log(result);
                 })
            })

            modem.getOwnNumber(phone=>{
                const newSMS = new SMS({
                    message:tempWord,
                    officer_phone:phone.data.number,
                    student_phone:to,
                    type:'send',
                    isChatbot:false,
                    student_id:null,
                    chatBotReplyID:null,
                    is_read:true
                });

                newSMS.save((data)=>{
                    modem.getSimInbox(data=>console.log(data))
                    modem.deleteAllSimMessages()
                    io.sockets.emit('newSMSFromOfficer');
                    return res.status(201).json({
                        message: 'Message Sent',
                        success: true
                    });
                });
            })
        }else{
            // Send Messages
            modem.sendSMS(to, text, false, (data)=>{
                modem.on('onNewMessage', messageDetails =>{ console.log(messageDetails) })
                // console.log(data);
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
                                chatBotReplyID:null,
                                is_read:true
                            });

                            // console.log(newSMS);
                            newSMS.save((data)=>{
                                // console.log(newSMS);
                                modem.deleteAllSimMessages()
                                io.sockets.emit('newSMSFromOfficer');
                                return res.status(201).json({
                                    message: 'Message Sent',
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

            
            modem.on('onSendingMessage', result => { 
                console.log(result);
             })
        }
    }catch(e){
        console.log(err);
        return res.status(500).json({
            message: "Server Error",
            success: false
        });
    }
}

const listenReply = (io) => {

    const verificationMessage = `Thank you for reaching out. Is your question was answered? Type Y for Yes and N for No`;

    modem.on('onNewMessage', messageDetails =>{  
        // countReply++;  
        // console.log(`Reply count here1113: ${countReply}`)

        modem.emit('messageChannel', {
            message:'Connected to the socket'
        });

        console.log(messageDetails);
        if(messageDetails.message.toLowerCase() == 'n' || messageDetails.message.toLowerCase() == 'y' || messageDetails.message.toLowerCase() == 'category'){

            if(messageDetails.message.toLowerCase() == 'category'){
                sendCategoryList(messageDetails,io);
            }else{
                verificationMessageIdentify(messageDetails,io)
            }
        }else{
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
                        is_read:false
                    });
                    (async()=>{
                        
                        modem.deleteAllSimMessages();
                        const newData = await SMS.find();
                        const nlpReply = await nlpFunctionV2(messageDetails.message);
                        const findStudentViaNum = await findStudent(messageDetails.sender)
                        let newContactNumber  = '0'+messageDetails.sender.substring(2);
    
                        if(!findStudentViaNum.success){
                            try{
    
                                const response = await axios.get(`http://student-server-dummy.herokuapp.com/${newContactNumber}`);
                                console.log(response.data);
                                const newStudent = new Student({
                                    student_id: response.data.Student.student_id,
                                    phone_number: messageDetails.sender,
                                    school: response.data.Student.school,
                                    course: response.data.Student.course
                                });
    
                                const studentNew = await newStudent.save();
                                if(response.data.success){
                                    newSMS.student_id = studentNew._id;
                                }
    
                            }catch(err){console.log('Student Not Found')}
                        }else{
                            newSMS.student_id = findStudentViaNum.data._id;
                        }
            
                        const newSMSStduent = await newSMS.save();
    
                        if(nlpReply.success) {
                            // console.log(nlpReply.answer.answer);
                            let text = nlpReply.answer.answer;
                            if(text.length > 140){
    
                                const tempWord = text;
                                const wordArr = [];
                    
                                while(text.length != 0){
                                    wordArr.push(text.substr(0,140))
                                    if(text.length < 140){
                                        text = text.slice(text.length);
                                    }else{
                                        text = text.slice(140);
                                    }
                                }
                                
                                wordArr.forEach(e=>{
                                    modem.sendSMS(messageDetails.sender, e, false, (data)=>{
                                        console.log(data);
                                    })
                    
                                    modem.on('onSendingMessage', result => { 
                                        console.log(result);
                                     })
                                })

                                modem.sendSMS(messageDetails.sender,verificationMessage,false,(data)=>{
                                    console.log('Verification Message Send')
                                })

                                modem.getOwnNumber((phone)=>{
                                    // console.log(phone.data.number);
        
                                    const newSMS = new SMS({
                                        message:tempWord,
                                        officer_phone:phone.data.number,
                                        student_phone:messageDetails.sender,
                                        type:'send',
                                        isChatbot:true,
                                        student_id:null,
                                        chatBotReplyID:newSMSStduent._id,
                                        is_read:true
                                    });
        
                                    // console.log(newSMS);
                                    newSMS.save((data1)=>{
                                        
                                        const newQuery = new Query({
                                            sender_id:ObjectId(newSMSStduent.student_id),
                                            category_id:nlpReply.categoryId,
                                            query_name:messageDetails.message,
                                            possible_answer:tempWord,
                                            faq_id:nlpReply.faqID,
                                            status:"1",
                                            phone_num:messageDetails.sender
                                        });
    
                                        console.log('Query Save not other')
    
                                        newQuery.save((data2) => {
                                            modem.deleteAllSimMessages()
                                            // socket.broadcast.emit("newdata", newData);
                                            let data = {
                                                message:'New Query Received',
                                                isUnkown:false
                                            }
                                            io.sockets.emit('newdata',data);  
                                        })
                                    });
        
                                });
                    
                                
                            }else{
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
                                                    is_read:true
                                                });
                    
                                                // console.log(newSMS);
                                                newSMS.save((data1)=>{
                                                    
                                                    const newQuery = new Query({
                                                        sender_id:ObjectId(newSMSStduent.student_id),
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
                                                        let data = {
                                                            message:'New Query Received',
                                                            isUnkown:false
                                                        }
                                                        // socket.broadcast.emit("newdata", newData);
                                                        io.sockets.emit('newdata',data);  
                                                    })
                                                });
                    
                                            });
                                        }catch(err){
                                            console.log(err)
                                        }
                                    }
                                })

                                modem.sendSMS(messageDetails.sender,verificationMessage,false,(data)=>{
                                    console.log('Verification Message Send')

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
                                            is_read:true,
                                            notification:true
                                        });

                                        newSMS.save(data=>{
                                            console.log(data);
                                        });
                                    });
                                })
                    
                                modem.on('onSendingMessage', result => { 
                                    console.log(result);
                                 })
                            }
                          
                            
                           
                        } else {
                            
                            modem.sendSMS(messageDetails.sender, nlpReply.message,  false, (data)=>{
                                console.log(data);
                                if(data.request == 'SendSMS'){
                                try{
                                    modem.getOwnNumber((phone)=>{
                                        // const newSMS = new SMS({
                                        //     message:data.data.message,
                                        //     officer_phone:phone.data.number,
                                        //     student_phone:data.data.recipient,
                                        //     type:'send',
                                        //     isChatbot:true,
                                        //     student_id:null,
                                        //     chatBotReplyID:newSMSStduent._id,
                                        //     is_read:true
                                        // });
            
                                        // newSMS.save((data1)=>{
                                            
                                        // });
    
                                        const newQuery = new Query({
                                            sender_id:ObjectId(newSMSStduent.student_id),
                                            category_id:nlpReply.categoryId,
                                            query_name:messageDetails.message,
                                            possible_answer:'N/A',
                                            faq_id:nlpReply.faqID,
                                            status:"1",
                                            phone_num:data.data.recipient
                                        });
    
                                        console.log('Query Save other')
                                        console.log(newQuery);
                                        newQuery.save((data2) => {
                                            modem.deleteAllSimMessages()
                                            // socket.broadcast.emit("newdata", newData);
                                            let data = {
                                                message:'Unknown query received',
                                                isUnkown:true
                                            }
                                            io.sockets.emit('newdata',data);
                                        })
                                        
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
        }

        
    });
};


const ReadMessage = async(req,res,number) => {
    try{
        await SMS.updateMany({student_phone:number},{$set:{"is_read":true}})
        return res.status(200).json({
            message: "Read All current message",
            success: false
        });
    }catch(err){
        console.log(err)
    }
};

const findStudent = async(phone_num) => {
    try{
        const student = await Student.find({phone_number:phone_num})
        message = {data:'123',success:false};
        if(student.length < 1){
            message.data = null;
            message.success = false
            return message
        }
        message.data = student[0];
        message.success = true;
        return message
    }catch(err){console.log(err)}
}

function verificationMessageIdentify(message,io){
    (async()=>{
        const studentSms = await SMS.find({student_phone:message.sender});
        const text = 'Thank you for asking! please kindly wait, Please wait for our team to get on your query shortly.'
        
        if(studentSms[studentSms.length-1].notification){
            console.log('inside');
            if(message.message.toLowerCase() == 'y'){
                modem.getOwnNumber((phone)=>{
                    
                    const newSMS = new SMS({
                        message:message.message,
                        officer_phone:phone.data.number,
                        student_phone:message.sender,
                        type:'recieve',
                        isChatbot:false,
                        student_id:null,
                        chatBotReplyID:null,
                        is_read:false
                    });
            
                    (async()=>{
                        
                        modem.deleteAllSimMessages();
                        const newData = await SMS.find();
                        const findStudentViaNum = await findStudent(message.sender)
                        let newContactNumber  = '0'+message.sender.substring(2);
            
                        if(!findStudentViaNum.success){
                            try{
            
                                const response = await axios.get(`http://student-server-dummy.herokuapp.com/${newContactNumber}`);
                                console.log(response.data);
                                const newStudent = new Student({
                                    student_id: response.data.Student.student_id,
                                    phone_number: message.sender,
                                    school: response.data.Student.school,
                                    course: response.data.Student.course
                                });
            
                                const studentNew = await newStudent.save();
                                if(response.data.success){
                                    newSMS.student_id = studentNew._id;
                                }
            
                            }catch(err){console.log('Student Not Found')}
                        }else{
                            newSMS.student_id = findStudentViaNum.data._id;
                        }
                        const newSMSStduent = await newSMS.save();
                    })();
                })
            }else{
                const id = studentSms[studentSms.length-1].chatBotReplyID;
                const smsQuery = await SMS.findOne({_id:ObjectId(id)})
                const query = await Query.findOne({query_name:smsQuery.message});
                const others = await Category.findOne({ category_name: 'others' });

                await Query.updateOne(
                    { _id: ObjectId(query._id)},
                    { $set: { category_id: ObjectId(others._id), faq_id: null,possbile_answer:'N/A'}}
                )

                modem.getOwnNumber((phone)=>{
                    
                    const newSMS = new SMS({
                        message:message.message,
                        officer_phone:phone.data.number,
                        student_phone:message.sender,
                        type:'recieve',
                        isChatbot:false,
                        student_id:null,
                        chatBotReplyID:null,
                        is_read:false
                    });
            
                    (async()=>{
                        
                        modem.deleteAllSimMessages();
                        const newData = await SMS.find();
                        const findStudentViaNum = await findStudent(message.sender)
                        let newContactNumber  = '0'+message.sender.substring(2);
            
                        if(!findStudentViaNum.success){
                            try{
            
                                const response = await axios.get(`http://student-server-dummy.herokuapp.com/${newContactNumber}`);
                                console.log(response.data);
                                const newStudent = new Student({
                                    student_id: response.data.Student.student_id,
                                    phone_number: message.sender,
                                    school: response.data.Student.school,
                                    course: response.data.Student.course
                                });
            
                                const studentNew = await newStudent.save();
                                if(response.data.success){
                                    newSMS.student_id = studentNew._id;
                                }
            
                            }catch(err){console.log('Student Not Found')}
                        }else{
                            newSMS.student_id = findStudentViaNum.data._id;
                        }
                        const newSMSStduent = await newSMS.save();

                        modem.sendSMS(message.sender, text, false, (data)=>{
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
                                            is_read:true
                                        });
                                        newSMS.save((data1)=>{
                                            modem.deleteAllSimMessages()
                                            // socket.broadcast.emit("newdata", newData);
                                            let data = {
                                                message:'Unknown query received',
                                                isUnkown:true
                                            }
                                            io.sockets.emit('newdata',data); 
                                        });
                                    });
                                }catch(err){
                                    console.log(err)
                                }
                            }
                        })
            
                        modem.on('onSendingMessage', result => { 
                            console.log(result);
                         })
                    })();
                })
                

            }
        }else {
            modem.getOwnNumber((phone)=>{
                    
                const newSMS = new SMS({
                    message:message.message,
                    officer_phone:phone.data.number,
                    student_phone:message.sender,
                    type:'recieve',
                    isChatbot:false,
                    student_id:null,
                    chatBotReplyID:null,
                    is_read:false
                });
        
                (async()=>{
                    
                    modem.deleteAllSimMessages();
                    const newData = await SMS.find();
                    const findStudentViaNum = await findStudent(message.sender)
                    let newContactNumber  = '0'+message.sender.substring(2);
        
                    if(!findStudentViaNum.success){
                        try{
        
                            const response = await axios.get(`http://student-server-dummy.herokuapp.com/${newContactNumber}`);
                            console.log(response.data);
                            const newStudent = new Student({
                                student_id: response.data.Student.student_id,
                                phone_number: message.sender,
                                school: response.data.Student.school,
                                course: response.data.Student.course
                            });
        
                            const studentNew = await newStudent.save();
                            if(response.data.success){
                                newSMS.student_id = studentNew._id;
                            }
        
                        }catch(err){console.log('Student Not Found')}
                    }else{
                        newSMS.student_id = findStudentViaNum.data._id;
                    }
                    const newSMSStduent = await newSMS.save();
                })();
            })
        }
    })();
}

function sendCategoryList(message,io){
    console.log('here');
    const text = 'This is the category';
    modem.getOwnNumber((phone)=>{
                    
        const newSMS = new SMS({
            message:message.message,
            officer_phone:phone.data.number,
            student_phone:message.sender,
            type:'recieve',
            isChatbot:false,
            student_id:null,
            chatBotReplyID:null,
            is_read:false
        });

        (async()=>{
            
            modem.deleteAllSimMessages();
            const newData = await SMS.find();
            const findStudentViaNum = await findStudent(message.sender)
            let newContactNumber  = '0'+message.sender.substring(2);

            if(!findStudentViaNum.success){
                try{

                    const response = await axios.get(`http://student-server-dummy.herokuapp.com/${newContactNumber}`);
                    console.log(response.data);
                    const newStudent = new Student({
                        student_id: response.data.Student.student_id,
                        phone_number: message.sender,
                        school: response.data.Student.school,
                        course: response.data.Student.course
                    });

                    const studentNew = await newStudent.save();
                    if(response.data.success){
                        newSMS.student_id = studentNew._id;
                    }

                }catch(err){console.log('Student Not Found')}
            }else{
                newSMS.student_id = findStudentViaNum.data._id;
            }

            const newSMSStduent = await newSMS.save();

            modem.sendSMS(message.sender, text, false, (data)=>{
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
                                is_read:true
                            });
                            newSMS.save((data1)=>{
                                modem.deleteAllSimMessages()
                                // socket.broadcast.emit("newdata", newData);
                                let data = {
                                    message:'New query received',
                                    isUnkown:false
                                }
                                io.sockets.emit('newdata',data); 
                            });
                        });
                    }catch(err){
                        console.log(err)
                    }
                }
            })

            modem.on('onSendingMessage', result => { 
                console.log(result);
             })

        })();
    })
}

module.exports = {SendSms, GetAllSms,listenReply,GetCurrentMessage,GetUnreadCurrentMessage,ReadMessage,OpenAndInitializeGSMModule,sendBroadcastMessage,SendQueryAnswer }