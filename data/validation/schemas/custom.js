'use strict';

const customRuleSchema = {
    id: '/CustomRuleSchema',
    $recursiveAnchor: true,
    type: 'object',
    properties: {
        category: {type: 'string'},
        code: {type: 'string'},
        language: {type: 'string'},
        name: {type: 'string'},
        description: {type: 'string'},
        msg_templ: {type: 'string'},
        severity: {
            type: 'string',
            enum: ['L', 'M', 'H']
        },
        likelihood: {
            type: 'string',
            enum: ['L', 'P', 'U']
        },
        cost: {
            type: 'string',
            enum: ['L', 'M', 'H']
        },
        details: {type: 'string'},
        examples: {
            type: 'object',
            properties: {
                good: {type: 'object'},
                bad: {type: 'object'},
            }
        },
    },
    required: ['code', 'language', 'name', ]
};

const customRuleInfoSchema = {
    id: '/CustomRuleInfoSchema',
    type: 'object',
    properties: {
        rules: {
            type: 'array',
            items: {
                type: 'object',
                $ref: '/CustomRuleSchema'
            },
        },
        pathMsg: {
            type: 'object',
            properties: {
                offset: {type: 'number'},
                msgs: {
                    type: 'array',
                    items: {
                        type: 'object',
                        $ref: '/PathMsgSchema'
                    },
                }
            },
        },
    },
}

module.exports = {
    customRuleSchema,
    customRuleInfoSchema,
}