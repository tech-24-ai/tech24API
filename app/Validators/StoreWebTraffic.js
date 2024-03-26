'use strict'

class StoreWebTraffic {
  get rules() {
    return {
      vendor_id: 'required',
      web_ranking: 'required',
      page_view_per_user: 'required',
      page_view_per_million: 'required',
      reach_per_million: 'required',
      month: 'required',
      monht_id:'required',
      year: 'required',
    }
  }

  get validateAll() {
    return true
  }

  async fails(errorMessages) {
    return this.ctx.response.status(422).send(errorMessages)
  }
}

module.exports = StoreWebTraffic
