export interface DynamicField {
  id?: string;
  value: string;
}

export interface Address {
  id?: string;
  type: 'Permanent' | 'Current' | 'Temporary';
  value: string;
}

export interface Policy {
  id?: string;
  policyNo: string;
  companyName: string;
  healthInfo?: string;
}

export interface MutualFundInvestment {
  id?: string;
  amc: string;
  folio: string;
  units: string;
  nav: string;
  investmentAmount: string;
}

export interface CustomField {
  id?: string;
  name: string;
  value: string;
}

export interface FamilyMember {
  id?: string;
  name: string;
  relationship: string;
  pan: string;
  aadhar: string;
  aadharMobile: string;
  passportNo: string;
  passportExpiryDate: string;
  healthInfo: string;
  mobiles: DynamicField[];
  addresses: Address[];
  healthPolicies: Policy[];
  carBikePolicies: Policy[];
  lifePolicies: Policy[];
  mutualFundInvestments: MutualFundInvestment[];
  customFields: CustomField[];
}

export interface Client {
  id?: string;
  userId: string;
  clientName: string;
  referenceName: string;
  pan: string;
  incomeTaxPassword?: string;
  aadhar: string;
  aadharMobile: string;
  passportNo: string;
  passportExpiryDate: string;
  remarks: string;
  mobiles: DynamicField[];
  addresses: Address[];
  healthPolicies: Policy[];
  carBikePolicies: Policy[];
  lifePolicies: Policy[];
  mutualFundInvestments: MutualFundInvestment[];
  customFields: CustomField[];
  familyMembers: FamilyMember[];
  createdAt?: Date;
  updatedAt?: Date;
}
