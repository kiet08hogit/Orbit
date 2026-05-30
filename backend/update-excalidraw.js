const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/dalkg/OneDrive/Documents/side projects/Circlo/Architecture';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.excalidraw'));

const replacements = [
  { from: /Azure Blob Storage/g, to: 'Amazon S3' },
  { from: /Azure Database for PostgreSQL/g, to: 'Amazon RDS (PostgreSQL)' },
  { from: /Azure DB Postgre/g, to: 'Amazon RDS (PostgreSQL)' },
  { from: /Azure DB for Postgre/g, to: 'Amazon RDS (PostgreSQL)' },
  { from: /Azure Postgre/g, to: 'Amazon RDS (PostgreSQL)' },
  { from: /Azure Static Web Apps \/ CDN/g, to: 'AWS Amplify \/ CloudFront' },
  { from: /\[ Azure App Service \]/g, to: '[ AWS ECS Fargate ]' },
  { from: /Azure Cloud Services/g, to: 'AWS Cloud Services' },
  { from: /Azure Redis\(Cache layer\)/g, to: 'Amazon ElastiCache (Redis)' }
];

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  replacements.forEach(r => {
    content = content.replace(r.from, r.to);
  });
  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  }
});
