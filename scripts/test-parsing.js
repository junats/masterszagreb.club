/**
 * test-parsing.js
 * Verifies the improvements to the Instagram caption parser.
 */

const { parseCaption } = require('./parse-caption');

// Mock a reference date (March 27, 2026)
const REF_DATE = '2026-03-27T21:00:00Z';

const TEST_CASES = [
    {
        name: "Standard DD.MM. format",
        caption: "Petak 03.04. Comfort Zone — Moare & Mornik",
        expectedDate: "03.04.2026"
    },
    {
        name: "English Month with Ordinal (April 4th)",
        caption: "Greenlight brings back Per Hammar! Saturday, April 4th at Masters.",
        expectedDate: "04.04.2026"
    },
    {
        name: "English Month with Ordinal (May 9th)",
        caption: "Gruv Hipnoza invites DLV. May 9th Terrace Session.",
        expectedDate: "09.05.2026"
    },
    {
        name: "Croatian relative (Večeras)",
        caption: "Večeras u Mastersu: carnero b2b borut cvajner",
        expectedDate: "27.03.2026"
    },
    {
        name: "English relative (Tonight)",
        caption: "Tonight! All night long with the crew.",
        expectedDate: "27.03.2026"
    },
    {
        name: "Sutra (Tomorrow)",
        caption: "Sutra u @masters.zagreb — techno night.",
        expectedDate: "28.03.2026"
    },
    {
        name: "Weekday name (This Friday)",
        caption: "We are back this FRIDAY with a special set.",
        expectedDate: "03.04.2026" // March 27 is Friday, so "Friday" might be today?
        // Actually (dayIndex - currentDay + 7) % 7 will return 0 if same day.
    },
    {
        name: "Croatian Weekday (Subota)",
        caption: "SUBOTA 12.04. Masters All Nighters",
        expectedDate: "12.04.2026" // Should pick up the numeric date first if it matches
    },
    {
        name: "No date in caption",
        caption: "Just a photo of the club mirror. No info here.",
        expectedDate: "" // Should NOT fallback to post date anymore
    }
];

console.log("\n🧪 Running Event Parsing Tests...");
console.log("-------------------------------");

let passed = 0;
TEST_CASES.forEach(tc => {
    const result = parseCaption(tc.caption, REF_DATE);
    const success = result.date === tc.expectedDate;
    
    if (success) {
        console.log(`✅ [PASS] ${tc.name}`);
        passed++;
    } else {
        console.error(`❌ [FAIL] ${tc.name}`);
        console.error(`   Caption: "${tc.caption}"`);
        console.error(`   Expected: "${tc.expectedDate}"`);
        console.error(`   Got:      "${result.date}"`);
    }
});

console.log("\n-------------------------------");
console.log(`📊 Summary: ${passed}/${TEST_CASES.length} passed.`);

if (passed === TEST_CASES.length) {
    console.log("🎉 All tests passed!\n");
    process.exit(0);
} else {
    console.log("🚨 Some tests failed.\n");
    process.exit(1);
}
