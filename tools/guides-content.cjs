// Content for the search guides (built by tools/build-guides.cjs). Plain HTML fragments.
// General information only: every page carries the "not legal or tax advice" notice.
module.exports = [
{
  slug: "llp-vs-private-limited",
  title: "LLP vs Private Limited Company in India: Which to Choose",
  h1: "LLP vs Private Limited Company: which one should you register?",
  description: "LLP or Private Limited Company? Compare liability, tax on profit, fundraising, ESOPs and yearly compliance in India, and find which structure fits your business.",
  kicker: "Business structure guide",
  answer: "Choose an <b>LLP</b> if you are two or more partners running a service, trading or professional business, you want limited liability, and you plan to take most of the profit out. Choose a <b>Private Limited Company</b> if you plan to raise money from investors, give ESOPs to your team, or keep most of the profit in the business to grow. Both protect your personal assets. They differ in how profit is taxed when you take it out, how you can raise money, and how much compliance you face each year.",
  sections: [
    { id: "compare", h2: "LLP vs Private Limited at a glance", html: `
<div class="g-table"><table>
<thead><tr><th scope="col">Point</th><th scope="col">LLP</th><th scope="col">Private Limited Company</th></tr></thead>
<tbody>
<tr><th scope="row">Law</th><td>Limited Liability Partnership Act, 2008</td><td>Companies Act, 2013</td></tr>
<tr><th scope="row">Owners</th><td>At least 2 partners, with at least 2 designated partners. No upper limit.</td><td>At least 2 shareholders and 2 directors. At most 200 members.</td></tr>
<tr><th scope="row">Your personal assets</th><td>Protected: liability limited to your agreed contribution</td><td>Protected: liability limited to any unpaid amount on your shares</td></tr>
<tr><th scope="row">Raising money from investors</th><td>No shares to issue. New partners can bring in capital.</td><td>Yes, by issuing shares. Preferred by angel and venture investors.</td></tr>
<tr><th scope="row">ESOPs for employees</th><td>Not available</td><td>Available</td></tr>
<tr><th scope="row">Tax on business profit</th><td>30%, plus surcharge and cess</td><td>22% under the concessional regime, about 25.17% with surcharge and cess</td></tr>
<tr><th scope="row">Profit you take out</th><td>Your share of profit is not taxed again</td><td>Dividends are taxed again in the shareholder's hands</td></tr>
<tr><th scope="row">Statutory audit</th><td>Only if turnover exceeds ₹40 lakh or contribution exceeds ₹25 lakh</td><td>Every year, whatever the size</td></tr>
<tr><th scope="row">Yearly MCA returns</th><td>Form 11 (annual return) and Form 8 (accounts and solvency)</td><td>AOC-4 (financial statements) and MGT-7 or MGT-7A (annual return), plus board meetings and an AGM</td></tr>
</tbody></table></div>` },
    { id: "llp-when", h2: "When an LLP is the better choice", html: `
<ul class="g-list">
<li>You are two or more partners, for example consultants, agencies, traders or a professional practice.</li>
<li>You want your house and savings protected from business debts, which a partnership firm does not give you.</li>
<li>You plan to withdraw most of the profit each year. An LLP's profit is taxed once, and your share reaches you without further tax.</li>
<li>You want lighter yearly compliance. Below ₹40 lakh turnover and ₹25 lakh contribution, an LLP does not need a statutory audit.</li>
<li>You do not need shares, ESOPs or venture capital.</li>
</ul>` },
    { id: "pvt-when", h2: "When a Private Limited Company is the better choice", html: `
<ul class="g-list">
<li>You plan to raise money from angel investors or venture capital funds. They invest through shares, which only a company can issue.</li>
<li>You want to reward employees with ESOPs.</li>
<li>You plan to keep most of the profit in the business to grow. The company pays a lower rate than an LLP while profit stays inside.</li>
<li>Large clients, lenders or government buyers in your sector expect to deal with a company.</li>
<li>You can manage yearly compliance: audit, board meetings, an AGM and MCA returns.</li>
</ul>` },
    { id: "tax", h2: "How the tax difference works", html: `
<p>An LLP pays tax at 30% (plus surcharge above ₹1 crore of income, and cess). When partners take their share of the profit out, it is not taxed again. Interest on capital and remuneration paid to working partners are deductible for the LLP within the limits in the Income-tax Act, and are taxed in the partners' hands.</p>
<p>A Private Limited Company that opts for the concessional regime pays 22%, about 25.17% with surcharge and cess. When it pays dividends, shareholders pay tax on them again at their own rates. Salaries paid to working directors are deductible for the company and taxed in the directors' hands.</p>
<p><a href=\"../../entity-tax-comparison/\">Compare the total tax for your own profit and owners</a>, including partner remuneration and director salary.</p>
<p>So, as a rule of thumb: <b>taking most of the profit out favours an LLP; keeping it in the business favours a company.</b> The real answer depends on your profit, how you pay yourselves and your personal tax slabs.</p>` },
    { id: "compliance", h2: "Yearly compliance compared", html: `
<div class="g-two">
<div><h3>LLP</h3><ul class="g-list">
<li>Form 11, the annual return, by 30 May</li>
<li>Form 8, the statement of accounts and solvency, by 30 October</li>
<li>Income tax return</li>
<li>Audit only above ₹40 lakh turnover or ₹25 lakh contribution</li>
<li>Yearly KYC of designated partners</li>
</ul></div>
<div><h3>Private Limited Company</h3><ul class="g-list">
<li>Statutory audit every year; first auditor appointed within 30 days of incorporation</li>
<li>Board meetings during the year and an annual general meeting</li>
<li>AOC-4 and MGT-7 or MGT-7A after the AGM</li>
<li>Commencement of business declaration (INC-20A) within 180 days of incorporation</li>
<li>Income tax return, and yearly KYC of directors</li>
</ul></div>
</div>` },
    { id: "switch", h2: "Can you switch later?", html: `
<p>Yes, in both directions, but it is not quick. A private company can convert into an LLP under the LLP Act, and an LLP can register as a company under the Companies Act. Each route needs consents from all owners, clearances, filings and fees, and the tax-neutral treatment applies only if conditions are met. It is far cheaper to choose correctly at the start.</p>` }
  ],
  faqs: [
    ["Is an LLP cheaper than a Private Limited Company?", "Setting up costs are broadly similar and depend on your contribution or share capital and your State's stamp duty. Running costs are usually lower for an LLP, mainly because a small LLP does not need a statutory audit and has fewer yearly filings."],
    ["Can an LLP raise money from investors?", "An LLP can admit new partners who bring in capital, but it cannot issue shares, which is how most angel and venture investors invest. Foreign investment in an LLP is allowed only in sectors where 100% foreign investment is permitted under the automatic route without conditions."],
    ["Which is better for a startup?", "If you plan to raise equity funding or offer ESOPs, a Private Limited Company. If you are bootstrapping a service business and taking profits out, an LLP is often the better fit. Both can apply for DPIIT startup recognition."],
    ["Can one person form an LLP or a Private Limited Company?", "No. Both need at least two people. A single founder who wants limited liability can form a One Person Company."],
    ["Do I need a professional to register?", "You can file online yourself with digital signatures, but some incorporation forms must be certified by a practising Chartered Accountant, Company Secretary or Cost Accountant."]
  ],
  related: ["sole-proprietorship-vs-partnership", "how-to-register-llp", "private-limited-company-registration-documents"]
},
{
  slug: "sole-proprietorship-vs-partnership",
  title: "Sole Proprietorship vs Partnership Firm in India: Key Differences",
  h1: "Sole proprietorship vs partnership firm: which suits your business?",
  description: "Sole proprietorship or partnership firm? Compare owners, setup, liability, tax and paperwork in India, and see when an LLP is the safer choice.",
  kicker: "Business structure guide",
  answer: "If you are starting <b>alone</b>, a sole proprietorship is the simplest and cheapest way to begin: there is no separate registration law, and the profit is taxed as your own income. If <b>two or more people</b> are starting together and sharing profit, you are a partnership: write a partnership deed and preferably register the firm. In both, the owners' personal assets can be used to pay business debts. If that worries you, compare an LLP.",
  sections: [
    { id: "compare", h2: "Proprietorship vs partnership at a glance", html: `
<div class="g-table"><table>
<thead><tr><th scope="col">Point</th><th scope="col">Sole proprietorship</th><th scope="col">Partnership firm</th></tr></thead>
<tbody>
<tr><th scope="row">Law</th><td>No specific law. The business is identified through registrations such as GST, Udyam and Shops &amp; Establishments.</td><td>Indian Partnership Act, 1932</td></tr>
<tr><th scope="row">Owners</th><td>One</td><td>2 to 50 partners</td></tr>
<tr><th scope="row">Setting up</th><td>Your own PAN, plus the registrations your business needs</td><td>A partnership deed on stamp paper and a PAN for the firm; registration with the Registrar of Firms is recommended</td></tr>
<tr><th scope="row">Your personal assets</th><td>At risk, without limit</td><td>At risk; partners are liable jointly and individually for the firm's debts</td></tr>
<tr><th scope="row">Tax</th><td>Profit is your income, taxed at your slab rates</td><td>The firm pays 30% plus surcharge and cess; partners' share of profit is not taxed again</td></tr>
<tr><th scope="row">Paying the owners</th><td>You simply withdraw money</td><td>Salary and interest to partners are deductible for the firm within legal limits, and taxed in the partners' hands</td></tr>
<tr><th scope="row">Bank account</th><td>Current account in your trade name, using your registrations</td><td>Current account in the firm's name, using the deed and the firm's PAN</td></tr>
<tr><th scope="row">Raising money</th><td>Your own funds and loans</td><td>Partners' capital, loans, and new partners</td></tr>
</tbody></table></div>` },
    { id: "prop-when", h2: "When a sole proprietorship makes sense", html: `
<ul class="g-list">
<li>You are the only owner and want to start quickly, with almost no setup cost.</li>
<li>The business is small and low-risk: freelancing, tuition, a small shop or consulting.</li>
<li>Your income is modest, so taxing it at your own slab rates costs less than a firm's flat 30%.</li>
<li>You are comfortable that your personal assets stand behind business debts.</li>
</ul>` },
    { id: "pf-when", h2: "When a partnership firm makes sense", html: `
<ul class="g-list">
<li>Two or more people are investing and sharing the profit.</li>
<li>You want a simple structure with no MCA filings and low running costs.</li>
<li>The business carries modest risk, and every partner trusts the others, because each partner can bind the firm and all are liable for its debts.</li>
</ul>` },
    { id: "deed", h2: "What your partnership deed should cover", html: `
<ul class="g-list">
<li>Name and address of the firm, and its business</li>
<li>Capital each partner brings in, and the profit and loss sharing ratio</li>
<li>Salary and interest on capital for working partners, within the limits allowed for tax</li>
<li>Roles, powers to sign and bank, and how decisions are made</li>
<li>Admission, retirement and death of a partner, and how the firm is dissolved</li>
<li>How disputes are resolved</li>
</ul>
<p>An unregistered firm cannot file a court case against outsiders to enforce its contracts, so registering the firm with your State's Registrar of Firms is worth the small effort.</p>` },
    { id: "llp", h2: "When to consider an LLP instead", html: `
<p>Both a proprietorship and a partnership leave the owners personally liable. If your business takes on debt, large contracts, employees or premises, or works in a risky sector such as food, construction or healthcare, an LLP gives you limited liability with tax treatment similar to a firm. It does add yearly MCA returns. See <a href="../llp-vs-private-limited/">LLP vs Private Limited</a> for the next step up.</p>` }
  ],
  faqs: [
    ["Is partnership registration compulsory?", "In most States it is optional, but an unregistered firm cannot sue outsiders to enforce its contracts. Registering is usually worth it."],
    ["Does a sole proprietorship need GST registration?", "Only if your turnover crosses the GST threshold or another rule applies, such as inter-State supply of goods or selling through an e-commerce operator. <a href=\"../../gst-registration-checker/\">Check with our free GST Registration Checker</a>."],
    ["Can I convert my proprietorship into a partnership later?", "Yes. You bring in a partner, sign a partnership deed and transfer the business to the firm. The firm then gets its own PAN and registrations."],
    ["Which pays less tax?", "For small profits, a proprietorship usually does, because your income is taxed at slab rates with the basic exemption and rebate. For larger profits, a firm's flat rate, plus deductible salary and interest to partners, can work out lower. <a href=\"../../income-tax-calculator/\">Try our Income Tax Calculator</a>."],
    ["How many partners can a firm have?", "Between 2 and 50."]
  ],
  related: ["llp-vs-private-limited", "how-to-register-llp", "private-limited-company-registration-documents"]
},
{
  slug: "how-to-register-llp",
  title: "How to Register an LLP in India: Steps and Documents",
  h1: "How to register an LLP in India: step by step",
  description: "Register an LLP in India step by step: digital signatures, name reservation, the FiLLiP form, LLP agreement in Form 3, documents needed and yearly compliance.",
  kicker: "Registration guide",
  answer: "You register an LLP online on the MCA portal. Get Class 3 digital signatures for the designated partners, reserve a name, file the <b>FiLLiP</b> incorporation form with partner and office details, receive the Certificate of Incorporation with your LLPIN, PAN and TAN, then file the signed LLP agreement in <b>Form 3 within 30 days</b>.",
  sections: [
    { id: "who", h2: "Who can form an LLP", html: `
<ul class="g-list">
<li>At least two partners. Partners can be individuals or companies; there is no maximum.</li>
<li>At least two designated partners, who must be individuals. At least one of them must be resident in India.</li>
<li>No minimum capital. Partners agree their contribution in the LLP agreement.</li>
</ul>` },
    { id: "steps", h2: "The steps", html: `
<ol class="g-steps">
<li><h3>Get digital signatures (DSC)</h3><p>Each designated partner needs a Class 3 digital signature certificate from a licensed certifying authority. It is used to sign the MCA forms.</p></li>
<li><h3>Choose and reserve a name</h3><p>The name must end with "LLP" or "Limited Liability Partnership" and must not match an existing company, LLP or trademark. Check the MCA name index and the trademark register, then reserve it through RUN-LLP, or propose it inside FiLLiP.</p></li>
<li><h3>Collect the documents</h3><p>Identity, address and PAN of every partner, and proof of the registered office. The full list is below.</p></li>
<li><h3>File FiLLiP</h3><p>FiLLiP is the incorporation form. It carries the partners' details, contributions, the registered office and their consents, and allots designated partner numbers (DPIN) to up to two designated partners who do not already have one. It is certified by a practising professional and filed with the fee based on contribution.</p></li>
<li><h3>Receive the Certificate of Incorporation</h3><p>Once approved, the Registrar issues the certificate with your LLPIN. The LLP's PAN and TAN are allotted along with it.</p></li>
<li><h3>Sign and file the LLP agreement</h3><p>Draft the agreement (capital, profit sharing, duties, admission and exit of partners), pay stamp duty as per your State, and file it in Form 3 within 30 days of incorporation. Late filing attracts an additional fee for every day of delay.</p></li>
<li><h3>Start operating</h3><p>Open a current account, bring in the agreed contributions, and take the registrations your business needs, such as GST, Shops &amp; Establishments and Professional Tax.</p></li>
</ol>` },
    { id: "documents", h2: "Documents you need", html: `
<div class="g-two">
<div><h3>For each partner</h3><ul class="g-list">
<li>PAN card</li>
<li>Identity proof: Aadhaar, voter ID, passport or driving licence</li>
<li>Address proof: a bank statement, or an electricity, telephone or mobile bill, not older than two months</li>
<li>Passport-size photograph</li>
<li>Email address and mobile number</li>
<li>Foreign nationals and NRIs: passport and overseas address proof, notarised or apostilled as required</li>
</ul></div>
<div><h3>For the registered office</h3><ul class="g-list">
<li>A utility bill (electricity, water or gas) not older than two months</li>
<li>If rented: the rent agreement and a no-objection letter from the owner</li>
<li>If owned: proof of ownership</li>
</ul>
<h3>Prepared during filing</h3><ul class="g-list">
<li>Consent of each partner to act</li>
<li>Subscription sheet with each partner's contribution</li>
<li>The LLP agreement, after incorporation</li>
</ul></div>
</div>` },
    { id: "after", h2: "After registration: your yearly compliance", html: `
<ul class="g-list">
<li><b>Form 11</b>, the annual return, by 30 May each year</li>
<li><b>Form 8</b>, the statement of accounts and solvency, by 30 October each year</li>
<li>Income tax return by the due date</li>
<li>Statutory audit only if turnover exceeds ₹40 lakh or contribution exceeds ₹25 lakh</li>
<li>Form 4 whenever a partner joins or leaves, and Form 3 when the agreement changes</li>
</ul>
<p>LLP filings carry a late fee for every day of delay, with no upper limit, so put these dates in a shared calendar from day one.</p>` },
    { id: "mistakes", h2: "Common reasons for delay", html: `
<ul class="g-list">
<li>A name that is too close to an existing company, LLP or trademark</li>
<li>Address proof or a utility bill older than two months</li>
<li>Names or dates of birth that differ between PAN, Aadhaar and the form</li>
<li>Missing owner's no-objection letter for a rented office</li>
<li>Forgetting Form 3 within 30 days of incorporation</li>
</ul>` }
  ],
  faqs: [
    ["Is there a minimum capital for an LLP?", "No. Partners can agree any contribution. The government fee for incorporation depends on the total contribution."],
    ["Can I register an LLP myself?", "Yes, the filing is online. You need digital signatures, and the incorporation form must be certified by a practising Chartered Accountant, Company Secretary or Cost Accountant."],
    ["Can NRIs or foreign nationals be partners?", "Yes. At least one designated partner must be resident in India. Foreign partners need notarised or apostilled documents, and foreign investment rules apply."],
    ["Can a company be a partner in an LLP?", "Yes. A company can be a partner and nominates an individual to act for it."],
    ["How long does registration take?", "It depends on how quickly the MCA processes your forms and whether any resubmission is needed. Having the documents right first time is the biggest factor."]
  ],
  related: ["llp-vs-private-limited", "private-limited-company-registration-documents", "sole-proprietorship-vs-partnership"]
},
{
  slug: "private-limited-company-registration-documents",
  title: "Documents Required for Private Limited Company Registration in India",
  h1: "Documents required for Private Limited Company registration",
  description: "Full checklist of documents for Private Limited Company registration in India: director and shareholder KYC, registered office proof, SPICe+ forms, MoA, AoA and post-incorporation filings.",
  kicker: "Registration guide",
  answer: "For every director and shareholder you need a <b>PAN</b>, an <b>identity proof</b>, an <b>address proof not older than two months</b> and a <b>photograph</b>. For the registered office you need a <b>utility bill not older than two months</b> and, if rented, the <b>rent agreement and the owner's no-objection letter</b>. The company's MoA, AoA, director consents and declarations are prepared and filed online in the <b>SPICe+</b> form.",
  sections: [
    { id: "basics", h2: "Before you start", html: `
<ul class="g-list">
<li>At least two directors, at least one of them resident in India, and at least two shareholders. The same people can be both.</li>
<li>At most 200 members. No minimum share capital.</li>
<li>Class 3 digital signatures for the directors and subscribers who sign the forms.</li>
<li>Director identification numbers (DIN) are allotted inside SPICe+ for up to three new directors.</li>
</ul>` },
    { id: "checklist", h2: "Document checklist", html: `
<div class="g-two">
<div><h3>Each director and shareholder (Indian)</h3><ul class="g-list">
<li>PAN card</li>
<li>Identity proof: Aadhaar, voter ID, passport or driving licence</li>
<li>Address proof: a bank statement, or an electricity, telephone or mobile bill, not older than two months</li>
<li>Passport-size photograph</li>
<li>Email address and mobile number</li>
</ul>
<h3>Foreign nationals and NRIs</h3><ul class="g-list">
<li>Passport</li>
<li>Overseas address proof</li>
<li>Documents notarised, and apostilled or consularised as required</li>
</ul></div>
<div><h3>Registered office</h3><ul class="g-list">
<li>A utility bill (electricity, water or gas) not older than two months</li>
<li>Rent agreement, if the premises are rented</li>
<li>No-objection letter from the owner</li>
<li>Proof of ownership, if owned</li>
</ul>
<h3>A company or LLP as shareholder</h3><ul class="g-list">
<li>Its certificate of incorporation and PAN</li>
<li>Board resolution authorising the investment and a representative</li>
</ul></div>
</div>` },
    { id: "forms", h2: "Forms prepared during registration", html: `
<ul class="g-list">
<li><b>SPICe+ Part A</b>: name reservation (you can propose two names)</li>
<li><b>SPICe+ Part B</b>: incorporation details, directors, shareholders, capital and registered office</li>
<li><b>e-MoA (INC-33)</b> and <b>e-AoA (INC-34)</b>: the company's objects and internal rules</li>
<li><b>INC-9</b>: declarations by subscribers and first directors</li>
<li><b>DIR-2</b>: each director's consent to act</li>
<li><b>AGILE-PRO-S</b>: applications for GSTIN (if needed), EPFO, ESIC, a bank account and, in some States, Professional Tax</li>
</ul>
<p>PAN and TAN for the company are applied for through SPICe+ and arrive with the Certificate of Incorporation.</p>` },
    { id: "after", h2: "After incorporation", html: `
<ul class="g-list">
<li>Certificate of Incorporation with the CIN, PAN and TAN</li>
<li>Open the company's bank account and collect the share subscription money</li>
<li>Hold the first board meeting and appoint the first auditor within 30 days</li>
<li>Issue share certificates within two months of incorporation</li>
<li>File the commencement of business declaration (INC-20A) within 180 days</li>
<li>Set up statutory registers and a compliance calendar</li>
</ul>` },
    { id: "mistakes", h2: "Common reasons for rejection or delay", html: `
<ul class="g-list">
<li>Proposed name too similar to an existing company, LLP or trademark</li>
<li>Utility bill or address proof older than two months</li>
<li>Mismatch between names on PAN, Aadhaar and the form</li>
<li>Unclear or unsigned owner's no-objection letter</li>
<li>Objects in the MoA that do not match the business activity</li>
</ul>` }
  ],
  faqs: [
    ["Is there a minimum capital for a Private Limited Company?", "No. You can start with any share capital. Fees and stamp duty depend on the authorised capital and your State."],
    ["Can my home be the registered office?", "Yes, with a recent utility bill and, if the home is not in your name, a no-objection letter from the owner."],
    ["Can the same person be a director and a shareholder?", "Yes. Most small companies start with two people who are both directors and shareholders."],
    ["Do directors need a DIN before applying?", "No. SPICe+ allots DINs to up to three new directors as part of incorporation."],
    ["Is a Private Limited Company the right choice for me?", "It suits founders who plan to raise investment, issue ESOPs or keep profit in the business. If you will take most of the profit out, compare an LLP first."]
  ],
  related: ["llp-vs-private-limited", "how-to-register-llp", "sole-proprietorship-vs-partnership"]
}
];
