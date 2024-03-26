'use strict'

const BlogTopic = use('App/Models/Admin/BlogModule/BlogTopic')

class BlogTopicController {
    async index({ request, response, view }) {

        const search = request.input('search')
        const orderBy = request.input('orderBy')
        const orderPos = request.input('orderPos')

        const query = BlogTopic.query()

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

module.exports = BlogTopicController
