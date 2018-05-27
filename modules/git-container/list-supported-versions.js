/*
  Run this script to generate markdown used to show all language versions to users

  from project root:
  node ./modules/git-container/list-supported-versions.js node outputpath.txt
 */
const { readdirSync, writeFileSync } = require('fs')
const { resolve } = require('path')

const lang = process.argv[2]
const output = process.argv[3]

const dir = readdirSync(resolve(__dirname, 'templates', lang.toLowerCase()))
const filenameExpr = new RegExp(`^${lang}-(.*).Dockerfile$`)

const versions = []
for (const filename of dir) {
  const matches = filenameExpr.exec(filename)

  if (!matches) {
    continue
  }

  versions.push(matches[1])
}

versions.sort().reverse()

writeFileSync(output, versions.join('\n'), 'utf8')
