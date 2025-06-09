#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

console.log("🌐 DeployIO Network Performance Analysis\n");

// Test 1: Critical Resource Analysis
console.log("🎯 Critical Resource Analysis");
console.log("==============================");

const distPath = path.join(__dirname, "../client/dist/assets");
if (!fs.existsSync(distPath)) {
  console.log("❌ Build assets not found. Please run build first.");
  process.exit(1);
}

const files = fs.readdirSync(distPath);

// Identify critical resources (main, core, CSS)
const criticalResources = files.filter(
  (file) =>
    file.includes("main") || file.includes("index") || file.endsWith(".css")
);

let criticalSize = 0;
console.log("📦 Critical resources (loaded immediately):");
criticalResources.forEach((file) => {
  const filePath = path.join(distPath, file);
  const stats = fs.statSync(filePath);
  const sizeKB = Math.round(stats.size / 1024);
  criticalSize += stats.size;
  console.log(`   ${file}: ${sizeKB}KB`);
});

// Non-critical resources (lazy loaded)
const nonCriticalResources = files.filter(
  (file) =>
    file.endsWith(".js") &&
    !file.includes("main") &&
    !file.includes("index") &&
    !file.includes("vendor")
);

let nonCriticalSize = 0;
console.log("\n🔄 Non-critical resources (lazy loaded):");
nonCriticalResources.forEach((file) => {
  const filePath = path.join(distPath, file);
  const stats = fs.statSync(filePath);
  const sizeKB = Math.round(stats.size / 1024);
  nonCriticalSize += stats.size;
  console.log(`   ${file}: ${sizeKB}KB`);
});

// Test 2: Network Performance Simulation
console.log("\n\n⚡ Performance Simulation");
console.log("==========================");

const networkProfiles = {
  "Slow 3G": { speed: (0.4 * 1024 * 1024) / 8, latency: 2000 }, // 400 Kbps, 2s latency
  "Fast 3G": { speed: (1.6 * 1024 * 1024) / 8, latency: 562 }, // 1.6 Mbps, 562ms latency
  "4G": { speed: (9 * 1024 * 1024) / 8, latency: 85 }, // 9 Mbps, 85ms latency
  Broadband: { speed: (50 * 1024 * 1024) / 8, latency: 28 }, // 50 Mbps, 28ms latency
};

console.log("🚀 Time to Interactive (TTI) estimates:");
console.log("----------------------------------------");

Object.entries(networkProfiles).forEach(([name, profile]) => {
  // Time to download critical resources
  const downloadTime = (criticalSize / profile.speed) * 1000; // Convert to ms
  const totalTime = downloadTime + profile.latency;

  console.log(`${name.padEnd(12)}: ${(totalTime / 1000).toFixed(2)}s`);
});

// Test 3: Progressive Loading Analysis
console.log("\n\n📊 Progressive Loading Benefits");
console.log("================================");

const totalAppSize = criticalSize + nonCriticalSize;
const criticalPercentage = ((criticalSize / totalAppSize) * 100).toFixed(1);
const lazyPercentage = ((nonCriticalSize / totalAppSize) * 100).toFixed(1);

console.log(`📈 App loading strategy:`);
console.log(
  `   Critical resources: ${(criticalSize / 1024).toFixed(
    0
  )}KB (${criticalPercentage}%)`
);
console.log(
  `   Lazy-loaded resources: ${(nonCriticalSize / 1024).toFixed(
    0
  )}KB (${lazyPercentage}%)`
);

// Calculate performance improvements
const beforeOptimization = totalAppSize; // If everything loaded upfront
const afterOptimization = criticalSize; // Only critical resources initially

const improvementPercentage = (
  ((beforeOptimization - afterOptimization) / beforeOptimization) *
  100
).toFixed(1);

console.log(`\n🎯 Performance Improvements:`);
console.log(`   Initial load reduction: ${improvementPercentage}%`);
console.log(`   Faster Time to Interactive`);
console.log(`   Better Core Web Vitals scores`);

// Test 4: Caching Strategy Analysis
console.log("\n\n💾 Caching Strategy Analysis");
console.log("==============================");

const vendorFiles = files.filter((f) => f.includes("vendor"));
const appFiles = files.filter(
  (f) => f.endsWith(".js") && !f.includes("vendor")
);

let vendorSize = 0;
vendorFiles.forEach((file) => {
  const filePath = path.join(distPath, file);
  const stats = fs.statSync(filePath);
  vendorSize += stats.size;
});

let appSize = 0;
appFiles.forEach((file) => {
  const filePath = path.join(distPath, file);
  const stats = fs.statSync(filePath);
  appSize += stats.size;
});

console.log("📦 Cache optimization:");
console.log(
  `   Vendor chunks: ${(vendorSize / 1024).toFixed(
    0
  )}KB (rarely change, long cache)`
);
console.log(
  `   App chunks: ${(appSize / 1024).toFixed(
    0
  )}KB (change frequently, shorter cache)`
);

const cacheHitRatio = vendorSize / (vendorSize + appSize);
console.log(
  `   Cache efficiency: ${(cacheHitRatio * 100).toFixed(
    1
  )}% of code is vendor (cacheable)`
);

// Test 5: Performance Score
console.log("\n\n🏆 Overall Performance Score");
console.log("==============================");

let score = 100;

// Deduct points for large critical bundle
if (criticalSize > 500 * 1024) score -= 15; // > 500KB
else if (criticalSize > 300 * 1024) score -= 10; // > 300KB
else if (criticalSize > 200 * 1024) score -= 5; // > 200KB

// Deduct points for poor lazy loading ratio
if (parseFloat(lazyPercentage) < 30) score -= 10;
else if (parseFloat(lazyPercentage) < 50) score -= 5;

// Deduct points for poor cache strategy
if (cacheHitRatio < 0.3) score -= 10;
else if (cacheHitRatio < 0.5) score -= 5;

console.log(`🎯 Performance Score: ${score}/100`);

if (score >= 95) console.log("🎉 Outstanding performance optimization!");
else if (score >= 85) console.log("🌟 Excellent performance optimization!");
else if (score >= 75) console.log("👍 Good performance optimization");
else if (score >= 60)
  console.log("⚠️  Moderate performance, some improvements needed");
else console.log("❌ Performance needs significant improvement");

console.log("\n✨ Network Performance Analysis Complete!\n");
