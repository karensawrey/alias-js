# ALIAS-js

Welcome to **ALIAS-js** - JavaScript implementation of the decentralized, open, free **alias** protocol for GDPR-based data portability between services.  
**alias** protocol is a part of the GDPR-centered data portability open source developer toolkit [GDPR.dev](https://gdpr.dev/).

Using **alias** protocol, you allow the users to choose their own "data bank" (authorization server) for storing their personal data dumps (defined by GDPR, CCPA, HIIPA, or any other data privacy regulation). This means that all the data they share with various online services can be securely stored in one place, without the need to duplicate or fully surrender the data to one singel social network or other website. 

Third party services that implement an **alias** client can request and receive the user's data. This is very similar to adding "Login with Facebook" or "Login with Google", but with "Login with Alias" button on their website, third party services request the data that is stored in a place controlled by a user.


**ALIAS-js** allows automating GDPR-regulated data portability using:

- Email automation templates to request GDPR data portability
- REST APIs to request data from GDPR "dumps"/takeouts
- SDKs to set up decentralized Authorization servers
- GDPR JWT tokens (by including machine-readable GDPR agreements)
- GDPR portability agreement generator that allows developers to request portability data from users in a compliant, machine-readable way

Try **ALIAS-js** to give your users the control over what happens to their personal data.

## Getting started

- [How to implement an Alias client to fetch user's data](https://github.com/progressive-identity/alias-js/wiki/Develop-a-client)
- [How to install and launch authorization server](https://github.com/progressive-identity/alias-js/wiki/Run-a-authorization-server)
- [Read more about the alias protocol](https://github.com/progressive-identity/alias-js/wiki/Protocol)
