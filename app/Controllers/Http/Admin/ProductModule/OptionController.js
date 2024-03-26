'use strict'

const Option = use('App/Models/Admin/ProductModule/Option')
const OptionSubOption = use('App/Models/Admin/ProductModule/OptionSubOption')
const Query = use('Query')
const moment = require("moment");
const searchInFields = [
    'id',
    'name',
]
class OptionController {
    async index({ request, response }) {
        const query = Option.query()

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
                switch (filter.name) {
                    case 'created_at':
                        query.whereRaw(               typeof filter.value == "object"                 ? `DATE(${filter.name}) between '${filter.value.startDate}' and '${filter.value.endDate}'`                 : `DATE(${filter.name}) = '${moment(filter.value).format(                     "YYYY-MM-DD"                   )}'`             );
                        break;
                    case 'updated_at':
                        query.whereRaw(               typeof filter.value == "object"                 ? `DATE(${filter.name}) between '${filter.value.startDate}' and '${filter.value.endDate}'`                 : `DATE(${filter.name}) = '${moment(filter.value).format(                     "YYYY-MM-DD"                   )}'`             );
                        break;
                    default:
                        query.whereRaw(`${filter.name} LIKE '%${filter.value}%'`)
                        break;
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

    async storeSubOptions(id, request) {

        await OptionSubOption
            .query()
            .where('option_id', id)
            .delete()

        if (request.input('have_sub_option') && request.input('options')) {
            var SubOptionData = []
            const optionsData = JSON.parse(request.input('options'))
            optionsData.forEach((data, index) => {
                SubOptionData.push(
                    {
                        option_id: id,
                        sub_option_id: data.sub_option_id,
                        sort_order: index,
                    }
                )
            })

            await OptionSubOption.createMany(SubOptionData)
        }
        return true
    }

    async store({ request, response }) {
        const query = new Option()
        query.name = request.input('name')
        query.have_priority = request.input('have_priority')
        query.have_sub_option = request.input('have_sub_option')
        await query.save()

        this.storeSubOptions(query.id, request)
        return response.status(200).send({ message: 'Create successfully' })
    }

    async show({ params, response }) {
        const query = await Option.query()
            .with('subOption', (builder) => {
                builder.orderBy("sort_order", 'ASC');
            })
            .where('id', params.id).first()

        return response.status(200).send(query)
    }

    async update({ params, request, response }) {
        const query = await Option.findOrFail(params.id)
        query.name = request.input('name')
        query.have_priority = request.input('have_priority')
        query.have_sub_option = request.input('have_sub_option')
        await query.save()

        this.storeSubOptions(query.id, request)
        return response.status(200).send({ message: 'Update successfully' })
    }

    async destroy({ params, response }) {
        const query = await Option.findOrFail(params.id)
        try {
            await query.delete()
            return response.status(200).send({ message: 'Delete successfully' })
        } catch (error) {
            return response.status(423).send({ message: 'Something went wrong' })
        }
    }

    async subOptions({ response }) {
        const query = OptionSubOption.query()
        const result = await query.fetch()
        return response.status(200).send(result)
    }
}

module.exports = OptionController
