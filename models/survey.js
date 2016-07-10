const bcrypt = require('bcrypt-nodejs');
const crypto = require('crypto');
const mongoose = require('mongoose');
const sanitizerPlugin = require('mongoose-sanitizer');
var User = require('./User');

// Schema for survey
const surveySchema = new mongoose.Schema({
// Special stats
  surveyID: { type: String, unique: true, sparse: true},
  created_by: { type: Schema.Types.ObjectId, ref: 'User' },
// Survey hum props
  shortTitle: String,
  question: String,
// Options object array
  options: [{
     optionText: {type: String, unique: true},
     rankScore: Number,
     statData: [{
        totalScore: Number,
        voters: Number,
        deviationScore: Number,
        repetitionScore: Number
     }],
     voters:[{voterIP: String}] 
    }],
}, { timestamps: true });

// Verify author via author ID
surveySchema.methods.verifyAuthor = function(authorID, cb) {
  isAuthor = (this.populate('created_by', ['_id']) == authorID) ? true : false;
  cb(err, isAuthor);
};

// Sanitize all inputs
surveySchema.plugin(sanitizerPlugin);

const Survey = mongoose.model('Survey', surveySchema);

module.exports = Survey;
