'use strict'

const VendorFundingList = use('App/Models/VendorFundingList')

const Query = use('Query')
const moment = require("moment");

const searchInFields = [
    'type_of_funding',
    'funded_by',
    'date_of_funding',
    'currency',
    'funding_amount',
]

class VendorFundingListController {

    async index({ request, response }) {

        const query = VendorFundingList.query()
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

        if (request.input('vendor_id')) {
            query.where('vendor_id', request.input('vendor_id'))
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

        if (request.input('start_date') && request.input('end_date')) {
            query.whereRaw(`DATE(created_at) >= '${request.input('start_date')}'`)
            query.whereRaw(`DATE(created_at) <= '${request.input('end_date')}'`)
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
        const query = new VendorFundingList()

        query.vendor_id = request.input('vendor_id')
        query.type_of_funding = request.input('type_of_funding')
        query.funded_by = request.input('funded_by')
        query.date_of_funding = request.input('date_of_funding')
        query.currency = request.input('currency')
        query.funding_amount = request.input('funding_amount')

        await query.save()
        return response.status(200).send({ message: 'Create successfully' })
    }

    async show({ params, response }) {
        const query = VendorFundingList.query()
        query.where('id', params.id)
        const result = await query.firstOrFail()
        return response.status(200).send(result)
    }

    async update({ params, request, response }) {
        const query = await VendorFundingList.findOrFail(params.id)
        query.vendor_id = request.input('vendor_id')
        query.type_of_funding = request.input('type_of_funding')
        query.funded_by = request.input('funded_by')
        query.date_of_funding = request.input('date_of_funding')
        query.currency = request.input('currency')
        query.funding_amount = request.input('funding_amount')
        await query.save()
        return response.status(200).send({ message: 'Update successfully' })
    }

    async destroy({ params, response }) {
        const query = await VendorFundingList.findOrFail(params.id)
        try {
            await query.delete()
            return response.status(200).send({ message: 'Delete successfully' })
        } catch (error) {
            return response.status(423).send({ message: 'Something went wrong' })
        }
    }
}

module.exports = VendorFundingListController
