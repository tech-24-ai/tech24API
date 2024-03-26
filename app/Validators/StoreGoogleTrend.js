'use strict'

class StoreGoogleTrend {
  get rules() {
    return {
      vendor_id: 'required',
      trends_score: 'required',
      date: 'required',
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

module.exports = StoreGoogleTrend
