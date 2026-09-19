/**
 * Seed script — populates the database with default settings, an admin user
 * and SAMPLE DATA clearly marked as demo content.
 *
 * Run with: bun prisma/seed.ts
 * Idempotent: skips sections that already contain data.
 *
 * ⚠️ DEMO DATA NOTICE: services, packages, prices, FAQs and gallery entries are
 * realistic samples for development only. The centre must review, edit or
 * unpublish them from the admin dashboard before going live.
 */
import { PrismaClient } from "@prisma/client";
import { scryptSync, randomBytes } from "crypto";
import { DEFAULT_SETTINGS } from "../src/lib/settings";

const db = new PrismaClient();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

async function seedSettings() {
  const existing = await db.siteSetting.count();
  if (existing > 0) {
    console.log("• Settings already seeded, skipping");
    return;
  }
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await db.siteSetting.create({ data: { key, value } });
  }
  console.log("✓ Site settings seeded");
}

async function seedAdmin() {
  const count = await db.adminUser.count();
  if (count > 0) {
    console.log("• Admin user already exists, skipping");
    return;
  }
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "Crystal@2024";
  await db.adminUser.create({
    data: {
      username,
      passwordHash: hashPassword(password),
      name: "Centre Administrator",
      role: "ADMIN",
    },
  });
  console.log(`✓ Admin user created → username: ${username} (password from env or demo default — change it!)`);
}

async function seedCatalog() {
  if ((await db.serviceCategory.count()) > 0) {
    console.log("• Catalog already seeded, skipping");
    return;
  }
  const categories = [
    {
      name: "Blood Tests",
      slug: "blood-tests",
      icon: "Droplets",
      description:
        "Routine and specialised laboratory investigations on blood samples, processed with careful handling and clear reporting.",
      image: "/images/cat-blood.jpg",
    },
    {
      name: "Pathology",
      slug: "pathology",
      icon: "Microscope",
      description:
        "Clinical pathology services including urine, stool and other body-fluid examinations.",
      image: "/images/cat-pathology.jpg",
    },
    {
      name: "Radiology & Imaging",
      slug: "radiology-imaging",
      icon: "ScanLine",
      description:
        "Diagnostic imaging services. Modality availability to be confirmed by the centre — please contact us before visiting for imaging.",
      image: "/images/cat-radiology.jpg",
    },
    {
      name: "Preventive Health Packages",
      slug: "preventive-packages",
      icon: "HeartPulse",
      description:
        "Grouped health check-up packages designed for periodic screening at value prices.",
      image: "/images/cat-packages.jpg",
    },
    {
      name: "Other Diagnostic Services",
      slug: "other-services",
      icon: "Stethoscope",
      description:
        "Additional diagnostic and support services such as ECG and home sample collection (where available).",
      image: "/images/cat-other.jpg",
    },
  ];

  const created = new Map<string, string>();
  for (let i = 0; i < categories.length; i++) {
    const c = categories[i];
    const row = await db.serviceCategory.create({
      data: { ...c, sortOrder: i },
    });
    created.set(c.slug, row.id);
  }

  const demo = { priceVisible: false, featured: false };
  const services: {
    slug: string;
    category: string;
    name: string;
    shortDescription: string;
    detailedDescription: string;
    preparation: string;
    sampleType: string;
    turnaroundTime: string;
    price: number | null;
    featured?: boolean;
  }[] = [
    {
      slug: "complete-blood-count-cbc",
      category: "blood-tests",
      name: "Complete Blood Count (CBC)",
      shortDescription:
        "Screens red cells, white cells and platelets — a first-line test for general health checks, infections and anaemia.",
      detailedDescription:
        "A Complete Blood Count measures the cellular components of blood: haemoglobin, red blood cell indices, total and differential white blood cell counts, and platelets. Doctors commonly order it as part of routine screening or when symptoms such as fatigue, fever or weakness need investigation. [Sample data — availability and exact panel composition to be confirmed by the centre.]",
      preparation: "No special preparation is usually required. Stay hydrated.",
      sampleType: "Blood (EDTA tube)",
      turnaroundTime: "Same day (sample data)",
      price: 350,
      featured: true,
    },
    {
      slug: "blood-glucose-fasting",
      category: "blood-tests",
      name: "Blood Glucose — Fasting",
      shortDescription: "Measures fasting blood sugar levels, commonly used in diabetes screening and monitoring.",
      detailedDescription:
        "Fasting blood glucose is a standard screening test for diabetes and pre-diabetes. You should not eat or drink anything except water for 8–10 hours before the sample is collected. [Sample data — to be confirmed by the centre.]",
      preparation: "Fast for 8–10 hours (water is allowed). Morning sample preferred.",
      sampleType: "Blood (fluoride tube)",
      turnaroundTime: "Same day (sample data)",
      price: 120,
    },
    {
      slug: "lipid-profile",
      category: "blood-tests",
      name: "Lipid Profile",
      shortDescription: "Cholesterol panel covering total cholesterol, HDL, LDL and triglycerides.",
      detailedDescription:
        "A lipid profile assesses cardiovascular risk by measuring total cholesterol, HDL, LDL and triglycerides. Typically advised after a 10–12 hour overnight fast for accurate triglyceride values. [Sample data — to be confirmed by the centre.]",
      preparation: "Fast for 10–12 hours. Avoid alcohol for 24 hours before the test.",
      sampleType: "Blood (serum)",
      turnaroundTime: "Same day (sample data)",
      price: 600,
      featured: true,
    },
    {
      slug: "thyroid-profile-tsh-t3-t4",
      category: "blood-tests",
      name: "Thyroid Profile (TSH, T3, T4)",
      shortDescription: "Evaluates thyroid gland function — useful for fatigue, weight changes and hormonal symptoms.",
      detailedDescription:
        "This panel measures Thyroid Stimulating Hormone (TSH) along with T3 and T4 hormones to assess whether the thyroid is overactive or underactive. [Sample data — to be confirmed by the centre.]",
      preparation: "No fasting required. Morning sample preferred if on thyroid medication — take medication after sample collection unless advised otherwise by your doctor.",
      sampleType: "Blood (serum)",
      turnaroundTime: "Same day / next day (sample data)",
      price: 550,
    },
    {
      slug: "hba1c-glycated-haemoglobin",
      category: "blood-tests",
      name: "HbA1c (Glycated Haemoglobin)",
      shortDescription: "Reflects average blood sugar over the past ~3 months; key test for diabetes management.",
      detailedDescription:
        "HbA1c indicates the average blood glucose level over the previous two to three months and does not require fasting. It is widely used to monitor long-term diabetes control. [Sample data — to be confirmed by the centre.]",
      preparation: "No fasting required.",
      sampleType: "Blood (EDTA tube)",
      turnaroundTime: "Same day (sample data)",
      price: 450,
    },
    {
      slug: "urine-routine-examination",
      category: "pathology",
      name: "Urine Routine Examination",
      shortDescription: "Basic urine analysis for infections, kidney issues and metabolic conditions.",
      detailedDescription:
        "Urine routine examination includes physical, chemical and microscopic analysis — helpful in detecting urinary tract infections, kidney problems and diabetes-related changes. [Sample data — to be confirmed by the centre.]",
      preparation:
        "Collect a mid-stream urine sample in a sterile container. Morning sample is preferred. Containers available at the centre.",
      sampleType: "Urine",
      turnaroundTime: "Same day (sample data)",
      price: 150,
    },
    {
      slug: "liver-function-test-lft",
      category: "blood-tests",
      name: "Liver Function Test (LFT)",
      shortDescription: "Enzyme and protein panel that assesses liver health.",
      detailedDescription:
        "LFT measures enzymes such as SGOT, SGPT, ALP and bilirubin levels to evaluate liver function and detect liver damage or disease. [Sample data — to be confirmed by the centre.]",
      preparation: "Fast for 8 hours if advised. Avoid alcohol for 24 hours before the test.",
      sampleType: "Blood (serum)",
      turnaroundTime: "Same day (sample data)",
      price: 650,
    },
    {
      slug: "kidney-function-test-kft",
      category: "blood-tests",
      name: "Kidney Function Test (KFT)",
      shortDescription: "Urea and creatinine panel used to assess kidney function.",
      detailedDescription:
        "KFT evaluates blood urea, serum creatinine and electrolytes to screen for kidney disease and monitor known kidney conditions. [Sample data — to be confirmed by the centre.]",
      preparation: "Fast for 8 hours if advised. Stay well hydrated.",
      sampleType: "Blood (serum)",
      turnaroundTime: "Same day (sample data)",
      price: 700,
    },
    {
      slug: "vitamin-d-total",
      category: "blood-tests",
      name: "Vitamin D (25-OH)",
      shortDescription: "Measures vitamin D levels — commonly checked for fatigue, bone pain and deficiency.",
      detailedDescription:
        "Vitamin D 25-hydroxy test is the standard way to determine vitamin D status. Low levels are associated with tiredness, bone and muscle discomfort. [Sample data — to be confirmed by the centre.]",
      preparation: "No special preparation required.",
      sampleType: "Blood (serum)",
      turnaroundTime: "Next day (sample data)",
      price: 1200,
    },
    {
      slug: "x-ray-chest",
      category: "radiology-imaging",
      name: "X-Ray — Chest",
      shortDescription: "Basic imaging of the chest for lung and heart assessment.",
      detailedDescription:
        "A chest X-ray produces images of the heart, lungs and chest wall. It is commonly used for cough, fever, chest discomfort and pre-employment checks. [Sample data — imaging availability to be confirmed by the centre before visiting.]",
      preparation:
        "Inform the staff if you are or may be pregnant. Wear clothing without metal buttons or accessories on the chest area.",
      sampleType: "Not applicable (imaging)",
      turnaroundTime: "Same day, often within the hour (sample data)",
      price: 300,
    },
    {
      slug: "ultrasound-usg-abdomen",
      category: "radiology-imaging",
      name: "Ultrasound (USG) — Abdomen",
      shortDescription: "Sonography of abdominal organs such as liver, gallbladder, kidneys and pancreas.",
      detailedDescription:
        "Abdominal ultrasound uses sound waves to visualise internal organs. It is painless and radiation-free. [Sample data — imaging availability to be confirmed by the centre before visiting.]",
      preparation:
        "Fast for 6–8 hours before the scan; a full bladder may be required for lower abdominal studies — follow the staff's instructions when booking.",
      sampleType: "Not applicable (imaging)",
      turnaroundTime: "Report same day (sample data)",
      price: 900,
    },
    {
      slug: "electrocardiogram-ecg",
      category: "other-services",
      name: "Electrocardiogram (ECG)",
      shortDescription: "Records the electrical rhythm of the heart — often a first-line cardiac screening test.",
      detailedDescription:
        "An ECG records the electrical activity of the heart through sensors placed on the chest and limbs. Quick, painless and commonly used for chest pain, palpitations and routine cardiac screening. [Sample data — to be confirmed by the centre.]",
      preparation: "No preparation needed. Avoid oily skin creams on the chest area.",
      sampleType: "Not applicable",
      turnaroundTime: "Immediate (sample data)",
      price: 250,
    },
  ];

  for (let i = 0; i < services.length; i++) {
    const s = services[i];
    await db.service.create({
      data: {
        slug: s.slug,
        categoryId: created.get(s.category)!,
        name: s.name,
        shortDescription: s.shortDescription,
        detailedDescription: s.detailedDescription,
        preparation: s.preparation,
        sampleType: s.sampleType,
        turnaroundTime: s.turnaroundTime,
        price: s.price,
        priceVisible: false, // prices hidden publicly until approved
        featured: s.featured ?? false,
        sortOrder: i,
        seoTitle: `${s.name} in Thane West | Crystal Diagnostic Centre`,
        seoDescription: s.shortDescription,
      },
    });
  }

  const packages: {
    slug: string;
    name: string;
    description: string;
    detailed: string;
    tests: string[];
    price: number;
    featured?: boolean;
  }[] = [
    {
      slug: "basic-health-checkup",
      name: "Basic Health Checkup",
      description: "Essential screening panel for annual health maintenance.",
      detailed:
        "A starter package covering fundamental blood and urine parameters suitable for a yearly routine review. [Sample package — contents and price pending confirmation by the centre.]",
      tests: ["Complete Blood Count (CBC)", "Blood Glucose — Fasting", "Urine Routine Examination"],
      price: 599,
      featured: false,
    },
    {
      slug: "full-body-checkup",
      name: "Full Body Checkup",
      description: "Comprehensive screening covering blood counts, metabolic, lipid, liver and kidney profiles.",
      detailed:
        "Our most complete preventive panel, bundling key haematology, metabolic and organ-function investigations with a physician-friendly summary. [Sample package — contents and price pending confirmation by the centre.]",
      tests: [
        "Complete Blood Count (CBC)",
        "Blood Glucose — Fasting",
        "HbA1c",
        "Lipid Profile",
        "Liver Function Test (LFT)",
        "Kidney Function Test (KFT)",
        "Thyroid Profile (TSH, T3, T4)",
        "Urine Routine Examination",
      ],
      price: 1999,
      featured: true,
    },
    {
      slug: "diabetes-care-panel",
      name: "Diabetes Care Panel",
      description: "Focused monitoring package for known or suspected diabetes.",
      detailed:
        "Combines average sugar (HbA1c) with kidney screening to support regular diabetes management reviews. [Sample package — contents and price pending confirmation by the centre.]",
      tests: ["HbA1c", "Blood Glucose — Fasting", "Kidney Function Test (KFT)", "Urine Routine Examination"],
      price: 1099,
      featured: true,
    },
    {
      slug: "thyroid-care-package",
      name: "Thyroid Care Package",
      description: "Complete thyroid evaluation for fatigue and metabolic symptoms.",
      detailed:
        "Covers the full thyroid hormone panel for detecting underactive or overactive thyroid conditions. [Sample package — contents and price pending confirmation by the centre.]",
      tests: ["Thyroid Profile (TSH, T3, T4)", "Complete Blood Count (CBC)"],
      price: 699,
      featured: false,
    },
    {
      slug: "senior-citizen-wellness",
      name: "Senior Citizen Wellness",
      description: "Screening panel designed around common health needs after age 60.",
      detailed:
        "Includes organ-function profiles and blood counts appropriate for periodic senior wellness reviews. [Sample package — contents and price pending confirmation; age applicability to be medically verified.]",
      tests: [
        "Complete Blood Count (CBC)",
        "Blood Glucose — Fasting",
        "HbA1c",
        "Lipid Profile",
        "Kidney Function Test (KFT)",
        "Urine Routine Examination",
      ],
      price: 1499,
      featured: false,
    },
  ];

  for (let i = 0; i < packages.length; i++) {
    const p = packages[i];
    await db.healthPackage.create({
      data: {
        slug: p.slug,
        name: p.name,
        description: p.description,
        detailedDescription: p.detailed,
        price: p.price,
        priceVisible: false, // hidden publicly until approved
        featured: p.featured ?? false,
        preparation: "Follow fasting instructions for included glucose and lipid tests unless advised otherwise.",
        sortOrder: i,
        tests: {
          create: p.tests.map((t, idx) => ({ name: t, sortOrder: idx })),
        },
      },
    });
  }

  console.log(`✓ Seeded ${categories.length} categories, ${services.length} services, ${packages.length} packages (DEMO data)`);
}

async function seedFaqs() {
  if ((await db.faq.count()) > 0) {
    console.log("• FAQs already seeded, skipping");
    return;
  }
  const faqs = [
    {
      question: "How can I request an appointment?",
      answer:
        "Use the Book a Test form on this website, call us on +91 8828393955, or visit the centre at Uthalsar Naka. This is a request — our team will call you back to confirm the slot, test details and preparation instructions.",
      category: "Appointments",
    },
    {
      question: "Where is Crystal Diagnostic Centre located?",
      answer:
        "We are at 1,2 Shrikrishna Bhavan CHS, opposite Varad Hospital, Uthalsar Naka, Uthalsar, Thane West, Thane — Maharashtra 400601. Directions are available on our Contact page.",
      category: "Location",
    },
    {
      question: "How do I prepare for a diagnostic test?",
      answer:
        "Preparation depends on the test — for example, fasting is commonly required for blood sugar and lipid tests. Each test page lists preparation instructions, and our team will repeat them while confirming your appointment.",
      category: "Preparation",
    },
    {
      question: "How can I contact the centre?",
      answer:
        "Call +91 8828393955 during working hours, send a message through the Contact page, or use WhatsApp if you prefer. Email details will be published once confirmed by the centre.",
      category: "Contact",
    },
    {
      question: "How do I receive my reports?",
      answer:
        "Report collection details will be confirmed by the centre when your test is registered. Online report access is planned for the future — until then please collect reports from the centre as guided by our staff.",
      category: "Reports",
    },
    {
      question: "Do I need to bring anything with me?",
      answer:
        "Carry any earlier reports and your doctor's prescription if you have one — they help our team match the correct tests. For first visits, arriving a few minutes early helps us register you smoothly.",
      category: "Appointments",
    },
  ];
  for (let i = 0; i < faqs.length; i++) {
    await db.faq.create({ data: { ...faqs[i], sortOrder: i } });
  }
  console.log(`✓ Seeded ${faqs.length} FAQs`);
}

async function seedGallery() {
  if ((await db.galleryImage.count()) > 0) {
    console.log("• Gallery already seeded, skipping");
    return;
  }
  const images = [
    { title: "Reception Area", category: "Reception", url: "/images/gallery-reception.jpg", alt: "Reception and waiting area of a modern diagnostic centre (representative image)" },
    { title: "Laboratory Workspace", category: "Facilities", url: "/images/gallery-lab.jpg", alt: "Clean modern laboratory workspace (representative image)" },
    { title: "Sample Collection", category: "Facilities", url: "/images/gallery-collection.jpg", alt: "Blood sample collection room with phlebotomy chair (representative image)" },
    { title: "Diagnostic Equipment", category: "Equipment", url: "/images/gallery-equipment.jpg", alt: "Modern diagnostic laboratory analyser equipment (representative image)" },
    { title: "Waiting Lounge", category: "Centre", url: "/images/gallery-lounge.jpg", alt: "Comfortable patient waiting lounge (representative image)" },
    { title: "Consultation Desk", category: "Centre", url: "/images/gallery-consult.jpg", alt: "Front desk consultation counter (representative image)" },
  ];
  for (let i = 0; i < images.length; i++) {
    await db.galleryImage.create({
      data: {
        ...images[i],
        sortOrder: i,
        // Representative AI-generated imagery — replace with real photographs approved by the centre
      },
    });
  }
  console.log(`✓ Seeded ${images.length} gallery images (representative imagery)`);
}

async function seedTestimonials() {
  const existing = await db.testimonial.count();
  if (existing > 0) {
    console.log("• Testimonials already seeded, skipping");
    return;
  }
  const testimonials = [
    {
      name: "Sample Patient — R. Kulkarni",
      area: "Thane West",
      rating: 5,
      text: "Booked a full body checkup online and got a call back within the hour. The staff explained the fasting requirements clearly and the whole visit took less time than I expected.",
      sortOrder: 10,
    },
    {
      name: "Sample Patient — S. Mehta",
      area: "Uthalsar",
      rating: 5,
      text: "Very convenient location near Uthalsar Naka. Sonography was done carefully and the technician explained each step. Reports came on WhatsApp the same evening.",
      sortOrder: 20,
    },
    {
      name: "Sample Patient — A. Shaikh",
      area: "Thane",
      rating: 4,
      text: "Home collection for my mother's blood test was punctual and the phlebotomist was gentle and professional. Would have liked more evening slots, but overall a smooth experience.",
      sortOrder: 30,
    },
    {
      name: "Sample Patient — P. Deshpande",
      area: "Thane West",
      rating: 5,
      text: "The tracker link with the reference code is a great idea — I could check the status of my request without calling. Transparent and stress-free.",
      sortOrder: 40,
    },
    {
      name: "Sample Patient — M. Joshi",
      area: "Kalwa",
      rating: 5,
      text: "Clean centre, polite front desk and reasonable packages. The doctor reviewed my report and explained the next steps patiently. Recommended for routine tests.",
      sortOrder: 50,
    },
  ];
  for (const t of testimonials) {
    await db.testimonial.create({ data: t });
  }
  console.log(`✓ Seeded ${testimonials.length} demo testimonials`);
}

async function main() {
  console.log("Seeding Crystal Diagnostic Centre database…");
  await seedSettings();
  await seedAdmin();
  await seedCatalog();
  await seedFaqs();
  await seedGallery();
  await seedTestimonials();
  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
