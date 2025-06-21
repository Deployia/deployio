#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("🚀 DeployIO Performance Benchmark Test\n");

// Test 1: Bundle Size Analysis
console.log("📊 Bundle Size Analysis");
console.log("========================");

const distPath = path.join(__dirname, "../client/dist/assets");
const files = fs.readdirSync(distPath);

let totalSize = 0;
const jsFiles = files.filter((f) => f.endsWith(".js"));
const cssFiles = files.filter((f) => f.endsWith(".css"));

console.log("\n🎯 JavaScript Bundles:");
jsFiles.forEach((file) => {
  const filePath = path.join(distPath, file);
  const stats = fs.statSync(filePath);
  const sizeKB = Math.round(stats.size / 1024);
  totalSize += stats.size;

  let category = "";
  if (file.includes("vendor")) category = "[VENDOR]";
  else if (file.includes("main")) category = "[MAIN]";
  else if (file.includes("index")) category = "[CORE]";
  else category = "[LAZY]";

  console.log(`  ${category} ${file}: ${sizeKB}KB`);
});

console.log("\n🎨 CSS Files:");
cssFiles.forEach((file) => {
  const filePath = path.join(distPath, file);
  const stats = fs.statSync(filePath);
  const sizeKB = Math.round(stats.size / 1024);
  totalSize += stats.size;
  console.log(`  ${file}: ${sizeKB}KB`);
});

const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
console.log(`\n📈 Total Bundle Size: ${totalSizeMB}MB`);

// Test 2: Code Splitting Analysis
console.log("\n\n🔀 Code Splitting Analysis");
console.log("============================");

const vendorChunks = jsFiles.filter((f) => f.includes("vendor"));
const lazyChunks = jsFiles.filter(
  (f) => !f.includes("vendor") && !f.includes("main") && !f.includes("index")
);

console.log(`✅ Vendor Chunks: ${vendorChunks.length}`);
vendorChunks.forEach((chunk) => console.log(`   - ${chunk}`));

console.log(`\n✅ Lazy-loaded Chunks: ${lazyChunks.length}`);
lazyChunks.forEach((chunk) => console.log(`   - ${chunk.replace(".js", "")}`));

// Test 3: Compression Analysis
console.log("\n\n🗜️ Compression Analysis");
console.log("=========================");

// Check if files can be compressed further
const largeFiles = jsFiles.filter((file) => {
  const filePath = path.join(distPath, file);
  const stats = fs.statSync(filePath);
  return stats.size > 100 * 1024; // Files larger than 100KB
});

console.log(`📦 Large files (>100KB): ${largeFiles.length}`);
largeFiles.forEach((file) => {
  const filePath = path.join(distPath, file);
  const stats = fs.statSync(filePath);
  const sizeKB = Math.round(stats.size / 1024);
  console.log(`   - ${file}: ${sizeKB}KB`);
});

// Test 4: Performance Recommendations
console.log("\n\n💡 Performance Analysis");
console.log("=========================");

const mainChunkSize = jsFiles.find((f) => f.includes("main"));
if (mainChunkSize) {
  const mainPath = path.join(distPath, mainChunkSize);
  const mainStats = fs.statSync(mainPath);
  const mainSizeKB = Math.round(mainStats.size / 1024);

  if (mainSizeKB < 10) {
    console.log("✅ Main bundle is optimally small (<10KB)");
  } else if (mainSizeKB < 50) {
    console.log("⚠️  Main bundle is acceptable but could be smaller");
  } else {
    console.log("❌ Main bundle is too large, consider more code splitting");
  }
}

// Calculate performance score
let score = 100;
if (totalSizeMB > 5) score -= 20;
if (totalSizeMB > 10) score -= 30;
if (vendorChunks.length < 3) score -= 15;
if (lazyChunks.length < 5) score -= 10;

console.log(`\n🏆 Performance Score: ${score}/100`);

if (score >= 90) console.log("🎉 Excellent performance optimization!");
else if (score >= 70) console.log("👍 Good performance optimization");
else if (score >= 50)
  console.log("⚠️  Moderate performance, room for improvement");
else console.log("❌ Poor performance, needs significant optimization");

// Test 5: Network Performance Simulation
console.log("\n\n🌐 Network Performance Simulation");
console.log("===================================");

const criticalResourceSize = jsFiles
  .filter((f) => f.includes("main") || f.includes("index"))
  .reduce((total, file) => {
    const filePath = path.join(distPath, file);
    const stats = fs.statSync(filePath);
    return total + stats.size;
  }, 0);

const criticalCSS = cssFiles.reduce((total, file) => {
  const filePath = path.join(distPath, file);
  const stats = fs.statSync(filePath);
  return total + stats.size;
}, 0);

const criticalTotal = criticalResourceSize + criticalCSS;
const criticalKB = Math.round(criticalTotal / 1024);

// Simulate network speeds
const networkSpeeds = {
  "Fast 3G": 1.6 * 1024, // 1.6 Mbps in bytes/sec
  "4G": 10 * 1024 * 1024, // 10 Mbps
  Broadband: 50 * 1024 * 1024, // 50 Mbps
};

console.log(`📡 Critical resource size: ${criticalKB}KB`);
console.log("\nEstimated load times:");

Object.entries(networkSpeeds).forEach(([name, speed]) => {
  const loadTime = (criticalTotal / speed).toFixed(2);
  console.log(`   ${name}: ${loadTime}s`);
});

console.log("\n✨ Benchmark Complete!\n");
