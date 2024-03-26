'use strict'

const Flow = use('App/Models/Admin/ProductModule/Flow')
const FlowQuestion = use('App/Models/Admin/ProductModule/FlowQuestion')
const Query = use('Query')
const moment = require("moment");
const searchInFields = [
    'flows.id',
    'flows.name',
]
class FlowController {
    async index({ request, response, view }) {

        const query = Flow.query()

        query.select('flows.*');
        query.select('modules.name as module');

        query.withCount('questions')
        query.with('questions')
        query.leftJoin('modules', 'modules.id', 'flows.module_id')

        const search = request.input('search')
        const orderBy = request.input('orderBy')
        const orderDirection = request.input('orderDirection')
        const searchQuery = new Query(request, { order: 'id' })

        if (orderBy && orderDirection) {
            query.orderBy(`${orderBy}`, orderDirection)
        }

        if (search) {
            query.where(searchQuery.search(searchInFields))
        }

        if (request.input('filters')) {
            const filters = JSON.parse(request.input('filters'))
            filters.forEach(filter => {
                if (filter.name == 'module') {
                    query.whereRaw(`modules.name LIKE '%${filter.value}%'`)
                } else {
                    query.whereRaw(`flows.${filter.name} LIKE '%${filter.value}%'`)
                }
            })
        }

        let page = null;
        let pageSize = null;

        if (request.input('page')) {
            page = request.input('page')
        }
        if (request.input('pageSize')) {
            pageSize = request.input('pageSize')
        }

        var result
        if (page && pageSize) {
            result = await query.paginate(page, pageSize)
        } else {
            result = await query.fetch()
        }

        return response.status(200).send(result)
    }

    async storeQuestions(id, request) {
        await FlowQuestion
            .query()
            .where('flow_id', id)
            .delete()

        if (request.input('questions')) {
            var data = []
            const questions = JSON.parse(request.input('questions'))
            questions.forEach((value, index) => {
                data.push({
                    flow_id: id,
                    question_id: value.question_id,
                    sort_order: index,
                    is_advanced: value.is_advanced,
                })
            })
            await FlowQuestion.createMany(data)
        }
    }

    async store({ request, response }) {
        const query = new Flow()
        query.module_id = request.input('module_id')
        query.name = request.input('name')
        query.notes = request.input('notes')
        await query.save()
        this.storeQuestions(query.id, request)
        return response.status(200).send({ message: 'Create successfully' })
    }

    async show({ params, request, response, view }) {

        const query = Flow.query()

        query.select('flows.*');
        query.select('modules.name as module');
        query.select('categories.id as category_id');
        query.select('categories.name as category');
        query.leftJoin('modules', 'modules.id', 'flows.module_id')
        query.leftJoin('categories', 'categories.id', 'modules.category_id')
        query.where('flows.id', params.id)
        query.with('question', (builder) => {
            builder.select('flow_questions.*')
            builder.select('flow_questions.question_id')
            builder.select('flow_questions.sort_order')
            builder.select('flow_questions.is_advanced')
            builder.select('questions.name as question')
            builder.leftJoin('questions', 'questions.id', 'flow_questions.question_id')
            builder.orderBy("flow_questions.sort_order", 'ASC')
        })

        const result = await query.firstOrFail()
        return response.status(200).send(result)
    }

    async update({ params, request, response }) {
        const query = await Flow.findOrFail(params.id)
        query.module_id = request.input('module_id')
        query.name = request.input('name')
        query.notes = request.input('notes')
        await query.save()
        this.storeQuestions(query.id, request)
        return response.status(200).send({ message: 'Update successfully' })
    }

    async destroy({ params, request, response }) {
        const query = await Flow.findOrFail(params.id)
        try {
            await query.delete()
            return response.status(200).send({ message: 'Delete successfully' })
        } catch (error) {
            return response.status(423).send({ message: 'Something went wrong' })
        }
    }

    async flow_questions({ request, response, view }) {
        const query = FlowQuestion.query()
        const result = await query.fetch()
        return response.status(200).send(result)
    }

}
module.exports = FlowController
