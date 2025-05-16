(()=>{var s=class extends HTMLElement{setConfig(e){this.config=e,this.render()}set hass(e){this._hass=e,this.render()}render(){!this.config||!this._hass||(this.innerHTML=`
      <ha-card header="Vertical Farm">
        <div style="padding: 16px;">
          <strong>Farm Name:</strong> ${this.config.farm_name||"N/A"}<br />
          <em>(This is a placeholder for your custom farm visualization!)</em>
        </div>
      </ha-card>
    `)}getCardSize(){return 2}};customElements.define("vertical-farm-card",s);})();
