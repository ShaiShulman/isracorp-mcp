import { mapCompany } from "../src/data/companyFields";
import { RawIcaCompany } from "../src/interfaces/interfaces";

const rawFixture = require("./fixtures/ica-response.json");
const rawTechnoGel: RawIcaCompany = rawFixture.Data[0];

describe("mapCompany", () => {
  test("maps all standard fields correctly", () => {
    const company = mapCompany(rawTechnoGel);

    expect(company.companyNumber).toBe("512345679");
    expect(company.hebrewName).toBe('טכנוגל בע"מ');
    expect(company.englishName).toBe("TECHNOgel LTD");
    expect(company.status).toBe("פעילה");
    expect(company.companyType).toBe("ישראלית");
    expect(company.limitType).toBe("מוגבלת");
    expect(company.registrationDate).toBe("15/03/2010");
    expect(company.city).toBe("חיפה");
    expect(company.violationStatus).toBeNull();
  });

  test("trims whitespace from address", () => {
    const company = mapCompany(rawTechnoGel);
    // Raw address has leading/trailing spaces
    expect(company.address).toBe("חיפה  הנמל  12");
    expect(company.address).not.toMatch(/^\s|\s$/);
  });

  test("handles null Address gracefully", () => {
    const rawWithoutAddress: RawIcaCompany = { ...rawTechnoGel, Address: null };
    const company = mapCompany(rawWithoutAddress);
    expect(company.address).toBe("");
    expect(company.city).toBe("");
  });

  test("handles null DisplayCompanyViolates", () => {
    const company = mapCompany(rawTechnoGel);
    expect(company.violationStatus).toBeNull();
  });

  test("maps violation status when present", () => {
    const rawViolating: RawIcaCompany = {
      ...rawTechnoGel,
      DisplayCompanyViolates: "מפרה",
    };
    const company = mapCompany(rawViolating);
    expect(company.violationStatus).toBe("מפרה");
  });

  test("handles missing DisplayEnglishName", () => {
    const rawNoEnglish: RawIcaCompany = {
      ...rawTechnoGel,
      DisplayEnglishName: "",
    };
    const company = mapCompany(rawNoEnglish);
    expect(company.englishName).toBe("");
  });
});
