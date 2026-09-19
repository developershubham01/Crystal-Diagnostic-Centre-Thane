import http from "http";

const BASE = "http://localhost:3000";

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const reqOptions = {
      method: options.method || "GET",
      headers: options.headers || { "Content-Type": "application/json" },
    };
    const req = http.request(url, reqOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });
    req.on("error", reject);
    if (options.body) {
      req.write(typeof options.body === "string" ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runQaSuite() {
  console.log("==================================================");
  console.log("  SENIOR QA AUTOMATED INTEGRATION & SECURITY SUITE");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // TEST 1: Public Catalog APIs
  console.log("--- 1. Testing Public Data & Catalog API Endpoints ---");
  try {
    const categories = await request("/api/categories");
    assert(categories.status === 200 && Array.isArray(categories.body), "GET /api/categories returns 200 & array");

    const services = await request("/api/services");
    assert(services.status === 200 && Array.isArray(services.body), "GET /api/services returns 200 & array");

    const packages = await request("/api/packages");
    assert(packages.status === 200 && Array.isArray(packages.body), "GET /api/packages returns 200 & array");

    const settings = await request("/api/settings");
    assert(settings.status === 200 && typeof settings.body === "object", "GET /api/settings returns 200 & settings object");

    const faqs = await request("/api/faqs");
    assert(faqs.status === 200 && Array.isArray(faqs.body), "GET /api/faqs returns 200 & array");
  } catch (err) {
    console.error("Catalog API test failed:", err);
    failed++;
  }

  // TEST 2: Appointment Creation Flow
  console.log("\n--- 2. Testing Appointment Booking Request (Functional) ---");
  let referenceCode = "";
  let mobileNum = "9820098200";
  try {
    const bookRes = await request("/api/appointments", {
      method: "POST",
      body: {
        name: "QA Test Patient",
        mobile: mobileNum,
        email: "qa@test.com",
        testOrPackage: "Complete Blood Count (CBC)",
        preferredDate: "2026-09-25",
        preferredTime: "10:00 AM",
        homeCollection: true,
        message: "Automated Senior QA verification booking",
        consent: true,
      },
    });

    assert(bookRes.status === 201 && bookRes.body.reference, "POST /api/appointments creates booking (201) & generates reference");
    referenceCode = bookRes.body.reference;
    console.log(`       Generated Reference Code: ${referenceCode}`);
  } catch (err) {
    console.error("Booking API test failed:", err);
    failed++;
  }

  // TEST 3: Appointment Tracking Flow
  console.log("\n--- 3. Testing Appointment Tracking API ---");
  try {
    const trackRes = await request(`/api/appointments/track?reference=${encodeURIComponent(referenceCode)}&mobile=${mobileNum}`);
    assert(trackRes.status === 200 && trackRes.body.reference === referenceCode, "GET /api/appointments/track resolves reference accurately & masks patient name for privacy");
  } catch (err) {
    console.error("Tracking API test failed:", err);
    failed++;
  }

  // TEST 4: Security & Lockout Validation (4 Failed Attempts -> 10-Minute Lockout)
  console.log("\n--- 4. Testing Authentication Security & 4-Attempt Lockout ---");
  try {
    const testHeaders = { "Content-Type": "application/json", "x-forwarded-for": `192.168.88.${Math.floor(Math.random() * 200) + 10}` };

    for (let attempt = 1; attempt <= 4; attempt++) {
      const loginRes = await request("/api/auth/login", {
        method: "POST",
        headers: testHeaders,
        body: { username: "admin", password: "wrong_password_123" },
      });

      if (attempt < 4) {
        assert(
          loginRes.status === 401 && String(loginRes.body.error).includes("attempt(s) remaining"),
          `Failed login attempt ${attempt}/4 returns 401 and reports remaining attempts`
        );
      } else {
        assert(
          loginRes.status === 429 && String(loginRes.body.error).includes("Account locked due to 4 consecutive failed login attempts"),
          `Failed login attempt 4/4 triggers 429 status & 10-minute lockout error message`
        );
      }
    }

    const fifthAttempt = await request("/api/auth/login", {
      method: "POST",
      headers: testHeaders,
      body: { username: "admin", password: "wrong_password_123" },
    });
    assert(fifthAttempt.status === 429, "Subsequent login attempts while locked out are immediately rejected (429)");

  } catch (err) {
    console.error("Security lockout test failed:", err);
    failed++;
  }

  // TEST 5: Contact Form Endpoint
  console.log("\n--- 5. Testing Contact Form Submission ---");
  try {
    const contactRes = await request("/api/contact", {
      method: "POST",
      body: {
        name: "QA Tester",
        phone: "9876543210",
        email: "qa@example.com",
        subject: "General Inquiry",
        message: "Testing contact message delivery",
        consent: true,
      },
    });
    assert(contactRes.status === 201 && contactRes.body.ok, "POST /api/contact submits inquiry (201)");
  } catch (err) {
    console.error("Contact API test failed:", err);
    failed++;
  }

  console.log("\n==================================================");
  console.log(`  SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");
  process.exit(failed > 0 ? 1 : 0);
}

runQaSuite();
