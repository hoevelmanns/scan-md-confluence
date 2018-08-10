Markdown scanner and Confluence importer
---

This project contains a NodeJs module that scans all markdowns of a specified directory recursively and imports them into Confluence as Confluence markup. 
The Confluence script can also be used to add labels to articles. 



Getting started
---
Install scan-md-confluence via npm:
```
$ npm install scan-md-confluence
```

Usage
---

##### Markdown files
In order for markdowns to be processed by the scanner, corresponding markdowns must be supplemented with metadata.

For example in top of a markdown file:

```
<!--
title: My Markdown
labels: label1, label2, label3 
-->
```

##### Configuration

```
{
  "confluence": {
    "username": "username",
    "password": "password",
    "baseUrl":  "https://{company}.atlassian.net/wiki",
    "version": 3,
    "space": "myspace",
    "parentPageId": 123,
    "markDown": {
      "codeStyling": {
        "linenumbers": true,
        "theme": "RDark"
      },
      "codeLanguageMap": {
        "markdownLanguage": "confluenceLanguage"
      }
    }
  },
  "fileEncoding": "utf8",
  "scanDirectory": "/src/"
}
```

##### Run the script
Let the scan process start:

```
$ node scan-md-confluence --scan --config=./configuration.json 
```