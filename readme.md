Markdown scanner and Confluence importer
---

This project contains a NodeJs module that scans all markdowns of a specified directory recursively and imports them into Confluence as Confluence markup.



Getting started
---
Install scan-md-confluence via npm:
```
$ npm install scan-md-confluence
```

##### Usage
```
$ node scan-md-confluence --config=./configuration.json
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