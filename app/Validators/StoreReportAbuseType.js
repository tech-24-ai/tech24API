'use strict'

class StoreReportAbuseType {
	get rules() {
		const id = this.ctx.params.id
		if (id) {
			return {
				name: `required|unique:report_abuse_types,name,id,${id}`,
			}
		} else {
			return {
				name: 'required|unique:report_abuse_types,name',
			}
		}	
	}

	get validateAll() {
		return true
	}

	async fails(errorMessages) {
		return this.ctx.response.status(422).send(errorMessages)
	}
}

module.exports = StoreReportAbuseType
