// Simple script to create placeholder SVGs for NFTs
const fs = require('fs');
const path = require('path');

const colors = [
	['#D4AF37', '#C5A028'], // Gold gradient
	['#E5E4E2', '#C0C0C0'], // Platinum gradient
	['#2D8659', '#1e5d3f'], // Green gradient
	['#475569', '#334155'], // Blue gradient
	['#D97706', '#b45309'], // Amber gradient
	['#991B1B', '#7f1d1d'] // Burgundy gradient
];

const patterns = ['circles', 'squares', 'triangles', 'waves', 'grid', 'abstract'];

function generateSVG(id, colorPair, pattern) {
	const [color1, color2] = colorPair;

	let patternSVG = '';

	switch (pattern) {
		case 'circles':
			patternSVG = `
        <circle cx="200" cy="200" r="80" fill="${color1}" opacity="0.6"/>
        <circle cx="300" cy="300" r="60" fill="${color2}" opacity="0.7"/>
        <circle cx="150" cy="350" r="40" fill="${color1}" opacity="0.5"/>
      `;
			break;
		case 'squares':
			patternSVG = `
        <rect x="100" y="100" width="120" height="120" fill="${color1}" opacity="0.6" transform="rotate(15 160 160)"/>
        <rect x="250" y="250" width="90" height="90" fill="${color2}" opacity="0.7" transform="rotate(-20 295 295)"/>
      `;
			break;
		case 'triangles':
			patternSVG = `
        <polygon points="250,100 350,300 150,300" fill="${color1}" opacity="0.6"/>
        <polygon points="300,200 400,350 200,350" fill="${color2}" opacity="0.5"/>
      `;
			break;
		case 'waves':
			patternSVG = `
        <path d="M0,250 Q125,200 250,250 T500,250" stroke="${color1}" stroke-width="3" fill="none" opacity="0.7"/>
        <path d="M0,300 Q125,250 250,300 T500,300" stroke="${color2}" stroke-width="3" fill="none" opacity="0.6"/>
        <path d="M0,350 Q125,300 250,350 T500,350" stroke="${color1}" stroke-width="3" fill="none" opacity="0.5"/>
      `;
			break;
		case 'grid':
			patternSVG = Array.from({ length: 5 }, (_, i) =>
				Array.from(
					{ length: 5 },
					(_, j) =>
						`<rect x="${i * 100}" y="${j * 100}" width="80" height="80" fill="${
							i % 2 === j % 2 ? color1 : color2
						}" opacity="${0.3 + (i + j) * 0.05}"/>`
				).join('')
			).join('');
			break;
		default:
			patternSVG = `
        <circle cx="${Math.random() * 400 + 50}" cy="${Math.random() * 400 + 50}" r="${
				Math.random() * 60 + 40
			}" fill="${color1}" opacity="0.6"/>
        <circle cx="${Math.random() * 400 + 50}" cy="${Math.random() * 400 + 50}" r="${
				Math.random() * 60 + 40
			}" fill="${color2}" opacity="0.7"/>
        <circle cx="${Math.random() * 400 + 50}" cy="${Math.random() * 400 + 50}" r="${
				Math.random() * 60 + 40
			}" fill="${color1}" opacity="0.5"/>
      `;
	}

	return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="500" height="500" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad${id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="500" height="500" fill="#0A0A0B"/>
  <rect width="500" height="500" fill="url(#grad${id})" opacity="0.15"/>
  ${patternSVG}
  <text x="250" y="460" font-family="monospace" font-size="16" fill="#A8A8A0" text-anchor="middle" opacity="0.5">
    Cosmic Signature #${1000 + id}
  </text>
</svg>`;
}

// Generate 30 placeholder SVGs
const outputDir = path.join(__dirname, '..', 'public', 'nfts');

if (!fs.existsSync(outputDir)) {
	fs.mkdirSync(outputDir, { recursive: true });
}

for (let i = 1; i <= 30; i++) {
	const colorPair = colors[i % colors.length];
	const pattern = patterns[i % patterns.length];
	const svg = generateSVG(i, colorPair, pattern);

	fs.writeFileSync(path.join(outputDir, `${i}.svg`), svg);
	// Also create .jpg extension (will be same SVG for now)
	fs.writeFileSync(path.join(outputDir, `${i}.jpg`), svg);
}

console.log('✅ Generated 30 placeholder NFT images');

