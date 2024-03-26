'use strict'

const Faq = use('App/Models/Admin/FaqModule/Faq')

const FaqCategory = use('App/Models/Admin/FaqModule/FaqCategory')

const Env = use('Env')
class FaqController {
    async index({ request, response }) {
        
        const search = request.input('search')
        const orderBy = request.input('orderBy')
        const orderPos = request.input('orderPos')

        const faqQuery = Faq.query()      
        
        faqQuery.select('faqs.*');
        faqQuery.select('faq_categories.name as faq_category');


        faqQuery.leftJoin('faq_categories', 'faq_categories.id', 'faqs.faq_category_id')

        if (orderBy && orderPos) {
            faqQuery.orderBy(orderBy, orderPos)
        }
        if (search) {
                faqQuery.orWhereRaw(`${filed} LIKE '%${search}%'`)
        }

        const result = await faqQuery.fetch()
        return response.status(200).send(result)
        
    }


}

module.exports = FaqController
