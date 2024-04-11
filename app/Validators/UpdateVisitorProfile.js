'use strict'

class UpdateVisitorProfile {
  get rules() {
   
	return {
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
