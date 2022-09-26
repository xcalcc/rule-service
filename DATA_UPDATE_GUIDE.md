# Data update guide
## Sources
Data sources for rule information are all stored in ```./data/source``` folder.
There are 4 parts of data:
1. Rulesets info - stored in ```./data/source/normalized_rule_map.xlsx```, 
   contains rule code map by rulesets and path massage mappings.
   
**Conventions**: enum value in column ```O``` needs to be sequential.
   
**Maintainer** [Sun.Chan](mailto:sun.chan@xcalibyte.com). online sheet:
Normalized rule map is in xcalibyte sharepoint 
   
2. Rule master info - stored in ```./data/source/RuleSetMaster.xlsx```, contains collection of rule info, 
   compare to ruleset map, this sheet is about a collection of all meta info for each rule. Besides, extra mapping for 
   from rule to standards mappings and standard details are also contained by this file.
   
**Conventions**: Ignore Column K/L for Rule master, which has been extracted to files and maintained separately.

**Maintainer**: [William.Chiuman](mailto:william.chiuman@xcalibyte.com)/[Yanwen.Lu](mailto:yanwen.lu@xcalibyte.com)

3. Rule details - stored in ```./data/source/raw/details/```, originally extracted from rule master sheet. This folder
   contains a list of folders named by rule code, each rule code folder contains details in Chinese and in English, 
   and example codes identified by its extension name, the ```.txt``` is for general which is unknown for languages.
   You can register new language with file extension in ```./data/configs.js```.

**Conventions**: Leave the example file empty other than delete them. Make sure the syntax are correct for each language.
Use markdown preview tool for formatting check on details(.md) files. 

File list in Rule Code folder:
- details_en.md
- details_cn.md
- example_good_{n}.{ext}
- example_bad_{n}.{ext}

If there are multiple examples, naming convention will be example_(good|bad)(_{n}).{ext}, for example, 
```example_good_1.c```, ```example_good_2.c```.

When extension is .txt, it will be treated as general language(unspecified)

**Maintainer**: [Sun.Chan](mailto:sun.chan@xcalibyte.com)/[William.Chiuman](mailto:william.chiuman@xcalibyte.com)/[Yanwen.Lu](mailto:yanwen.lu@xcalibyte.com)

4. Custom rules - Client will send copy of custom json here, need authorization, stored by user. Details TBD.

## Utilities
###v2csv

Written in C, maintained by [Shinming.Liu](mailto:shinming.liu@xcalibyte.com)/[Jeremy.Zhao](mailto:shinming.liu@xcalibyte.com).
As a git submodule sits in ```./data/source/v2csv```, make sure you when you clone this new project and run: 
```shell
$>git submodule update --init --recursive
```
Each time if there is any new commit on the rule service project, you also need to run
```shell
$>git submodule update --recursive
```
After this, run below command to get a new compiled version of csv reader, which will convert all derived csvs to json 
for data serving.
```shell
$>yarn compile-csvreader
```

## Generating new data
Just run below you will have latest data from *normalized_rule_map.xlsx* and *RuleSetMaster.xlsx*, remember to commit them.
After that when service is re-deployed, new data will be ready to serve.
```shell
$>yarn gen-data
```
