const fs = require('fs');

class AliasAndDefineReplacement {
  constructor(fullMatch, _type, alias, key) {
    this.fullMatch = fullMatch;
    this.alias = alias;
    this.key = key;
  }

  replace(content) {
    return content.replace(this.fullMatch, '')
      .replace(new RegExp(` ${this.alias} `, 'g'), ` ${this.key} `)
      .replace(new RegExp(` ${this.alias} `, 'g'), ` ${this.key} `)
      .replace(new RegExp(` ${this.alias}\n`, 'g'), ` ${this.key}\n`);
  }
}

class CommentAndWhitespaceReplacement {
  replace(content) {
    return content
      .split('\n')
      .filter(l => !l.trim().match(/(^$|^#)/))
      .join('\n');
  }
}

class Minification {
  constructor(filePath) {
    if (!filePath.endsWith('.mips')) {
      throw new Error(`${filePath} must end with .mips`);
    }
    this.filePath = filePath;
    this.minifiedPath = this.filePath.replace(/.mips$/, '.min.mips')
    this.content = fs.readFileSync(this.filePath, 'utf8');
  }

  minify() {
    const replacements = [
      ...this.findAliasAndDefines(),
      new CommentAndWhitespaceReplacement(),
    ];
    const newContent = replacements
      .reduce((current, next) => next.replace(current), this.content);
    fs.writeFileSync(this.minifiedPath, newContent, 'utf8');
    const originalLineAmount = this.content.split('\n').length;
    const minifiedLineAmount = newContent.split('\n').length;
    console.log(
      `Minified ${this.filePath} to ${this.minifiedPath}\n` +
      `  ${originalLineAmount} lines => ${minifiedLineAmount} lines\n` +
      `  Reduced by ${originalLineAmount - minifiedLineAmount}`
    );
  }

  findAliasAndDefines() {
    const regex = /(alias|define) (\w+) ([-\w]+)/g;
    const replacements = [];
    let match;
    while (match = regex.exec(this.content)) {
      replacements.push(new AliasAndDefineReplacement(...match));
    }

    return replacements;
  }
}

const [, , filePath] = process.argv;
new Minification(filePath).minify();