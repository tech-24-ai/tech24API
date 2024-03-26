'use strict'

class StoreReportAbuse {
	get rules() {
		const id = this.ctx.params.id
		return {
			report_abuse_type_id: 'required',
			community_id: 'required',
			community_post_id: 'required',
			community_post_reply_id: 'required',
			reason: 'required',
		}
	}

	get validateAll() {
		return true
	}

	async fails(errorMessages) {
		return this.ctx.response.status(422).send(errorMessages)
	}
}

module.exports = StoreReportAbuse
