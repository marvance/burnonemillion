var mongoose = require('mongoose')

var BadgeSchema = new mongoose.Schema({
	title: String,
	summary: String,
	img: String
})

var BadgeModel = mongoose.model('Badge', BadgeSchema)



module.exports = BadgeModel


