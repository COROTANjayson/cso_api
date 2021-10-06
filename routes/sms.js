const router = require("express").Router();

const { SendSms } = require("../utils/SmsController");


// Add Sender Route (/api/sender/add)
router.post("/send", /* userAuth, */ async (req, res) => {
    await SendSms(req.body, res);
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

module.exports = router;