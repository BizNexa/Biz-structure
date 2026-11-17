// Second batch of search guides (high-volume searches): business structures, LLP pros and cons,
// Pvt Ltd pros and cons, partnership vs LLP. Same shape as guides-content.cjs.
const tool = (R) => `<p class="g-toolcta">Want the numbers for your own business? <a href="../../entity-tax-comparison/#tool">Compare the total tax as a proprietor, firm / LLP or Pvt Ltd</a>, or <a href="../../business-structure/#quiz">find your structure in 4 quick taps</a>.</p>`;

module.exports = [
{
  slug: "types-of-business-structures-in-india",
  title: "Types of Business Structures in India: 7 Forms of Business Organisation Compared",
  h1: "Types of business structures in India: the 7 forms compared",
  description: "The 7 forms of business organisation in India compared: sole proprietorship, partnership, LLP, OPC, private limited, public limited and Section 8. Liability, tax, compliance and which to choose.",
  kicker: "Business structure guide",
  answer: "India has seven main forms of business organisation: <b>sole proprietorship, partnership firm, limited liability partnership (LLP), one person company (OPC), private limited company, public limited company</b> and <b>Section 8 company</b> (for non-profits). They differ in three ways that matter most: whether your personal assets are at risk, how the profit is taxed, and how much compliance you face each year. Most small businesses choose between a proprietorship, an LLP and a private limited company.",
  sections: [
    { id: "compare", h2: "The 7 business structures at a glance", html: `
<div class="g-table"><table>
<thead><tr><th scope="col">Structure</th><th scope="col">Owners</th><th scope="col">Personal liability</th><th scope="col">How profit is taxed</th><th scope="col">Yearly compliance</th></tr></thead>
<tbody>
<tr><th scope="row">Sole proprietorship</th><td>1</td><td>Unlimited</td><td>As the owner's income, at slab rates</td><td>Lowest</td></tr>
<tr><th scope="row">Partnership firm</th><td>2 to 50</td><td>Unlimited, joint</td><td>30% in the firm; partners' share not taxed again</td><td>Low</td></tr>
<tr><th scope="row">LLP</th><td>2 or more</td><td>Limited to contribution</td><td>30% in the LLP; partners' share not taxed again</td><td>Moderate</td></tr>
<tr><th scope="row">One person company</th><td>1</td><td>Limited</td><td>Company rates (about 25.17% under the concessional regime)</td><td>High</td></tr>
<tr><th scope="row">Private limited company</th><td>2 to 200</td><td>Limited</td><td>Company rates; dividends taxed again in shareholders' hands</td><td>High</td></tr>
<tr><th scope="row">Public limited company</th><td>7 or more</td><td>Limited</td><td>Company rates</td><td>Highest</td></tr>
<tr><th scope="row">Section 8 company</th><td>2 or more</td><td>Limited</td><td>Can register for exemption as a non-profit</td><td>High</td></tr>
</tbody></table></div>` },
    { id: "each", h2: "Each form of business organisation explained", html: `
<h3>1. Sole proprietorship</h3><p>One person runs the business in their own name. There is no separate registration law: the business is identified through registrations such as GST, Udyam and Shops &amp; Establishments. It is the quickest and cheapest way to start, but the owner is personally liable for every business debt.</p>
<h3>2. Partnership firm</h3><p>Two or more people share the profit under a partnership deed (Indian Partnership Act, 1932). Simple and inexpensive, with no MCA filings, but every partner is personally liable for the firm's debts, and each partner can bind the firm.</p>
<h3>3. Limited liability partnership (LLP)</h3><p>A partnership with a separate legal identity (LLP Act, 2008). Partners' liability is limited to what they agreed to contribute, and profit is taxed once. It suits professionals, agencies and service businesses that take most of the profit out.</p>
<h3>4. One person company (OPC)</h3><p>A company with a single member (Companies Act, 2013), with a nominee named in case the member dies or is unable to act. It gives a solo founder limited liability and a company's credibility, with company-level compliance.</p>
<h3>5. Private limited company</h3><p>The usual choice for startups and growing businesses. It can issue shares to investors and offer ESOPs, and the owners' liability is limited. It has the most structured yearly compliance of the common forms: statutory audit, board meetings, an AGM and MCA returns.</p>
<h3>6. Public limited company</h3><p>Needed to raise money from the public or to list on a stock exchange. It requires at least seven members and three directors, and faces the heaviest regulation.</p>
<h3>7. Section 8 company</h3><p>A company formed for charitable or not-for-profit objects. Profit cannot be distributed to members and must be used for the objects. It is the company form for NGOs and foundations.</p>` },
    { id: "choose", h2: "How to choose the right structure", html: `
<ul class="g-list">
<li><b>Starting alone with low risk?</b> A sole proprietorship. Add limited liability later with an OPC or a private limited company.</li>
<li><b>Two or more people, taking most of the profit out?</b> An LLP usually costs less tax and less compliance than a company.</li>
<li><b>Planning to raise investment or give ESOPs?</b> A private limited company; investors invest through shares.</li>
<li><b>Risky sector, large contracts or employees?</b> Choose a form with limited liability: LLP, OPC or private limited.</li>
<li><b>Charitable or non-profit purpose?</b> A Section 8 company.</li>
</ul>
${tool()}` },
    { id: "change", h2: "Can you change your structure later?", html: `
<p>Yes. A proprietorship can move to a partnership or company, a partnership firm can convert into an LLP, and a private company and an LLP can convert into each other. Each conversion needs consents, filings and fees, and some tax benefits apply only if conditions are met. Choosing well at the start saves this cost.</p>` }
  ],
  faqs: [
    ["What are the main forms of business organisation in India?", "Sole proprietorship, partnership firm, limited liability partnership, one person company, private limited company, public limited company and Section 8 company. Hindu undivided families, trusts, societies and co-operatives are other forms used in specific situations."],
    ["Which business structure is best for a small business?", "For one owner with low risk, a sole proprietorship. For two or more owners who want limited liability and take most of the profit out, an LLP. For a business that will raise investment, a private limited company."],
    ["Which structure has the lowest compliance?", "A sole proprietorship, followed by a partnership firm. Neither files returns with the Ministry of Corporate Affairs."],
    ["Which structures give limited liability?", "LLP, one person company, private limited company, public limited company and Section 8 company. In a proprietorship or partnership firm the owners' personal assets can be used to pay business debts."],
    ["Which structure pays the least tax?", "It depends on your profit, the number of owners and how much you take out. Use the Biz Matrix Entity Tax Comparison to see the total tax for your own figures."]
  ],
  related: ["llp-vs-private-limited", "llp-advantages-and-disadvantages", "private-limited-company-advantages-and-disadvantages"]
},
{
  slug: "llp-advantages-and-disadvantages",
  title: "Advantages and Disadvantages of LLP in India (Benefits of an LLP)",
  h1: "Advantages and disadvantages of an LLP in India",
  description: "Benefits of a limited liability partnership in India: limited liability, single tax on profit, low compliance and no minimum capital. Plus the disadvantages, and when an LLP is the right choice.",
  kicker: "Business structure guide",
  answer: "An LLP gives partners <b>limited liability</b> and a <b>separate legal identity</b>, like a company, while keeping the <b>flexibility and single taxation of a partnership</b>: partners' share of profit is not taxed again. There is no minimum capital, and a small LLP needs no statutory audit. The main drawbacks: it <b>cannot issue shares or ESOPs</b>, which makes venture funding difficult; profit kept in the LLP is taxed at 30%, higher than a company's concessional rate; and late MCA filings attract a daily fee.",
  sections: [
    { id: "advantages", h2: "Advantages of an LLP", html: `
<div class="g-table"><table><thead><tr><th scope="col">Benefit</th><th scope="col">What it means for you</th></tr></thead><tbody>
<tr><th scope="row">Limited liability</th><td>Your liability is limited to the contribution you agreed. Your house and savings are protected from the LLP's debts.</td></tr>
<tr><th scope="row">Separate legal entity</th><td>The LLP owns property, signs contracts and sues in its own name, and continues when partners change.</td></tr>
<tr><th scope="row">Profit taxed once</th><td>The LLP pays 30% (plus surcharge above ₹1 crore and cess). Your share of the profit reaches you without further tax.</td></tr>
<tr><th scope="row">Deductible pay to partners</th><td>Remuneration to working partners within legal limits, and interest on capital up to 12%, are deductible for the LLP and taxed at the partners' own slab rates.</td></tr>
<tr><th scope="row">No minimum capital</th><td>Partners agree any contribution in the LLP agreement.</td></tr>
<tr><th scope="row">Lighter compliance than a company</th><td>No board meetings or AGM. Statutory audit only above ₹40 lakh turnover or ₹25 lakh contribution.</td></tr>
<tr><th scope="row">No limit on partners</th><td>Unlike a partnership firm (maximum 50), an LLP can have any number of partners.</td></tr>
<tr><th scope="row">Flexible management</th><td>The LLP agreement sets roles, profit sharing and decision-making, without the formality of a board.</td></tr>
</tbody></table></div>` },
    { id: "disadvantages", h2: "Disadvantages of an LLP", html: `
<ul class="g-list">
<li><b>No shares or ESOPs.</b> Angel and venture investors invest through shares, so fundraising is much harder than in a private limited company.</li>
<li><b>Higher tax on retained profit.</b> Profit kept in the business is taxed at 30%, against about 25.17% for a company under the concessional regime.</li>
<li><b>No presumptive taxation.</b> Unlike a proprietor or a partnership firm, an LLP cannot use the presumptive income scheme.</li>
<li><b>Late-filing fees.</b> Form 11 (due 30 May) and Form 8 (due 30 October) attract an additional fee for every day of delay.</li>
<li><b>Two designated partners required</b>, at least one resident in India, each with a DPIN and digital signature.</li>
<li><b>Less familiar to some lenders and large clients</b> than a private limited company.</li>
</ul>` },
    { id: "who", h2: "Who should choose an LLP?", html: `
<ul class="g-list">
<li>Two or more partners running a professional practice, agency, consultancy or service business.</li>
<li>Owners who plan to take most of the profit out each year.</li>
<li>Businesses that want protection from personal liability without a company's compliance.</li>
<li>Not ideal if you plan to raise venture capital or reward staff with ESOPs: choose a private limited company.</li>
</ul>
${tool()}` }
  ],
  faqs: [
    ["What are the main benefits of an LLP?", "Limited liability, a separate legal identity, profit taxed once, no minimum capital, deductible remuneration and interest to partners, and lighter compliance than a company."],
    ["What are the disadvantages of an LLP?", "It cannot issue shares or ESOPs, retained profit is taxed at 30%, it cannot use presumptive taxation, and late MCA filings attract a daily fee."],
    ["Is an LLP better than a private limited company?", "For partners who take most of the profit out and do not need investors, often yes. For businesses raising equity or offering ESOPs, a private limited company is better."],
    ["Does an LLP need an audit?", "A statutory audit is needed only if turnover exceeds ₹40 lakh or contribution exceeds ₹25 lakh. A tax audit applies above the income-tax turnover limits, as for any business."],
    ["How many partners can an LLP have?", "At least two, with no upper limit. At least two must be designated partners, one of them resident in India."]
  ],
  related: ["llp-vs-private-limited", "how-to-register-llp", "partnership-firm-vs-llp"]
},
{
  slug: "private-limited-company-advantages-and-disadvantages",
  title: "Private Limited Company: Advantages and Disadvantages (Pros and Cons) in India",
  h1: "Private limited company: advantages and disadvantages",
  description: "Pros and cons of a private limited company in India: limited liability, investor funding, ESOPs and credibility, against higher compliance, mandatory audit and tax on dividends.",
  kicker: "Business structure guide",
  answer: "A private limited company gives its owners <b>limited liability</b>, a <b>separate legal identity</b> and the ability to <b>raise money by issuing shares and offer ESOPs</b>, which is why startups choose it. Profit kept in the company is taxed at about <b>25.17%</b> under the concessional regime. The trade-offs: a <b>statutory audit every year</b>, board meetings, an AGM and MCA returns, higher running costs, and <b>dividends are taxed again</b> in the shareholders' hands.",
  sections: [
    { id: "advantages", h2: "Advantages of a private limited company", html: `
<div class="g-table"><table><thead><tr><th scope="col">Benefit</th><th scope="col">What it means for you</th></tr></thead><tbody>
<tr><th scope="row">Limited liability</th><td>Shareholders risk only any unpaid amount on their shares. Personal assets are protected.</td></tr>
<tr><th scope="row">Raise equity funding</th><td>The company can issue shares to angel investors and venture funds, the way most startup funding works.</td></tr>
<tr><th scope="row">ESOPs</th><td>Reward and retain employees with stock options, which LLPs and firms cannot offer.</td></tr>
<tr><th scope="row">Lower tax on retained profit</th><td>About 25.17% under the concessional regime (22% plus surcharge and cess), with no minimum alternate tax.</td></tr>
<tr><th scope="row">Credibility</th><td>Banks, large clients and government buyers are often more comfortable dealing with a company.</td></tr>
<tr><th scope="row">Perpetual succession</th><td>The company continues regardless of changes in shareholders or directors.</td></tr>
<tr><th scope="row">Easy change of ownership</th><td>Ownership moves by transferring shares, subject to the articles of association.</td></tr>
<tr><th scope="row">Deductible director salary</th><td>Salary to working directors is an expense for the company and taxed in the directors' hands, with the salary standard deduction.</td></tr>
</tbody></table></div>` },
    { id: "disadvantages", h2: "Disadvantages of a private limited company", html: `
<ul class="g-list">
<li><b>Highest compliance of the common forms.</b> Statutory audit every year, board meetings, an annual general meeting, and AOC-4 and MGT-7/7A filings.</li>
<li><b>Higher running cost</b> for accounting, audit and company-secretarial work.</li>
<li><b>Dividends are taxed twice.</b> The company pays tax, and shareholders pay tax again on dividends at their slab rates.</li>
<li><b>Post-incorporation steps.</b> First auditor within 30 days, share certificates within two months, and the commencement-of-business declaration within 180 days.</li>
<li><b>Limits:</b> at most 200 members, and the company cannot invite the public to subscribe to its shares.</li>
<li><b>Closing down</b> takes longer and costs more than closing a proprietorship or firm.</li>
</ul>` },
    { id: "who", h2: "Who should choose a private limited company?", html: `
<ul class="g-list">
<li>Startups planning to raise investment or offer ESOPs.</li>
<li>Businesses that will keep most of the profit to grow.</li>
<li>Businesses where credibility with banks, large clients or government buyers matters.</li>
<li>If you will take most of the profit out and do not need investors, compare an LLP first.</li>
</ul>
${tool()}` }
  ],
  faqs: [
    ["What are the advantages of a private limited company?", "Limited liability, the ability to raise equity and offer ESOPs, lower tax on retained profit under the concessional regime, credibility, perpetual succession and easy transfer of ownership."],
    ["What are the disadvantages of a private limited company?", "Higher compliance and cost, a mandatory statutory audit, dividends taxed again in shareholders' hands, a 200-member limit and a slower closure process."],
    ["What is the tax rate for a private limited company?", "About 25.17% under the concessional regime (22% plus a 10% surcharge and 4% cess), with no minimum alternate tax."],
    ["Is audit compulsory for a private limited company?", "Yes. A company's accounts are audited every year, whatever its size."],
    ["Can one person form a private limited company?", "No, it needs at least two members and two directors. A single founder can form a one person company instead."]
  ],
  related: ["llp-vs-private-limited", "private-limited-company-registration-documents", "llp-advantages-and-disadvantages"]
},
{
  slug: "partnership-firm-vs-llp",
  title: "Partnership Firm vs LLP in India: Differences, Tax and Which to Choose",
  h1: "Partnership firm vs LLP: which should you choose?",
  description: "Partnership firm vs LLP in India compared: liability, registration, tax, presumptive taxation, audit, compliance and cost. See which suits your business.",
  kicker: "Business structure guide",
  answer: "Both are taxed the same way: <b>30% on the profit</b>, with partners' share not taxed again and partners' remuneration and interest deductible within limits. The big difference is <b>liability</b>: in a partnership firm partners are personally liable for the firm's debts; in an LLP liability is <b>limited to the agreed contribution</b>. A firm is cheaper and simpler to run and can use presumptive taxation; an LLP files two returns with the MCA each year but protects your personal assets.",
  sections: [
    { id: "compare", h2: "Partnership firm vs LLP at a glance", html: `
<div class="g-table"><table>
<thead><tr><th scope="col">Point</th><th scope="col">Partnership firm</th><th scope="col">LLP</th></tr></thead>
<tbody>
<tr><th scope="row">Law</th><td>Indian Partnership Act, 1932</td><td>Limited Liability Partnership Act, 2008</td></tr>
<tr><th scope="row">Registration</th><td>Partnership deed; registration with the Registrar of Firms is optional in most States</td><td>Mandatory incorporation with the MCA</td></tr>
<tr><th scope="row">Separate legal entity</th><td>No</td><td>Yes</td></tr>
<tr><th scope="row">Partners' liability</th><td>Unlimited, joint and individual</td><td>Limited to agreed contribution</td></tr>
<tr><th scope="row">Number of partners</th><td>2 to 50</td><td>2 or more, no upper limit</td></tr>
<tr><th scope="row">Income tax</th><td>30% plus surcharge and cess</td><td>30% plus surcharge and cess</td></tr>
<tr><th scope="row">Presumptive taxation</th><td>Available within the limits</td><td>Not available</td></tr>
<tr><th scope="row">Statutory audit</th><td>No (tax audit above the income-tax limits)</td><td>Above ₹40 lakh turnover or ₹25 lakh contribution</td></tr>
<tr><th scope="row">Yearly MCA filings</th><td>None</td><td>Form 11 and Form 8</td></tr>
<tr><th scope="row">Running cost</th><td>Lower</td><td>Moderate</td></tr>
</tbody></table></div>` },
    { id: "firm", h2: "When a partnership firm makes sense", html: `
<ul class="g-list">
<li>A small, low-risk business among people who trust each other.</li>
<li>You want the lowest compliance and cost, with no MCA filings.</li>
<li>You want to use presumptive taxation instead of keeping full books.</li>
</ul>` },
    { id: "llp", h2: "When an LLP makes sense", html: `
<ul class="g-list">
<li>The business takes on debt, large contracts, employees or premises, so limited liability matters.</li>
<li>You want a separate legal identity that continues when partners change.</li>
<li>You expect more than 50 partners in future.</li>
<li>You can manage two MCA returns each year and their due dates.</li>
</ul>
${tool()}` },
    { id: "convert", h2: "Converting a partnership firm into an LLP", html: `
<p>An existing partnership firm can convert into an LLP under the LLP Act, carrying over its assets, liabilities and contracts. All partners must become partners of the LLP. The tax-neutral treatment of the transfer applies only if the conditions in the Income-tax Act are met, so check them before converting.</p>` }
  ],
  faqs: [
    ["Which is better, a partnership firm or an LLP?", "An LLP if you want limited liability and can manage two MCA returns a year; a partnership firm if the business is small, low-risk and you want the lowest cost and presumptive taxation."],
    ["Is the tax the same for a partnership firm and an LLP?", "Yes. Both pay 30% plus surcharge and cess; partners' share of profit is not taxed again, and remuneration and interest to partners are deductible within the legal limits."],
    ["Can an LLP use presumptive taxation?", "No. Presumptive taxation is available to individuals, HUFs and partnership firms, but not to LLPs."],
    ["Is registration compulsory for a partnership firm?", "In most States it is optional, but an unregistered firm cannot sue outsiders to enforce its contracts, so registering is usually worth it."],
    ["Can a partnership firm be converted into an LLP?", "Yes, under the LLP Act, with the consent of all partners. Check the Income-tax Act conditions for a tax-neutral conversion first."]
  ],
  related: ["llp-advantages-and-disadvantages", "sole-proprietorship-vs-partnership", "how-to-register-llp"]
}
];
