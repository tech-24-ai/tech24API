'use strict'

const Industry = use('App/Models/Admin/ProductModule/Industry')
class IndustryController {
    async index({ request, response, view }) {
        const query = Industry.query()
        query.where('parent_id', null)
        query.with('children')
        const result = await query.fetch()
        return response.status(200).send(result)
    }
}

module.exports = IndustryController
