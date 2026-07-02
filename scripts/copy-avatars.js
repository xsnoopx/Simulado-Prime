const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const srcDir = path.join(__dirname, '../home/ubuntu/avatars');
const destDir = path.join(__dirname, '../public/avatars');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// 1. Copy avatar files from the project root (where the user created them)
console.log('Searching for avatar files in project root:', rootDir);
try {
  const rootFiles = fs.readdirSync(rootDir);
  let copiedCount = 0;
  rootFiles.forEach(file => {
    if (file.startsWith('avatar_') && file.endsWith('.png')) {
      const srcPath = path.join(rootDir, file);
      const destPath = path.join(destDir, file);
      fs.copyFileSync(srcPath, destPath);
      copiedCount++;
    }
  });
  console.log(`Copied ${copiedCount} avatar files from root directory to ${destDir}`);
} catch (err) {
  console.error('Error copying from root:', err);
}

// 2. Also copy from legacy source directory if it exists
if (fs.existsSync(srcDir)) {
  console.log('Copying avatars from legacy directory:', srcDir, 'to', destDir);
  try {
    fs.cpSync(srcDir, destDir, { recursive: true });
    console.log('Legacy avatars copied successfully!');
  } catch (err) {
    console.error('Error copying legacy avatars:', err);
  }
} else {
  console.log('Legacy source avatars directory not found at', srcDir);
}
