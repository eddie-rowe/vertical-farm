# Vertical Farm UI

This directory contains the frontend (Lovelace card) for the Vertical Farm Home Assistant integration.

## Development

### Install dependencies
```bash
npm install
```

### Build the card
```bash
npm run build
```
The built file will be output to `dist/vertical-farm-card.js`.

### Development mode (auto-rebuild on changes)
```bash
npm run dev
```

## Usage in Home Assistant
1. Copy `dist/vertical-farm-card.js` to your Home Assistant `www/` directory (or use HACS for distribution).
2. In Home Assistant, add a resource in Settings → Dashboards → Resources:
   - URL: `/local/vertical-farm-card.js`
   - Resource type: JavaScript Module
3. Add a new Manual card to your dashboard with the following YAML:
```yaml
type: 'custom:vertical-farm-card'
farm_name: 'Main Farm'
```

## Next Steps
- Extend the card to visualize your farm layout and data.
- Add configuration options and interactivity as needed.
