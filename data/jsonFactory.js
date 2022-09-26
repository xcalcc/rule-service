module.exports = {
    transformRuleSetJson(dataList) {
        return dataList.map(data => {
            let constructed = {
                core_string: data.core_string,
                csv_string: data.csv_string,
                severity: data.severity,
                likelihood: data.likelihood,
                master_id: data.master_id,
                id: data.id,
                alias: {}, //alias in other ruleset
                standard: {},
            };
            typeof data.owasp_map === 'string' && data.owasp_map.trim() && (constructed.standard.owasp = data.owasp_map);
            typeof data.cwe_map === 'string' && data.cwe_map.trim() && (constructed.standard.cwe = data.cwe_map);
            typeof data.p3csec_map === 'string' && data.p3csec_map.trim() && (constructed.standard.p3csec = data.p3csec_map);
            typeof data.cert_map === 'string' && data.cert_map.trim() && (constructed.alias.cert = data.cert_map);

            return constructed;
        });
    },
    transformPathMsgJson(dataList, locale = 'en') {
        switch (locale) {
            case 'cn':
                return dataList.map(data => ({
                    id: data.id,
                    msg: data.msg_cn || '',
                }));
            case 'en':
            default:
                return dataList.map(data => ({
                    id: data.id,
                    msg: data.msg_en || '',
                }));
        }
    },
    transformStandardJson(dataList, locale = 'en') {
        let dataObj = {};
        switch (locale) {
            case 'cn':
                dataList.forEach(data => {
                    dataObj[data.id] = {
                        msg: data.standard_name_cn || '',
                        url: data.url || '',
                    }
                });
            case 'en':
            default:
                dataList.forEach(data => {
                    dataObj[data.id] = {
                        msg: data.standard_name || '',
                        url: data.url || '',
                    }
                });
        }
        return dataObj;
    },
    transformMasterRuleJson(dataList, locale = 'en') {
        switch (locale) {
            case 'cn':
                return dataList.map(data => ({
                    master_id: data.master_id,
                    category: data.category,
                    language: data.language,
                    ruleSet: data.ruleSet,
                    code: data.code,
                    name: data.rule_name_cn,
                    desc: data.rule_description_cn,
                    msg_templ: data.message_template_chi,
                }));
            case 'en':
            default:
                return dataList.map(data => ({
                    master_id: data.master_id,
                    category: data.category,
                    language: data.language,
                    ruleSet: data.ruleSet,
                    code: data.code,
                    name: data.rule_name_en,
                    desc: data.rule_description_en,
                    msg_templ: data.message_template_eng,
                }));
        }
    },
    columnMap: {
        normalizedMap: {
            ruleSet: {
                A: 'csv_string',
                B: 'core_string',
                D: 'severity',
                E: 'likelihood',
                F: 'cost',
                H: 'source_or_sink',
                J: 'cert_map',
                K: 'owasp_map',
                L: 'cwe_map',
                M: 'p3csec_map',
                N: 'master_id',
            },
            pathMsg: {
                B: 'id',
                C: 'msg_en',
                D: 'msg_cn',
            }
        },
        masterMap: {
            master: {
                A: 'master_id',
                B: 'category',
                C: 'language',
                D: 'ruleSet',
                F: 'code',
                G: 'rule_name_en',
                H: 'rule_name_cn',
                I: 'rule_description_en',
                J: 'rule_description_cn',
                M: 'message_template_eng',
                N: 'message_template_chi',
            },
            standard: {
                A: 'id',
                B: 'standard_name',
                C: 'standard_name_cn',
                D: 'url',
            }
        },
    }
};
