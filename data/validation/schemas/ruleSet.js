'use strict';

const ruleSetSchema = {
    id: '/RuleSetSchema',
    type: 'object',
    properties: {
        core_string: {
            type: 'string'
        },
        csv_string: {
            type: 'string'
        },
        master_id: {
            type: 'integer'
        },
        id: {
            type: 'integer'
        },
    },
    required: ['id', 'master_id', 'csv_string', 'core_string',]
}

const ruleSetsSchema = {
    id: '/RuleSets',
    type: 'array',
    items: {
        type: 'object',
        $ref: '/RuleSetSchema'
    }
}

module.exports = {
    ruleSetSchema,
    ruleSetsSchema,
}