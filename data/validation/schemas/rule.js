'use strict';

const ruleSchema = {
    id: '/RuleSchema',
    $recursiveAnchor: true,
    type: 'object',
    properties: {
        category: {type: 'string'},
        language: {type: 'string'},
        code: {type: 'string'},
        master_id: {type: 'number'},
        severity: {
            type: 'string',
            enum: ["HIGH", "MEDIUM", "LOW"]
        },
        likelihood: {
            type: 'string',
            enum: ["PROBABLE", "UNLIKELY", "LIKELY"]
        },
        cost: {
            type: 'string',
            enum: ["HIGH", "MEDIUM", "LOW"]
        },
        examples: {
            type: 'object',
            properties: {
                good: {
                    type: 'object',
                    properties: {
                        cpp: {
                            type: 'array'
                        },
                        java: {
                            type: 'array'
                        },
                        c: {
                            type: 'array'
                        },
                        general: {
                            type: 'array'
                        },
                    }
                },
                bad: {
                    type: 'object',
                    properties: {
                        cpp: {
                            type: 'array'
                        },
                        java: {
                            type: 'array'
                        },
                        c: {
                            type: 'array'
                        },
                        general: {
                            type: 'array'
                        },
                    }
                }
            }
        },
        msg_templ: {type: 'string'},
        name: {type: 'string'},
        desc: {type: 'string'},
        details: {type: 'string'},
        alias: {type: 'object'},
        standards: {type: 'object'},
        csv_string: {type: 'array'},

        ruleSet: {type: 'object', properties: {

            }},
    },
    required: [ 'code', 'language', 'name',]
};

const ruleListSchema = {
    id: '/RuleListSchema',
    type: 'array',
    items: {
        type: 'object',
        $ref: '/RuleSchema'
    }
};

module.exports = {
    ruleListSchema,
    ruleSchema,
}

