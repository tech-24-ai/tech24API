'use strict'

const FaqCategory = use('App/Models/Admin/FaqModule/FaqCategory')

class FaqCategoryController {
    async index({ request, response, view }) {

        const search = request.input('search')
        const orderBy = "sort_order";//request.input('orderBy')
        const orderPos = "asc"

        const query = FaqCategory.query()

        if (orderBy && orderPos) {
            query.orderBy(orderBy, orderPos)
        }
        if (search) {
            where.forEach(filed => {
                query.orWhereRaw(`${filed} LIKE '%${search}%'`)
            })
        }

        const result = await query.fetch()
        return response.status(200).send(result)
    }
}

module.exports = FaqCategoryController
