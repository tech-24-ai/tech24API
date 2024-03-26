'use strict'

const SubOption = use('App/Models/Admin/ProductModule/SubOption')
const Query = use('Query')
const moment = require("moment");
const searchInFields = [
    'id',
    'name',
]
class SubOptionController {
    async index({ request, response, view }) {
        const query = SubOption.query()

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

    async store({ request, response }) {
        const query = new SubOption()
        query.name = request.input('name')
        await query.save()
        return response.status(200).send({ message: 'Create successfully' })
    }

    async show({ params, request, response, view }) {
        const query = await SubOption.findOrFail(params.id)
        return response.status(200).send(query)
    }

    async update({ params, request, response }) {
        const query = await SubOption.findOrFail(params.id)
        query.name = request.input('name')
        await query.save()
        return response.status(200).send({ message: 'Update successfully' })
    }

    async destroy({ params, request, response }) {
        const query = await SubOption.findOrFail(params.id)
        try {
            await query.delete()
            return response.status(200).send({ message: 'Delete successfully' })
        } catch (error) {
            return response.status(423).send({ message: 'Something went wrong' })
        }
    }
}

module.exports = SubOptionController
