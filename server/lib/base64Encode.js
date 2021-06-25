import fs from 'fs';

const base64Encode = (filePath) => {
  const bitmap = fs.readFileSync(filePath);
  return Buffer.from(bitmap).toString('base64');
}

export default base64Encode;
