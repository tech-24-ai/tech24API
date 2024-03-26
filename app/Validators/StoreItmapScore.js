'use strict'

class StoreItmapScore {
  get rules() {
    return {
      vendor_id: 'required',
      overall_score: 'required',
      vendor_visiblity_score: 'required',
      vendor_visiblity_score_system: 'required',
      short_term_technology_score: 'required',
      long_term_technology_score: 'required',
      innovation_value_score: 'required',
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

module.exports = StoreItmapScore
