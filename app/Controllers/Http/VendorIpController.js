'use strict'

const VendorIp = use('App/Models/VendorIp')

const Query = use('Query')
const moment = require("moment");

const searchInFields = [
    'patent_count',
    'year',
    'quarter',
]
const patentService = require("../../services/patents.service");
const { formatResponse } = require("../../Helper/stats");

class VendorIpController {

    async index({ request, response }) {

        const query = VendorIp.query()
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
        const query = new VendorIp()

        query.vendor_id = request.input('vendor_id')
        query.patent_count = request.input('patent_count')
        query.year = request.input('year')
        query.quarter = request.input('quarter')

        await query.save()
        return response.status(200).send({ message: 'Create successfully' })
    }

    async show({ params, response }) {
        const query = VendorIp.query()
        query.where('id', params.id)
        const result = await query.firstOrFail()
        return response.status(200).send(result)
    }

    async update({ params, request, response }) {
        const query = await VendorIp.findOrFail(params.id)
        query.vendor_id = request.input('vendor_id')
        query.patent_count = request.input('patent_count')
        query.year = request.input('year')
        query.quarter = request.input('quarter')
        await query.save()
        return response.status(200).send({ message: 'Update successfully' })
    }

    async destroy({ params, response }) {
        const query = await VendorIp.findOrFail(params.id)
        try {
            await query.delete()
            return response.status(200).send({ message: 'Delete successfully' })
        } catch (error) {
            return response.status(423).send({ message: 'Something went wrong' })
        }
    }

    async ips_stats({ params, response }) {
        const query = VendorIp.query();
        query.where("vendor_id", params.id);
        const result = await query.fetch();
        const stats = await patentService.getIPSstats(
          params.id,
          "patent_count"
        );
        return response
          .status(200)
          .send(formatResponse(stats, result, "patent_count"));
      }
}

module.exports = VendorIpController
