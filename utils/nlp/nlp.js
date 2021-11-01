const { NlpManager } = require('node-nlp');
const FAQ = require("../../models/FAQ");
const Category = require("../../models/Category");
const translate = require('@vitalets/google-translate-api');

const manager = new NlpManager({ languages: ['en'], forceNER: true });

const nlpFunction = async (text) =>{

    console.log('here faq')
    const faq = await FAQ.find();
    faq.forEach(element => {
        // Adds the utterances and intents for the NLP
        
        element.faq_utterances.forEach(e=>{
            // console.log(e);
            manager.addDocument('en',e.value,element.faq_title);
        })

        // Train also the NLG
        manager.addAnswer('en', element.faq_title, element.faq_answer);
    });

    const translation =  await translate(text, {to: 'en'});
    await manager.train();
    manager.save();

    try{
        const response = await manager.process('en', translation.text);
        const findID = await FAQ.findOne({faq_title:response.intent})
        console.log(response);
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

        console.log(data.answer);
        
        return data;

    }catch(e){
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

module.exports = {
    nlpFunction
};