export interface IcaCompany {
  companyNumber: string;
  hebrewName: string;
  englishName: string;
  status: string;
  companyType: string;
  limitType: string;
  registrationDate: string;
  address: string;
  city: string;
  violationStatus: string | null;
}

export interface RawIcaAddress {
  IsDelivery: boolean;
  Id: number;
  ContactId: number;
  AddressType: number;
  CountryId: number;
  CountryName: string;
  CityId: number;
  CityName: string;
  StreetId: number;
  StreetName: string;
  HouseNumber: string;
  Entrance: string | null;
  FlatNumber: string | null;
  FloorNumber: number | null;
  ZipCode: number;
  PostBox: string | null;
  AtAddress: string | null;
  IsVerified: boolean;
  IsReturned: boolean;
  Status: number;
  AddressString: string;
  AddressSourceString: string;
  [key: string]: unknown;
}

export interface RawIcaCompany {
  DisplayCompanyType: string;
  DisplayCompanyPurpose: string;
  DisplayCompanyLimitType: string;
  DisplayCompanyRegistrationDate: string;
  DisplayCompanyViolates: string | null;
  DisplayCompanySubStatus: string | null;
  LastYearlyReport: number | null;
  IsCharitable: boolean;
  IsGovernmental: boolean;
  DisplayContactType: string;
  DisplayId: string;
  DisplayName: string;
  DisplayEnglishName: string;
  StatusString: string;
  ContactId: number;
  RowGuid: string;
  Address: RawIcaAddress | null;
  [key: string]: unknown;
}

export interface RawIcaResponse {
  Data: RawIcaCompany[];
  Success: boolean;
}

export interface SearchResult {
  results: IcaCompany[];
  source: "api" | "scraper" | "empty";
}

export interface GetCompanyResult {
  company: IcaCompany;
  source: "api" | "scraper";
}
