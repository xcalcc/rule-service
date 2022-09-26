# Rule-service

A service to serve rule information

## Data source generation
There are two major xlsx files to serve as data source
- normalized_rule_map.xlsx (rulesets/path messages)
- RuleSetMaster.xlsx (rule information)

This service will convert these two files into .csv then calling csvreader executable file to convert json and 
  store in ```data/output/```

## Submodules
First time pull
```shell
$>git submodule update --init --recursive
```
Later pull recursively
```shell
$>git submodule update --recursive --remote
```

### csvreader
A tool to transform csv to json

### rule-details


### Prerequisites:
- Latest source code of v2csv: https://github.com/xcalcc/v2csv.git
- Precompile the csvreader before generating data

## Compile csvreader
```shell
$> yarn compile-csvreader
```

## Generate data
```shell
$> yarn gen-data
```

## Validate data
```shell
$> yarn validate-data
```

## Start dev (with nodemon)
```shell
$> yarn start-dev
```

## Start (for production usage)
```shell
$> yarn start
```

## Test
```
$> yarn test
```

## Docker

### Build & Run
```
$> docker-compose up --build
```

### Integrate extra rules
For extra rules, set ```EXTRA_RULE_FILES``` in env file, separated by ",", prepare folders accordingly in ```/data/output/miscellaneous/input/```, put
```rules_cn.json``` and ```rules_en.json```

## Custom Rule ##
| :boom: Custom rule will be based on project id              |
|:---------------------------|
| Each Xcalscan ready project will have a folder called .xcalscan-rules, inside which there will be a rules.json, and .mi file, rule service will always store the json and save it with gzip compression |
| For custom data serving, normally you need to provide a project ID to retrieve back the rule info|

## How to add a standard
1. Add a tab in rule master table meets the format requirements as other standards
2. transformer.js add new entry to read new tab
3. output csv add record
4. convertingJson add new argument for the tab
5. Add new class for the standard
