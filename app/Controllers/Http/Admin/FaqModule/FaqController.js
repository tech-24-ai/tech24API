'use strict'

const Faq = use('App/Models/Admin/FaqModule/Faq')
const Query = use('Query')
const moment = require("moment");
const Excel = require("exceljs");
const searchInFields = [
     'faqs.name', 'faqs.details', 'faq_categories.name'
]
class FaqController {
    async index({ request, response }) {

        const query = Faq.query()

        const search = request.input('search')
        const orderBy = request.input('orderBy')
        const orderDirection = request.input('orderDirection')
        const searchQuery = new Query(request, { order: 'id' })

        query.select('faqs.*');
        query.select('faq_categories.name as faq_category');


        query.leftJoin('faq_categories', 'faq_categories.id', 'faqs.faq_category_id')

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
                        query.whereRaw(`DATE(faqs.${filter.name}) = '${moment(filter.value).format('YYYY-MM-DD')}'`)
                        break;
                    case 'updated_at':
                        query.whereRaw(`DATE(faqs.${filter.name}) = '${moment(filter.value).format('YYYY-MM-DD')}'`)
                        break;
                    case 'faq_category':
                        query.whereRaw(`faq_categories.name LIKE '%${filter.value}%'`)
                        break;
                    default:
                        query.whereRaw(`faqs.${filter.name} LIKE '%${filter.value}%'`)
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
        const query = new Faq()
        query.faq_category_id = request.input('faq_category_id')
        query.name = request.input('faq_question')
        query.details = request.input('faq_answer')
        await query.save()
        return response.status(200).send({ message: 'Created successfully' })
    }

    async show({ params, response }) {
        const query = await Faq.findOrFail(params.id)
        const faq_category = await query.faq_category().fetch()
        if (faq_category) {
            query.faq_category = faq_category.name
        } else {
            query.faq_category = ''
        }
        return response.status(200).send(query)
    }

    async update({ params, request, response }) {
        const query = await Faq.findOrFail(params.id)
        query.faq_category_id = request.input('faq_category_id')
        query.name = request.input('faq_question')
        query.details = request.input('faq_answer')
        await query.save()
        return response.status(200).send({ message: 'Updated successfully' })
    }

    async destroy({ params, response }) {
        const query = await Faq.findOrFail(params.id)
        try {
            await query.delete()
            return response.status(200).send({ message: 'Deleted successfully' })
        } catch (error) {
            return response.status(423).send({ message: 'Something went wrong' })
        }
    }

    async exportReport({ request, response, auth }) {

        const query = Faq.query()

        const search = request.input('search')
        const orderBy = request.input('orderBy')
        const orderDirection = request.input('orderDirection')
        const searchQuery = new Query(request, { order: 'id' })

        query.select('faqs.*');
        query.select('faq_categories.name as faq_category');


        query.leftJoin('faq_categories', 'faq_categories.id', 'faqs.faq_category_id')

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
                        query.whereRaw(`DATE(faqs.${filter.name}) = '${moment(filter.value).format('YYYY-MM-DD')}'`)
                        break;
                    case 'updated_at':
                        query.whereRaw(`DATE(faqs.${filter.name}) = '${moment(filter.value).format('YYYY-MM-DD')}'`)
                        break;
                    case 'faq_category':
                        query.whereRaw(`faq_categories.name LIKE '%${filter.value}%'`)
                        break;
                    default:
                        query.whereRaw(`faqs.${filter.name} LIKE '%${filter.value}%'`)
                        break;
                }
            })
        }

        var result = await query.fetch()

        const fileName = "faqs-" + moment().format('yyyy-MM-DD') + ".xlsx";
        let workbook = new Excel.Workbook();
        let worksheet = workbook.addWorksheet("FAQ List");
        let font = { name: "Arial", size: 12 };

        const data = await result.toJSON();
        let exportData = [];
        let index = 1;
        if (data) {
            data.forEach((element) => {

                exportData.push({
                    sno: index++,
                    faq_category: element.faq_category,
                    name: element.name,
                    details: element.details,
                    created: element.created_at,
                    updated: element.updated_at,
                });
            });


        }


        let columns = [
            { header: "S. No.", key: "sno", width: 10, style: { font: font } },
            { header: "FAQ Category", key: "faq_category", width: 30, style: { font: font } },
            { header: "Question", key: "name", width: 40, style: { font: font } },
            { header: "Answer", key: "details", width: 60, style: { font: font } },
            { header: "Created", key: "created_at", width: 30, style: { font: font } },
            { header: "Updated", key: "updated_at", width: 30, style: { font: font } },
        ];


        worksheet.getColumn(4).alignment = { wrapText: true };
        worksheet.getColumn(3).alignment = { wrapText: true };
        
        worksheet.columns = columns;
        worksheet.addRows(exportData);

        worksheet.getCell("B1", "C1").fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "cccccc" },
        };


        response.header(
            `Content-Type`,
            `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
        );
        response.header(`Content-Disposition`, `attachment; filename="${fileName}`);
        return workbook.xlsx.writeBuffer(response);
    }

}

module.exports = FaqController
