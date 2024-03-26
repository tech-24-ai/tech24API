'use strict'

const Contact = use('App/Models/Admin/ContactModule/Contact')
const Query = use('Query')
const Excel = require("exceljs");
const moment = require("moment");
const searchInFields = [
    'contacts.id',
    'contacts.organisation_name',
]
class ContactController {
    async index({ request, response }) {

        const query = Contact.query()

        const search = request.input('search')
        const orderBy = request.input('orderBy')
        const orderDirection = request.input('orderDirection')
        const searchQuery = new Query(request, { order: 'id' })

        query.select('contacts.*');
        query.select('contact_types.name as contact_type');


        query.leftJoin('contact_types', 'contact_types.id', 'contacts.contact_type_id')

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
                        query.whereRaw(`DATE(contacts.${filter.name}) = '${moment(filter.value).format('YYYY-MM-DD')}'`)
                        break;
                    case 'updated_at':
                        query.whereRaw(`DATE(contacts.${filter.name}) = '${moment(filter.value).format('YYYY-MM-DD')}'`)
                        break;
                    case 'contact_type':
                        query.whereRaw(`contact_types.name LIKE '%${filter.value}%'`)
                        break;
                    default:
                        query.whereRaw(`contacts.${filter.name} LIKE '%${filter.value}%'`)
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
        const query = new Contact()
        query.contact_type_id = request.input('contact_type_id')
        query.organisation_name = request.input('organisation_name')
        query.requirement = request.input('requirement')
        query.company_address = request.input('company_address')
        query.website = request.input('website')
        query.domain_expertise = request.input('domain_expertise')
        query.revenue_range = request.input('revenue_range')
        query.number_employees = request.input('number_employees')
        await query.save()
        return response.status(200).send({ message: 'Create successfully' })
    }

    async show({ params, response }) {
        const query = await Contact.findOrFail(params.id)
        const contact_type = await query.contact_type().fetch()
        if (contact_type) {
            query.contact_type = contact_type.name
        } else {
            query.contact_type = ''
        }
        return response.status(200).send(query)
    }

    async update({ params, request, response }) {
        const query = await Contact.findOrFail(params.id)

        query.contact_type_id = request.input('contact_type_id')
        query.organisation_name = request.input('organisation_name')
        query.requirement = request.input('requirement')
        query.company_address = request.input('company_address')
        query.website = request.input('website')
        query.domain_expertise = request.input('domain_expertise')
        query.revenue_range = request.input('revenue_range')
        query.number_employees = request.input('number_employees')

        await query.save()
        return response.status(200).send({ message: 'Update successfully' })
    }

    async destroy({ params, response }) {
        const query = await Contact.findOrFail(params.id)

        try {
            await query.delete()
            return response.status(200).send({ message: 'Delete successfully' })
        } catch (error) {
            return response.status(423).send({ message: 'Something went wrong' })
        }
    }

    async exportReport({ request, response }) {

        const query = Contact.query()

        const search = request.input('search')
        const orderBy = request.input('orderBy')
        const orderDirection = request.input('orderDirection')
        const searchQuery = new Query(request, { order: 'id' })

        query.select('contacts.*');
        query.select('contact_types.name as contact_type');


        query.leftJoin('contact_types', 'contact_types.id', 'contacts.contact_type_id')

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
                        query.whereRaw(`DATE(contacts.${filter.name}) = '${moment(filter.value).format('YYYY-MM-DD')}'`)
                        break;
                    case 'updated_at':
                        query.whereRaw(`DATE(contacts.${filter.name}) = '${moment(filter.value).format('YYYY-MM-DD')}'`)
                        break;
                    case 'contact_type':
                        query.whereRaw(`contact_types.name LIKE '%${filter.value}%'`)
                        break;
                    default:
                        query.whereRaw(`contacts.${filter.name} LIKE '%${filter.value}%'`)
                        break;
                }
            })
        }


        var result = await query.fetch()

        const fileName = "contacts-" + moment().format('yyyy-MM-DD') + ".xlsx";
        let workbook = new Excel.Workbook();
        let worksheet = workbook.addWorksheet("Contact List");
        let font = { name: "Arial", size: 12 };

        const data = await result.toJSON();
        let exportData = [];
        let index = 1;
        if (data) {
            data.forEach((element) => {



                exportData.push({
                    sno: index++,
                    contact_type: element.contact_type,
                    organisation_name: element.organisation_name,
                    requirement: element.requirement,
                    company_address: element.company_address,
                    website: element.website,
                    domain_expertise: element.domain_expertise,
                    revenue_range: element.revenue_range,
                    number_employees: element.number_employees,
                    created: element.created_at,
                    updated: element.updated_at,
                });
            });


        }

       
        let columns = [
            { header: "S. No.", key: "sno", width: 10, style: { font: font } },
            { header: "Contact Type", key: "contact_type", width: 50, style: { font: font } },
            { header: "Organization", key: "organisation_name", width: 30, style: { font: font } },
            { header: "Requirement", key: "requirement", width: 60, style: { font: font } },
            { header: "Company Address", key: "company_address", width: 40, style: { font: font } },
            { header: "Website", key: "website", width: 40, style: { font: font } },
            { header: "Domain Expertise", key: "domain_expertise", width: 40, style: { font: font } },
            { header: "Revenue Range", key: "revenue_range", width: 40, style: { font: font } },
            { header: "Number of Employees", key: "number_employees", width: 40, style: { font: font } },            
            { header: "Created", key: "created_at", width: 30, style: { font: font } },
            { header: "Updated", key: "updated_at", width: 30, style: { font: font } },
        ];


        worksheet.getColumn(4).alignment = { wrapText: true };
        worksheet.getColumn(5).alignment = { wrapText: true };
        worksheet.getColumn(7).alignment = { wrapText: true };
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

module.exports = ContactController
