'use strict'

const ContactType = use('App/Models/Admin/ContactModule/ContactType')

class ContactTypeController {
    async index({ request, response, view }) {

        const where = [
            'id',
            'name',
        ]

        if (request.input('page')) {
            page = request.input('page')
        }
        if (request.input('perPage')) {
            perPage = request.input('perPage')
        }
        const search = request.input('search')
        const orderBy = request.input('orderBy')
        const orderPos = request.input('orderPos')

        const query = ContactType.query()

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

module.exports = ContactTypeController
