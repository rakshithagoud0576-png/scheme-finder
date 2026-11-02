// Scheme data. SAMPLE DATA: eligibility rules here are simplified for demonstration.
// Before going live, verify every scheme against its official source and set `lastVerified`.
//
// Rule format (all rules in a scheme must pass):
//   { field, op, value, label }
//   op: "eq" | "in" | "gte" | "lte" | "between" | "is"
//   or an OR-group: { anyOf: [rule, rule, ...], label }
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.SchemeData = factory();
})(typeof self !== "undefined" ? self : this, function () {
  // Profile fields shown in the form. `type`: number | select | bool
  var FIELDS = [
    { key: "age", type: "number", min: 0, max: 120 },
    { key: "gender", type: "select", options: ["female", "male", "other"] },
    {
      key: "state",
      type: "select",
      options: ["Andhra Pradesh", "Telangana", "Karnataka", "Tamil Nadu", "Maharashtra", "Other"],
    },
    { key: "income", type: "number", min: 0, max: 100000000 },
    { key: "category", type: "select", options: ["General", "OBC", "SC", "ST"] },
    {
      key: "occupation",
      type: "select",
      options: ["farmer", "student", "self-employed", "salaried", "unemployed", "homemaker", "other"],
    },
    { key: "bpl", type: "bool" },
    { key: "ownsLand", type: "bool" },
    { key: "taxpayer", type: "bool" },
    { key: "girlChild", type: "bool" },
    { key: "disability", type: "bool" },
  ];

  var SCHEMES = [
    {
      id: "pm-kisan",
      name: "PM-KISAN",
      level: "Central",
      state: null,
      topic: "Agriculture",
      benefit: "Income support of ₹6,000 per year, paid in three instalments, to eligible farmer families.",
      rules: [
        { field: "occupation", op: "eq", value: "farmer", label: "Must be a farmer" },
        { field: "ownsLand", op: "is", value: true, label: "Must own cultivable land" },
        { field: "taxpayer", op: "is", value: false, label: "Income tax payers are excluded" },
      ],
      documents: ["Aadhaar card", "Land ownership records", "Bank account details"],
      url: "https://pmkisan.gov.in",
      lastVerified: null,
    },
    {
      id: "pmjay",
      name: "Ayushman Bharat PM-JAY",
      level: "Central",
      state: null,
      topic: "Health",
      benefit: "Health cover for hospitalisation at empanelled hospitals for eligible families.",
      rules: [
        {
          anyOf: [
            { field: "bpl", op: "is", value: true },
            { field: "age", op: "gte", value: 70 },
          ],
          label: "Low-income household or age 70 and above",
        },
      ],
      documents: ["Aadhaar card", "Ration card or proof of household status", "Mobile number"],
      url: "https://pmjay.gov.in",
      lastVerified: null,
    },
    {
      id: "sukanya",
      name: "Sukanya Samriddhi Yojana",
      level: "Central",
      state: null,
      topic: "Women & Children",
      benefit: "Small-savings account for a girl child with a government-set interest rate and tax benefits.",
      rules: [{ field: "girlChild", op: "is", value: true, label: "Needs a girl child under 10 years in the family" }],
      documents: ["Girl child's birth certificate", "Parent or guardian ID and address proof"],
      url: "https://www.indiapost.gov.in",
      lastVerified: null,
    },
    {
      id: "atal-pension",
      name: "Atal Pension Yojana",
      level: "Central",
      state: null,
      topic: "Pension",
      benefit: "Guaranteed monthly pension after age 60, based on your contribution.",
      rules: [
        { field: "age", op: "between", value: [18, 40], label: "Age must be between 18 and 40" },
        { field: "taxpayer", op: "is", value: false, label: "Income tax payers are not eligible" },
      ],
      documents: ["Aadhaar card", "Savings bank account", "Mobile number"],
      url: "https://www.npscra.nsdl.co.in",
      lastVerified: null,
    },
    {
      id: "ujjwala",
      name: "PM Ujjwala Yojana",
      level: "Central",
      state: null,
      topic: "Women & Children",
      benefit: "Deposit-free LPG connection for women from eligible low-income households.",
      rules: [
        { field: "gender", op: "eq", value: "female", label: "Applicant must be a woman" },
        { field: "age", op: "gte", value: 18, label: "Applicant must be 18 or older" },
        { field: "bpl", op: "is", value: true, label: "Household must be low-income (BPL)" },
      ],
      documents: ["Aadhaar card", "Ration card or BPL proof", "Bank account details", "Passport-size photo"],
      url: "https://www.pmuy.gov.in",
      lastVerified: null,
    },
    {
      id: "old-age-pension",
      name: "National Old Age Pension (IGNOAPS)",
      level: "Central",
      state: null,
      topic: "Pension",
      benefit: "Monthly pension for elderly people from low-income households.",
      rules: [
        { field: "age", op: "gte", value: 60, label: "Must be 60 or older" },
        { field: "bpl", op: "is", value: true, label: "Household must be low-income (BPL)" },
      ],
      documents: ["Age proof", "BPL certificate or card", "Aadhaar card", "Bank account details"],
      url: "https://nsap.nic.in",
      lastVerified: null,
    },
    {
      id: "disability-pension",
      name: "National Disability Pension (IGNDPS)",
      level: "Central",
      state: null,
      topic: "Pension",
      benefit: "Monthly pension for persons with severe disability from low-income households.",
      rules: [
        { field: "disability", op: "is", value: true, label: "Must have a certified disability" },
        { field: "bpl", op: "is", value: true, label: "Household must be low-income (BPL)" },
        { field: "age", op: "between", value: [18, 79], label: "Age must be between 18 and 79" },
      ],
      documents: ["Disability certificate", "BPL certificate or card", "Aadhaar card", "Bank account details"],
      url: "https://nsap.nic.in",
      lastVerified: null,
    },
    {
      id: "post-matric-sc",
      name: "Post-Matric Scholarship for SC Students",
      level: "Central",
      state: null,
      topic: "Education",
      benefit: "Scholarship covering fees and maintenance allowance for post-matric study.",
      rules: [
        { field: "occupation", op: "eq", value: "student", label: "Must be a student" },
        { field: "category", op: "eq", value: "SC", label: "Must belong to the SC category" },
        { field: "income", op: "lte", value: 250000, label: "Family income must be ₹2.5 lakh per year or less" },
      ],
      documents: ["Caste certificate", "Income certificate", "Admission proof", "Previous marksheet", "Bank account details"],
      url: "https://scholarships.gov.in",
      lastVerified: null,
    },
    {
      id: "mudra",
      name: "PM MUDRA Yojana",
      level: "Central",
      state: null,
      topic: "Business & Jobs",
      benefit: "Collateral-free loans for small non-farm businesses.",
      rules: [
        { field: "occupation", op: "eq", value: "self-employed", label: "Must run or plan a small business" },
        { field: "age", op: "gte", value: 18, label: "Must be 18 or older" },
      ],
      documents: ["Identity and address proof", "Business plan or proof of business", "Bank statements"],
      url: "https://www.mudra.org.in",
      lastVerified: null,
    },
    {
      id: "stand-up-india",
      name: "Stand-Up India",
      level: "Central",
      state: null,
      topic: "Business & Jobs",
      benefit: "Bank loans for first-time entrepreneurs who are women or from SC/ST communities.",
      rules: [
        {
          anyOf: [
            { field: "gender", op: "eq", value: "female" },
            { field: "category", op: "in", value: ["SC", "ST"] },
          ],
          label: "Must be a woman or belong to SC/ST",
        },
        { field: "age", op: "gte", value: 18, label: "Must be 18 or older" },
        { field: "occupation", op: "eq", value: "self-employed", label: "Must be starting a new enterprise" },
      ],
      documents: ["Identity and address proof", "Caste certificate (if applicable)", "Project report"],
      url: "https://www.standupmitra.in",
      lastVerified: null,
    },
    {
      id: "kalyana-lakshmi",
      name: "Kalyana Lakshmi / Shaadi Mubarak (Telangana)",
      level: "State",
      state: "Telangana",
      topic: "Women & Children",
      benefit: "One-time marriage assistance for brides from eligible low-income families.",
      rules: [
        { field: "gender", op: "eq", value: "female", label: "Bride must be a woman" },
        { field: "age", op: "gte", value: 18, label: "Bride must be 18 or older" },
        { field: "income", op: "lte", value: 200000, label: "Family income must be ₹2 lakh per year or less" },
      ],
      documents: ["Aadhaar card", "Income certificate", "Age proof", "Bank account details"],
      url: "https://telanganaepass.cgg.gov.in",
      lastVerified: null,
    },
  ];

  return { FIELDS: FIELDS, SCHEMES: SCHEMES };
});
