class VerticalFarmCard extends HTMLElement {
  setConfig(config) {
    this.config = config;
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
  }

  render() {
    if (!this.config || !this._hass) return;
    this.innerHTML = `
      <ha-card header="Vertical Farm">
        <div style="padding: 16px;">
          <strong>Farm Name:</strong> ${this.config.farm_name || 'N/A'}<br />
          <em>(This is a placeholder for your custom farm visualization!)</em>
        </div>
      </ha-card>
    `;
  }

  getCardSize() {
    return 2;
  }
}

customElements.define('vertical-farm-card', VerticalFarmCard);
