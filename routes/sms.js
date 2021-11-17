const router = require("express").Router();
const { SendSms, GetAllSms,listenReply,GetCurrentMessage,GetUnreadCurrentMessage,ReadMessage,OpenAndInitializeGSMModule,sendBroadcastMessage,SendQueryAnswer } = require("../utils/SmsController");

module.exports = function(io){
    console.log('insideroute')
    listenReply(io);
    OpenAndInitializeGSMModule(io);

    // Add Sender Route (/api/sender/add)
    router.post("/send", /* userAuth, */ async (req, res) => {
        await SendSms(req.body.data, res,io);
        // try {
        //     modem.initializeModem((data)=>{
        //         console.log('Modem is Initialized');
                
        //         const to = req.body.number;
        //         const text = req.body.text;
        //         // Send Messages
        //         modem.sendSMS(to, text, false, (data)=>{
        //             console.log(data);
        //         })
        
        //     })

        //     modem.on('onSendingMessage', result => { 
        //         console.log('hello there');
        
        //         try{
        //           return res.status(201).json({
        //             message: result,
        //             success: true
        //           });
        //         }catch(err){
        //           console.log(err);
        //           return res.status(500).json({
        //               message: "Send SMS Error",
        //               success: false
        //           });
        //         }
        //      })

            
        // } catch (err) {
        //     console.log(err);
        //     return res.status(500).json({
        //         message: "Send SMS Error",
        //         success: false
        //     });
        // }
    });

    router.get('/getallmessage',  /* userAuth, */ async (req,res)=> {
        await GetAllSms(req, res)
    });

    router.get('/getcurrentmessage/:phone_num', /* userAuth, */ async (req,res)=> {
        const phone_num = req.params.phone_num;
        await GetCurrentMessage(req, res,phone_num)
    });

    router.get('/getunreadcurrentmessage', /* userAuth, */ async (req,res)=> {
        await GetUnreadCurrentMessage(req, res)
    });

    router.get('/changesmsstatus/:phone_num', /* userAuth, */ async (req,res)=> {
        const phone_num = req.params.phone_num;
        await ReadMessage(req, res,phone_num)
    });

    router.post('/sendbroadcastmessage', /* userAuth, */ async (req,res)=>{
        await sendBroadcastMessage(req.body.data,res);
    })

    router.post('/sendqueryanswer', /* userAuth, */ async (req,res)=>{
        await SendQueryAnswer(req.body.data,res,io);
    })

    return router
}