const { NlpManager } = require('node-nlp');
const FAQ = require("../../models/FAQ");
const Category = require("../../models/Category");
const translate = require('@vitalets/google-translate-api');

const manager = new NlpManager({ languages: ['en'], forceNER: true, nlu: { log: true }});

const nlpFunction = async (text) =>{

    const faq = await FAQ.find();
    faq.forEach(element => {
        
        element.faq_utterances.forEach(e=>{
            manager.addDocument('en',e.value,element.faq_title);
        })
        manager.addAnswer('en', element.faq_title, element.faq_answer);
    });

    // const translation =  await translate(text, {to: 'en'});
    const translation = {text:text};

    console.log('------------------------------')
    console.log(translation)
    await manager.train();
    manager.save();

    try{
        const response = await manager.process('en', translation.text);
        const findID = await FAQ.findOne({faq_title:response.intent})
        data = {
            answer: response,
            success: true,
            categoryId: null,
            faqID: null
        }

        if(findID){
            data.categoryId = findID.category_id
            data.faqID = findID._id

            // Add the query of student to the array of faq_utterances
            await FAQ.updateOne({_id:findID._id},{$push:{faq_utterances:{value:text}}})
        }
        
        if(response.answers.length < 1){
            const findOthersID = await Category.findOne({category_name:'others'})
            data.success = false
            data.categoryId = findOthersID._id
            return data;
        }
        
        return data;

    }catch(e){
        console.log('error here');
        console.log(e);
    }
    // // Train and save the model.
    // (async() => {
    //     await manager.train();
    //     manager.save();

    //     try{
    //         // const translation =  await translate(text, {to: 'en'});
            

    //         const response = await manager.process('en', text);

    //         data = {
    //             answer: response,
    //             success: true
    //         }
            
    //         if(response.answers.length < 1){
    //             data.success = false
    //             return data;
    //         }

    //         console.log('here here here');
    //         return data;

    //     }catch(e){
    //         console.log(e);
    //     }

    //     // console.log(response);
    // })();

    // return '123faq123';
}

const nlpFunctionV2 = async (text) =>{

    let faq = await FAQ.find();
    var stopwords = ['is','the',"myself", "ourselves", "yours", "yourself", "yourselves","himself",  "herself", "itself", "they", "them", "their", "theirs", "themselves"]

    try{
        const category = await Category.find();
        category.forEach(e=>{
            manager.addDocument('en', e.category_name.toLowerCase(), e.category_name.toLowerCase());
            manager.addAnswer('en', e.category_name.toLowerCase(), e._id.toString());
            // console.log(e._id);
        })

        const translation =  await translate(text, {from: 'ceb',to: 'en'});
        // const translation = {text:text};
        console.log(translation);
        console.log('----------------')

        await manager.train();
        manager.save();

        const response = await manager.process('en', translation.text.toLowerCase());
        const findOthersID = await Category.findOne({category_name:'others'})

        data = {
            answer: '',
            success: false,
            categoryId: findOthersID._id,
            faqID: null,
            message:''
        }

        console.log(response);

        if(response.answer == undefined){
            data.message = `I'm sorry but your query doesn’t belong to any defined category, Please wait for our team to get on your query shortly.`
            return data;
        }else{
            const manager1 = new NlpManager({ languages: ['en'], forceNER: true, nlu: { log: true }});
            faq = faq.filter(e=>e.category_id == response.answer);
            translation.text = translation.text.replace(response.intent.toLowerCase(),'');

            faq.forEach(e=>{
                e.faq_utterances = e.faq_utterances.map(u=>u.value.toLowerCase().replace(response.intent.toLowerCase(),'').trim())

                
                stopwords.forEach(s=>{
                    e.faq_utterances = e.faq_utterances.map(u=>u.toLowerCase().replace(s,'').trim())
                    translation.text = translation.text.replace(s,'').trim();
                })
                
                
              
                e.faq_utterances.forEach(u=>{
              
                    manager1.addDocument('en', u, e.faq_title);
                })

                manager1.addAnswer('en', e.faq_title, e.faq_answer)
            })

            await manager1.train();
            manager1.save();

            let response1 = await manager1.process('en', translation.text.toLowerCase());

            
            if(response1.answer == undefined){
                data.message = `New query was received. Please wait for our team will get back to you shortly`
                return data;
            }else{
                
                findFaq = await FAQ.findOne({faq_title:response1.intent})

                data.answer = response1;
                data.categoryId = response.answer;
                data.success = true;
                data.faqID = findFaq._id;
                return data;
            }
        }
    }catch(e){
        console.log(e);
    }
}


module.exports = {
    nlpFunctionV2
};