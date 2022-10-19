import { LightningElement, track, api, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';

import PHONE_FIELD from '@salesforce/schema/Account.Phone';

const fields = [PHONE_FIELD];

export default class Five9ClickToDial_LWC extends LightningElement {

    /*
        in order to use the anonymous metadata request, domain must be contain one chat license
        if you do not have a chat license, you will need a different way to manage the API URL
        i.e. app-atl.five9.com OR app-scl.five9.com
    */

    // Five9 domain name (case sensitive)
    domainName = 'My Five9 Domain Name';

    // id of campaign to use in outbound call
    // use "0" for "None" campaign
    campaignId = '0';

    @api recordId;

    @wire(getRecord, { recordId: '$recordId', fields })
    account;

    get phone() {
        return getFieldValue(this.account.data, PHONE_FIELD);
    }

    @track clickToDialUrl;
    @track phoneDisplay;


    buildPhoneUrl() {

        console.log('this.phone', this.phone);

        if (this.phone == null) {
            this.clickToDialUrl = null;
            return;
        }

        let phoneNumsOnly = this.phone.replaceAll(/\D/g, '');

        // validate that phone number is at least 10 digits
        if (/\d{10}/.test(phoneNumsOnly) == false) {
            this.clickToDialUrl = null;
            return;
        }

        let numToDial = phoneNumsOnly.slice(-10);
        this.phoneDisplay = `(${numToDial.slice(0,3)}) ${numToDial.slice(3,6)}-${numToDial.slice(6,10)}`;

        const metadataUrl = 'https://app.five9.com/appsvcs/rs/svc/auth/anon?cookieless=true';

        let body = {
            tenantName: this.domainName
        };

        fetch(metadataUrl, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        }).then((response) => response.json())
            .then(resp => {

                let apiUrl = resp.metadata.dataCenters[0].apiUrls[0].host;
                let domainId = resp.orgId;

                this.clickToDialUrl = `https://${apiUrl}/appsvcs/rs/svc/orgs/${domainId}/interactions/click_to_dial?number=${phoneNumsOnly}&campaignId=${this.campaignId}&dialImmediately=true`;

                console.log('clickToDialUrl', this.clickToDialUrl);
            });
    }

    renderedCallback() {

        if (this.clickToDialUrl == null) {
            this.buildPhoneUrl();
        }

    }


}