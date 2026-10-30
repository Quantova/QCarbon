# QCarbon

QCarbon is a live production post quantum registry tool for carbon credits and emission allowances on the Quantova network. It proves the issuance, independent attestation, transfer and retirement of carbon credits, and it lets any third party confirm that history without trusting the party that created it.

QCarbon proves records without disclosing them. Credit identities and holder details stay private on the systems of the party that holds them. Only a salted cryptographic commitment is written to the chain.

## What it records

Each record is a signed envelope of one of four types.

1. issue, a registry issues credits for a project, naming the vintage, the tonnes of CO2 equivalent and the methodology.
2. attest, a validation and verification body records its outcome on an issued credit.
3. transfer, the holder moves credits to another party.
4. retire, the holder retires credits against a named beneficiary so they can never be used again.

Every record is signed with ML-DSA-65 under FIPS 204 by the party whose role it names, and each later record links to the one before it so the whole life of a credit forms a chain.

## Install

```
npm install @quantovainc/qcarbon
```

## Use

```js
const qcarbon = require('@quantovainc/qcarbon');

const registry = qcarbon.generateKey();
const credit = qcarbon.issue({ key: registry, project: 'Amazon REDD 0041', vintage: 2026, tonnes: 100000, methodology: 'vm0007', registrarLabel: 'Verra' });
const anchored = await qcarbon.anchor(credit, { seed, index: 0, network: 'testnet' });
const result = await qcarbon.verify(anchored[0], { type: 'issue', network: 'testnet' });
```

## What a record does not establish

1. It does not show that the stated reductions are real. It shows only that the signer stated them and that the statement existed unchanged at a point in time.
2. It does not identify a natural or legal person. The signer is a chain address, and linking an address to a registry, verification body or holder is a separate attestation.

## License

Apache-2.0 OR MIT
