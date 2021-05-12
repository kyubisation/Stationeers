const fs = require('fs');
const path = require('path');

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

class JumpTargetReplacement {
  replace(content) {
    const lines = content.split('\n');
    let result = [];
    const jumpTargetMap = {}
    lines.forEach((line, index) => {
      const match = line.match(/^(\w+):/);
      if (match) {
        jumpTargetMap[match[1]] = index - Object.keys(jumpTargetMap).length;
      } else {
        result.push(line);
      }
    });
    result = result.map((line) => {
      const match = line.match(/ (\w+)$/);
      return (match && match[1] in jumpTargetMap)
        ? line.replace(/ \w+$/, ` ${jumpTargetMap[match[1]]}`)
        : line;
    })
    return result.join('\n');
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
      new JumpTargetReplacement(),
    ];
    const newContent = replacements
      .reduce((current, next) => next.replace(current), this.content);
    fs.writeFileSync(this.minifiedPath, newContent, 'utf8');
    const filePath = path.relative(process.cwd(), this.filePath);
    const minifiedPath = path.relative(process.cwd(), this.minifiedPath);
    const originalLineAmount = this.content.split('\n').length;
    const minifiedLineAmount = newContent.split('\n').length;
    console.log(
      `Minified ${filePath} to ${minifiedPath}\n` +
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

class MinificationWalker {
  constructor(directoryPath) {
    if (!fs.existsSync(directoryPath) || !fs.statSync(directoryPath).isDirectory()) {
      throw new Error(`${directoryPath} must be an existing directory`);
    }
    this.directoryPath = directoryPath;
  }

  minify() {
    for (const filePath of this._walk(this.directoryPath)) {
      if (this._numberOfLines(filePath) > 128) {
        new Minification(filePath).minify();
      } else {
        this._deleteMinifiedVariant(filePath);
      }
    }
  }

  _walk(directory) {
    return fs.readdirSync(directory, { withFileTypes: true }).reduce((current, next) => {
      if (next.isDirectory()) {
        return current.concat(this._walk(path.join(directory, next.name)));
      } else if (this._isMinifyableMipsFile(next, directory)) {
        return current.concat(path.join(directory, next.name));
      } else {
        return current;
      }
    }, []);
  }

  _isMinifyableMipsFile(dirent) {
    return dirent.isFile() && dirent.name.endsWith('.mips') && !dirent.name.endsWith('.min.mips');
  }

  _numberOfLines(filePath) {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return fileContent.split('\n').length;
  }

  _deleteMinifiedVariant(filePath) {
    const minifiedFilePath = fs.existsSync(filePath.replace(/.mips$/, '.min.mips'));
    if (fs.existsSync(minifiedFilePath)) {
      console.log(`Removing obsolete ${minifiedFilePath}`);
      fs.unlinkSync(minifiedFilePath);
    }
  }
}

const [, , filePath] = process.argv;
if (filePath) {
  new Minification(filePath).minify();
} else {
  new MinificationWalker(process.cwd()).minify();
}