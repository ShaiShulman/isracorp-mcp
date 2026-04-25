import { IcaCompany, RawIcaCompany } from "../interfaces/interfaces";
import { formatCompanyNumber } from "./companyUtils";

/**
 * Maps a raw ICA API response object to the normalised IcaCompany interface.
 * All undefined/null fields are mapped to null for consistent serialisation.
 */
export function mapCompany(raw: RawIcaCompany): IcaCompany {
  return {
    companyNumber: formatCompanyNumber(raw.DisplayId ?? ""),
    hebrewName: raw.DisplayName ?? "",
    englishName: raw.DisplayEnglishName ?? "",
    status: raw.StatusString ?? "",
    companyType: raw.DisplayCompanyType ?? "",
    limitType: raw.DisplayCompanyLimitType ?? "",
    registrationDate: raw.DisplayCompanyRegistrationDate ?? "",
    address: raw.Address?.AddressString?.trim() ?? "",
    city: raw.Address?.CityName ?? "",
    violationStatus: raw.DisplayCompanyViolates ?? null,
  };
}
