'use strict'

const Subcription = use("App/Models/Subcription");
const Query = use("Query");
const TransactionHistory = use("App/Models/TransactionHistory");
const moment = require("moment");
const Excel = require("exceljs");
const Investor = use("App/Models/Investor");

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

/**
 * Resourceful controller for interacting with subcriptions
 */


const requestOnly = [
  "payment_transaction_id",
  "transaction_status",
  "transaction_date",
  "transaction_amount",
  "transaction_details",
  "created_by",
  "updated_by"
];

const searchInFields = ["id", "payment_transaction_id", "transaction_status", "created_by"];

class TranscationHistoryController {
  /**
   * Show a list of all transcationhistories.
   * GET transcationhistories
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index({ request, response, view }) {

    const query = TransactionHistory.query()

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

    query.with('users');

    var investorfiltername = "";


    if (request.input('filters')) {
      const filters = JSON.parse(request.input('filters'))
      filters.forEach(filter => {
        switch (filter.name) {
          case 'users.name':
            investorfiltername = filter.value;  
            break;
       
          case 'created_at':
            query.whereRaw(`DATE(transaction_histories.${filter.name}) = '${moment(filter.value).format('YYYY-MM-DD')}'`)
            break;
          case 'updated_at':
            query.whereRaw(`DATE(transaction_histories.${filter.name}) = '${moment(filter.value).format('YYYY-MM-DD')}'`)
            break;
          case 'transaction_status':
            query.whereRaw(`transaction_histories.transaction_status LIKE '%${filter.value}%'`)
            break;
          default:
            query.whereRaw(`transaction_histories.${filter.name} LIKE '%${filter.value}%'`)
            break;
        }
      })
    }

    if (investorfiltername.length > 0) {
      const investorids = await Investor.query().whereRaw(`name LIKE '%${investorfiltername}%'`).pluck('id');
      if(investorids.length>0) query.whereRaw('user_id in (?)', [investorids]);
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

  /**
   * Render a form to be used for creating a new transcationhistory.
   * GET transcationhistories/create
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async create({ request, response, view }) {
    const query = new TransactionHistory()
    query.payment_transaction_id = request.input('payment_transaction_id')
    query.transaction_status = request.input('transaction_status')
    query.transaction_amount = request.input('transaction_amount')
    query.transaction_details = request.input('transaction_details')
    query.transaction_date = request.input('transaction_date')
    query.transaction_details = request.input('transaction_details')
    await query.save()
    return response.status(200).send({ message: 'Created successfully' })
  }

  /**
   * Create/save a new transcationhistory.
   * POST transcationhistories
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store({ request, response }) {
    const query = new TransactionHistory()
    query.payment_transaction_id = request.input('payment_transaction_id')
    query.transaction_status = request.input('transaction_status')
    query.transaction_amount = request.input('transaction_amount')
    query.transaction_details = request.input('transaction_details')
    query.transaction_date = request.input('transaction_date')
    await query.save()
    return response.status(200).send({ message: 'Created successfully' })
  }

  /**
   * Display a single transcationhistory.
   * GET transcationhistories/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show({ params, request, response, view }) {
    const query = TransactionHistory.query();
    query.where("id", params.id);
    query.with('users');
    //return response.status(200).send(query)
    var result
    result = await query.fetch();

    return response.status(200).send(result);
  }


  /**
   * Update transcationhistory details.
   * PUT or PATCH transcationhistories/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({ params, request, response }) {
    const query = await TransactionHistory.findOrFail(params.id)
    query.payment_transaction_id = request.input('payment_transaction_id')
    query.transaction_status = request.input('transaction_status')
    query.transaction_amount = request.input('transaction_amount')
    query.transaction_details = request.input('transaction_details')
    query.transaction_date = request.input('transaction_date')
    await query.save()
    return response.status(200).send({ message: 'Updated successfully' })
  }

  /**
   * Delete a transcationhistory with id.
   * DELETE transcationhistories/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy({ params, request, response }) {
    const query = await TransactionHistory.findOrFail(params.id)
    try {
      await query.delete()
      return response.status(200).send({ message: 'Deleted successfully' })
    } catch (error) {
      return response.status(423).send({ message: 'Something went wrong' })
    }
  }

  async exportReport({ request, response, view }) {

    const query = TransactionHistory.query()

    const search = request.input('search')
    const orderBy = request.input('orderBy')
    const orderDirection = request.input('orderDirection')
    const searchQuery = new Query(request, { order: 'id' })

    query.with('users', (builder) => {
      builder.select('id', 'name')
    });

    if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection)
    }

    if (search) {
      query.where(searchQuery.search(searchInFields))
    }

    query.with('users');
    if (request.input('filters')) {
      const filters = JSON.parse(request.input('filters'))
      filters.forEach(filter => {
        switch (filter.name) {
          case 'created_at':
            query.whereRaw(`DATE(transaction_histories.${filter.name}) = '${moment(filter.value).format('YYYY-MM-DD')}'`)
            break;
          case 'updated_at':
            query.whereRaw(`DATE(transaction_histories.${filter.name}) = '${moment(filter.value).format('YYYY-MM-DD')}'`)
            break;
          case 'transaction_status':
            query.whereRaw(`transaction_histories.transaction_status LIKE '%${filter.value}%'`)
            break;
          default:
            query.whereRaw(`transaction_histories.${filter.name} LIKE '%${filter.value}%'`)
            break;
        }
      })
    }

    var result = await query.fetch()

    const fileName = "investor-subscription-" + moment().format('yyyy-MM-DD') + ".xlsx";
    let workbook = new Excel.Workbook();
    let worksheet = workbook.addWorksheet("Investor Subscription List");
    let font = { name: "Arial", size: 12 };

    const data = await result.toJSON();
    let exportData = [];
    let index = 1;

    if (data) {
      data.forEach((element) => {

        let paypal_txn_id = "NA"
        if (element.payment_transaction_id) {
          paypal_txn_id = element.payment_transaction_id
        }

        let name = "NA"
        if(element.users){
          name = element.users.name;
        }

        exportData.push({
          sno: index++,
          paypal_id: paypal_txn_id,
          investor: name,
          transaction_status: element.transaction_status,
          transaction_details: element.transaction_details,
          transaction_amount: element.transaction_amount,
          transaction_date: element.transaction_date,
          created: element.created_at,
          updated: element.updated_at,
        });
      });


    }


    let columns = [
      { header: "S. No.", key: "sno", width: 10, style: { font: font } },
      { header: "PayPal ID", key: "paypal_id", width: 30, style: { font: font } },
      { header: "Investor/Company User Name", key: "investor", width: 30, style: { font: font } },
      { header: "Transaction Status", key: "transaction_status", width: 30, style: { font: font } },
      { header: "Transaction Details", key: "transaction_details", width: 40, style: { font: font } },
      { header: "Transaction ID", key: "transaction_id", width: 30, style: { font: font } },
      { header: "Transaction Date", key: "transaction_date", width: 30, style: { font: font } },
      { header: "Transaction Amount in USD", key: "transaction_amount", width: 30, style: { font: font } },
      { header: "Created", key: "created_at", width: 30, style: { font: font } },
      { header: "Updated", key: "updated_at", width: 30, style: { font: font } },
    ];


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

module.exports = TranscationHistoryController
