const fs = require('fs');
const path = require('path');

const TARGET_DIRS = [
  path.join(__dirname, '../src'),
  path.join(__dirname, '../../frontend/src'),
  path.join(__dirname, '../../frontend/index.html')
];

const EXTENSIONS = ['.js', '.jsx', '.html', '.json', '.txt'];

function walkDir(dir, callback) {
  const stat = fs.statSync(dir);
  if (stat.isFile()) {
    callback(dir);
    return;
  }
  const files = fs.readdirSync(dir);
  files.forEach(f => {
    const filePath = path.join(dir, f);
    const fileStat = fs.statSync(filePath);
    if (fileStat.isDirectory()) {
      // Exclude node_modules or git
      if (f !== 'node_modules' && f !== '.git') {
        walkDir(filePath, callback);
      }
    } else {
      const ext = path.extname(filePath);
      if (EXTENSIONS.includes(ext)) {
        callback(filePath);
      }
    }
  });
}

function runReplace() {
  console.log('Starting global superadmin -> developer rename...');
  let totalFiles = 0;
  let modifiedFiles = 0;

  TARGET_DIRS.forEach(target => {
    if (!fs.existsSync(target)) {
      console.warn(`Target path does not exist: ${target}`);
      return;
    }
    
    walkDir(target, (filePath) => {
      // Skip this script itself
      if (filePath === __filename) return;

      totalFiles++;
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Perform regex replacements
      let newContent = content
        .replace(/superadmin/g, 'developer')
        .replace(/SuperAdmin/g, 'Developer')
        .replace(/SUPERADMIN/g, 'DEVELOPER')
        .replace(/Super Admin/g, 'Developer')
        .replace(/super admin/g, 'developer')
        .replace(/Super admin/g, 'Developer');

      if (newContent !== content) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`✏️ Modified: ${path.relative(path.join(__dirname, '../..'), filePath)}`);
        modifiedFiles++;
      }
    });
  });

  console.log(`\nRename complete. Checked ${totalFiles} files. Modified ${modifiedFiles} files.`);
}

runReplace();
