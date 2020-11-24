#!/usr/bin/env node

const { parser } = require('@vuese/parser')
const Render = require('@vuese/markdown-render')
const fs = require('fs')
const docs = process.env.npm_package_docs
// 开关 在项目的package.json文件添加docs 字段 
if (!docs) {
  return
}

const packageFolderName = docs.packageFolderName || 'packages'

const packages = fs.readdirSync(packageFolderName).filter((package)=>{
  if(/^\./.test(package)) return false
  return true
})

packages.map(package => {
  const contentTable = toTableStr(packageFolderName + '/' + package + '/src/index.vue')
  const contentExample = exampleToMarkdown(packageFolderName + '/' + package + '/example')
  
  fs.writeFileSync(`${packageFolderName}/${package}/docs.md`, contentExample + contentTable, 'utf-8')
})

// 生成 table
/**
 * 
 * @param {string} filePath Single File Components 文件地址
 */
function toTableStr (filePath) {
  if(fs.existsSync(filePath)) {
    const source = fs.readFileSync(filePath, 'utf-8')
    try {
      let parserRes = parser(source)
      parserRes.props && parserRes.props.map((props) => {
        props.default = props.default? props.default.replace(/[\n]/g,'') : props.default
      })
      const r = new Render.default(parserRes)
      let markdownRes = r.renderMarkdown()
      const content = markdownRes.content.replace(/\<!-- @vuese.+?--\>/g, '')
      return content
    } catch(e) {
      console.error('can not parser ' + filePath)
      console.error(e)
      process.exit(1)
    }
  }else{
    console.error(filePath + ' is not a file')
    process.exit(1)
  }
}

// example 转markdown
function exampleToMarkdown (folderPath) {
  if(fs.existsSync(folderPath)) {
    const exampleFiles = fs.readdirSync(folderPath)
    let str = ''
    exampleFiles.map(item => {
      let fileData = fs.readFileSync(`${folderPath}/${item}`, "utf-8")
      // 提取描述
      if(fileData.match(/\<!--[\s\S]+?--\>/)){
        let description = fileData.match(/\<!--([\s\S]+?)--\>/)[1]
        str += `${description}\n`
        str += `\`\`\`html\n${fileData.replace(/\<!--[\s\S]+?--\>/, '')}\n\`\`\``
        str += '\n'
      } else {
        str += '\n'
        str += `\`\`\`html\n${fileData}\n\`\`\``
        str += '\n'
      }
    })
    return str
  } else {
    console.error(folderPath + ' is not a folder')
    process.exit(1)
  }
}