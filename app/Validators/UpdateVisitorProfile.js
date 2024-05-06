'use strict'

class UpdateVisitorProfile {
  get rules() {
   
	return {
		first_name: 'required',
		country: 'required',
		city_district: 'required',
		job_title: 'required',
		company: 'required',
		mobile: 'required',
		alternate_email: 'email',
	}
   
  }

  get validateAll() {
    return true
  }

  async fails(errorMessages) {
    return this.ctx.response.status(422).send(errorMessages)
  }
}

module.exports = UpdateVisitorProfile
