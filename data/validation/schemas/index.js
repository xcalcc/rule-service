const ruleSchema = require('./rule');
const ruleSetSchema = require('./ruleSet');
const customRuleSchema = require('./custom');

const masterRuleSchema = {
    id: '/MasterRules',
    type: 'array',
    items: {
        type: 'object',
        $ref: '/RuleSchema'
    },
}

const pathMsgSchema = {
    id: '/PathMsgSchema',
    type: 'object',
    properties: {
        id: {
            type: 'integer'
        },
        msg_en: {
            type: 'string'
        },
        msg_cn: {
            type: 'string'
        },
        msg: {
            type: 'string'
        }
    },
    required: ['id',]
}
const pathMsgListSchema = {
    id: '/PathMsgListSchema',
    type: 'array',
    items: {
        $ref: '/PathMsgSchema'
    }

}

const owaspSchema = {
    id: '/OwaspSchema',
    type: 'object',
    properties: {
        standard_name: {type: 'string'},
        url: {type: 'string'},
    },
    required: ['name']
}

const owaspListSchema = {
    id: '/OwaspListSchema',
    type: 'object',
    patternProperties: {
        'A': {
            $ref: '/OwaspSchema'
        }
    }
}
const cweSchema = {
    id: '/CweSchema',
    type: 'object',
    properties: {
        name: {type: 'string'},
        url: {type: 'string'},
    },
    required: ['name']
}

const cweListSchema = {
    id: '/CweListSchema',
    type: 'object',
    patternProperties: {
        'CWE': {
            $ref: '/CweSchema'
        }
    }
}
const p3cSecSchema = {
    id: '/P3cSecSchema',
    type: 'object',
    properties: {
        name: {type: 'string'},
        url: {type: 'string'},
    },
    required: ['name']
}

const p3cSecListSchema = {
    id: '/P3cSecListSchema',
    type: 'object',
    properties: {
        $ref: '/P3cSecSchema'
    }
}
const certInfoSchema = {
    id: '/CertInfoSchema',
    type: 'object',
    properties: {
        name: {type: 'string'},
        url: {type: 'string'},
    },
    required: ['name']
}

const certInfoListSchema = {
    id: '/CertInfoListSchema',
    type: 'object',
    properties: {
        $ref: '/CertInfoSchema'
    }
}

module.exports = {
    ...customRuleSchema,
    ...ruleSchema,
    ...ruleSetSchema,
    //others
    masterRuleSchema,
    pathMsgListSchema,
    pathMsgSchema,
    owaspListSchema,
    owaspSchema,
    cweListSchema,
    cweSchema,
    p3cSecListSchema,
    p3cSecSchema,
    certInfoListSchema,
    certInfoSchema,
};
