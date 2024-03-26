'use strict'

const MISegment = use('App/Models/Admin/MISegmentModule/MISegment')
class IndustryController {
    async index({ request, response, view }) {
        const query = MISegment.query()
        // query.where('parent_id', null)
        query.with('children')
        const result = await query.fetch()
        return response.status(200).send(result)
    }
}

module.exports = IndustryController
