const path = require('path');
const Schema = require('../../data/validation/schemas');
const validator = require('../../data/validation');

it('should pass validation for json files', ()=> {
    expect(validator.validateOnce()).toBeTruthy();
});

it('should fail the validation when data got error', ()=> {
    const failedCaseForBlt = path.resolve(__dirname, './mock/bltFailedCase.json');
    const validateResult = validator.validateFile(failedCaseForBlt, Schema.ruleSetsSchema);
    expect(validateResult.passed).toBeFalsy();
})