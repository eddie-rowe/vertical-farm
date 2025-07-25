# Integration Suggestions System

This system provides clean, intuitive UI components for suggesting relevant integrations across your vertical farming platform.

## Components

### IntegrationCard

Displays individual integration suggestions with icons, benefits, and setup information.

```tsx
<IntegrationCard
  name="Square"
  icon="/icons/integrations/square.svg"
  benefit="Accept in-person payments and track sales automatically"
  setupTime="2 min"
  status="available"
  difficulty="easy"
  onConnect={() => handleConnect("square")}
/>
```

### EmptyStateWithIntegrations

Shows integration suggestions when pages have no data yet.

```tsx
<EmptyStateWithIntegrations
  pageType="business"
  title="Track Your Farm Revenue"
  description="Connect your payment processor to see revenue, trends, and customer data automatically synced to your dashboard."
  integrations={businessIntegrations}
/>
```

### IntegrationHint

Displays subtle banner-style integration suggestions on pages with existing data.

```tsx
<IntegrationHint
  message="Connect Square or Stripe to automatically track revenue and customer payments"
  integrations={["Square", "Stripe", "QuickBooks"]}
  pageContext="business management"
  variant="info"
/>
```

## Page Implementations

### Business Management Dashboard

- **Empty State**: Shows when no payment/business integrations are connected
- **Integration Hints**: Suggests payment, accounting, and CRM integrations
- **Integrations**: Square, Stripe, PayPal, QuickBooks, Xero, HubSpot

### Device Control & Automation

- **Empty State**: Shows when no device integrations are connected
- **Integration Hints**: Suggests smart home and IoT platforms
- **Integrations**: Home Assistant, SmartThings, Arduino Cloud, AWS IoT Core

### AI Insights & Analytics

- **Empty State**: Shows when no AI integrations are connected
- **Integration Hints**: Suggests AI platforms and research tools
- **Integrations**: OpenAI, Anthropic Claude, Google AI, Perplexity AI

### Environmental Monitoring

- **Integration Hints**: Suggests weather and sensor APIs
- **Integrations**: OpenWeatherMap, AccuWeather, Purple Air, ThingSpeak

### Inventory & Supply Chain

- **Integration Hints**: Suggests supplier and shipping integrations
- **Integrations**: Johnny's Seeds, FedEx API, UPS API, TradeGecko

## Usage Guidelines

### When to Use Empty States

- Page has no relevant data due to missing integrations
- User hasn't connected the required services yet
- Clear value proposition for connecting integrations

### When to Use Integration Hints

- Page has some data but could benefit from additional integrations
- User has connected some integrations but not others
- Contextual suggestions for improving functionality

### Customization

- Modify integration configurations in `/lib/integrations/constants.ts`
- Add new page types by extending the constants and components
- Customize styling through Tailwind classes

## Integration Categories

- **Payment**: Square, Stripe, PayPal
- **Accounting**: QuickBooks, Xero, FreshBooks
- **CRM**: HubSpot, Salesforce, Pipedrive
- **Smart Home**: Home Assistant, SmartThings
- **IoT**: Arduino Cloud, AWS IoT Core, Raspberry Pi
- **AI**: OpenAI, Anthropic, Google AI, Perplexity
- **Weather**: OpenWeatherMap, AccuWeather
- **Shipping**: FedEx, UPS, USPS

## Adding New Integrations

1. Add integration to appropriate array in `constants.ts`
2. Include icon file in `/public/icons/integrations/`
3. Add integration logic to relevant page components
4. Update documentation and tests

## Design Principles

- **Progressive Disclosure**: Show most relevant integrations first
- **Contextual Suggestions**: Match integrations to page functionality
- **Clear Value Proposition**: Explain benefits, not just features
- **Non-Intrusive**: Suggestions enhance, don't distract from main content
- **Actionable**: Provide clear next steps for setup
