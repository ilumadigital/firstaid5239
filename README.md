# Firstaid5239.gr — ΕΝΑΚ / Νόμος 5239/2025

## Production deployment: Hostinger / public_html + private .env (15/10/2026)

**Τρέχων στόχος:** απευθείας PHP hosting (Hostinger) με SMTP και Cloudflare Turnstile. Η παλαιότερη παρακάτω ενότητα Vercel/Resend είναι εναλλακτική για άλλο hosting και **δεν ενεργοποιεί** το νέο PHP backend.

### Διάταξη αρχείων στον server

```text
/home/USER/domains/firstaid5239.gr/
├── .env                         # PRIVATE — κανένα public URL
├── composer.json                # PRIVATE
├── vendor/                      # PRIVATE — PHPMailer via Composer
└── public_html/
    ├── index.html
    ├── script.js
    ├── styles.css
    ├── ...                      # υπόλοιπα αρχεία dist/
    └── api/
        ├── .htaccess            # rewrite /api/contact και προστασία _bootstrap
        ├── _bootstrap.php       # reads ../.. /.env relative to api/
        ├── config.php           # returns ONLY public Turnstile site key
        └── contact.php          # validates Turnstile, sends 2 SMTP emails
```

1. Στο Cloudflare Turnstile δημιουργήστε widget για `firstaid5239.gr` και `www.firstaid5239.gr`. Αντιγράψτε το **Site Key** και το **Secret Key**. Το Site Key επιτρέπεται να φτάσει στον browser, το Secret Key όχι.
2. Εκτελέστε `npm run build` και ανεβάστε το περιεχόμενο του `dist/` **μέσα** στο `public_html/`, μαζί με τα dotfiles (`api/.htaccess`). Κρατήστε **μόνο τα public αρχεία** μέσα στο document root.
3. Στον φάκελο **ακριβώς πάνω από το `public_html/`**, δημιουργήστε `.env` από το `.env.example` και συμπληρώστε τον **καινούριο** κωδικό SMTP και τα Turnstile keys. Ποτέ `.env` μέσα σε public_html, `dist`, repo ή JavaScript. Ο PHP κώδικας αναζητά το private env στο `dirname(__DIR__, 2) . '/.env'` από τον φάκελο `public_html/api/`.
4. Στον ίδιο private φάκελο τοποθετήστε το `composer.json` και εκτελέστε `composer install --no-dev --prefer-dist --optimize-autoloader`. Εναλλακτικά, αν δεν υπάρχει SSH/Composer στη φιλοξενία, εκτελέστε Composer τοπικά και ανεβάστε τον φάκελο `vendor/` δίπλα στο `.env`. Μην τοποθετείτε το `vendor/` στο public_html. Απαιτείται PHP 8.1+, cURL και OpenSSL.
5. Επιβεβαιώστε ότι το `https://firstaid5239.gr/api/config.php` επιστρέφει JSON με **μόνο** `turnstileSiteKey`. Μην περιμένετε ποτέ να εμφανιστεί SMTP password ή Turnstile secret σε απόκριση.
6. Υποβάλετε **πραγματικό** αίτημα από κάθε φόρμα (hero και επικοινωνία) και ελέγξτε α) email ΕΝΑΚ στο `info@enak.gr`, β) επιβεβαίωση στο email πελάτη, γ) σωστό Reply-To, δ) logs/Spam. Δοκιμάστε επίσης ληγμένο/απούσα Turnstile token: πρέπει να απορρίπτεται χωρίς SMTP αποστολή.
7. Ελέγξτε SPF/DKIM/DMARC και επιτρέψτε SMTP 465 outbound στο hosting. Αν το `public_html` είναι symlink ή έχει διαφορετική διαδρομή, προσαρμόστε στο `_bootstrap.php` και στο `contact.php` την **ίδια** βάση διαδρομής του private folder.

Παράδειγμα private `.env` χωρίς πραγματικά secrets: `.env.example`. Πεδία: `SMTP_HOST=smtp.hostinger.com`, `SMTP_PORT=465`, `SMTP_USER=info@enak.gr`, `SMTP_PASSWORD` (μυστικό), `MAIL_FROM=info@enak.gr`, `MAIL_TO=info@enak.gr`, `TURNSTILE_SITE_KEY` (public), `TURNSTILE_SECRET_KEY` (μυστικό) και `TURNSTILE_ALLOWED_HOSTNAMES` (comma-separated). Η υποβολή αποτυγχάνει με σαφές μήνυμα αν λείπει κρίσιμη ρύθμιση: ποτέ ψευδές success.

**Ειδικά για την ασφάλεια:** Αν κάποιος κωδικός SMTP κοινοποιήθηκε σε chat ή τρίτο πρόσωπο, αλλάξτε τον πριν τη χρήση, και προσθέστε στο private `.env` μόνο τον νέο κωδικό. Δώστε στο `.env` τα ελάχιστα δικαιώματα πρόσβασης που επιτρέπει το hosting (π.χ. `chmod 600`). Η τελική παράδοση στο Inbox δεν εγγυάται μόνο από την επιτυχία SMTP acceptance.

## Branding και lead capture (έκδοση 12/10/2026)

- **Επίσημο logo ΕΝΑΚ:** `public/enak-logo.png`, προέλευση `https://enak.gr/wp-content/uploads/2024/03/ENAK.png`, αντιγραμμένο τοπικά και δημοσιευμένο στο `/enak-logo.png`. Χρησιμοποιείται στο header, footer, favicon, privacy page, Open Graph metadata και Organization Schema.
- **Γραμματοσειρά:** `Google Sans Flex` από Google Fonts με `Noto Sans` ως εφεδρική για ελληνικούς χαρακτήρες που ενδέχεται να μην υποστηρίζονται από την Google Sans Flex. Καθολική εφαρμογή σε σώμα, τίτλους, πεδία και κουμπιά.
- **Δύο φόρμες:** κύρια φόρμα προσφοράς στο hero (above the fold) και πλήρης φόρμα στο τέλος. Και οι δύο έχουν ξεχωριστά IDs/μηνύματα, ίδια validation, GDPR checkbox, honeypot και τον ίδιο `POST /api/contact` μηχανισμό διπλής ειδοποίησης.
- Το workflow κατεβάζει την αυθεντική εικόνα από enak.gr μόνο αν λείπει το `public/enak-logo.png`. Το GitHub Actions κάνει build/test και δημοσιεύει τον τελικό HTML/CSS/JS και την εικόνα στη ρίζα του repository για static hosting. Για λειτουργική αποστολή email χρειάζεται ενεργός Vercel/serverless provider και ρυθμισμένο Resend.


Πλήρες responsive μονοσέλιδο marketing + legal explainer website για εκπαίδευση πρώτων βοηθειών επιχειρήσεων. Βασίζεται στο **άρθρο 39 του Ν. 5239/2025** και στην **έναρξη ισχύος από 01.01.2026** (άρθρο 103 παρ. 2). Το site παρέχει δύο νομικές κατηγορίες προσωπικού, calculator, προγράμματα ΕΝΑΚ, 18 FAQ, schema.org graph, llms.txt/llms-full.txt, sitemap, robots, privacy policy και φόρμα προσφοράς.

## Τεχνολογία

- Static, server-rendered στο build HTML (χωρίς client-side rendering του βασικού περιεχομένου), CSS, απλό JavaScript.
- Node.js >= 20, **χωρίς εξωτερικά npm dependencies**.
- `build.mjs` παράγει `dist/index.html` από `src/01-header.html`…`src/04-contact.html`, ενσωματώνει τα 18 FAQ στο HTML και στο JSON-LD, δημιουργεί `dist/faq.md` και αντιγράφει το `public/`.
- Vercel Serverless API `/api/contact`, χρήση του Resend Batch API για **δύο emails σε μία αποδεκτή παρτίδα** (ΕΝΑΚ + πελάτης). Ο κώδικας βρίσκεται σε `api/contact.cjs` και το Vercel entrypoint σε `api/contact.js`.
- `npm run build`, `npm run test` (μετά το build), `npm run check` (syntax + build + tests).

## Αποστολή μέσω Hostinger SMTP (προτεινόμενη)

Το `/api/contact` υποστηρίζει SMTP μέσω Nodemailer και χρησιμοποιεί την Hostinger, όταν έχουν οριστεί οι μεταβλητές `SMTP_USER` και `SMTP_PASSWORD`. Οι μεταβλητές μπαίνουν **μόνο στο Vercel → Project → Settings → Environment Variables**, ποτέ στο GitHub, σε client-side JS ή σε αρχεία `.env` που γίνονται commit.

| Variable | Value |
| --- | --- |
| `SMTP_HOST` | `smtp.hostinger.com` |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | `info@enak.gr` |
| `SMTP_PASSWORD` | Το νέο password του mailbox (secret) |
| `MAIL_FROM` | `info@enak.gr` |
| `MAIL_TO` | `info@enak.gr` |

Μετά την αποθήκευση των μεταβλητών, κάντε Redeploy του production deployment. Η πρώτη αποστολή είναι το αίτημα προς ΕΝΑΚ με Reply-To τον ενδιαφερόμενο, η δεύτερη είναι η επιβεβαίωση στον ενδιαφερόμενο. Τα credentials δεν εκτίθενται στον browser. Το SMTP είναι προεπιλεγμένο όταν υπάρχουν τα δύο secrets· αλλιώς παραμένει η παλαιά ενσωμάτωση Resend.

**Ασφάλεια:** Αλλάξτε τον κωδικό του mailbox αν δημοσιοποιήθηκε ή μοιράστηκε σε συνομιλία. Χρησιμοποιήστε τον νέο κωδικό αποκλειστικά σε ασφαλές secret storage. Μην υποθέσετε ότι η επιτυχία στην κλήση SMTP εγγυάται τελική παράδοση στο Inbox· ελέγξτε και spam/SMTP logs.

## Δημοσίευση στο Vercel

1. Στο Vercel, **Add New Project → Import** από GitHub `ilumadigital/firstaid5239`.
2. Framework: **Other**. Το `vercel.json` ορίζει Build Command `npm run build` και Output Directory `dist`.
3. Ορίστε το custom domain `firstaid5239.gr` (και κατά προτίμηση `www.firstaid5239.gr` με 301 redirect προς το non-www canonical). Προσθέστε τις DNS εγγραφές που θα εμφανίσει το Vercel στον διαχειριστή DNS του domain.
4. Στον λογαριασμό **Resend**, επαληθεύστε domain που ελέγχει η ΕΝΑΚ (π.χ. `firstaid5239.gr`) και τις DNS εγγραφές SPF/DKIM που δίνει ο πάροχος. **Μην χρησιμοποιείτε** αυθαίρετο From από domain που δεν έχει επαληθευτεί.
5. Στο Vercel → Project → Settings → Environment Variables ορίστε:
   - `RESEND_API_KEY`: πραγματικό private API key Resend (μόνο server-side).
   - `MAIL_FROM`: π.χ. `ENAK First Aid <noreply@firstaid5239.gr>` (**verified sender/domain**).
   - `MAIL_TO`: `info@enak.gr` (προεπιλογή, μπορείτε να το δηλώσετε ρητά).
6. Κάντε Redeploy. Δοκιμάστε **αληθινή** αποστολή από το live domain με δικό σας email, ελέγξτε Inbox/Spam του αιτούντος και Inbox του `info@enak.gr`, καθώς και τα Resend Delivery Logs. Ελέγξτε ότι το Reply-To του email της ΕΝΑΚ είναι ο αιτών.
7. Για την ευρετηρίαση: Google Search Console / Bing Webmaster Tools, επιβεβαίωση domain, υποβολή `https://firstaid5239.gr/sitemap.xml`, έλεγχος robots, canonical και JSON-LD. Η ευρετηρίαση και η κατάταξη εξαρτώνται από τις μηχανές αναζήτησης· **καμία θέση #1 δεν μπορεί να εγγυηθεί**.

> Χωρίς πραγματικό Resend API key / verified sender, η φόρμα εμφανίζει **σαφές σφάλμα 503**. Δεν εμφανίζει ψεύτικη επιβεβαίωση. Η επιτυχής απόκριση του Batch API σημαίνει ότι ο πάροχος **δέχτηκε** τα δύο emails για επεξεργασία· για την τελική παράδοση πρέπει να ελέγχονται τα logs και τα mailbox. Η ανίχνευση spam παρέχει honeypot και server-side validation· για υψηλή κίνηση προτείνεται και WAF/rate limiting από το hosting.

## Βασικά URL

- `/` — Πλήρης μονοσέλιδη παρουσίαση, νόμος, δύο περιπτώσεις προσωπικού, εκπαίδευση, FAQ, φόρμα.
- `/privacy.html` — GDPR ενημέρωση (νομική βοηθητική σελίδα).
- `/robots.txt`, `/sitemap.xml` — Crawlers / sitemap.
- `/llms.txt`, `/llms-full.txt`, `/faq.md` — Οργανωμένη πληροφορία για συστήματα AI και απαντήσεις.
- `/api/contact` — Επαληθευμένη υποβολή JSON με απάντηση `{ok: true|false}`.

## Νομική ακρίβεια

- **Έως 50 εργαζόμενοι ανά εγκατάσταση**: υλικό/βίντεο Υπουργείου Εργασίας (άρθρο 39, δα).
- **Πάνω από 50**: μαθήματα από πιστοποιημένο εκπαιδευτικό φορέα στο **ήμισυ του προσωπικού** ανά εγκατάσταση, **τουλάχιστον ανά 3 έτη** (άρθρο 39, δβ).
- **Έναρξη ισχύος**: 1/1/2026 (άρθρο 103 παρ. 2).
- ΚΑΡΠΑ και Χάιμλιχ είναι οι ειδικές ενότητες του άρθρου. AED / άλλες πρώτες βοήθειες είναι προαιρετικές πρόσθετες ενότητες, όχι απαιτήσεις που θεσπίζει ειδικά το άρθρο 39.

Πηγές: [ΕΛΙΝΥΑΕ](https://www.elinyae.gr/ethniki-nomothesia/n-52392025-fek-178a-20102025), [TaxHeaven άρθρο 39](https://www.taxheaven.gr/law/5239/2025/article/39/view), [TaxHeaven άρθρο 103](https://www.taxheaven.gr/law/5239/2025/article/103/view), [ΕΝΑΚ Πρώτες Βοήθειες](https://enak.gr/first-aid/).

## Πριν το production launch

- Επιβεβαιώστε την ακριβή εταιρική επωνυμία / ρόλο υπεύθυνου επεξεργασίας και ελέγξτε την `privacy.html` με τον υπεύθυνο GDPR. Επιβεβαιώστε και τους συμβατικούς όρους hosting, μεταφοράς δεδομένων και email service.
- Επιβεβαιώστε ότι το branding (EFR Center S28558, ΕΝΑΚ) και τα προγράμματα ακολουθούν την τρέχουσα προσφορά της ΕΝΑΚ.
- Ελέγξτε πραγματική παράδοση email, SPF/DKIM/DMARC, και ότι λειτουργεί το DNS/SSL.
- Προσθέστε WAF/rate limits σε παραγωγή εφόσον χρειάζεται και ολοκληρώστε Search Console/Bing indexing.
- Κρατήστε το περιεχόμενο ενημερωμένο αν τροποποιηθεί ο νόμος. Η παρούσα έκδοση δημιουργήθηκε/ελέγχθηκε τον Οκτώβριο 2026.

Ανάπτυξη για το project firstaid5239.gr.
